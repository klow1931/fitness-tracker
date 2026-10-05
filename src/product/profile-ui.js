/* v2.76 — consumer Profile hub and home for secondary settings/features. */
(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 function setupSummary(){
  const record=window.LoadnoteProgrammingProfile?.current?.(data.programmingProfiles||[]);
  const p=record?.context;
  if(!p)return {ready:false,title:'Training setup not completed',body:'Tell Loadnote what you are training for, when you can train, and what equipment you actually have. This informs reviewed programming without changing existing workouts.',meta:''};
  const goal=window.LoadnoteProgrammingProfile?.GOALS?.[p.goal]||p.goal;
  const available=(p.availableDays||[]).map(i=>days[i]).join(', ');
  const equipment=(p.equipment||[]).length;
  return {ready:true,title:goal,body:'Availability and hard constraints are used by reviewed programming. Preferences and notes remain context rather than automatic prescriptions.',meta:[available||'No days recorded',p.sessionMinutes?p.sessionMinutes+' min max/session':null,equipment?equipment+' equipment items':'No equipment recorded',p.eventDate?'Event '+p.eventDate:null].filter(Boolean).join(' · ')};
 }
 function render(){
  const host=document.getElementById('profile-hub');if(!host)return;
  const setup=setupSummary();
  let competitionCount=0;
  try{competitionCount=new Set((window.LoadnoteReadiness?.list?.(data.exerciseRoles||[])||[]).filter(row=>row.role==='competition'&&row.competitionLift).map(row=>row.competitionLift)).size;}catch{}
  host.innerHTML=
   '<div class="profile-grid">'+
    '<section class="card profile-card" id="profile-training-setup">'+
     '<p class="eyebrow">TRAINING</p>'+
     '<h2>'+esc(setup.title)+'</h2>'+
     (setup.meta?'<p class="profile-meta">'+esc(setup.meta)+'</p>':'')+
     '<p class="more-hint">'+esc(setup.body)+'</p>'+
     '<div class="profile-actions">'+
      '<button type="button" class="btn-primary" id="profile-edit-training">'+(setup.ready?'Edit training setup':'Set up training')+'</button>'+
      '<button type="button" class="btn-secondary" id="profile-go-train">Go to Train</button>'+
      '<button type="button" class="btn-secondary" onclick="LoadnoteAthleteIntakeUI.open()">Athlete intake</button>'+
     '</div>'+
     '<div class="profile-setup-extra"><div><b>Powerlifting lift mapping</b><p class="more-hint">'+competitionCount+'/3 competition lifts confirmed. Only needed for squat/bench/deadlift-specific Decisions.</p></div><button type="button" class="btn-secondary" id="profile-lift-mapping">Review mappings</button></div>'+
    '</section>'+
    '<section class="card profile-card" id="profile-account-card">'+
     '<p class="eyebrow">ACCOUNT &amp; DATA</p><h2>Sync and protect your training</h2>'+
     '<p class="more-hint">Account actions live here so backup and sync do not interrupt the training flow.</p>'+
     '<div id="account-status" aria-live="polite"><p class="more-hint">Checking account status…</p></div>'+
    '</section>'+
    '<section class="card profile-card" id="profile-preferences">'+
     '<p class="eyebrow">PREFERENCES</p><h2>How Loadnote feels</h2>'+
     '<p class="more-hint">Keep global settings here so Home and Train stay focused on training.</p>'+
     '<div class="profile-preference-row"><div><b>Weight display</b><p class="more-hint">Stored training weights remain normalized internally.</p></div><div class="profile-inline-actions"><button type="button" class="btn-secondary" data-profile-unit="kg">kg</button><button type="button" class="btn-secondary" data-profile-unit="lb">lb</button></div></div>'+
     '<div class="profile-preference-row"><div><b>Gym mode</b><p class="more-hint">Larger controls for logging between sets.</p></div><button type="button" class="btn-secondary" id="profile-gym-mode">'+(data.gymMode?'On':'Off')+'</button></div>'+
     '<div class="profile-preference-row"><div><b>Appearance</b><p class="more-hint">Switch between light and dark appearance.</p></div><button type="button" class="btn-secondary" id="profile-theme">'+(data.dark?'Dark':'Light')+'</button></div>'+
    '</section>'+
    '<section class="card profile-card profile-secondary" id="profile-more">'+
     '<p class="eyebrow">MORE FEATURES</p><h2>Open only what you need</h2>'+
     '<p class="more-hint">Other parts of Loadnote stay available here without competing with Home, Train, Progress and Coach.</p>'+
     '<div class="profile-destination-grid">'+
      '<button type="button" class="profile-destination" data-profile-tab="calendar"><b>Calendar</b><small>Plan and review training days</small></button>'+
      '<button type="button" class="profile-destination" data-profile-tab="nutrition"><b>Food</b><small>Nutrition log and targets</small></button>'+
      '<button type="button" class="profile-destination" data-profile-tab="measures"><b>Measurements</b><small>Body check-ins</small></button>'+
      '<button type="button" class="profile-destination" data-profile-tab="photos"><b>Photos</b><small>Photo check-ins</small></button>'+
      '<button type="button" class="profile-destination profile-destination-wide" data-profile-tab="tools"><b>Tools &amp; data</b><small>Calculators, backups, integrity checks, privacy and app information</small></button>'+
     '</div>'+
    '</section>'+
   '</div>';
  host.querySelector('#profile-edit-training')?.addEventListener('click',()=>window.openProgrammingProfile?.());
  host.querySelector('#profile-go-train')?.addEventListener('click',()=>showTab('workouts'));
  host.querySelector('#profile-lift-mapping')?.addEventListener('click',()=>window.openExerciseRoleSetup?.());
  host.querySelectorAll('[data-profile-unit]').forEach(button=>{
   const active=button.dataset.profileUnit===currentUnit();
   button.classList.toggle('profile-choice-active',active);
   button.setAttribute('aria-pressed',String(active));
   button.addEventListener('click',()=>{setUnit(button.dataset.profileUnit);render();});
  });
  host.querySelector('#profile-gym-mode')?.addEventListener('click',()=>{toggleGymMode();render();});
  host.querySelector('#profile-theme')?.addEventListener('click',()=>{toggleDark();render();});
  host.querySelectorAll('[data-profile-tab]').forEach(button=>button.addEventListener('click',()=>showTab(button.dataset.profileTab)));
  window.renderAccountStatus?.();
 }
 window.renderProfileHub=render;
})();