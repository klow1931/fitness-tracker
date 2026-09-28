/* v2.32 — evidence-bound, explicitly approved weekly and phase-transition cycle reviews. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./meet-cycle'),require('./phase-guidance'),require('./schedule'),require('./session-intent'),require('./decision-readiness'));
 else root.LoadnoteCycleReview=factory(root.LoadnoteCore,root.LoadnoteMeetCycle,root.LoadnotePhaseGuidance,root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Cycle,Guidance,Schedule,Intent,Readiness){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const LIFTS=['squat','bench','deadlift'],LEGACY_POLICY='cycle-week-set-v1',POLICY='cycle-week-adjust-v2';
 const dayAfter=s=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
 function validate(state){
  const cycles=Cycle.validate(state.meetCycles||[]);
  for(const cycle of cycles){
   if(cycle.weeklyReviews==null)continue;
   if(!Array.isArray(cycle.weeklyReviews)||cycle.weeklyReviews.length>52)throw Error('Invalid weekly reviews');
   let prev='',seen=new Set();
   for(const e of cycle.weeklyReviews){
    if(!e||![1,2].includes(e.version)||![LEGACY_POLICY,POLICY].includes(e.policy)||e.cycleId!==cycle.id||typeof e.id!=='string'||!e.id||!iso(e.createdAt)||e.createdAt<=prev||!Schedule.date(e.asOf)||e.asOf>e.createdAt.slice(0,10)||!Number.isInteger(e.week)||e.week<1||e.week>=cycle.config.weeks||seen.has(e.week)||typeof e.notes!=='string'||e.notes.length>1000||!e.report||e.report.cycleId!==cycle.id||e.report.week!==e.week||!Array.isArray(e.changes))throw Error('Invalid weekly review record');
    prev=e.createdAt;seen.add(e.week);
    if(e.kind!=='weekly'&&e.kind!=='phase-transition')throw Error('Invalid review kind');
    for(const lift of LIFTS){
      const allowed=e.policy===LEGACY_POLICY?['keep','reduce-one']:['keep','reduce-one','reduce-load'];
      if(!allowed.includes(e.choices?.[lift]))throw Error('Invalid weekly lift choice');
    }
    for(const change of e.changes){
     if(!change.id?.startsWith('meet:'+cycle.id+':')||!change.before||!change.after||change.after.recordedAt!==e.createdAt||change.after.context.prescription?.capturedAt!==e.createdAt||change.after.context.date<=e.asOf)throw Error('Invalid future-only cycle review revision');
     Schedule.validate([{id:change.id,revisions:[change.before,change.after]}]);
    }
   }
  }
  return cycles;
 }
 function analyze(state,{cycleId,week,asOf,now=new Date().toISOString()}={}){
  if(!Schedule.date(asOf)||!iso(now)||asOf>now.slice(0,10)||!Number.isInteger(week))throw Error('Choose a valid review date and completed cycle week');
  const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',cycle=validate(state).find(c=>c.id===cycleId);
  if(!cycle?.scheduledAt||cycle.scheduledAt>cutoff)throw Error('Choose an already scheduled cycle');
  const w=cycle.weekly.find(e=>e.week===week),next=cycle.weekly.find(e=>e.week===week+1);
  if(!w||!next||w.endDate>asOf)throw Error('Review a completed training week before the next cycle week');
  if((cycle.weeklyReviews||[]).some(e=>e.week===week&&e.createdAt<=cutoff))throw Error('This week already has an accepted review');
  const guidance=Guidance.inspect(state,{cycleId,reviewWeek:week,asOf,now}),kind=w.phase===next.phase?'weekly':'phase-transition';
  const targets=cycle.sessions.filter(s=>s.week===week+1),calendar=Schedule.list(state.scheduledSessions||[],cutoff),workouts=Readiness.workoutsAt(state,asOf,cutoff,false).workouts;
  const findings={},eligibility={};
  const allResolved=guidance.summary.unknown===0&&guidance.summary.unconfirmed===0&&guidance.summary.upcoming===0&&guidance.summary.completed+guidance.summary.skipped+guidance.summary.cancelled===guidance.summary.planned;
  for(const lift of LIFTS){
   const observed=guidance.lifts[lift],sessions=targets.filter(s=>s.exercises.some(e=>e.lift===lift)),common=[],setIssues=[],loadIssues=[],incrementKg=Number(cycle.sourceProgram?.config?.incrementKg);
   if(!allResolved)common.push('Some reviewed-week sessions remain unconfirmed, ambiguous or upcoming.');
   if(observed.comparableRpeSets<2||observed.aboveCap<2)common.push('At least two comparable sets above their approved RPE caps are required before a bounded next-week reduction is offered.');
   if(!['accumulation','strength'].includes(next.phase))common.push('Peak, taper and event-week prescriptions remain unchanged by this adjustment rule.');
   if(!sessions.length)common.push('No next-week exposure for this lift.');
   if(!(incrementKg>0))loadIssues.push('The reviewed program has no valid load increment.');
   for(const s of sessions){
     const id='meet:'+cycleId+':'+s.key,record=calendar.find(row=>row.id===id);
     if(!record||record.status!=='scheduled'||record.date!==s.date||record.date<=asOf||record.revisionAt!==record.createdAt){common.push('A next-week session is missing, rescheduled, previously adjusted or no longer in the future.');continue;}
     if(workouts.some(w=>w.sessionIntent?.schedule?.id===id)){common.push('An intended next-week session already has recorded training.');continue;}
     const original=Intent.createPrescription(s.exercises,record.prescription.source,record.prescription.capturedAt);
     if(!same(original,record.prescription))common.push('The next-week prescription differs from the original approved cycle.');
     for(const e of s.exercises.filter(e=>e.lift===lift)){
       if(e.sets.length<3)setIssues.push('An exposure must have at least three sets before removing one.');
       if(e.sets.some(set=>!Number.isFinite(Number(set.weight))||Number(set.weight)<=incrementKg))loadIssues.push('Every adjusted set needs an explicit load above one program increment.');
     }
   }
   const shared=[...new Set(common)],setReasons=[...new Set([...shared,...setIssues])],loadReasons=[...new Set([...shared,...loadIssues])],canReduceOne=setReasons.length===0,canReduceLoad=loadReasons.length===0;
   findings[lift]={name:observed.name,exerciseId:observed.exerciseId,plannedSets:observed.plannedSets,validActualSets:observed.validActualSets,comparableRpeSets:observed.comparableRpeSets,aboveCap:observed.aboveCap,plannedNextExposures:sessions.length,incrementKg,canReduceOne,canReduceLoad,
    reason:canReduceOne||canReduceLoad?'A bounded next-week reduction is available for athlete review; keep remains the default.':[...new Set([...setReasons,...loadReasons])].join(' '),
    setReason:setReasons.length?setReasons.join(' '):'One fewer set per eligible next-week exposure is available.',
    loadReason:loadReasons.length?loadReasons.join(' '):'One program load increment lower on matching next-week sets is available.'};
   eligibility[lift]=canReduceOne||canReduceLoad;
  }
  return {version:2,policy:POLICY,cycleId,week,kind,phase:w.phase,nextPhase:next.phase,asOf,cutoff,through:w.endDate,nextWeek:next.week,reviewDate:asOf,
    guidance,findings,eligibility,notes:['The original program stays unchanged; reviews affect at most the next week.','Above-cap sets are descriptive logged observations, not proof that reducing sets or load improves adaptation or recovery.','Load reductions use exactly one reviewed program increment in internal kg and never change reps, exercise selection or frequency.','A keep decision makes no Calendar edits; missing evidence never authorizes automatic progression.','A completed training log, an open draft or a previously revised next-week session cannot be overwritten.']};
 }
 function preview(report,choices){
  if(!report||report.policy!==POLICY||!choices||LIFTS.some(l=>!['keep','reduce-one','reduce-load'].includes(choices[l])))throw Error('Choose keep or a supported bounded reduction for every lift');
  for(const lift of LIFTS){
   if(choices[lift]==='reduce-one'&&!report.findings?.[lift]?.canReduceOne)throw Error('The '+lift+' set reduction is not supported by the reviewed evidence or next-week schedule');
   if(choices[lift]==='reduce-load'&&!report.findings?.[lift]?.canReduceLoad)throw Error('The '+lift+' load reduction is not supported by the reviewed evidence or next-week schedule');
  }
  return LIFTS.filter(l=>choices[l]!=='keep');
 }
 function apply(state,report,choices,{confirmed=false,notes='',asOf,now=new Date().toISOString(),id=Core.createId(),lockedSessionIds=[]}={}){
  if(!confirmed||typeof notes!=='string'||notes.length>1000||!iso(now)||asOf!==report?.asOf||(asOf!==now.slice(0,10)&&dayAfter(asOf)!==now.slice(0,10)))throw Error('Approve a fresh weekly review for today');
  const selected=preview(report,choices),fresh=analyze(state,{cycleId:report.cycleId,week:report.week,asOf,now});
  const semantic=value=>{const x=copy(value);delete x.cutoff;delete x.guidance.cutoff;return x;};
  if(!same(semantic(report),semantic(fresh)))throw Error('Training evidence or Calendar changed; regenerate the weekly review');
  const records=validate(state),cycle=records.find(c=>c.id===report.cycleId),sessions=Schedule.validate(state.scheduledSessions||[]),changes=[];
  const sources=cycle.sessions.filter(s=>s.week===report.nextWeek),watched=new Set(lockedSessionIds);
  if(selected.length){
   for(const source of sources){
    if(!source.exercises.some(e=>selected.includes(e.lift)))continue;
    const key='meet:'+cycle.id+':'+source.key,rec=sessions.find(s=>s.id===key),before=rec?.revisions.at(-1);
    if(!before||before.recordedAt>=now||before.recordedAt!==rec.revisions[0].recordedAt||watched.has(key)||(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===key))throw Error('Next-week session changed, has begun or is open in a workout draft');
    const after=copy(before.context),original=Intent.createPrescription(source.exercises,after.prescription.source,after.prescription.capturedAt);
    if(!same(original,after.prescription)||after.date<=asOf||after.status!=='scheduled')throw Error('Only untouched future original targets can be revised');
    let changed=false;
    const applied=[];
    for(const ex of after.prescription.plannedExercises){
     const role=source.exercises.find(e=>e.exerciseId===ex.exerciseId)?.lift,action=choices[role];
     if(!selected.includes(role)||action==='keep')continue;
     if(action==='reduce-one'){
      if(ex.sets.length<3)throw Error('A lift requires at least three sets for this bounded change');
      ex.sets.pop();changed=true;applied.push(role+' set');
     }else if(action==='reduce-load'){
      const step=Number(report.findings?.[role]?.incrementKg);
      if(!(step>0)||ex.sets.some(set=>!Number.isFinite(Number(set.weight))||Number(set.weight)<=step))throw Error('A lift requires explicit loads above one program increment for this bounded change');
      ex.sets=ex.sets.map(set=>({...set,weight:Math.round((Number(set.weight)-step)*100)/100}));changed=true;applied.push(role+' load');
     }
    }
    if(changed){
     after.prescription.capturedAt=now;
     after.reason='Athlete-approved week '+report.week+' review: bounded '+[...new Set(applied)].join(', ')+' adjustment(s) for next week';
     const revision={recordedAt:now,context:after};
     rec.revisions.push(revision);changes.push({id:key,before:copy(before),after:copy(revision)});
    }
   }
   for(const lift of selected)if(!changes.some(e=>sources.find(s=>'meet:'+cycle.id+':'+s.key===e.id)?.exercises.some(ex=>ex.lift===lift)))throw Error('A selected lift has no complete eligible next-week edit');
  }
  const event={version:2,policy:POLICY,id,cycleId:cycle.id,week:report.week,kind:report.kind,asOf,createdAt:now,notes:notes.trim(),choices:copy(choices),report:copy(report),changes};
  cycle.weeklyReviews=[...(cycle.weeklyReviews||[]),event];
  const result={...state,meetCycles:records,scheduledSessions:Schedule.validate(sessions)};
  validate(result);
  return result;
 }
 return {analyze,preview,apply,validate};
});
