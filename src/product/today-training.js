/* v2.48 — deterministic "today to train" session state. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'));
 else root.LoadnoteTodayTraining=factory(root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 // Preview one scheduled strength exposure without reprogramming or touching a draft.
 // Loads stay in stored kg; the UI alone converts to the athlete's chosen units.
 const cleanName=x=>String(x??'').trim().replace(/\s+/g,' ').toLowerCase();
 const known=x=>x!=null&&String(x).trim()!==''&&Number.isFinite(Number(x));
 const validLoad=x=>known(x)&&Number(x)>=0;
 const validReps=x=>known(x)&&Number.isInteger(Number(x))&&Number(x)>0;
 const validRpe=x=>known(x)&&Number(x)>=1&&Number(x)<=10;
 function sameExercise(planned,logged){
  if(!logged||logged.type==='cardio'||logged.type==='practice'||logged.trackBy==='duration')return false;
  if(planned.loadConvention&&logged.loadConvention&&planned.loadConvention!==logged.loadConvention)return false;
  if(planned.exerciseId)return logged.exerciseId===planned.exerciseId;
  return !logged.exerciseId&&cleanName(logged.name)===cleanName(planned.name);
 }
 function previousStrength(state,planned,day){
  const cutoff=day+'T23:59:59.999Z';
  // If a historical result was corrected AFTER this view's date, skip it
  // instead of leaking the future correction into an earlier preview.
  const revisedLater=new Set((state?.workoutRevisions||[])
   .filter(r=>r?.workoutId!=null&&typeof r.recordedAt==='string'&&r.recordedAt>cutoff)
   .map(r=>String(r.workoutId)));
  const before=(state?.workouts||[]).filter(w=>Schedule.date(w?.date)&&w.date<day&&(!w.createdAt||typeof w.createdAt==='string'&&w.createdAt<=cutoff))
   .sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  for(const workout of before){
   if(revisedLater.has(String(workout.id)))continue;
   const matched=(workout.exercises||[]).filter(e=>sameExercise(planned,e));
   if(matched.length!==1)continue;
   const set=(matched[0].sets||[]).find(s=>validLoad(s?.weight)&&validReps(s?.reps));
   if(set)return {date:workout.date,weightKg:Number(set.weight),reps:Number(set.reps),rpe:validRpe(set.rpe)?Number(set.rpe):null};
  }
  return null;
 }
 function sessionContext(state,session,day){
  if(!session?.prescription?.plannedExercises)return null;
  for(const planned of session.prescription.plannedExercises){
   if(planned?.type==='cardio'||planned?.type==='practice'||planned?.trackBy==='duration'||!planned?.name)continue;
   const first=(planned.sets||[]).find(s=>validLoad(s?.weight)&&validReps(s?.reps));
   if(!first)continue;
   return {name:planned.name,exerciseId:planned.exerciseId||null,
    target:{weightKg:Number(first.weight),reps:Number(first.reps),targetRpe:validRpe(first.targetRpe)?Number(first.targetRpe):null},
    previous:previousStrength(state,planned,day),
    notice:'The target is the current scheduled prescription; last performance is a prior recorded set, not an automatic progression recommendation.'};
  }
  return null;
 }
 function inspect(state,{day,draft=null}={}){
  if(!Schedule.date(day))throw Error('Choose a valid training date');
  const current=Schedule.list(state?.scheduledSessions||[]).filter(s=>s.date===day);
  const workouts=state?.workouts||[],draftScheduleId=draft?.sessionIntent?.schedule?.id||null;
  const loggedToday=workouts.filter(w=>w?.date===day&&Array.isArray(w.exercises)&&w.exercises.length>0).length;
  const sessions=current.map(s=>{
    const linked=workouts.filter(w=>w?.sessionIntent?.schedule?.id===s.id);
    const status=linked.length===1?'completed':linked.length>1?'ambiguous':s.status;
    const plannedExercises=s.prescription?.plannedExercises||[];
    return {id:s.id,name:s.name,date:s.date,status,role:s.role||'unspecified',goal:s.goal||'',revisionAt:s.revisionAt,
      exerciseCount:plannedExercises.length,setCount:plannedExercises.reduce((n,e)=>n+(e.type==='cardio'?1:(e.sets||[]).length),0),
      exercises:plannedExercises.slice(0,4).map(e=>({name:e.name,sets:e.type==='cardio'?1:(e.sets||[]).length})),
      draftOpen:draftScheduleId===s.id,workoutId:linked.length===1?linked[0].id:null,performanceContext:sessionContext(state,s,day)};
  });
  const openDraft=!!(draft&&((draft.rows||[]).some(r=>r.name||(r.sets||[]).some(s=>s.reps||s.duration||s.weight||s.rpe))||draftScheduleId));
  const active=sessions.find(s=>s.draftOpen)||sessions.find(s=>s.status==='scheduled')||null;
  const completed=sessions.filter(s=>s.status==='completed').length;
  // A scheduled draft from another day is still recoverable work, not a
  // license to replace it with today's scheduled session.
  return {version:1,day,sessions,active,openDraft,unlinkedDraft:openDraft&&!sessions.some(s=>s.draftOpen),completed,loggedToday,
    summary:active?.draftOpen?'Workout in progress':openDraft?'Unfinished workout ready to resume':active?'Today’s scheduled workout is ready':completed?'Today’s scheduled training is logged':loggedToday?'Training logged today':'No workout is scheduled today'};
 }
 return {inspect,sessionContext,previousStrength};
});
