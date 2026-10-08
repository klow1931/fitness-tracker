(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function report(){return LoadnoteTrainingHub.inspect(data,{asOf:today(),draft:readLoggerDraft(),sportDraft:!!window.LoadnoteSportPlannerUI?.hasDraft?.()});}
 function plan(){showTab('coach');showSubTab('coach','co-programs');window.renderProgrammingWorkspace?.();const host=document.getElementById('programming-workspace');host?.scrollIntoView({block:'start'});const button=host?.querySelector('#programming-workspace-primary');button?.focus({preventScroll:true});}
 function weekMarkup(w){
  if(w.status!=='ready')return '<p role="alert">'+esc(w.notice)+'</p><button type="button" class="btn-secondary" data-hub-calendar>Review Calendar</button>';
  const c=w.counts,b=w.brief;
  return '<details class="training-week"><summary>This week · '+w.workouts+' workout'+(w.workouts===1?'':'s')+' logged</summary><p>'+esc(w.from+' – '+w.through)+'</p><p>'+w.sets+' recorded strength sets · '+w.unknownEffort+' with unknown effort</p><dl class="training-week-counts"><div><dt>Linked session logs</dt><dd>'+c.linked+'</dd></div><div><dt>Past sessions unconfirmed</dt><dd>'+c.unconfirmed+'</dd></div><div><dt>Today / upcoming</dt><dd>'+c.upcoming+'</dd></div><div><dt>Explicitly skipped</dt><dd>'+c.skipped+'</dd></div><div><dt>Cancelled</dt><dd>'+c.cancelled+'</dd></div></dl>'+(c.changed?'<p>Changed Calendar revisions: '+c.changed+'. Compare captured and current targets in review.</p>':'')+(c.duplicates?'<p role="alert">Duplicate session links: '+c.duplicates+'. Review history before interpreting progress.</p>':'')+(w.recent?'<p>Last logged: '+esc(w.recent.date+' · '+w.recent.names.join(', '))+'</p>':'')+'<p class="more-hint">'+esc(w.notice)+'</p><button type="button" class="btn-secondary" data-hub-calendar>Review Calendar</button></details>'+
   (b.status==='ready'?'<div class="training-hub-brief"><b>'+esc((b.session.date===today()?'Today':'Next scheduled')+' · '+b.session.name)+'</b><p class="more-hint">'+esc(b.purpose)+'</p><button type="button" class="btn-secondary" data-hub-brief>Session briefing</button></div>':b.status==='ambiguous'?'<p>Multiple upcoming sessions. Choose the exact workout in Calendar.</p>':b.status==='invalid'?'<p role="alert">Saved targets need review in Calendar.</p>':'');
 }
 function route(r){
  const kind=r.primary.kind;
  if(kind==='setup'){window.openProgrammingProfile?.();return;}
  if(kind==='plan'){plan();return;}
  if(kind==='lifecycle'||kind==='resolve'){window.LoadnoteProgramLifecycleUI?.route(r.lifecycle);return;}
  if(kind==='resume'&&window.LoadnoteSportPlannerUI?.hasDraft?.()&&!loggerHasContent()){
   try{const draft=window.LoadnoteSportPlannerUI.readDraft();if(!draft)throw Error('Sport draft cannot be read. Review its recovery controls; it has not been discarded.');window.LoadnoteSportPlannerUI.record(draft.sessionId);}
   catch(error){showTab('coach');showSubTab('coach','co-programs');document.getElementById('programming-tools-panel').open=true;const panel=document.getElementById('sport-planner-panel');panel.open=true;window.renderSportPlanner?.();const status=document.getElementById('sp-status');status.textContent=error.message;status.setAttribute('role','alert');panel.scrollIntoView({block:'start'});document.getElementById('sp-resume')?.focus({preventScroll:true});}
   return;
  }
  if(kind==='resume'){window.openFastStartLogger({compact:true});return;}
  showTab('workouts');window.requestTrainLauncher?.();
 }
 function render(){
  const hosts=[...document.querySelectorAll('[data-training-hub]')];if(!hosts.length||!window.LoadnoteTrainingHub)return;
  let r;try{r=report();}catch(error){for(const host of hosts){host.replaceChildren();const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='Training status needs review: '+error.message;host.append(p);}return;}
  for(const host of hosts){
   const compact=host.dataset.trainingHub==='compact';
   const showPrimary=!compact&&(!['resume','train','lifecycle'].includes(r.primary.kind)||(!!window.LoadnoteSportPlannerUI?.hasDraft?.()&&!loggerHasContent()));
   host.innerHTML=(!compact?'<p class="eyebrow">YOUR TRAINING</p><h2>'+(r.started?'Keep your training moving':'Start training')+'</h2>'+
    '<div class="training-hub-next"><b>'+esc(r.primary.detail)+'</b>'+(showPrimary?'<button type="button" class="btn-primary" data-hub-primary>'+esc(r.primary.label)+'</button>':'')+'</div>':'')+
    (!compact?'<details><summary>Getting started · '+r.steps.filter(s=>s.done).length+'/3</summary><ol class="training-hub-steps">'+r.steps.map(s=>'<li><div><b>'+esc(s.label)+'</b><p class="more-hint">'+esc(s.detail)+'</p></div><button type="button" class="btn-secondary" data-hub-step="'+s.key+'">'+({setup:'Review setup',plan:'Review plan',train:'Open Train'}[s.key])+'</button></li>').join('')+'</ol><p class="more-hint">Save setup → review a supported plan → schedule in Calendar → record actual work. You can also log your own training without a generated plan. An account is optional.</p><button type="button" class="btn-secondary" data-hub-intake>Optional athlete intake</button></details>':'')+
    (r.started||r.week.brief?.status==='ready'||r.week.brief?.status==='ambiguous'||r.week.status==='invalid'?weekMarkup(r.week):'')+
    (r.weeklyStatus!=='empty'||r.started?'<div class="training-hub-review"><div><b>'+esc(r.review.label)+'</b><p class="more-hint">'+esc(r.review.detail)+'</p></div>'+(r.review.available?'<button type="button" class="btn-secondary" data-hub-week>Open review</button>':'')+'</div>':'')+
    '<details><summary>Training tools</summary><div class="programming-workspace-actions"><button type="button" class="btn-secondary" data-hub-plan>Plan &amp; setup</button><button type="button" class="btn-secondary" data-hub-adjust>Adjust a session</button><button type="button" class="btn-secondary" data-hub-library>Exercise library</button><button type="button" class="btn-secondary" data-hub-train>Log my own workout</button></div><p class="more-hint">Changes need fresh targets and approval. No workout is changed by opening a tool.</p></details>';
   host.querySelector('[data-hub-primary]')?.addEventListener('click',()=>route(report()));
   host.querySelectorAll('[data-hub-step]').forEach(b=>b.onclick=()=>{if(b.dataset.hubStep==='setup')window.openProgrammingProfile();else if(b.dataset.hubStep==='plan')plan();else showTab('workouts');});
   host.querySelector('[data-hub-intake]')?.addEventListener('click',()=>window.LoadnoteAthleteIntakeUI.open());
   host.querySelector('[data-hub-calendar]')?.addEventListener('click',()=>showTab('calendar'));
   host.querySelector('[data-hub-brief]')?.addEventListener('click',()=>window.LoadnoteWorkoutBriefUI.open({sessionId:report().week.brief?.session?.id}));
   host.querySelector('[data-hub-week]')?.addEventListener('click',()=>{const fresh=report();if(fresh.weeklyStatus==='unsupported'){showTab('coach');showSubTab('coach','co-programs');const id=fresh.lifecycle.program?.id;if(fresh.lifecycle.program?.kind==='sport-program')window.LoadnoteSportPlannerUI?.show?.(id);else window.LoadnoteHypertrophyBuilderUI?.show?.(id);}else window.LoadnoteWeeklyCoachingUI?.open?.();});
   host.querySelector('[data-hub-plan]').onclick=plan;
   host.querySelector('[data-hub-adjust]').onclick=()=>window.LoadnoteSessionOptionsUI.open();
   host.querySelector('[data-hub-library]').onclick=()=>window.LoadnoteExerciseLibraryUI.open();
   host.querySelector('[data-hub-train]').onclick=()=>showTab('workouts');
  }
 }
 window.LoadnoteTrainingHubUI={render,report,plan};
})();
