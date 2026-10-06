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
   if(row.dataset.type==='cardio'&&header){
    // Cardio completion is an execution control, not setup chrome. Keep its
    // checkbox visible while hiding only the editable header/options around it.
    header.classList.remove('execution-row-options');
    const completion=row.querySelector('.cardio-done')?.closest('.cardio-completion-label')||row.querySelector('.cardio-done')?.closest('label');
    for(const child of header.children)child.classList.toggle('execution-row-options',child!==completion);
   }else header?.classList.add('execution-row-options');
   note?.classList.add('execution-row-options');
  }
 }
 function syncViewportInsets(){
  const root=document.documentElement,cockpit=document.getElementById('training-cockpit'),dock=document.getElementById('gym-floor-dock');
  const transitioning=!!cockpit?.querySelector('[data-cockpit-transition]');
  // Secondary controls remain reachable in normal flow; they must not cover RPE chips.
  const inlineDock=active&&cockpit&&!cockpit.hidden;
  if(dock){const parent=inlineDock?document.getElementById('workout-log-card'):document.body;if(parent&&dock.parentElement!==parent)parent.appendChild(dock);dock.style.position=inlineDock?'static':'';dock.style.marginTop=inlineDock?'.75rem':'';}
  const tallCockpit=cockpit&&cockpit.getBoundingClientRect().height>innerHeight*.4;
  if(cockpit)cockpit.style.position=active&&(optionsOpen||tallCockpit)?'static':'';
  if(dock)dock.style.display=transitioning?'none':'';
  if(!active){root.style.scrollPaddingTop='';root.style.scrollPaddingBottom='';return;}
  const top=!optionsOpen&&!tallCockpit&&cockpit&&!cockpit.hidden?Math.ceil(cockpit.getBoundingClientRect().height)+12:0;
  const bottom=!inlineDock&&!transitioning&&dock?.classList.contains('gym-floor-dock-active')?Math.ceil(innerHeight-dock.getBoundingClientRect().top)+12:0;
  root.style.scrollPaddingTop=top?top+'px':'';
  root.style.scrollPaddingBottom=bottom?bottom+'px':'';
 }
 function syncViewportSoon(){requestAnimationFrame(()=>{syncViewportInsets();window.LoadnoteCoachCompanionUI?.syncLauncherPosition?.();});}
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
  syncViewportSoon();
 }
 function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;update();});}
 function toggleOptions(){
  if(!active)return;
  optionsOpen=!optionsOpen;
  document.body.classList.toggle('training-execution-options-open',optionsOpen);
  window.refreshTrainingCockpit?.();
  syncViewportSoon();
  if(optionsOpen){
   const target=document.querySelector('#workout-log-card .execution-secondary');
   requestAnimationFrame(()=>target?.scrollIntoView({block:'nearest',behavior:'smooth'}));
  }
 }
 function closeOptions(){if(!optionsOpen)return;optionsOpen=false;document.body.classList.remove('training-execution-options-open');window.refreshTrainingCockpit?.();syncViewportSoon();}
 function init(){
  decorateSecondary();update();
  const card=document.getElementById('workout-log-card');
  if(card){
   // Cockpit controls are re-rendered from workout state. Prevent the cockpit's
   // card-level focus refresh from replacing a button between pointer-down and
   // click, which would make otherwise valid gym-floor actions intermittently
   // non-interactive.
   card.addEventListener('focusin',event=>{
    if(event.target.closest?.('#training-cockpit'))event.stopImmediatePropagation();
   },true);
   card.addEventListener('input',queue);
   // Text and numeric logger fields already update execution state on `input`.
   // Their blur-triggered `change` event must not queue a second shell render,
   // otherwise the cockpit button being tapped can be replaced before click.
   card.addEventListener('change',event=>{
    if(event.target.matches?.('input:not([type="checkbox"]):not([type="radio"]),textarea'))return;
    queue();
   });
  }
  const rows=document.getElementById('exercise-rows');if(rows)new MutationObserver(queue).observe(rows,{childList:true,subtree:true});
  // A restored draft is initialized while Home is visible. Refresh when the
  // athlete returns to Train so the already-active execution shell can reveal
  // its cockpit instead of remaining hidden from the initial render.
  const panel=document.getElementById('panel-workouts'),log=document.querySelector('[data-panel="workouts"][data-sub="wo-log"]');
  const viewObserver=new MutationObserver(queue);
  for(const target of [panel,log])if(target)viewObserver.observe(target,{attributes:true,attributeFilter:['class']});
  // The mobile gym dock is redundant during the explicit exercise-transition
  // prompt and can cover its primary action. Keep viewport insets synchronized
  // whenever the cockpit content changes.
  const cockpit=document.getElementById('training-cockpit');if(cockpit)new MutationObserver(syncViewportSoon).observe(cockpit,{childList:true,subtree:true});
  window.addEventListener('resize',syncViewportSoon,{passive:true});
 }
 window.LoadnoteTrainingExecutionUI={init,refresh:update,isActive:()=>active,optionsOpen:()=>optionsOpen,toggleOptions,closeOptions,rowSnapshot};
 window.refreshTrainingExecution=update;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
