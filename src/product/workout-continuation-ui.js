/* v7.6 — explicit continuation after entered work is checked complete.
 * Existing form, draft and review serializers remain authoritative.
 */
(function(){
 'use strict';
 function available(){
  const host=document.getElementById('training-cockpit');
  if(window.loggerSaving||!host||host.hidden||document.getElementById('workout-review')?.open)return null;
  const panel=document.getElementById('panel-workouts'),log=document.querySelector('[data-panel="workouts"][data-sub="wo-log"]');
  if(panel?.classList.contains('hidden')||log?.classList.contains('hidden'))return null;
  const ctx=window.LoadnoteTrainingCockpitUI?.current?.();
  const rows=[...document.querySelectorAll('#exercise-rows > div')];
  if(!ctx||ctx.row||!ctx.rows.length||ctx.rows.length!==rows.length)return null;
  const last=ctx.rows.at(-1);
  return {last,canAddSet:last.dataset.type!=='cardio'&&!!last.querySelector('.sets-container > div')};
 }
 function focus(input){
  if(!input?.isConnected)return;
  input.scrollIntoView({block:'center',behavior:'instant'});input.focus({preventScroll:true});
 }
 function changed(){saveLoggerDraft();updateTrainingFlow();window.refreshTrainingCockpit?.();}
 function addBlankSet(){
  const next=available();if(!next?.canAddSet)return false;
  const container=next.last.querySelector('.sets-container');
  addSetToContainer(container,{reps:'',duration:'',weight:'',rpe:'',showCompletion:true},next.last.dataset.trackBy==='duration'?'duration':'reps');
  changed();focus(container.lastElementChild.querySelector('.set-reps,.set-duration'));return true;
 }
 function addExercise(){
  if(!available())return false;
  addExerciseRow();changed();
  window.LoadnoteTrainingExecutionUI?.openOptions?.();
  focus(document.querySelector('#exercise-rows > div:last-child .ex-name'));return true;
 }
 function render(host,complete){
  if(!complete)return;
  const next=available();if(!next)return;
  const section=document.createElement('section');section.className='workout-continuation';section.setAttribute('aria-label','Keep training');
  const text=document.createElement('p');text.textContent=next.canAddSet?'More work to log? Add a blank set or another exercise.':'More work to log? Add another exercise.';section.append(text);
  if(next.canAddSet){
   const button=document.createElement('button');button.type='button';button.className='btn-secondary';button.dataset.continuationSet='';
   button.textContent='Add blank set · '+next.last.querySelector('.ex-name').value.trim();button.onclick=addBlankSet;section.append(button);
  }
  const exercise=document.createElement('button');exercise.type='button';exercise.className='btn-secondary';exercise.dataset.continuationExercise='';exercise.textContent='Add exercise';exercise.onclick=addExercise;section.append(exercise);
  host.querySelector('.training-cockpit-current')?.after(section);
 }
 window.LoadnoteWorkoutContinuationUI={render,addBlankSet,addExercise};
})();
