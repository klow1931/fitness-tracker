/* v2.76 — consumer Profile hub and home for secondary settings/features. */
(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 function setupSummary(){
  const record=window.LoadnoteProgrammingProfile?.current?.(data.programmingProfiles||[]);
  const p=record?.context;
  if(!p)return {ready:false,title:'Training setup not completed',body:'Start with your goal, available days and equipment. Existing workouts stay unchanged.',meta:''};
  const goal=window.LoadnoteProgrammingProfile?.GOALS?.[p.goal]||p.goal;
  const available=(p.availableDays||[]).map(i=>days[i]).join(', ');
  const equipment=(p.equipment||[]).length;
  return {ready:true,title:goal,body:'Saved defaults for reviewed programming. Existing workouts stay unchanged.',meta:[available||'No days recorded',p.sessionMinutes?p.sessionMinutes+' min max/session':null,equipment?equipment+' equipment items':'No equipment recorded',p.eventDate?'Event '+p.eventDate:null].filter(Boolean).join(' · ')};
 }
 function render(){
  const host=document.getElementById('profile-hub');if(!host)return;
  const setup=setupSummary();
  const context=window.LoadnoteProgrammingProfile?.current?.(data.programmingProfiles||[])?.context;
  const powerlifting=!context||['general','meet'].includes(context.goal);
  let competitionCount=0;
  try{competitionCount=new Set((window.LoadnoteReadiness?.list?.(data.exerciseRoles||[])||[]).filter(row=>row.role==='competition'&&row.competitionLift).map(row=>row.competitionLift)).size;}catch{}
  host.innerHTML=
   '<div class="profile-grid">'+
    '<section class="card profile-card" id="profile-training-setup">'+
     '<p class="eyebrow">TRAINING</p>'+
     '<h2>'+esc(setup.title)+'</h2>'+
     (setup.meta?'<p class="profile-meta">'+esc(setup.meta)+'</p>':'')+
     '<p class="more-hint">'+esc(setup.body)+'</p>'+
     '<ol class="setup-checklist" aria-label="Training setup steps"><li><div><b>1. Goal &amp; schedule</b><p class="more-hint">'+(setup.ready?'Saved · edit when your availability changes.':'Choose your training defaults first.')+'</p></div><div class="profile-actions">'+
      '<button type="button" class="btn-primary" id="profile-edit-training">'+(setup.ready?'Edit training setup':'Set up training')+'</button>'+
     '</div></li><li><div><b>2. Training background</b><p class="more-hint">'+(context?.intake?'Recorded · review if your history or limits change.':'Optional · history, priorities and reported limits.')+'</p></div><button type="button" class="btn-secondary" id="profile-athlete-intake" '+(!setup.ready?'disabled':'')+'>Athlete intake</button></li>'+
     (powerlifting?'<li><div><b>3. Powerlifting lift mapping</b><p class="more-hint">'+competitionCount+'/3 competition lifts confirmed. Match your squat, bench and deadlift names.</p></div><button type="button" class="btn-secondary" id="profile-lift-mapping">Review mappings</button></li>':'')+
     '</ol><details class="setup-details"><summary>Advanced setup</summary><p class="more-hint">Availability, equipment and avoided exercises constrain generated plans. Free-text notes are context, not automatic prescriptions. Athlete intake is optional; review reported limits before programming.</p>'+
     (!powerlifting?'<p class="more-hint">Powerlifting mapping is only needed for squat/bench/deadlift-specific Decisions.</p><button type="button" class="btn-secondary" id="profile-lift-mapping">Review mappings</button>':'')+
     '<button type="button" class="btn-secondary" id="profile-go-train">Go to Train</button></details>'+
    '</section>'+
    '<section class="card profile-card" id="profile-account-card">'+
     '<p class="eyebrow">ACCOUNT &amp; DATA</p><h2>Sync and protect your training</h2>'+
     '<div id="account-status" aria-live="polite"><p class="more-hint">Checking account status…</p></div>'+
    '</section>'+
    '<section class="card profile-card" id="profile-preferences">'+
     '<p class="eyebrow">PREFERENCES</p><h2>How Loadnote feels</h2>'+
     '<div class="profile-preference-row"><div><b>Weight display</b><p class="more-hint">Display units only. Saved loads stay unchanged.</p></div><div class="profile-inline-actions" role="group" aria-label="Weight display"><button type="button" class="btn-secondary" data-profile-unit="kg" aria-label="Kilograms">kg</button><button type="button" class="btn-secondary" data-profile-unit="lb" aria-label="Pounds">lb</button></div></div>'+
     '<div class="profile-preference-row"><div><b>Gym mode</b><p class="more-hint">Larger workout controls.</p></div><button type="button" class="btn-secondary" id="profile-gym-mode" aria-label="Gym mode" aria-pressed="'+Boolean(data.gymMode)+'">'+(data.gymMode?'On':'Off')+'</button></div>'+
     '<div class="profile-preference-row"><div><b>Appearance</b><p class="more-hint">Choose light or dark.</p></div><button type="button" class="btn-secondary" id="profile-theme" aria-label="Dark appearance" aria-pressed="'+Boolean(data.dark)+'">'+(data.dark?'Dark':'Light')+'</button></div>'+
    '</section>'+
    '<section class="card profile-card profile-secondary" id="profile-more">'+
     '<p class="eyebrow">MORE FEATURES</p><h2>More tools</h2>'+
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
  host.querySelector('#profile-athlete-intake')?.addEventListener('click',()=>window.LoadnoteAthleteIntakeUI?.open());
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
