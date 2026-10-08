(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function report(){return LoadnoteTrainingHub.inspect(data,{asOf:today(),draft:readLoggerDraft(),sportDraft:!!window.LoadnoteSportPlannerUI?.hasDraft?.()});}
 function plan(){showTab('coach');showSubTab('coach','co-programs');window.renderProgrammingWorkspace?.();const host=document.getElementById('programming-workspace');host?.scrollIntoView({block:'start'});const button=host?.querySelector('#programming-workspace-primary');button?.focus({preventScroll:true});}
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
    (!compact?'<details><summary>Getting started · '+r.steps.filter(s=>s.done).length+'/3</summary><ol class="training-hub-steps">'+r.steps.map(s=>'<li><div><b>'+esc(s.label)+'</b><p class="more-hint">'+esc(s.detail)+'</p></div><span class="badge">'+(s.done?'Saved':'Not yet')+'</span></li>').join('')+'</ol><p class="more-hint">You can log your own training without a generated plan. An account is optional.</p></details>':'')+
    (r.weeklyStatus!=='empty'||r.started?'<div class="training-hub-review"><div><b>'+esc(r.review.label)+'</b><p class="more-hint">'+esc(r.review.detail)+'</p></div>'+(r.review.available?'<button type="button" class="btn-secondary" data-hub-week>Open review</button>':'')+'</div>':'')+
    '<details><summary>Training tools</summary><div class="programming-workspace-actions"><button type="button" class="btn-secondary" data-hub-plan>Plan &amp; setup</button><button type="button" class="btn-secondary" data-hub-adjust>Adjust a session</button><button type="button" class="btn-secondary" data-hub-library>Exercise library</button><button type="button" class="btn-secondary" data-hub-train>Log my own workout</button></div><p class="more-hint">Changes need fresh targets and approval. No workout is changed by opening a tool.</p></details>';
   host.querySelector('[data-hub-primary]')?.addEventListener('click',()=>route(report()));
   host.querySelector('[data-hub-week]')?.addEventListener('click',()=>{const fresh=report();if(fresh.weeklyStatus==='unsupported'){showTab('coach');showSubTab('coach','co-programs');const id=fresh.lifecycle.program?.id;if(fresh.lifecycle.program?.kind==='sport-program')window.LoadnoteSportPlannerUI?.show?.(id);else window.LoadnoteHypertrophyBuilderUI?.show?.(id);}else window.LoadnoteWeeklyCoachingUI?.open?.();});
   host.querySelector('[data-hub-plan]').onclick=plan;
   host.querySelector('[data-hub-adjust]').onclick=()=>window.LoadnoteSessionOptionsUI.open();
   host.querySelector('[data-hub-library]').onclick=()=>window.LoadnoteExerciseLibraryUI.open();
   host.querySelector('[data-hub-train]').onclick=()=>showTab('workouts');
  }
 }
 window.LoadnoteTrainingHubUI={render,report,plan};
})();
