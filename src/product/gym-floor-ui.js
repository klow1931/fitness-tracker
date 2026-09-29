/* v2.62 — mobile gym-floor logging ergonomics.
 * Adds input affordances, previous-set context and a one-handed session dock.
 * Training data remains owned by the existing workout logger/session modules.
 */
(function(){
 'use strict';
 let decorated=false,viewportBase=0;
 const H=()=>window.LoadnoteGymFloor;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function loggerVisible(){
  const panel=document.getElementById('panel-workouts'),sub=document.querySelector('[data-panel="workouts"][data-sub="wo-log"]');
  return !!panel&&!panel.classList.contains('hidden')&&!!sub&&!sub.classList.contains('hidden');
 }
 function rowPrevious(row){
  if(!row||row.dataset.type==='cardio')return null;
  const name=row.querySelector('.ex-name')?.value.trim(),date=document.getElementById('wo-date')?.value;
  if(!name||!date||!window.LoadnoteSession)return null;
  let exerciseId=null;try{exerciseId=window.LoadnoteIntegrity?.resolveExercise(data.exerciseCatalog,name)?.id||null;}catch{}
  let editId=null;try{editId=typeof workoutEdit!=='undefined'?workoutEdit?.id:null;}catch{}
  try{return LoadnoteSession.previous(data.workouts||[],name,date,editId,row.dataset.type,row.dataset.trackBy,exerciseId);}catch{return null;}
 }
 function previousLabel(set,trackBy){
  const p=H()?.previousPayload(set,trackBy);if(!p)return '';
  const parts=[];
  if(p.weight!=null)parts.push(String(toDisplay(p.weight))+' '+unitLabel());
  parts.push(trackBy==='duration'?p.duration+' sec':p.reps+' reps');
  const effort=Number(set?.rpe);if(Number.isFinite(effort)&&effort>=1&&effort<=10)parts.push('RPE '+effort);
  return parts.join(' × ');
 }
 function configureInput(input,kind){
  if(!input)return;
  input.inputMode=H()?.inputMode(kind)||'decimal';
  input.autocomplete='off';
  input.setAttribute('enterkeyhint',kind==='rpe'?'done':'next');
  input.setAttribute('data-gym-field',kind);
 }
 function setContext(set,previous,trackBy,index){
  let host=set.querySelector('.gym-set-history');
  if(!host){host=document.createElement('div');host.className='gym-set-history';set.appendChild(host);}
  const prior=previous?.exercise?.sets?.[index],label=previousLabel(prior,trackBy);
  if(!label){host.hidden=true;host.replaceChildren();return;}
  const measure=set.querySelector(trackBy==='duration'?'.set-duration':'.set-reps'),weight=set.querySelector('.set-weight');
  const blank=!(Number(measure?.value)>0)&&!(Number(weight?.value)>0);
  host.hidden=false;
  host.innerHTML='<span>Last: '+esc(label)+'</span>'+(blank?'<button type="button" class="gym-use-last" data-gym-use-last>Use last</button>':'');
  const button=host.querySelector('[data-gym-use-last]');
  if(button)button.onclick=()=>{
    const payload=H()?.previousPayload(prior,trackBy);if(!payload)return;
    if(weight&&payload.weight!=null){weight.value=String(toDisplay(payload.weight));weight.dispatchEvent(new Event('input',{bubbles:true}));}
    if(trackBy==='duration'){
      const duration=set.querySelector('.set-duration');if(duration&&payload.duration!=null){duration.value=String(payload.duration);duration.dispatchEvent(new Event('input',{bubbles:true}));}
    }else{
      const reps=set.querySelector('.set-reps');if(reps&&payload.reps!=null){reps.value=String(payload.reps);reps.dispatchEvent(new Event('input',{bubbles:true}));}
    }
    saveLoggerDraft();updateTrainingFlow();refresh();
    (trackBy==='duration'?set.querySelector('.set-duration'):set.querySelector('.set-reps'))?.focus({preventScroll:true});
  };
 }
 function decorateRows(){
  if(!H())return;
  for(const row of document.querySelectorAll('#exercise-rows > div')){
    if(row.dataset.type==='cardio'){
      configureInput(row.querySelector('.cardio-duration'),'duration');
      configureInput(row.querySelector('.cardio-distance'),'distance');
      configureInput(row.querySelector('.cardio-hr'),'hr');
      continue;
    }
    const trackBy=row.dataset.trackBy==='duration'?'duration':'reps',previous=rowPrevious(row);
    [...row.querySelectorAll('.sets-container > div')].forEach((set,index)=>{
      configureInput(set.querySelector('.set-weight'),'weight');
      configureInput(set.querySelector('.set-reps'),'reps');
      configureInput(set.querySelector('.set-duration'),'duration');
      configureInput(set.querySelector('.set-rpe'),'rpe');
      setContext(set,previous,trackBy,index);
    });
  }
 }
 function dock(){
  let host=document.getElementById('gym-floor-dock');if(host)return host;
  host=document.createElement('aside');host.id='gym-floor-dock';host.className='gym-floor-dock';host.setAttribute('aria-label','Workout quick controls');
  host.innerHTML='<button type="button" class="gym-floor-current" data-gym-current><span>Current set</span><b data-gym-current-label>Workout</b></button><button type="button" class="gym-floor-rest" data-gym-rest aria-label="Rest timer"><span>Rest</span><b id="rest-timer-sticky">—</b></button><button type="button" class="btn-primary gym-floor-finish" data-gym-finish>Finish</button>';
  document.body.appendChild(host);
  host.querySelector('[data-gym-current]').onclick=()=>{const set=document.querySelector('#exercise-rows .logger-active-set')||firstUnfinishedSet();set?.scrollIntoView({block:'center',behavior:'smooth'});};
  host.querySelector('[data-gym-rest]').onclick=()=>document.querySelector('.training-rest-controls')?.scrollIntoView({block:'center',behavior:'smooth'});
  host.querySelector('[data-gym-finish]').onclick=()=>reviewWorkout();
  return host;
 }
 function firstUnfinishedSet(){
  return [...document.querySelectorAll('#exercise-rows .sets-container > div')].find(set=>!set.querySelector('.set-done-check')?.checked)||null;
 }
 function currentLabel(){
  const set=document.querySelector('#exercise-rows .logger-active-set')||firstUnfinishedSet();if(!set)return 'Workout';
  const row=set.closest('#exercise-rows > div'),sets=[...row.querySelectorAll('.sets-container > div')],number=sets.indexOf(set)+1,name=row.querySelector('.ex-name')?.value.trim()||'Exercise';
  return name+' · Set '+Math.max(1,number);
 }
 function updateDock(){
  const host=dock(),hasDraft=(()=>{try{return loggerHasContent();}catch{return false;}})();
  const show=loggerVisible()&&hasDraft;
  host.classList.toggle('gym-floor-dock-active',show);
  host.setAttribute('aria-hidden',String(!show));
  const label=host.querySelector('[data-gym-current-label]');if(label)label.textContent=currentLabel();
  const train=document.querySelector('#mobile-nav [data-tab="workouts"]');
  train?.classList.toggle('workout-draft-active',hasDraft);
  if(train)train.setAttribute('aria-label',hasDraft?'Train — workout draft saved':'Train');
  try{paintRest();}catch{}
 }
 function viewportState(){
  const vv=window.visualViewport;if(!vv)return;
  if(!viewportBase||vv.height>viewportBase)viewportBase=vv.height;
  const layout=Math.max(document.documentElement.clientHeight,viewportBase);
  const open=H()?.keyboardLikelyOpen(layout,vv.height,140)||false;
  document.body.classList.toggle('mobile-keyboard-open',open);
 }
 function refresh(){decorateRows();updateDock();viewportState();}
 function keydown(event){
  const input=event.target.closest?.('#exercise-rows [data-gym-field]');if(!input||event.key!=='Enter')return;
  const set=input.closest('.sets-container > div'),kind=input.dataset.gymField;if(!set)return;
  let next=null;
  if(kind==='weight')next=set.querySelector('.set-reps,.set-duration');
  else if(kind==='reps'||kind==='duration')next=set.querySelector('.set-rpe');
  else if(kind==='rpe'&&Number(input.value)>=1&&Number(input.value)<=10){
    event.preventDefault();window.completeLoggerSetQuickly?.(set,input.value);return;
  }
  if(next){event.preventDefault();next.focus();try{next.select();}catch{}}
 }
 function init(){
  if(decorated)return;decorated=true;
  dock();refresh();
  const rows=document.getElementById('exercise-rows');
  if(rows)new MutationObserver(()=>queueMicrotask(refresh)).observe(rows,{childList:true,subtree:true});
  document.addEventListener('input',event=>{if(event.target.closest?.('#workout-log-card'))queueMicrotask(refresh);});
  document.addEventListener('change',event=>{if(event.target.closest?.('#workout-log-card'))queueMicrotask(refresh);});
  document.addEventListener('focusin',event=>{if(event.target.closest?.('#workout-log-card'))queueMicrotask(refresh);});
  document.addEventListener('keydown',keydown);
  window.visualViewport?.addEventListener('resize',viewportState);
  window.visualViewport?.addEventListener('scroll',viewportState);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){viewportState();refresh();}});
 }
 window.LoadnoteGymFloorUI={init,refresh,decorateRows,updateDock,viewportState,currentLabel};
 window.refreshGymFloorUI=refresh;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
