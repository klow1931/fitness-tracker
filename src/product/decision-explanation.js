/* Deterministic explanation of existing competition-lift decision evidence.
 * This module does not choose a direction, edit plans, or infer physiological readiness.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./decision-engine'),require('./coach-support'));
 else root.LoadnoteDecisionExplanation=factory(root.LoadnoteDecisionEngine,root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Engine,Support){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const NAMES={squat:'Squat',bench:'Bench',deadlift:'Deadlift'};
 const ACTIONS={increase:'Increase',hold:'Hold',reduce:'Reduce','insufficient-evidence':'Insufficient evidence'};
 const round=(v,n=1)=>Math.round((v+Number.EPSILON)*10**n)/10**n;
 const weight=(kg,unit)=>Number.isFinite(kg)?round(kg*(unit==='lb'?2.2046226218:1))+' '+(unit==='lb'?'lb':'kg'):'unknown load';
 function build(row,policy,{unit='kg'}={}){
  if(!row||!LIFTS.includes(row.lift)||!ACTIONS[row.decision]||!policy)throw Error('A validated decision and policy are required');
  const exposure=Array.isArray(row.evidence)?row.evidence.slice(-3):[];
  const complete=exposure.length===3&&exposure.every(e=>Number.isFinite(e.estimatedCapacity)&&e.estimatedCapacity>0&&Number.isFinite(e.rpe)&&e.rpe>=1&&e.rpe<=10);
  const trend=complete?round((exposure[2].estimatedCapacity/exposure[0].estimatedCapacity-1)*100):null;
  const intervals=complete?[1,2].map(i=>round((exposure[i].estimatedCapacity/exposure[i-1].estimatedCapacity-1)*100)):[];
  const rpeAverage=complete?round(exposure.reduce((n,e)=>n+e.rpe,0)/3):null;
  const rpeChange=complete?round(exposure[2].rpe-exposure[0].rpe):null;
  const latestAge=complete?Math.floor((Date.parse(row.asOf+'T12:00:00Z')-Date.parse(exposure[2].date+'T12:00:00Z'))/86400000):null;
  const conservative=!!row.signals?.some(s=>/intentionally conservative/i.test(s));
  const measurements=complete?[
   'Three-exposure estimated-capacity change: '+(trend>=0?'+':'')+trend+'%.',
   'Exposure intervals: '+intervals.map(v=>(v>=0?'+':'')+v+'%').join(', ')+'.',
   'Mean RPE: '+rpeAverage+'; latest RPE: '+exposure[2].rpe+'; first-to-latest RPE difference: '+(rpeChange>=0?'+':'')+rpeChange+'.',
   'Newest usable exposure: '+latestAge+' day(s) before the review date.'
  ]:[];
  const gates=complete?[
   'Increase requires at least '+(conservative?policy.conservativeIncreaseTrendPct:policy.increaseTrendPct)+'% capacity improvement, two non-declining intervals (tolerance '+policy.intervalTolerancePct+'%), and both mean and latest RPE at or below '+policy.increaseMaxRpe+'.',
   'Reduce requires a trend at or below '+policy.reduceTrendPct+'%, latest RPE at least '+policy.reduceEffortRpe+', and two non-increasing intervals.',
   'High latest RPE (at least '+policy.highEffortRpe+'), rising effort (at least +'+policy.rpeRiseGuard+' RPE), a negative trend, stale evidence (more than '+policy.maxEvidenceAgeDays+' days), or incompatible patterns can prevent an increase.'
  ]:[];
  const observations=exposure.map(e=>({
   date:e.date,exerciseId:e.exerciseId||null,workoutId:e.workoutId||null,
   text:e.date+': '+weight(e.weight,unit)+' × '+e.reps+' reps @ RPE '+e.rpe+' · estimated capacity '+weight(e.estimatedCapacity,unit)
  }));
  return {
   version:1,lift:row.lift,label:NAMES[row.lift],asOf:row.asOf,mode:row.mode,decision:row.decision,decisionAllowed:row.decisionAllowed===true,readOnly:true,
   summary:NAMES[row.lift]+' — '+ACTIONS[row.decision]+'. '+row.reason,
   observations,measurements,gates,
   next:row.nextExposure||'Keep existing plan unchanged by this review.',
   watch:row.watchNext||'Gather another usable logged exposure.',
   limitations:complete?'Estimated capacity is derived from logged load, reps and RPE; it is not a tested 1RM, a diagnosis or proof of recovery. A direction is guidance only; this explanation has not changed the next workout.':'Not enough valid recent capacity observations to describe a three-exposure trend. Missing evidence is not treated as zero; this explanation has not changed the next workout.'
  };
 }
 function wants(q){
  const text=String(q||'');
  if(!/\b(why|explain|reason|how come)\b/i.test(text)||!/(\bhold\w*\b|\bincreas\w*\b|\breduc\w*\b|\bdecision\w*\b|\brecommend\w*\b|\bsuggest\w*\b|\bdirection\b|\bload\s+change\b)/i.test(text))return null;
  const lifts=LIFTS.filter(l=>l==='bench'?/\bbench\b|\bbench press\b/i.test(text):l==='deadlift'?/\bdeadlift\b|\bsumo\b/i.test(text):/\bsquat\b/i.test(text));
  return lifts.length===1?lifts[0]:null;
 }
 function answer(state,question,{asOf,unit='kg'}={}){
  const lift=wants(question);if(!lift||Support?.health(String(question||'')))return null;
  let decision,policy;try{const report=Engine.snapshot(state,{asOf,retrospective:true});decision=report.lifts[lift];policy=report.policy;}
  catch{return {text:'I could not validate the current lift decision. Review training evidence in Decisions; no workout was changed.',source:'Current corrected lift evidence unavailable',readOnly:true,evidence:[],intent:{topic:'decision-explanation',lift}};}
  const report=build(decision,policy,{unit});
  const text=[report.summary,report.observations.length?'Supporting recorded exposures: '+report.observations.map(x=>x.text).join('; ')+'.':'No recent comparable competition-lift exposures available.',...report.measurements,...report.gates,'Next: '+report.next,'Watch next: '+report.watch,report.limitations].join(' ');
  return {text,source:'Current corrected lift evidence · decision explanation',readOnly:true,evidence:[report],intent:{topic:'decision-explanation',lift}};
 }
 return {build,answer,wants};
});
