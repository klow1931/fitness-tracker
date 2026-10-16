/* Beginner entry paths, reversible Simple view and a non-mutating logger guide. */
(function(){
 'use strict';
 const model=window.LoadnoteBeginnerExperience;
 let preference=model.normalize(),loaded=false;
 function load(){if(!loaded){try{preference=model.read(localStorage);}catch{}loaded=true;}return preference;}
 function change(patch){
  try{preference=model.write(localStorage,load(),patch);}
  catch{apply();window.showToast?.('Could not save your view preference on this device. Nothing was changed.','error');return false;}
  apply();return true;
 }
 function apply(){
  document.body.classList.toggle('loadnote-simple-view',load().view==='simple');
  const banner=document.getElementById('simple-view-banner');if(banner)banner.hidden=preference.view!=='simple';
  const choice=document.getElementById('beginner-simple-choice');if(choice)choice.checked=preference.view==='simple';
  const card=document.getElementById('onboarding-card');if(card&&preference.entry)card.classList.add('hidden');
  renderGuide();
 }
 function enter(entry){
  const simple=document.getElementById('beginner-simple-choice')?.checked;
  if(!change({entry,view:simple?'simple':'full'}))return;
  if(entry==='log'){window.openFastStartLogger?.({compact:true});renderGuide();return;}
  if(entry==='help'){
   window.openProgrammingProfile?.({guided:true,notice:'Start with your goal, available days and equipment. You can leave unknown experience as unknown. Review any suggested program before scheduling it.',onSaved:()=>window.LoadnoteTrainingHubUI?.plan?.()});return;
  }
  window.showTab?.('workouts');window.showSubTab?.('workouts','wo-templates');
  document.getElementById('beginner-existing-program')?.focus();
 }
 function renderGuide(){
  const host=document.getElementById('beginner-workout-guide');if(!host)return;
  const p=load(),editing=typeof workoutEdit!=='undefined'&&!!workoutEdit;
  host.hidden=p.guide!=='active'||editing||(data.workouts||[]).length>0&&p.entry===null;
  if(host.hidden)return;
  const step=model.steps[p.step];
  host.innerHTML='<h3 tabindex="-1">'+step.title+'</h3><p>'+step.body+'</p><div class="beginner-actions">'+
   (p.step?'<button type="button" class="btn-secondary" data-guide="back">Back</button>':'')+
   (p.step<3?'<button type="button" class="btn-primary" data-guide="next">Next tip</button>':'')+
   '<button type="button" class="btn-secondary" data-guide="skip">Hide guide</button></div><p class="more-hint">Tips only — these buttons never change your workout. Replay in Profile → How Loadnote feels.</p>';
  host.querySelectorAll('[data-guide]').forEach(button=>button.addEventListener('click',()=>{
   const action=button.dataset.guide;
   if(!change(action==='skip'?{guide:'skipped'}:{step:p.step+(action==='next'?1:-1)}))return;
   if(action!=='skip')host.querySelector('h3')?.focus({preventScroll:true});
   else document.getElementById('workout-mode-title')?.focus({preventScroll:true});
  }));
 }
 function preferencesHTML(){const p=load();return '<div class="profile-preference-row"><div><b>Simple view</b><p class="more-hint">Simplify Home without changing your training or program. Saved on this device.</p></div><button type="button" class="btn-secondary" id="profile-simple-view" aria-pressed="'+(p.view==='simple')+'">'+(p.view==='simple'?'On':'Off')+'</button></div><div class="profile-guide-actions"><button type="button" class="btn-secondary" id="profile-replay-guide">Replay workout guide</button><button type="button" class="btn-secondary" id="profile-starting-choices">Choose how to start</button></div>';}
 function bindPreferences(host){
  host.querySelector('#profile-simple-view')?.addEventListener('click',()=>{if(change({view:load().view==='simple'?'full':'simple'}))window.renderProfileHub?.();});
  host.querySelector('#profile-replay-guide')?.addEventListener('click',()=>{if(change({guide:'active',step:0,entry:load().entry||'log'})){window.openFastStartLogger?.({compact:true});renderGuide();document.getElementById('beginner-workout-guide')?.scrollIntoView({block:'start'});}});
  host.querySelector('#profile-starting-choices')?.addEventListener('click',()=>{if(change({entry:null})){window.showTab?.('dashboard');const card=document.getElementById('onboarding-card');card?.classList.remove('hidden');card?.scrollIntoView({block:'start'});card?.querySelector('[data-beginner-entry]')?.focus();}});
 }
 function saved({editing=false}={}){if(!editing&&load().guide==='active')change({guide:'complete'});}
 window.LoadnoteBeginnerUI={apply,renderGuide,preferencesHTML,bindPreferences,saved,selected:()=>!!load().entry};
 document.addEventListener('DOMContentLoaded',()=>{
  apply();
  document.querySelectorAll('[data-beginner-entry]').forEach(button=>button.addEventListener('click',()=>enter(button.dataset.beginnerEntry)));
  document.getElementById('simple-show-all')?.addEventListener('click',()=>change({view:'full'}));
 });
})();
