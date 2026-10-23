/* v3.92: first-workout path and action-driven, read-only guidance. */
(function(){
 'use strict';
 const model=window.LoadnoteBeginnerExperience;
 let preference=model.normalize(),loaded=false,viewIsExplicit=false;
 function load(){if(!loaded){try{preference=model.read(localStorage);}catch{}loaded=true;}return preference;}
 function initialize(state){
  try{
   const raw=localStorage.getItem(model.KEY);
   viewIsExplicit=raw!==null;
   preference=raw===null&&model.isNewAthlete(state)?model.normalize({view:'simple'}):model.read(localStorage);
  }catch{preference=model.normalize();viewIsExplicit=false;}
  loaded=true;apply();
 }
 function change(patch){
  try{preference=model.write(localStorage,load(),patch);viewIsExplicit=true;}
  catch{apply();window.showToast?.('Could not save your view preference on this device. Nothing was changed.','error');return false;}
  apply();return true;
 }
 function apply(){
  const p=load();
  document.body.classList.toggle('loadnote-simple-view',p.view==='simple');
  // Fresh installs default to a calm presentation, but do not remove
  // established Home routes before an athlete explicitly chooses first logging.
  document.body.classList.toggle('loadnote-first-workout',p.entry==='log'||viewIsExplicit&&p.view==='simple');
  const banner=document.getElementById('simple-view-banner');if(banner)banner.hidden=p.view!=='simple';
  const choice=document.getElementById('beginner-simple-choice');if(choice)choice.checked=p.view==='simple';
  const card=document.getElementById('onboarding-card');if(card&&p.entry)card.classList.add('hidden');
  renderGuide();
 }
 function enter(entry){
  const simple=document.getElementById('beginner-simple-choice')?.checked;
  if(!change({entry,view:simple?'simple':'full'}))return;
  if(entry==='log'){window.openFastStartLogger?.({compact:true});renderGuide();return;}
  if(entry==='help'){
   window.openProgrammingProfile?.({guided:true,notice:'Start with your goal, available days and equipment. Leave unknown experience as unknown. Review suggested programs before scheduling.',onSaved:()=>window.LoadnoteTrainingHubUI?.plan?.()});return;
  }
  window.showTab?.('coach');window.showSubTab?.('coach','co-programs');
  window.renderCustomProgramStudio?.();window.LoadnoteCustomProgramUI?.open();
 }
 function observations(){
  const rows=[...document.querySelectorAll('#exercise-rows > div')];
  const namedExercise=rows.some(row=>!!row.querySelector('.ex-name')?.value.trim());
  const enteredSet=rows.some(row=>{
   if(!row.querySelector('.ex-name')?.value.trim())return false;
   if(row.dataset.type==='cardio')return Number(row.querySelector('.set-duration')?.value)>0||
    Number(row.querySelector('[data-cardio-duration]')?.value)>0;
   return [...row.querySelectorAll('.logger-set')].some(set=>
    Number(set.querySelector('.set-reps')?.value)>0||Number(set.querySelector('.set-duration')?.value)>0);
  });
  return {namedExercise,enteredSet,reviewOpen:!!document.getElementById('workout-review')?.open};
 }
 function renderGuide(){
  const host=document.getElementById('beginner-workout-guide');if(!host)return;
  const p=load(),editing=typeof workoutEdit!=='undefined'&&!!workoutEdit;
  const workouts=typeof data!=='undefined'?(data.workouts||[]):[];
  host.hidden=p.guide!=='active'||editing||(workouts.length>0&&p.entry===null);
  const obs=observations(),index=model.guideStage(obs);
  const reviewTip=document.getElementById('beginner-review-tip');
  if(reviewTip)reviewTip.hidden=host.hidden||!obs.reviewOpen;
  if(host.hidden)return;
  if(host.dataset.guideStage===String(index))return;
  host.dataset.guideStage=String(index);
  const step=model.steps[index];
  host.innerHTML='<p class="more-hint">First workout · '+(index+1)+' of 4</p>'+
   '<h3>'+step.title+'</h3><p>'+step.body+'</p>'+
   '<div class="beginner-actions"><button type="button" class="btn-secondary" data-guide="skip">Hide tips</button></div>'+
   '<p class="more-hint">These tips follow your actions. Only Save workout records your session.</p>';
  host.querySelector('[data-guide="skip"]')?.addEventListener('click',()=>{
   if(change({guide:'skipped'}))document.getElementById('workout-mode-title')?.focus({preventScroll:true});
  });
 }
 function preferencesHTML(){
  const p=load();return '<div class="profile-preference-row"><div><b>Simple view</b><p class="more-hint">Keep Home focused on training. Your workouts and programming are unchanged. Saved on this device.</p></div><button type="button" class="btn-secondary" id="profile-simple-view" aria-pressed="'+(p.view==='simple')+'">'+(p.view==='simple'?'On':'Off')+'</button></div><div class="profile-guide-actions"><button type="button" class="btn-secondary" id="profile-replay-guide">Replay workout tips</button><button type="button" class="btn-secondary" id="profile-starting-choices">Choose how to start</button></div>';
 }
 function bindPreferences(host){
  host.querySelector('#profile-simple-view')?.addEventListener('click',()=>{if(change({view:load().view==='simple'?'full':'simple'}))window.renderProfileHub?.();});
  host.querySelector('#profile-replay-guide')?.addEventListener('click',()=>{
   if(change({guide:'active',step:0,entry:load().entry||'log'})){
    const guide=document.getElementById('beginner-workout-guide');if(guide)delete guide.dataset.guideStage;
    window.openFastStartLogger?.({compact:true});renderGuide();
    guide?.scrollIntoView({block:'start'});
   }
  });
  host.querySelector('#profile-starting-choices')?.addEventListener('click',()=>{
   if(change({entry:null})){
    window.showTab?.('dashboard');const card=document.getElementById('onboarding-card');
    card?.classList.remove('hidden');card?.scrollIntoView({block:'start'});
    card?.querySelector('[data-beginner-entry=log]')?.focus();
   }
  });
 }
 function saved({editing=false}={}){if(!editing&&load().guide==='active')change({guide:'complete'});}
 window.LoadnoteBeginnerUI={apply,initialize,renderGuide,preferencesHTML,bindPreferences,saved,selected:()=>!!load().entry};
 document.addEventListener('DOMContentLoaded',()=>{
  apply();
  document.querySelectorAll('[data-beginner-entry]').forEach(b=>b.addEventListener('click',()=>enter(b.dataset.beginnerEntry)));
  document.getElementById('simple-show-all')?.addEventListener('click',()=>change({view:'full'}));
  const refresh=event=>{
   if(!event.target?.closest?.('#exercise-rows,#workout-review,[data-workout-action],#training-cockpit'))return;
   requestAnimationFrame(renderGuide);
  };
  for(const action of ['input','change','click'])document.addEventListener(action,refresh,true);
 });
})();
