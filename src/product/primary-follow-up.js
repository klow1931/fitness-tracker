/* Approved primary-lift changes: previous target, exact approved revision, corrected actual work. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./program-lifecycle'),require('./phase-review'),require('./decision-readiness'),require('./weekly-evidence'));else root.LoadnotePrimaryFollowUp=factory(root.LoadnoteSchedule,root.LoadnoteProgramLifecycle,root.LoadnotePhaseReview,root.LoadnoteReadiness,root.LoadnoteWeeklyEvidence);})(typeof globalThis!=='undefined'?globalThis:this,function(S,L,Phase,R,E){
 'use strict';const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>JSON.parse(JSON.stringify(x));
 const LABELS={within:'Within effort cap',above:'Above effort cap',unknown:'Needs evidence',waiting:'Scheduled',missing:'No linked log',superseded:'Target changed',skipped:'Skipped',cancelled:'Cancelled'};
 const NOTICE='Follow-ups describe recorded work after approval. They do not prove the change caused an outcome or authorize another change.';
 function inspect(state,{asOf,now=new Date().toISOString()}={}){
  if(!S.date(asOf)||!E.stamp(now)||asOf>now.slice(0,10))throw Error('Choose a valid follow-up date');
  const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',programs=L.programs(state,{includeCancelled:true}),records=S.validate(state.scheduledSessions||[]),workouts=R.workoutsAt(state,asOf,cutoff,false).workouts;
  const events=[...Phase.validate(state.phaseReviews||[]).map(r=>({...r,kind:'phase-program'})),...programs.filter(p=>p.kind==='meet-cycle').flatMap(p=>(p.record.weeklyReviews||[]).map(r=>({...r,programId:p.id,kind:'meet-cycle'})))].filter(r=>r.createdAt<=cutoff&&r.asOf<=asOf),rows=[];
  for(const event of events){
   const p=programs.find(p=>p.id===event.programId&&p.kind===event.kind&&p.record.scheduledAt<=event.createdAt);if(!p)continue;
   for(const change of event.changes){
    const record=records.find(r=>r.id===change.id),source=p.record.sessions.find(s=>p.prefix+s.key===change.id),revision=record?.revisions.find(v=>same(v,change.after)),before=record?.revisions.find(v=>same(v,change.before));
    if(!source)continue;
    for(const approved of change.after.context.prescription.plannedExercises){
     const origin=source.exercises.filter(e=>e.exerciseId===approved.exerciseId&&['squat','bench','deadlift'].includes(e.lift)),priors=change.before.context.prescription.plannedExercises.filter(e=>e.exerciseId===approved.exerciseId);
     if(origin.length!==1||priors.length!==1||same(priors[0],approved))continue;
     const comparison=E.compare(record,revision,workouts.filter(w=>w.sessionIntent?.schedule?.id===change.id),approved,{asOf,cutoff});
     if(!before||!revision||change.after.recordedAt!==event.createdAt){comparison.status='unknown';comparison.gaps.push('The saved approval and Calendar revisions could not be verified.');}
     rows.push({...comparison,sessionId:change.id,revisionAt:event.createdAt,reviewId:event.id,programId:p.id,programKind:p.kind,programName:p.name,date:change.after.context.date,name:approved.name,lift:origin[0].lift,before:copy(priors[0]),approved:copy(approved),label:LABELS[comparison.status]});
    }
   }
  }
  return {asOf,cutoff,rows:rows.sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name)),notice:NOTICE};
 }
 return {inspect,LABELS,NOTICE};
});
