/* A fresh, bounded training summary for the opted-in device model. No raw records. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coaching-context'),require('./programming-profile'),require('./athlete-intake'));
 else root.LoadnoteLocalCoachContext=factory(root.LoadnoteCoachingContext,root.LoadnoteProgrammingProfile,root.LoadnoteAthleteIntake);
})(typeof globalThis!=='undefined'?globalThis:this,function(Coaching,Profile,Intake){
 'use strict';
 const text=(v,n=160)=>typeof v==='string'?v.slice(0,n):null;
 const names=(state,ids)=>(ids||[]).slice(0,12).map(id=>text((state.exerciseCatalog||[]).find(e=>e.id===id)?.name)||'Unmapped movement');
 function build(state,{asOf,live=null,unit='kg'}={}){
  let s;try{s=Coaching.build(state,{asOf,live,sportLive:live?.sportWorkout||null});}catch{return {asOf,unit,unavailable:true,gaps:['Training context could not be validated. Do not infer missing facts.']};}
  // Profile notes, names, contact details, free-text injury notes, IDs and raw logs are omitted.
  const p=Profile.current(state.programmingProfiles||[],asOf+'T23:59:59.999Z')?.context,i=p?.intake;
  return {asOf,unit,readOnly:true,
   setup:p?{experience:p.experience,consistency:p.consistency,goal:Profile.GOALS[p.goal],availableDays:p.availableDays,sessionMinutes:p.sessionMinutes,equipment:p.equipment.slice(0,12),preferredMovements:names(state,p.preferredExerciseIds),excludedMovements:names(state,p.avoidedExerciseIds)}:null,
   reportedIntake:i?{years:i.years,breakWeeks:i.breakWeeks,issueStatus:i.issueStatus,hold:Intake.active(i),urgent:i.urgentSymptoms,activity:i.activity,issues:i.issues.slice(0,8).map(r=>({area:Intake.AREAS[r.area],side:Intake.SIDES[r.side],status:r.status,basis:r.basis,symptoms:r.symptoms})),priorities:i.priorities.map(k=>Intake.AREAS[k])}:null,
   goals:s.goals.slice(0,3).map(g=>({name:text(g.name),sport:g.sport,eventDate:g.eventDate})),
   program:s.program?{name:text(s.program.name),kind:s.program.kind,phase:s.program.phase,week:s.program.week}:null,
   currentTask:s.currentTask?{name:text(s.currentTask.name),kind:s.currentTask.kind,reported:true}:null,
   upcoming:s.session?{date:s.session.date,name:text(s.session.name),state:s.session.state,movements:s.session.targets.slice(0,8).map(e=>text(e.name))}:null,
   weekly:{from:s.from,through:s.asOf,loggedSessions:s.weekly.sessions,calendar:s.weekly.calendar,strength:s.weekly.strength},
   gaps:s.gaps.slice(0,8).map(g=>text(g,200)),priorities:s.priorities.map(p=>text(p.text,220)),
   notice:'Saved preferences and athlete reports, not inferred diagnoses or causal learning. Unknown evidence stays unknown. Exact targets are explained by the reviewed coach; chat cannot change training.'};
 }
 return {build};
});
