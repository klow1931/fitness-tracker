/* v2.75 — execution-first workout shell.
 * Collapses setup chrome only after meaningful workout work exists. Existing
 * logger, schedule, rest and save flows remain authoritative.
 */
(function(){
 'use strict';
 let active=false,optionsOpen=false,queued=false;
 const E=()=>window.LoadnoteTrainingExecution;
 function editing(){try{return !!(typeof workoutEdit!=='undefined'&&workoutEdit);}catch{return false;}}
 function rowSnapshot(row){
  if(row.dataset.type==='cardio')return {
   type:'cardio',name:row.querySelector('.ex-name')?.value.trim()||'',
   duration:row.querySelector('.cardio-duration')?.value||'',distance:row.querySelector('.cardio-distance')?.value||'',
   done:!!row.querySelector('.cardio-done')?.checked
  };
  const trackBy=row.dataset.trackBy==='duration'?'duration':'reps';
  return {
   type:'strength',name:row.querySelector('.ex-name')?.value.trim()||'',
   sets:[...row.querySelectorAll('.sets-container > div')].map(set=>({
    measure:set.querySelector(trackBy==='duration'?'.set-duration':'.set-reps')?.value||'',
    weight:set.querySelector('.set-weight')?.value||'',rpe:set.querySelector('.set-rpe')?.value||'',
    done:!!set.querySelector('.set-done-check')?.checked
   }))
  };
 }
 function sessionFlags(){
  let scheduled=false,started=false;
  try{scheduled=!!(typeof pendingScheduledSession!=='undefined'&&pendingScheduledSession);started=!!(typeof pendingSessionTiming!=='undefined'&&pendingSessionTiming?.startedAt);}catch{}
  return {scheduled,started};
 }
 function shouldActivate(){
  if(editing())return false;
  const rows=[...document.querySelectorAll('#exercise-rows > div')].map(rowSnapshot);
  return !!E()?.meaningful(rows,sessionFlags());
 }
 function decorateSecondary(){
  const card=document.getElementById('workout-log-card');if(!card)return;
  const top=card.querySelector(':scope > .flex.flex-wrap.items-center.justify-between');
  const date=document.getElementById('wo-date')?.closest('.grid');
  const timing=document.querySelector('#workout-log-card [data-workout-action="start-session"]')?.closest('.mb-3');
  const intent=document.getElementById('session-intent');
  const draft=document.getElementById('logger-draft-status');
  const summary=document.getElementById('logger-summary');
  const helper=summary?.nextElementSibling;
  const sessionBar=card.querySelector('.training-session-bar');
  const add=document.querySelector('#exercise-rows + .flex');
  const actions=document.getElementById('workout-actions');
  for(const el of [top,date,timing,intent,draft,summary,helper,sessionBar,add,actions])el?.classList.add('execution-secondary');
  for(const row of document.querySelectorAll('#exercise-rows > div')){
   const header=row.querySelector('.ex-name')?.closest('.flex');
   const note=row.querySelector('.ex-note')?.closest('.mb-2');
   header?.classList.add('execution-row-options');
   note?.classList.add('execution-row-options');
  }
 }
 function update(){
  decorateSecondary();
  const next=shouldActivate();
  if(!next)optionsOpen=false;
  active=next;
  document.body.classList.toggle('training-execution-active',active);
  document.body.classList.toggle('training-execution-options-open',active&&optionsOpen);
  window.updateTrainingFlow?.();
  window.refreshTrainingCockpit?.();
  window.refreshGymFloorUI?.();
 }
 function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;update();});}
 function toggleOptions(){
  if(!active)return;
  optionsOpen=!optionsOpen;
  document.body.classList.toggle('training-execution-options-open',optionsOpen);
  window.refreshTrainingCockpit?.();
  if(optionsOpen){
   const target=document.querySelector('#workout-log-card .execution-secondary');
   requestAnimationFrame(()=>target?.scrollIntoView({block:'nearest',behavior:'smooth'}));
  }
 }
 function closeOptions(){if(!optionsOpen)return;optionsOpen=false;document.body.classList.remove('training-execution-options-open');window.refreshTrainingCockpit?.();}
 function init(){
  decorateSecondary();update();
  const card=document.getElementById('workout-log-card');
  if(card){
   card.addEventListener('input',queue);
   card.addEventListener('change',queue);
   card.addEventListener('focusin',event=>{
    if(!active||!optionsOpen)return;
    if(event.target.matches?.('.set-weight,.set-reps,.set-duration,.set-rpe,.cardio-duration,.cardio-distance,.cardio-hr'))closeOptions();
   });
  }
  const rows=document.getElementById('exercise-rows');if(rows)new MutationObserver(queue).observe(rows,{childList:true,subtree:true});
 }
 window.LoadnoteTrainingExecutionUI={init,refresh:update,isActive:()=>active,optionsOpen:()=>optionsOpen,toggleOptions,closeOptions,rowSnapshot};
 window.refreshTrainingExecution=update;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();