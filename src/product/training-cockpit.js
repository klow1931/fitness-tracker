/* v2.74 — deterministic helpers for frictionless in-workout controls.
 * Load adjustments are display-unit values only. Storage conversion remains
 * owned by the existing workout logger/session pipeline.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteTrainingCockpit=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const norm=x=>String(x??'').trim().replace(/\s+/g,' ').toLowerCase();
 function loadSteps(unit){
  return unit==='lb'?{small:2.5,large:5}:{small:1.25,large:2.5};
 }
 function adjustDisplayWeight(value,delta){
  const current=Number(value),step=Number(delta);
  if(!Number.isFinite(step))return null;
  const next=Math.max(0,(Number.isFinite(current)?current:0)+step);
  return Math.round(next*100)/100;
 }
 function elapsedMinutes(startedAt,now=new Date().toISOString()){
  const start=Date.parse(startedAt),end=Date.parse(now);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return null;
  return Math.floor((end-start)/60000);
 }
 function exerciseIdentity(exercise){
  if(exercise?.exerciseId)return 'id:'+String(exercise.exerciseId);
  return 'name:'+norm(exercise?.name);
 }
 function plannedExercise(plan,{exerciseId=null,name='',trackBy='reps'}={}){
  const rows=plan?.plannedExercises||[];
  const matches=rows.filter(e=>{
   if(e?.type==='cardio')return false;
   const mode=e.trackBy==='duration'?'duration':'reps';
   if(mode!==trackBy)return false;
   if(exerciseId)return e.exerciseId===exerciseId||(!e.exerciseId&&norm(e.name)===norm(name));
   return norm(e.name)===norm(name);
  });
  return matches.length===1?matches[0]:null;
 }
 function targetSet(plan,marker,setIndex){
  const exercise=plannedExercise(plan,marker);
  const index=Number(setIndex);
  if(!exercise||!Number.isInteger(index)||index<0)return null;
  const set=exercise.sets?.[index];
  if(!set)return null;
  return {
   exercise:exerciseIdentity(exercise),
   weight:Number.isFinite(Number(set.weight))?Number(set.weight):null,
   reps:Number.isFinite(Number(set.reps))?Number(set.reps):null,
   duration:Number.isFinite(Number(set.duration))?Number(set.duration):null,
   targetRpe:Number(set.targetRpe)>=1&&Number(set.targetRpe)<=10?Number(set.targetRpe):null
  };
 }
 function transition(fromExerciseIndex,toExerciseIndex){
  const from=Number(fromExerciseIndex),to=Number(toExerciseIndex);
  return Number.isInteger(from)&&Number.isInteger(to)&&from>=0&&to===from+1;
 }
 function workoutTakeaway(workout){
  const sets=(workout?.exercises||[]).filter(e=>e.type!=='cardio').flatMap(e=>e.sets||[]);
  const known=sets.filter(s=>s.rpe!=null&&s.rpe!==''&&Number.isFinite(Number(s.rpe))&&Number(s.rpe)>=1&&Number(s.rpe)<=10).length;
  return {logged:sets.length+' strength sets recorded.',watch:!sets.length?'Cardio recorded; no strength-effort comparison.':known<sets.length?(sets.length-known)+' sets have no recorded RPE; effort comparisons are limited.':'Effort recorded for every strength set; recovery is still separate.',next:'Keep scheduled targets until a supported change is reviewed.'};
 }
 return {loadSteps,adjustDisplayWeight,elapsedMinutes,plannedExercise,targetSet,transition,workoutTakeaway};
});
