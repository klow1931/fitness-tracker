/* v2.32 — evidence-bound, explicitly approved weekly and phase-transition cycle reviews. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./meet-cycle'),require('./phase-guidance'),require('./schedule'),require('./session-intent'),require('./decision-readiness'));
 else root.LoadnoteCycleReview=factory(root.LoadnoteCore,root.LoadnoteMeetCycle,root.LoadnotePhaseGuidance,root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Cycle,Guidance,Schedule,Intent,Readiness){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const LIFTS=['squat','bench','deadlift'],POLICY='cycle-week-set-v1';
 const dayAfter=s=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
 function validate(state){
  const cycles=Cycle.validate(state.meetCycles||[]);
  for(const cycle of cycles){
   if(cycle.weeklyReviews==null)continue;
   if(!Array.isArray(cycle.weeklyReviews)||cycle.weeklyReviews.length>52)throw Error('Invalid weekly reviews');
   let prev='',seen=new Set();
   for(const e of cycle.weeklyReviews){
    if(!e||e.version!==1||e.policy!==POLICY||e.cycleId!==cycle.id||typeof e.id!=='string'||!e.id||!iso(e.createdAt)||e.createdAt<=prev||!Schedule.date(e.asOf)||e.asOf>e.createdAt.slice(0,10)||!Number.isInteger(e.week)||e.week<1||e.week>=cycle.config.weeks||seen.has(e.week)||typeof e.notes!=='string'||e.notes.length>1000||!e.report||e.report.cycleId!==cycle.id||e.report.week!==e.week||!Array.isArray(e.changes))throw Error('Invalid weekly review record');
    prev=e.createdAt;seen.add(e.week);
    if(e.kind!=='weekly'&&e.kind!=='phase-transition')throw Error('Invalid review kind');
    for(const lift of LIFTS)if(!['keep','reduce-one'].includes(e.choices?.[lift]))throw Error('Invalid weekly lift choice');
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
   const observed=guidance.lifts[lift],sessions=targets.filter(s=>s.exercises.some(e=>e.lift===lift)),issues=[];
   if(!allResolved)issues.push('Some reviewed-week sessions remain unconfirmed, ambiguous or upcoming.');
   if(observed.comparableRpeSets<2||observed.aboveCap<2)issues.push('At least two comparable sets above their approved RPE caps are required to offer a one-set reduction.');
   if(!['accumulation','strength'].includes(next.phase))issues.push('Peak, taper and event-week prescriptions remain unchanged by this set-reduction rule.');
   if(!sessions.length)issues.push('No next-week exposure for this lift.');
   for(const s of sessions){
     const id='meet:'+cycleId+':'+s.key,record=calendar.find(row=>row.id===id);
     if(!record||record.status!=='scheduled'||record.date!==s.date||record.date<=asOf||record.revisionAt!==record.createdAt){issues.push('A next-week session is missing, rescheduled, previously adjusted or no longer in the future.');continue;}
     if(workouts.some(w=>w.sessionIntent?.schedule?.id===id)){issues.push('An intended next-week session already has recorded training.');continue;}
     const original=Intent.createPrescription(s.exercises,record.prescription.source,record.prescription.capturedAt);
     if(!same(original,record.prescription))issues.push('The next-week prescription differs from the original approved cycle.');
     if(s.exercises.some(e=>e.lift===lift&&e.sets.length<3))issues.push('An exposure must have at least three sets before removing one.');
   }
   findings[lift]={name:observed.name,exerciseId:observed.exerciseId,plannedSets:observed.plannedSets,validActualSets:observed.validActualSets,comparableRpeSets:observed.comparableRpeSets,aboveCap:observed.aboveCap,plannedNextExposures:sessions.length,canReduceOne:issues.length===0,reason:issues.length?issues.join(' '):'A single-set reduction per eligible next-week exposure is available for athlete review, not an automatic recommendation.'};
   eligibility[lift]=issues.length===0;
  }
  return {version:1,policy:POLICY,cycleId,week,kind,phase:w.phase,nextPhase:next.phase,asOf,cutoff,through:w.endDate,nextWeek:next.week,reviewDate:asOf,
    guidance,findings,eligibility,notes:['The original program stays unchanged; reviews affect at most the next week.','Above-cap sets are descriptive logged observations, not proof that reducing sets improves adaptation or recovery.','A keep decision makes no Calendar edits; missing evidence never authorizes automatic progression.','A completed training log, an open draft or a previously revised next-week session cannot be overwritten.']};
 }
 function preview(report,choices){
  if(!report||report.policy!==POLICY||!choices||LIFTS.some(l=>!['keep','reduce-one'].includes(choices[l])))throw Error('Choose keep or the supported one-set reduction for every lift');
  for(const lift of LIFTS)if(choices[lift]==='reduce-one'&&!report.eligibility[lift])throw Error('The '+lift+' reduction is not supported by the reviewed evidence or next-week schedule');
  return LIFTS.filter(l=>choices[l]==='reduce-one');
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
    for(const ex of after.prescription.plannedExercises){
     const role=source.exercises.find(e=>e.exerciseId===ex.exerciseId)?.lift;
     if(!selected.includes(role))continue;
     if(ex.sets.length<3)throw Error('A lift requires at least three sets for this bounded change');
     ex.sets.pop();changed=true;
    }
    if(changed){
     after.prescription.capturedAt=now;
     after.reason='Athlete-approved week '+report.week+' review: one set removed from '+selected.join(', ')+' next-week exposure(s)';
     const revision={recordedAt:now,context:after};
     rec.revisions.push(revision);changes.push({id:key,before:copy(before),after:copy(revision)});
    }
   }
   for(const lift of selected)if(!changes.some(e=>sources.find(s=>'meet:'+cycle.id+':'+s.key===e.id)?.exercises.some(ex=>ex.lift===lift)))throw Error('A selected lift has no complete eligible next-week edit');
  }
  const event={version:1,policy:POLICY,id,cycleId:cycle.id,week:report.week,kind:report.kind,asOf,createdAt:now,notes:notes.trim(),choices:copy(choices),report:copy(report),changes};
  cycle.weeklyReviews=[...(cycle.weeklyReviews||[]),event];
  const result={...state,meetCycles:records,scheduledSessions:Schedule.validate(sessions)};
  validate(result);
  return result;
 }
 return {analyze,preview,apply,validate};
});
