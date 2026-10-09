/* Shared, read-only limits. These checks are not clinical clearance. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'),require('./athlete-intake'),require('./data-integrity'),require('./decision-readiness'));
 else root.LoadnoteDecisionBoundaries=factory(root.LoadnoteProgrammingProfile,root.LoadnoteAthleteIntake,root.LoadnoteIntegrity,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile,Intake,Integrity,Readiness){
 'use strict';
 function assess(state,lift,{asOf,knownAt,retrospective=true,startDate}={}){
  const end=asOf+'T23:59:59.999Z',cutoff=knownAt&&knownAt<end?knownAt:end;
  try{
   const p=Profile.current(state.programmingProfiles||[],retrospective?undefined:cutoff)?.context;
   const intake=Intake.assess(p?.intake);
   if(intake.hold||intake.urgent)return {blocked:true,reason:'Current reported symptoms or activity restrictions require an individually reviewed plan; a lift trend is not medical clearance.',signals:intake.messages};
   const ids=new Set(Readiness.list(state.exerciseRoles||[],retrospective?undefined:cutoff).filter(r=>r.role==='competition'&&r.competitionLift===lift).map(r=>r.exerciseId));
   if((p?.avoidedExerciseIds||[]).some(id=>ids.has(id)))return {blocked:true,reason:'The mapped competition lift is marked avoided in your programming profile. Review restrictions before interpreting a loading direction.',signals:[]};
   // Replay uses an identity Map; inspect raw visible IDs before it can collapse duplicates.
   const visible=(state.workouts||[]).filter(w=>w.date<=asOf&&(!startDate||w.date>=startDate)&&(retrospective||!w.createdAt||w.createdAt<=cutoff)&&(w.exercises||[]).some(e=>ids.has(e.exerciseId)));
   const keys=visible.map(w=>String(w.id??''));
   if(keys.some(id=>!id)||new Set(keys).size!==keys.length)return {blocked:true,reason:'Matching workouts have missing or duplicate identities. Resolve the records before using a directional decision.',signals:[]};
   const rows=Readiness.workoutsAt(state,asOf,cutoff,retrospective).workouts.filter(w=>(!startDate||w.date>=startDate)&&(w.exercises||[]).some(e=>ids.has(e.exerciseId)));
   const workouts=rows.map(w=>({...w,exercises:w.exercises.filter(e=>ids.has(e.exerciseId))}));
   const audit=Integrity.auditTrainingData({workouts},{asOf});
   if(audit.status==='review')return {blocked:true,reason:'Matching lift data contains invalid effort/load or suspicious load entries. Review History cleanup before relying on a loading direction.',signals:audit.current.issues.map(i=>i.detail)};
   return {blocked:false,reason:null,signals:[]};
  }catch{return {blocked:true,reason:'Programming restrictions or lift evidence could not be validated. Resolve the data issue before relying on a loading direction.',signals:[]};}
 }
 return {assess};
});
