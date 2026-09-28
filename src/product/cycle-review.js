/* v2.32 — evidence-bound, explicitly approved weekly and phase-transition cycle reviews. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./meet-cycle'),require('./phase-guidance'),require('./schedule'),require('./session-intent'),require('./decision-readiness'));
 else root.LoadnoteCycleReview=factory(root.LoadnoteCore,root.LoadnoteMeetCycle,root.LoadnotePhaseGuidance,root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Cycle,Guidance,Schedule,Intent,Readiness){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const LIFTS=['squat','bench','deadlift'],LEGACY_POLICY='cycle-week-set-v1',PREVIOUS_POLICY='cycle-week-adjust-v2',POLICY='cycle-week-adjust-v3';
 const dayAfter=s=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
 function validate(state){
  const cycles=Cycle.validate(state.meetCycles||[]);
  for(const cycle of cycles){
   if(cycle.weeklyReviews==null)continue;
   if(!Array.isArray(cycle.weeklyReviews)||cycle.weeklyReviews.length>52)throw Error('Invalid weekly reviews');
   let prev='',seen=new Set();
   for(const e of cycle.weeklyReviews){
    if(!e||![1,2,3].includes(e.version)||![LEGACY_POLICY,PREVIOUS_POLICY,POLICY].includes(e.policy)||e.cycleId!==cycle.id||typeof e.id!=='string'||!e.id||!iso(e.createdAt)||e.createdAt<=prev||!Schedule.date(e.asOf)||e.asOf>e.createdAt.slice(0,10)||!Number.isInteger(e.week)||e.week<1||e.week>=cycle.config.weeks||seen.has(e.week)||typeof e.notes!=='string'||e.notes.length>1000||!e.report||e.report.cycleId!==cycle.id||e.report.week!==e.week||!Array.isArray(e.changes))throw Error('Invalid weekly review record');
    prev=e.createdAt;seen.add(e.week);
    if(e.kind!=='weekly'&&e.kind!=='phase-transition')throw Error('Invalid review kind');
    for(const lift of LIFTS){
      const allowed=e.policy===LEGACY_POLICY?['keep','reduce-one']:e.policy===PREVIOUS_POLICY?['keep','reduce-one','reduce-load']:['keep','reduce-one','reduce-load','increase-load'];
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
   const observed=guidance.lifts[lift],sessions=targets.filter(s=>s.exercises.some(e=>e.lift===lift)),futureIssues=[],setIssues=[],reduceLoadIssues=[],increaseIssues=[],incrementKg=Number(cycle.sourceProgram?.config?.incrementKg),trainingMaxKg=Number(cycle.sourceProgram?.config?.lifts?.[lift]?.trainingMaxKg);
   if(!allResolved)futureIssues.push('Some reviewed-week sessions remain unconfirmed, ambiguous or upcoming.');
   if(!['accumulation','strength'].includes(next.phase))futureIssues.push('Peak, taper and event-week prescriptions remain unchanged by this adjustment rule.');
   if(!sessions.length)futureIssues.push('No next-week exposure for this lift.');
   if(!(incrementKg>0)){reduceLoadIssues.push('The reviewed program has no valid load increment.');increaseIssues.push('The reviewed program has no valid load increment.');}
   if(observed.comparableRpeSets<2||observed.aboveCap<2){setIssues.push('At least two comparable sets above their approved RPE caps are required before a one-set reduction is offered.');reduceLoadIssues.push('At least two comparable sets above their approved RPE caps are required before a load reduction is offered.');}
   if(Number(observed.competitionCompletedSets||0)<Number(observed.competitionPlannedSets||0))increaseIssues.push('All planned competition-lift sets must be completed before a load increase is offered.');
   if(Number(observed.competitionComparableRpeSets||0)<4)increaseIssues.push('At least four directly comparable competition-lift sets are required before a load increase is offered.');
   if(Number(observed.competitionAboveCap||0)!==0)increaseIssues.push('No comparable competition-lift set may exceed its approved RPE cap before a load increase is offered.');
   if(Number(observed.competitionBelowCapHalf||0)<2)increaseIssues.push('At least two comparable competition-lift sets must finish at least 0.5 RPE below their approved cap before a load increase is offered.');
   let competitionNextExposures=0;
   for(const s of sessions){
     const id='meet:'+cycleId+':'+s.key,record=calendar.find(row=>row.id===id);
     if(!record||record.status!=='scheduled'||record.date!==s.date||record.date<=asOf||record.revisionAt!==record.createdAt){futureIssues.push('A next-week session is missing, rescheduled, previously adjusted or no longer in the future.');continue;}
     if(workouts.some(w=>w.sessionIntent?.schedule?.id===id)){futureIssues.push('An intended next-week session already has recorded training.');continue;}
     const original=Intent.createPrescription(s.exercises,record.prescription.source,record.prescription.capturedAt);
     if(!same(original,record.prescription))futureIssues.push('The next-week prescription differs from the original approved cycle.');
     for(const e of s.exercises.filter(e=>e.lift===lift)){
       if(e.sets.length<3)setIssues.push('An exposure must have at least three sets before removing one.');
       if(e.sets.some(set=>!Number.isFinite(Number(set.weight))||Number(set.weight)<=incrementKg))reduceLoadIssues.push('Every reduced set needs an explicit load above one program increment.');
       if(e.exerciseId===observed.exerciseId){
         competitionNextExposures++;
         if(!(trainingMaxKg>0))increaseIssues.push('The competition lift has no valid training max for the progression ceiling.');
         if(e.sets.some(set=>!Number.isFinite(Number(set.weight))))increaseIssues.push('Every progressed competition-lift set needs an explicit load.');
         if(trainingMaxKg>0&&e.sets.some(set=>Number(set.weight)+incrementKg>trainingMaxKg*.85+1e-9))increaseIssues.push('A one-increment increase would exceed the supported 85% training-max ceiling.');
       }
     }
   }
   if(!competitionNextExposures)increaseIssues.push('No matching competition-lift exposure exists next week.');
   const shared=[...new Set(futureIssues)],setReasons=[...new Set([...shared,...setIssues])],reduceLoadReasons=[...new Set([...shared,...reduceLoadIssues])],increaseReasons=[...new Set([...shared,...increaseIssues])];
   const canReduceOne=setReasons.length===0,canReduceLoad=reduceLoadReasons.length===0,canIncreaseLoad=increaseReasons.length===0;
   findings[lift]={name:observed.name,exerciseId:observed.exerciseId,plannedSets:observed.plannedSets,completedSets:observed.completedSets,validActualSets:observed.validActualSets,comparableRpeSets:observed.comparableRpeSets,aboveCap:observed.aboveCap,belowCapHalf:Number(observed.belowCapHalf||0),competitionPlannedSets:Number(observed.competitionPlannedSets||0),competitionCompletedSets:Number(observed.competitionCompletedSets||0),competitionComparableRpeSets:Number(observed.competitionComparableRpeSets||0),competitionAboveCap:Number(observed.competitionAboveCap||0),competitionBelowCapHalf:Number(observed.competitionBelowCapHalf||0),plannedNextExposures:sessions.length,competitionNextExposures,incrementKg,trainingMaxKg,canReduceOne,canReduceLoad,canIncreaseLoad,
    reason:canReduceOne||canReduceLoad||canIncreaseLoad?'A bounded next-week adjustment is available for athlete review; keep remains the default.':[...new Set([...setReasons,...reduceLoadReasons,...increaseReasons])].join(' '),
    setReason:setReasons.length?setReasons.join(' '):'One fewer set per eligible next-week exposure is available.',
    loadReason:reduceLoadReasons.length?reduceLoadReasons.join(' '):'One program load increment lower on matching next-week sets is available.',
    increaseReason:increaseReasons.length?increaseReasons.join(' '):'One program load increment higher on matching next-week competition-lift sets is available.'};
   eligibility[lift]=canReduceOne||canReduceLoad||canIncreaseLoad;
  }
  return {version:3,policy:POLICY,cycleId,week,kind,phase:w.phase,nextPhase:next.phase,asOf,cutoff,through:w.endDate,nextWeek:next.week,reviewDate:asOf,
    guidance,findings,eligibility,notes:['The original program stays unchanged; reviews affect at most the next week.','Above-cap and below-cap sets are descriptive logged observations, not proof of adaptation, fatigue or recovery.','Load changes use exactly one reviewed program increment in internal kg. Upward progression is limited to the confirmed competition exercise and cannot exceed the existing 85% training-max ceiling.','Load changes never alter reps, set count, exercise selection, frequency or phase timing.','A keep decision makes no Calendar edits; missing evidence never authorizes automatic progression.','A completed training log, an open draft or a previously revised next-week session cannot be overwritten.']};
 }
 function preview(report,choices){
  if(!report||report.policy!==POLICY||!choices||LIFTS.some(l=>!['keep','reduce-one','reduce-load','increase-load'].includes(choices[l])))throw Error('Choose keep or a supported bounded adjustment for every lift');
  for(const lift of LIFTS){
   if(choices[lift]==='reduce-one'&&!report.findings?.[lift]?.canReduceOne)throw Error('The '+lift+' set reduction is not supported by the reviewed evidence or next-week schedule');
   if(choices[lift]==='reduce-load'&&!report.findings?.[lift]?.canReduceLoad)throw Error('The '+lift+' load reduction is not supported by the reviewed evidence or next-week schedule');
   if(choices[lift]==='increase-load'&&!report.findings?.[lift]?.canIncreaseLoad)throw Error('The '+lift+' load increase is not supported by the reviewed evidence or next-week schedule');
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
      ex.sets=ex.sets.map(set=>({...set,weight:Math.round((Number(set.weight)-step)*100)/100}));changed=true;applied.push(role+' load reduction');
     }else if(action==='increase-load'){
      const finding=report.findings?.[role],step=Number(finding?.incrementKg);
      if(ex.exerciseId!==finding?.exerciseId)continue;
      if(!(step>0)||!(Number(finding?.trainingMaxKg)>0)||ex.sets.some(set=>!Number.isFinite(Number(set.weight))||Number(set.weight)+step>Number(finding.trainingMaxKg)*.85+1e-9))throw Error('The competition-lift increase is outside the supported one-increment ceiling');
      ex.sets=ex.sets.map(set=>({...set,weight:Math.round((Number(set.weight)+step)*100)/100}));changed=true;applied.push(role+' competition load increase');
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
  const event={version:3,policy:POLICY,id,cycleId:cycle.id,week:report.week,kind:report.kind,asOf,createdAt:now,notes:notes.trim(),choices:copy(choices),report:copy(report),changes};
  cycle.weeklyReviews=[...(cycle.weeklyReviews||[]),event];
  const result={...state,meetCycles:records,scheduledSessions:Schedule.validate(sessions)};
  validate(result);
  return result;
 }
 return {analyze,preview,apply,validate};
});
