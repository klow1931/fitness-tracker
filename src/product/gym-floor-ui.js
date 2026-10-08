/* v2.75 — mobile gym-floor ergonomics coordinated with execution-first mode.
 * Adds input affordances, previous-set context and a one-handed session dock.
 * Training data remains owned by the existing workout logger/session modules.
 */
(function(){
 'use strict';
 let decorated=false,viewportBase=0,viewportWidth=0;
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
 function currentSetPayload(set,trackBy){
  if(!set)return null;
  const measure=set.querySelector(trackBy==='duration'?'.set-duration':'.set-reps'),weight=set.querySelector('.set-weight');
  if(!(Number(measure?.value)>0))return null;
  return {measure:measure.value,weight:weight?.value??''};
 }
 function copyCurrentSet(from,to,trackBy){
  const payload=currentSetPayload(from,trackBy);if(!payload)return false;
  const weight=to.querySelector('.set-weight'),measure=to.querySelector(trackBy==='duration'?'.set-duration':'.set-reps');
  if(weight){weight.value=payload.weight;weight.dispatchEvent(new Event('input',{bubbles:true}));}
  if(measure){measure.value=payload.measure;measure.dispatchEvent(new Event('input',{bubbles:true}));}
  return true;
 }
 function setContext(set,previous,trackBy,index,priorSet){
  let host=set.querySelector('.gym-set-history');
  if(!host){host=document.createElement('div');host.className='gym-set-history';set.appendChild(host);}
  const prior=previous?.exercise?.sets?.[index],label=previousLabel(prior,trackBy),same=currentSetPayload(priorSet,trackBy);
  const measure=set.querySelector(trackBy==='duration'?'.set-duration':'.set-reps'),weight=set.querySelector('.set-weight');
  const blank=!(Number(measure?.value)>0)&&!(Number(weight?.value)>0);
  const canCopySame=!!(blank&&same),canUseLast=!!(blank&&label),signature=[label,blank,currentUnit(),canCopySame,same?.weight,same?.measure].join('|');
  if(host._gymSignature===signature){host.hidden=!(label||canCopySame);return;}
  host._gymSignature=signature;
  if(!label&&!canCopySame){host.hidden=true;host.replaceChildren();return;}
  host.hidden=false;
  host.innerHTML=(label?'<span>Last: '+esc(label)+'</span>':'<span>Quick fill</span>')+
    '<div class="gym-set-history-actions">'+
    (canCopySame?'<button type="button" class="gym-copy-prior" data-gym-copy-prior>Same as set '+index+'</button>':'')+
    (canUseLast?'<button type="button" class="gym-use-last" data-gym-use-last>Use last session</button>':'')+
    '</div>';
  host.querySelector('[data-gym-copy-prior]')?.addEventListener('click',()=>{
    if(!copyCurrentSet(priorSet,set,trackBy))return;
    saveLoggerDraft();updateTrainingFlow();refresh();
    set.querySelector('.set-rpe')?.focus({preventScroll:true});
  });
  host.querySelector('[data-gym-use-last]')?.addEventListener('click',()=>{
    const payload=H()?.previousPayload(prior,trackBy);if(!payload)return;
    if(weight&&payload.weight!=null){weight.value=String(toDisplay(payload.weight));weight.dispatchEvent(new Event('input',{bubbles:true}));}
    if(trackBy==='duration'){
      const duration=set.querySelector('.set-duration');if(duration&&payload.duration!=null){duration.value=String(payload.duration);duration.dispatchEvent(new Event('input',{bubbles:true}));}
    }else{
      const reps=set.querySelector('.set-reps');if(reps&&payload.reps!=null){reps.value=String(payload.reps);reps.dispatchEvent(new Event('input',{bubbles:true}));}
    }
    saveLoggerDraft();updateTrainingFlow();refresh();
    set.querySelector('.set-rpe')?.focus({preventScroll:true});
  });
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
    const sets=[...row.querySelectorAll('.sets-container > div')];
    sets.forEach((set,index)=>{
      configureInput(set.querySelector('.set-weight'),'weight');
      configureInput(set.querySelector('.set-reps'),'reps');
      configureInput(set.querySelector('.set-duration'),'duration');
      configureInput(set.querySelector('.set-rpe'),'rpe');
      setContext(set,previous,trackBy,index,index>0?sets[index-1]:null);
    });
  }
 }
 function dock(){
  let host=document.getElementById('gym-floor-dock');if(host)return host;
  host=document.createElement('aside');host.id='gym-floor-dock';host.className='gym-floor-dock';host.setAttribute('aria-label','Workout quick controls');
  host.innerHTML='<button type="button" class="gym-floor-current" data-gym-current><span>Current set</span><b data-gym-current-label>Workout</b><small data-gym-progress></small></button><button type="button" class="gym-floor-rest" data-gym-rest aria-label="Rest timer"><span>Rest</span><b id="rest-timer-sticky">—</b></button><button type="button" class="btn-primary gym-floor-finish" data-gym-finish>Finish</button>';
  document.body.appendChild(host);
  host.querySelector('[data-gym-current]').onclick=()=>{const set=document.querySelector('#exercise-rows .logger-active-set')||firstUnfinishedSet();set?.scrollIntoView({block:'center',behavior:'smooth'});};
  host.querySelector('[data-gym-rest]').onclick=()=>{
   if(window.LoadnoteRestTimer?.snapshot?.().active){document.getElementById('training-cockpit')?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
   if(window.LoadnoteTrainingExecutionUI?.isActive?.()&&!window.LoadnoteTrainingExecutionUI?.optionsOpen?.())window.LoadnoteTrainingExecutionUI.toggleOptions();
   requestAnimationFrame(()=>document.querySelector('.training-rest-controls')?.scrollIntoView({block:'center',behavior:'smooth'}));
  };
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
 function progressState(){
  const rows=[...document.querySelectorAll('#exercise-rows > div')].map(row=>{
    if(row.dataset.type==='cardio')return {type:'cardio',entered:Number(row.querySelector('.cardio-duration')?.value)>0||Number(row.querySelector('.cardio-distance')?.value)>0,done:!!row.querySelector('.cardio-done')?.checked};
    const trackBy=row.dataset.trackBy==='duration'?'duration':'reps';
    return {type:'strength',sets:[...row.querySelectorAll('.sets-container > div')].map(set=>({entered:Number(set.querySelector(trackBy==='duration'?'.set-duration':'.set-reps')?.value)>0,done:!!set.querySelector('.set-done-check')?.checked}))};
  });
  return H()?.sessionProgress(rows)||null;
 }
 function updateDock(){
  const host=dock(),hasDraft=(()=>{try{return loggerHasContent();}catch{return false;}})(),progress=progressState();
  const show=loggerVisible()&&hasDraft;
  host.classList.toggle('gym-floor-dock-active',show);
  document.body.classList.toggle('gym-floor-dock-visible',show);
  host.setAttribute('aria-hidden',String(!show));
  const label=host.querySelector('[data-gym-current-label]');if(label)label.textContent=currentLabel();
  const progressLabel=host.querySelector('[data-gym-progress]');
  if(progressLabel)progressLabel.textContent=progress?.totalSets?progress.doneSets+'/'+progress.totalSets+' sets · '+progress.doneExercises+'/'+progress.totalExercises+' exercises':'';
  const finish=host.querySelector('[data-gym-finish]');if(finish)finish.textContent=progress?.complete?'Review':'Finish';
  const train=document.querySelector('#mobile-nav [data-tab="workouts"]');
  train?.classList.toggle('workout-draft-active',hasDraft);
  if(train)train.setAttribute('aria-label',hasDraft?'Train — workout draft saved':'Train');
 }
 function viewportState(){
  const vv=window.visualViewport;
  if(!vv){document.body.classList.remove('mobile-keyboard-open');return;}
  const field=document.activeElement;
  const editing=!!field&&!field.disabled&&!field.readOnly&&field.getClientRects().length>0&&
   (field.isContentEditable||field.tagName==='TEXTAREA'||
    (field.tagName==='INPUT'&&['text','search','email','url','tel','password','number'].includes(field.type)));
  const width=Math.round(vv.width||window.innerWidth||0);
  if(!editing||!viewportWidth||Math.abs(width-viewportWidth)>80){viewportWidth=width;viewportBase=vv.height;}
  if(!viewportBase||vv.height>viewportBase)viewportBase=vv.height;
  const layout=Math.max(document.documentElement.clientHeight,viewportBase);
  const open=H()?.shouldHideNavigation(layout,vv.height,{editing,scale:vv.scale??1})||false;
  document.body.classList.toggle('mobile-keyboard-open',open);
 }
 function refresh(){decorateRows();window.LoadnoteAccessibility?.decorateLogger();updateDock();viewportState();}
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
  document.addEventListener('focusin',()=>queueMicrotask(viewportState));
  document.addEventListener('focusout',()=>queueMicrotask(viewportState));
  document.addEventListener('keydown',keydown);
  window.visualViewport?.addEventListener('resize',viewportState);
  window.visualViewport?.addEventListener('scroll',viewportState);
  window.addEventListener('resize',viewportState);
  window.addEventListener('pageshow',viewportState);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){viewportState();refresh();}});
 }
 window.LoadnoteGymFloorUI={init,refresh,decorateRows,updateDock,viewportState,currentLabel,progressState};
 window.refreshGymFloorUI=refresh;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
