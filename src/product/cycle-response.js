/* v2.33 — descriptive, dated competition-lift response across a reviewed meet cycle. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./meet-cycle'),require('./phase-guidance'),require('./decision-readiness'),require('./schedule'),require('./session-intent'));
 else root.LoadnoteCycleResponse=factory(root.LoadnoteCore,root.LoadnoteMeetCycle,root.LoadnotePhaseGuidance,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Cycle,Guidance,Readiness,Schedule,Intent){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const round=n=>Math.round(n*100)/100;
 const median=xs=>{const values=[...xs].sort((a,b)=>a-b);return (values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2;};
 function inspect(state,{cycleId,asOf,now=new Date().toISOString()}={}){
  if(!Schedule.date(asOf)||!iso(now)||asOf>now.slice(0,10))throw Error('Choose a valid cycle-response review date');
  const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
  const cycles=Cycle.validate(state.meetCycles||[]).filter(c=>c.scheduledAt&&c.scheduledAt<=cutoff);
  const cycle=cycles.find(c=>c.id===cycleId);
  if(!cycle)return null;
  const complete=cycle.weekly.filter(w=>w.endDate<=asOf),history=Readiness.workoutsAt(state,asOf,cutoff,false);
  const logs=history.workouts.filter(w=>iso(w.createdAt)&&w.createdAt<=cutoff),bySession=new Map();
  for(const w of logs){
   const key=w.sessionIntent?.schedule?.id;
   if(!key?.startsWith('meet:'+cycle.id+':'))continue;
   const rows=bySession.get(key)||[];rows.push(w);bySession.set(key,rows);
  }
  const originals=new Map(cycle.sessions.map(s=>['meet:'+cycle.id+':'+s.key,s]));
  const dated=new Map(),blocks=[];
  function summary(weeks,phase){
   const bucket={phase,weeks:weeks.map(w=>w.week),weekCount:weeks.length,firstDate:weeks[0]?.startDate||null,lastDate:weeks.at(-1)?.endDate||null,
    plannedSessions:0,linkedSessions:0,unconfirmedSessions:0,explicitSkips:0,otherSessions:0,changedSessions:0,lifts:{}};
   for(const lift of LIFTS)bucket.lifts[lift]={lift,name:cycle.sourceProgram.config.lifts[lift].name,competitionExerciseId:cycle.sourceProgram.config.lifts[lift].exerciseId,
    originalSets:0,originalExposures:0,loggedSets:0,linkedExposures:0,matchedRpeSets:0,aboveCapSets:0,capacityDates:0,baselineEstimateKg:null,latestEstimateKg:null,observedChangePct:null,status:'insufficient-evidence',
    notes:[]};
   for(const week of weeks){
    const view=Guidance.inspect(state,{cycleId,reviewWeek:week.week,asOf,now});
    bucket.plannedSessions+=view.summary.planned;bucket.linkedSessions+=view.summary.completed;bucket.unconfirmedSessions+=view.summary.unconfirmed;bucket.explicitSkips+=view.summary.skipped;bucket.otherSessions+=view.summary.unknown+view.summary.cancelled;
    bucket.changedSessions+=view.summary.revised;
    for(const lift of LIFTS){
     const v=view.lifts[lift],b=bucket.lifts[lift];
     b.originalSets+=v.plannedSets;b.originalExposures+=v.plannedExposures;b.loggedSets+=v.validActualSets;b.linkedExposures+=v.loggedExposures;b.matchedRpeSets+=v.comparableRpeSets;b.aboveCapSets+=v.aboveCap;
    }
   }
   for(const lift of LIFTS){
    const b=bucket.lifts[lift],dates=(dated.get(phase)?.get(lift)||[]);
    b.capacityDates=dates.length;
    const span=dates.length>=4&&(Date.parse(dates.at(-1).date+'T12:00:00Z')-Date.parse(dates[0].date+'T12:00:00Z'))/86400000>=14;
    if(span){
     const early=median(dates.slice(0,2).map(x=>x.value)),late=median(dates.slice(-2).map(x=>x.value));
     b.baselineEstimateKg=round(early);b.latestEstimateKg=round(late);b.observedChangePct=round((late/early-1)*100);
     b.status=b.observedChangePct>=2?'higher-estimate':b.observedChangePct<=-3?'lower-estimate':'similar-estimate';
     b.notes.push('Median of the first two and last two eligible competition-lift dates within this phase; not a tested 1RM.');
    }else b.notes.push('Requires four distinct valid competition-lift RPE-capacity dates spanning at least 14 days within this phase.');
    if(bucket.unconfirmedSessions||bucket.otherSessions)b.notes.push('Unconfirmed or ambiguous training prevents a complete phase adherence comparison.');
    if(bucket.changedSessions)b.notes.push('Calendar changes occurred; original workload and actual logged work remain separate.');
    if(b.matchedRpeSets===0)b.notes.push('No directly comparable completed sets with valid RPE versus original approved caps.');
   }
   return bucket;
  }
  for(const source of cycle.sessions.filter(s=>complete.some(w=>w.week===s.week))){
   const id='meet:'+cycle.id+':'+source.key,ws=bySession.get(id)||[],record=(state.scheduledSessions||[]).find(s=>s.id===id);
   if(ws.length!==1||!record)continue;
   const w=ws[0],link=w.sessionIntent?.schedule,approved=record.revisions.find(r=>r.recordedAt===link?.revisionAt&&r.recordedAt<=cutoff);
   const original=record.revisions[0];
   if(!approved||approved.recordedAt!==original.recordedAt||w.date!==source.date||w.date!==approved.context.date||w.createdAt<approved.recordedAt)continue;
   try{if(JSON.stringify(Intent.prescription(w.sessionIntent.prescription))!==JSON.stringify(approved.context.prescription)||Intent.planTiming(approved.context.prescription,w.date,w.sessionIntent.timing)!=='before-training')continue;}catch(e){continue;}
   for(const lift of LIFTS){
    const exerciseId=cycle.sourceProgram.config.lifts[lift].exerciseId;
    const role=Readiness.list(state.exerciseRoles||[],w.createdAt).filter(r=>r.role==='competition'&&r.competitionLift===lift);
    if(role.length!==1||role[0].exerciseId!==exerciseId)continue;
    const ex=(w.exercises||[]).filter(e=>e.exerciseId===exerciseId&&e.type!=='cardio'&&e.trackBy!=='duration');
    const valid=ex.flatMap(e=>(e.sets||[]).map(s=>Core.capacityEvidence(s.weight,s.reps,s.rpe).estimate)).filter(Number.isFinite);
    if(!valid.length)continue;
    const phase=cycle.weekly.find(x=>x.week===source.week)?.phase,byLift=dated.get(phase)||new Map(),arr=byLift.get(lift)||[];
    arr.push({date:w.date,value:Math.max(...valid)});byLift.set(lift,arr);dated.set(phase,byLift);
   }
  }
  for(const byLift of dated.values())for(const [lift,rows] of byLift){
   const unique=new Map();for(const row of rows){const old=unique.get(row.date);if(old==null||row.value>old)unique.set(row.date,row.value);}
   byLift.set(lift,[...unique].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,value])=>({date,value})));
  }
  const phases=[...new Set(complete.map(w=>w.phase))];
  for(const phase of phases)blocks.push(summary(complete.filter(w=>w.phase===phase),phase));
  const warnings=['Observed training characteristics and estimated-capacity changes are associations, not evidence that a specific programming choice caused the result.','An unlogged workout is unconfirmed, not automatically missed; measured volume, prescribed volume and adherence are different quantities.','Only the confirmed competition exercise contributes to capacity estimates; variations and older unlinked workouts do not become competition-lift evidence.','A scheduled but unfinished phase does not establish its final training response.'];
  if(history.legacyTimestampCount)warnings.push(history.legacyTimestampCount+' legacy workout(s) lack an auditable creation timestamp; they are excluded from this cycle response.');
  return {version:1,cycleId:cycle.id,cycleName:cycle.sourceProgram.config.name,asOf,cutoff,completedWeeks:complete.length,totalWeeks:cycle.config.weeks,phases:blocks,warnings,notice:'Read-only retrospective observations. No fatigue diagnosis, inferred safe maximum, automatic program adjustment or causal attribution.'};
 }
 return {inspect};
});
