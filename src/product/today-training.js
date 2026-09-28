/* v2.48 — deterministic "today to train" session state. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'));
 else root.LoadnoteTodayTraining=factory(root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 function inspect(state,{day,draft=null}={}){
  if(!Schedule.date(day))throw Error('Choose a valid training date');
  const current=Schedule.list(state?.scheduledSessions||[]).filter(s=>s.date===day);
  const workouts=state?.workouts||[],draftScheduleId=draft?.sessionIntent?.schedule?.id||null;
  const sessions=current.map(s=>{
    const linked=workouts.filter(w=>w?.sessionIntent?.schedule?.id===s.id);
    const status=linked.length===1?'completed':linked.length>1?'ambiguous':s.status;
    const plannedExercises=s.prescription?.plannedExercises||[];
    return {id:s.id,name:s.name,date:s.date,status,role:s.role||'unspecified',goal:s.goal||'',revisionAt:s.revisionAt,
      exerciseCount:plannedExercises.length,setCount:plannedExercises.reduce((n,e)=>n+(e.type==='cardio'?1:(e.sets||[]).length),0),
      exercises:plannedExercises.slice(0,4).map(e=>({name:e.name,sets:e.type==='cardio'?1:(e.sets||[]).length})),
      draftOpen:draftScheduleId===s.id,workoutId:linked.length===1?linked[0].id:null};
  });
  const openDraft=!!draft&&((draft.rows||[]).some(r=>r.name||(r.sets||[]).some(s=>s.reps||s.duration||s.weight||s.rpe))||draftScheduleId);
  const active=sessions.find(s=>s.draftOpen)||sessions.find(s=>s.status==='scheduled')||null;
  const completed=sessions.filter(s=>s.status==='completed').length;
  return {version:1,day,sessions,active,openDraft,unlinkedDraft:openDraft&&!draftScheduleId,completed,
    summary:active?.draftOpen?'Workout in progress':active?'Today’s scheduled workout is ready':completed?'Today’s scheduled training is logged':openDraft?'Unfinished workout ready to resume':'No workout is scheduled today'};
 }
 return {inspect};
});
