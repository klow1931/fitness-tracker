/* v3.42 — offline answers about apparent lift plateaus from ProgressStory.
 * Do not propose new doses or infer a physiological explanation.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./progress-story'),require('./decision-readiness'),require('./schedule'));
 else root.LoadnoteCoachPerformanceInsights=factory(root.LoadnoteProgressStory,root.LoadnoteReadiness,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Story,Readiness,Schedule){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const focus=q=>/\b(stall(?:ed|ing)?|plateau(?:ed|ing)?|not improv(?:ing|ed)|stagnat(?:e|ed|ing|ion)|not (?:getting|becoming) stronger)\b/i.test(q);
 const liftOf=q=>/\b(bench|bench press)\b/i.test(q)?'bench':/\b(deadlift|sumo)\b/i.test(q)?'deadlift':/\bsquat\b/i.test(q)?'squat':null;
 function inspect(state,{asOf,lift,weeks=12,unit='kg'}={}){
  if(!Schedule.date(asOf)||!LIFTS.includes(lift))throw Error('Choose a dated squat, bench or deadlift comparison');
  const candidates=Story.movementOptions(state,{asOf,weeks}).filter(x=>x.lift===lift);
  if(candidates.length!==1)return {status:'unmapped',lift,reason:candidates.length?'Multiple competition exercise identities are available. Confirm one mapping before reviewing a trend.':'No matching dated competition-lift history is available. Confirm its exercise identity and log sets with RPE.'};
  const marker=candidates[0],story=Story.movementStory(state,marker,{asOf,weeks}),trend=story.direction;
  const valid=['higher','lower','similar'].includes(trend.status);
  const rpeDays=story.overall.capacityDays,baselineDays=story.baseline.capacityDays,recentDays=story.recent.capacityDays;
  return {status:valid?trend.status:'insufficient',lift,name:marker.name,asOf,weeks,unit,
   baselineDays,recentDays,allEvidenceDays:rpeDays,
   changePct:valid?trend.deltaPct:null,changeKg:valid?trend.deltaKg:null,
   baselineVolumeKg:story.baseline.volumeKg,recentVolumeKg:story.recent.volumeKg,
   baselineRpe:story.baseline.averageRpe,recentRpe:story.recent.averageRpe,
   explanation:trend.reason||trend.note||'Comparable data are unavailable.',
   recentSets:story.recent.sets,
   notice:'An observed pattern cannot establish why it happened. Compare equivalent lifts, reps and effort, and review your existing plan before changing any loads.'};
 }
 function answer(state,question,{asOf,unit='kg',history=[]}={}){
  if(!focus(String(question||'')))return null;
  const lift=liftOf(question)||[...history].reverse().filter(h=>h.role==='user').map(h=>liftOf(h.content||'')).find(Boolean);
  if(!lift)return {text:'Which lift appears stalled—squat, bench or deadlift? I can check the saved RPE-aware training trend without diagnosing a cause or adding weight.',source:'Offline Coach · training trends',readOnly:true,evidence:[],followUps:['Why is my bench progress stalled?']};
  let report;try{report=inspect(state,{asOf,lift,unit});}catch{return {text:'I could not validate the saved training trend. Check the recorded exercises and dates first; no programming change was made.',source:'Offline Coach · training trends unavailable',readOnly:true,evidence:[]};}
  if(report.status==='unmapped')return {text:report.reason,source:'Offline Coach · training trends',readOnly:true,evidence:[report]};
  const fmt=n=>Math.round(n*(unit==='lb'?2.2046226218:1)*10)/10+' '+(unit==='lb'?'lb':'kg');
  const outcome=report.status==='higher'?'The recent demonstrated-capacity evidence is higher, so a plateau is not established.':
   report.status==='lower'?'Recent demonstrated-capacity evidence is lower. That observation alone cannot identify why.':
   report.status==='similar'?'The earlier and recent RPE-aware capacity estimates are similar. That does not prove a physiological plateau.':
   'There is not enough comparable RPE-aware evidence to establish a trend.';
  const comparison=report.changePct==null?'At least two usable capacity days are needed in both the first and last four weeks.':
   'The median of the daily best estimates changed '+(report.changePct>0?'+':'')+report.changePct+'% ('+(report.changeKg>0?'+':'')+fmt(report.changeKg)+').';
  const missing=report.recentSets>0&&report.recentDays===0?' Recent logged sets lack eligible RPE-aware capacity estimates.':'';
  return {text:report.name+': '+outcome+' '+comparison+' First comparison window: '+report.baselineDays+' capacity days; most recent: '+report.recentDays+'. '+report.explanation+missing+' '+report.notice+' You can review the exact lift history in Progress and the next scheduled targets in Decisions.',
   source:'Offline Coach · corrected training trends',readOnly:true,evidence:[report],intent:{topic:'training-trend',lift},followUps:['Review my weekly training','Explain my next workout']};
 }
 return {focus,inspect,answer};
});
