(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const KINDS=new Set(['conversation-preferences','coach-memory','current-workout','coach-followthrough','starter-plan','saved-starter','beginner-log','profile-review','offline-plan','progress','training-feedback','log-workout','review','calendar','programming','proposals','check-in','wave','manage','lifecycle','adapt','preferences','guidance','intake','edit-plan','cardio','edit-learning','library','accessory-review','accessory-follow-up','workout-brief','weekly-coaching','primary-follow-up','mappings','custom-programs']);
 function route(a){if(!a||!KINDS.has(a.kind))return;
  window.LoadnoteCoachCompanionUI?.close?.();document.querySelector('#sp-record-dialog[open]')?.close();
  if(a.kind==='conversation-preferences'){window.LoadnoteCoachConversationPreferencesUI?.open(a);return;}
  if(a.kind==='coach-memory'){window.LoadnoteCoachMemoryUI?.open(a);return;}
  if(a.kind==='current-workout'){showTab('workouts');showSubTab('workouts','wo-log');return;}
  if(a.kind==='coach-followthrough'){window.LoadnoteCoachFollowthroughUI?.open(a);return;}
  if(a.kind==='starter-plan'){window.LoadnoteBeginnerUI?.start?.('help');return;}
  if(a.kind==='saved-starter'){window.LoadnoteBeginnerProgramUI?.openSaved?.({id:a.planId||null});return;}
  if(a.kind==='beginner-log'){window.LoadnoteBeginnerUI?.start?.('log');return;}
  if(a.kind==='offline-plan'){window.LoadnoteOfflinePlannerUI.open(a.request);return;}
  if(a.kind==='progress'){showTab('prs');return;}
  if(a.kind==='training-feedback'){
   showTab('prs');window.renderTrainingReview?.();
   revealNavigationTarget('training-review-panel');return;
  }
  if(a.kind==='log-workout'){showTab('dashboard');document.getElementById('workout-log-card')?.scrollIntoView({block:'start'});return;}
  if(a.kind==='profile-review'){window.openProgrammingProfile?.({proposal:a.proposal});return;}
  if(a.kind==='mappings'){window.openExerciseRoleSetup?.();return;}
  if(a.kind==='library'){window.LoadnoteCoachingLibraryUI?.open?.();return;}
  if(a.kind==='accessory-review'){window.LoadnoteAccessoryReviewUI?.open?.(a);return;}
  if(a.kind==='weekly-coaching'){window.LoadnoteWeeklyCoachingUI?.open?.(a);return;}
  if(a.kind==='primary-follow-up'){window.LoadnoteWeeklyCoachingUI?.openFollowups?.();return;}
  if(a.kind==='workout-brief'){window.LoadnoteWorkoutBriefUI?.open?.(a);return;}
  if(a.kind==='accessory-follow-up'){window.LoadnoteAccessoryFollowUpUI?.open?.(a);return;}
  if(a.kind==='intake'){window.LoadnoteAthleteIntakeUI?.open?.();return;}
  if(a.kind==='edit-plan'){window.LoadnoteProgramEditUI?.open?.();return;}
  if(a.kind==='cardio'){window.LoadnoteCardioPlannerUI?.open?.();return;}
  if(a.kind==='edit-learning'){window.LoadnoteProgramEditUI?.learning?.();return;}
  if(a.kind==='adapt'){window.LoadnoteAdaptiveSessionUI?.open?.();return;}
  if(a.kind==='preferences'){window.LoadnoteAdaptiveSessionUI?.preferences?.();return;}
  if(a.kind==='guidance'){window.LoadnoteMovementGuidanceUI?.open?.();return;}
  if(a.kind==='calendar'){showTab('calendar');return;}
  showTab('coach');showSubTab('coach','co-programs');
  if(a.kind==='custom-programs'){window.renderCustomProgramStudio?.();revealNavigationTarget('custom-program-studio');return;}
  if(a.kind==='manage'){window.LoadnoteProgramCancellationUI?.open?.();return;}
  if(a.kind==='wave'){window.LoadnotePhaseBuilderUI?.open?.(null,{periodization:'wave'});return;}
  if(a.kind==='lifecycle'){window.LoadnoteProgramLifecycleUI?.route?.(window.LoadnoteProgramLifecycleUI.currentReport());return;}
  const target=a.kind==='programming'?'programming-workspace':a.kind==='proposals'?'coaching-proposals':a.kind==='check-in'?'coaching-week-form':'shared-coaching-review';
  // A historical evidence review has no editable check-in. Open today's form
  // only when needed, preserving an existing unsaved current check-in.
  if(a.kind==='check-in'&&!document.getElementById(target))window.renderCoachingReview?.();
  revealNavigationTarget(target,a.kind==='programming'?'#programming-workspace-primary':a.kind==='check-in'?'#coaching-sleep':a.kind==='proposals'?':scope > summary':null);
 }
 function attach(host,reply,ask=null){if(!host||!reply?.actions?.length&&!reply?.followUps?.length)return;const group=document.createElement('div');group.className='smart-coach-actions';
  for(const a of (reply.actions||[]).filter(a=>KINDS.has(a.kind)).slice(0,4)){
    const b=document.createElement('button');b.type='button';b.className='btn-secondary';b.textContent=a.label;
    // Safari can swallow the synthetic click on a button in a scrolling
    // chat when a finger tap settles the scroll. A stationary touch activates
    // once on touchend; preventDefault blocks WebKit's subsequent ghost click.
    // Swipes, multi-touch and cancelled gestures never route an action.
    b.style.touchAction='manipulation';
    let start=null,lastTouchActivation=0;
    const point=(list,id)=>[...list].find(t=>t.identifier===id);
    b.addEventListener('touchstart',event=>{
     if(event.touches.length!==1){start=null;return;}
     const t=event.touches[0];
     start={id:t.identifier,x:t.clientX,y:t.clientY};
    },{passive:true});
    b.addEventListener('touchmove',event=>{
     if(!start)return;
     const t=point(event.touches,start.id);
     if(!t||Math.hypot(t.clientX-start.x,t.clientY-start.y)>12)start=null;
    },{passive:true});
    b.addEventListener('touchcancel',()=>{start=null;},{passive:true});
    b.addEventListener('touchend',event=>{
     const initial=start;start=null;
     if(!initial||event.changedTouches.length!==1)return;
     const t=point(event.changedTouches,initial.id);
     if(!t||Math.hypot(t.clientX-initial.x,t.clientY-initial.y)>12)return;
     if(event.cancelable)event.preventDefault();
     lastTouchActivation=Date.now();
     route(a);
    },{passive:false});
    // Retain mouse, keyboard and assistive-technology clicks. Suppress only
    // the immediate compatibility click after a touchend-initiated route.
    b.addEventListener('mousedown',event=>{if(event.button===0)event.preventDefault();});
    b.addEventListener('click',event=>{
     if(event.detail!==0&&lastTouchActivation&&Date.now()-lastTouchActivation<700)return;
     route(a);
    });
    group.append(b);
   }
  if(ask)for(const q of (reply.followUps||[]).slice(0,3)){const b=document.createElement('button');b.type='button';b.className='coach-follow-up';b.textContent=q;b.addEventListener('click',()=>ask(q));group.append(b);}host.append(group);
 }
 function render(host){if(!host||!window.LoadnoteSmartCoach)return;try{const b=window.LoadnoteSmartCoach.brief(data,{asOf:today()}),section=document.createElement('section');section.id='smart-coach-brief';section.className='card smart-coach-brief';section.setAttribute('aria-label','Daily coaching brief');section.innerHTML='<p class="eyebrow">DAILY COACHING BRIEF · '+esc(b.asOf)+'</p><h3>'+esc(b.title)+'</h3><p>'+esc(b.reason)+'</p><div class="smart-coach-metrics">'+b.evidence.slice(0,3).map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>'+(b.liftInsights.length?'<details><summary>Lift evidence · '+b.liftInsights.length+'</summary>'+b.liftInsights.map(r=>'<p><b>'+esc(r.name)+'</b> · '+esc(r.status)+' · '+r.sessions+' matching training days<br>'+esc(r.reasons.join(' '))+'</p>').join('')+'</details>':'')+(b.concerns.length?'<details><summary>What needs attention · '+b.concerns.length+'</summary>'+b.concerns.map(x=>'<p>'+esc(x)+'</p>').join('')+'</details>':'')+'<details><summary>Evidence and unknowns</summary><p>'+esc(b.gaps.join('; ')||'No listed gaps; logs describe only recorded training.')+'</p><p>'+esc(b.notice)+'</p></details>';attach(section,{...b,actions:b.actions.slice(0,2),followUps:['What should I focus on today?']},q=>{window.LoadnoteCoachCompanionUI?.open?.();window.LoadnoteCoachCompanionUI?.ask?.(q);});host.prepend(section);}catch(e){const p=document.createElement('p');p.className='more-hint';p.textContent='Daily brief needs validated training records: '+e.message;host.prepend(p);}}
 window.LoadnoteSmartCoachUI={route,attach,render};
})();
