/* v2.77 — Today → fast-start training handoff. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let trainLaunchRequested=false;

 function loggerDraft(){try{return typeof readLoggerDraft==='function'?readLoggerDraft():null;}catch{return null;}}
 function meaningfulDraftRows(draft){return (draft?.rows||[]).filter(row=>row?.name||(row?.sets||[]).some(set=>set?.reps||set?.duration||set?.weight||set?.rpe));}
 function ensureFastStartUI(){
  if(!document.getElementById('fast-start-style')){
   const style=document.createElement('style');style.id='fast-start-style';style.textContent=`
    #train-launcher{display:none}
    body.train-launch-mode #train-launcher{display:block}
    body.train-launch-mode #workout-log-card,
    body.train-launch-mode #panel-workouts>.section-tabs,
    body.train-launch-mode #panel-workouts>p,
    body.train-launch-mode #workout-recap,
    body.train-launch-mode #training-blocks{display:none!important}
    .train-launch-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}
    .train-launch-head h2{margin:.15rem 0 .25rem}
    .train-launch-preview{display:grid;gap:.55rem;margin:1rem 0}
    .train-launch-exercise{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem .85rem;border:1px solid var(--border);border-radius:.8rem;background:var(--surface-soft,#f8fafc)}
    .train-launch-actions,.train-launch-secondary{display:flex;gap:.65rem;flex-wrap:wrap;align-items:center}
    .train-launch-secondary{margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)}
    .train-launch-secondary-label{width:100%;font-size:.78rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em}
    #train-fast-options{display:none;align-items:center;gap:.65rem;flex-wrap:wrap;margin:.5rem 0 1rem;padding:.7rem .8rem;border:1px dashed var(--border);border-radius:.8rem}
    body.train-fast-start-active:not(.training-execution-active) #train-fast-options{display:flex}
    body.train-fast-start-active:not(.train-fast-options-open):not(.training-execution-active) #workout-log-card [data-fast-start-secondary="true"]{display:none!important}
    body.training-execution-active #train-fast-options{display:none!important}
    @media(max-width:640px){.train-launch-actions>.btn-primary,.train-launch-actions>.btn-secondary{flex:1 1 100%}.train-launch-secondary>.btn-secondary{flex:1 1 calc(50% - .4rem)}}
   `;document.head.appendChild(style);
  }
  const log=document.getElementById('workout-log-card');
  if(log&&!document.getElementById('train-launcher')){const launcher=document.createElement('section');launcher.id='train-launcher';launcher.className='card';launcher.setAttribute('aria-live','polite');log.before(launcher);}
  if(log&&!document.getElementById('train-fast-options')){
   const options=document.createElement('div');options.id='train-fast-options';options.innerHTML='<button type="button" class="btn-secondary" data-fast-options-toggle>Workout options</button><span class="more-hint">Date, notes, session intent, planned-work details and setup tools</span>';
   const cockpit=document.getElementById('training-cockpit');(cockpit||log.firstChild)?.after?.(options);options.querySelector('[data-fast-options-toggle]').addEventListener('click',()=>{document.body.classList.toggle('train-fast-options-open');const open=document.body.classList.contains('train-fast-options-open');options.querySelector('button').textContent=open?'Hide workout options':'Workout options';});
  }
  const title=document.getElementById('workout-mode-title'),head=title?.parentElement;
  if(head){[...head.children].slice(1).forEach(el=>el.dataset.fastStartSecondary='true');}
  const dateGrid=document.getElementById('wo-date')?.closest('.grid');if(dateGrid)dateGrid.dataset.fastStartSecondary='true';
  const timing=document.getElementById('session-timing-summary')?.parentElement;if(timing)timing.dataset.fastStartSecondary='true';
  for(const id of ['workout-plan-context','session-intent','logger-draft-status']){const el=document.getElementById(id);if(el)el.dataset.fastStartSecondary='true';}
 }
 function closeLaunchMode(){document.body.classList.remove('train-launch-mode');trainLaunchRequested=false;}
 function openFastStartLogger({compact=true}={}){
  ensureFastStartUI();closeLaunchMode();document.body.classList.toggle('train-fast-start-active',!!compact);document.body.classList.remove('train-fast-options-open');
  showTab('workouts');showSubTab('workouts','wo-log');window.refreshTrainingCockpit?.();
  requestAnimationFrame(()=>{ensureFastStartUI();const cockpit=document.getElementById('training-cockpit'),first=document.querySelector('#exercise-rows > div');(cockpit&&!cockpit.hidden?cockpit:first||document.getElementById('workout-mode-title'))?.scrollIntoView({block:'start'});});
 }
 function leaveFastStart(destination){closeLaunchMode();document.body.classList.remove('train-fast-start-active','train-fast-options-open');destination();}
 function goTrain(){openFastStartLogger({compact:true});}
 function otherActions(report){
  const parts=[];
  if(!report?.openDraft&&(data.workouts||[]).length)parts.push('<button type="button" class="btn-secondary" data-train-repeat>Repeat last workout</button>');
  if(!report?.openDraft&&(data.templates||[]).length)parts.push('<button type="button" class="btn-secondary" data-train-templates>Choose template</button>');
  if(!report?.openDraft)parts.push('<button type="button" class="btn-secondary" data-train-empty>Start empty workout</button>');
  if((data.workouts||[]).length)parts.push('<button type="button" class="btn-secondary" data-train-history>Workout history</button>');
  return parts.length?'<div class="train-launch-secondary"><span class="train-launch-secondary-label">Other ways to train</span>'+parts.join('')+'</div>':'';
 }
 function bindLauncher(host,report,active,lifecycle,lifecycleGate){
  host.querySelector('[data-train-primary]')?.addEventListener('click',()=>{
   const action=host.querySelector('[data-train-primary]').dataset.trainPrimary;
   if(action==='resume'){openFastStartLogger({compact:true});return;}
   if(action==='review'){closeLaunchMode();window.LoadnoteProgramLifecycleUI?.route?.(lifecycle);return;}
   if(action==='start'){
    const id=active?.id;window.startScheduledWorkout?.(id);
    requestAnimationFrame(()=>{const draft=loggerDraft();if(draft?.sessionIntent?.schedule?.id===id)openFastStartLogger({compact:true});});return;
   }
   if(action==='empty'){if(!report.openDraft&&typeof clearWorkoutForm==='function'){clearWorkoutForm(true);saveLoggerDraft?.();}openFastStartLogger({compact:true});}
  });
  host.querySelector('[data-train-repeat]')?.addEventListener('click',()=>{openFastStartLogger({compact:true});requestAnimationFrame(()=>document.querySelector('[data-workout-action="repeat"]')?.click());});
  host.querySelector('[data-train-templates]')?.addEventListener('click',()=>leaveFastStart(()=>{showTab('workouts');showSubTab('workouts','wo-templates');}));
  host.querySelector('[data-train-history]')?.addEventListener('click',()=>leaveFastStart(()=>{showTab('workouts');showSubTab('workouts','wo-history');}));
  host.querySelector('[data-train-empty]')?.addEventListener('click',()=>{if(!report.openDraft&&typeof clearWorkoutForm==='function'){clearWorkoutForm(true);saveLoggerDraft?.();}openFastStartLogger({compact:true});});
 }
 function renderTrainLauncher(){
  if(!trainLaunchRequested)return;
  ensureFastStartUI();
  const editBanner=document.getElementById('workout-edit-banner');if(editBanner&&!editBanner.hidden){openFastStartLogger({compact:false});return;}
  showSubTab('workouts','wo-log');
  const host=document.getElementById('train-launcher');if(!host)return;
  const draft=loggerDraft(),report=LoadnoteTodayTraining.inspect(data,{day:today(),draft}),active=report.active;
  const lifecycle=window.LoadnoteProgramLifecycleUI?.currentReport?.()||null;
  const belongs=!!(active&&lifecycle?.program&&(active.id.startsWith('phase:'+lifecycle.program.id+':')||active.id.startsWith('meet:'+lifecycle.program.id+':')));
  const lifecycleGate=belongs&&['resolve-overdue','review-week','review-phase','review-programs'].includes(lifecycle.nextAction?.kind);
  document.body.classList.add('train-launch-mode');document.body.classList.remove('train-fast-start-active','train-fast-options-open');
  let title='',subtitle='',badge='',preview='',primaryAction='',primaryLabel='';
  // An unrelated unfinished draft always wins over starting a new scheduled session.
  if(active?.draftOpen){
   title=active.name;subtitle='Your scheduled workout is already in progress.';badge='In progress';primaryAction='resume';primaryLabel='Resume workout';
   preview=active.exercises.map(e=>'<div class="train-launch-exercise"><b>'+esc(e.name)+'</b><span>'+esc(e.sets)+' set'+(e.sets===1?'':'s')+'</span></div>').join('');
  }else if(report.unlinkedDraft){
   const rows=meaningfulDraftRows(draft);title='Workout in progress';subtitle='Your unfinished workout is saved on this device. Resume it before starting something new.';badge='Resume first';primaryAction='resume';primaryLabel='Resume workout';
   preview=rows.slice(0,4).map(row=>'<div class="train-launch-exercise"><b>'+esc(row.name||'Exercise')+'</b><span>'+esc((row.sets||[]).length)+' set'+((row.sets||[]).length===1?'':'s')+'</span></div>').join('');
  }else if(active){
   title=active.name;subtitle=lifecycleGate?lifecycle.nextAction.label:(active.goal||'Today’s scheduled workout is ready.');badge=lifecycleGate?'Review first':'Ready';primaryAction=lifecycleGate?'review':'start';primaryLabel=lifecycleGate?lifecycle.nextAction.label:'Start workout';
   preview=active.exercises.map(e=>'<div class="train-launch-exercise"><b>'+esc(e.name)+'</b><span>'+esc(e.sets)+' set'+(e.sets===1?'':'s')+'</span></div>').join('');
  }else if(report.completed){
   title='Training logged';subtitle='Today’s scheduled training is complete. Start another session only if you intend to train again.';badge='Complete';primaryAction='empty';primaryLabel='Start another workout';
  }else{
   title='What are you training today?';subtitle='Nothing is scheduled today. Start simple, repeat something familiar, or choose a saved template.';badge='Open training';primaryAction='empty';primaryLabel='Start empty workout';
  }
  host.innerHTML='<div class="train-launch-head"><div><p class="eyebrow">Train</p><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div><span class="badge">'+esc(badge)+'</span></div>'+(preview?'<div class="train-launch-preview">'+preview+'</div>':'')+'<div class="train-launch-actions"><button type="button" class="btn-primary" data-train-primary="'+esc(primaryAction)+'">'+esc(primaryLabel)+'</button></div>'+otherActions(report);
  bindLauncher(host,report,active,lifecycle,lifecycleGate);
 }
 function requestTrainLauncher(){trainLaunchRequested=true;requestAnimationFrame(renderTrainLauncher);}

 function render(){
  const host=document.getElementById('today-training');if(!host||!window.LoadnoteTodayTraining)return;
  const draft=loggerDraft(),report=LoadnoteTodayTraining.inspect(data,{day:today(),draft});
  const continuity=window.LoadnoteTrainingContinuity?.inspect(data,{asOf:today()})||null;
  const continuityHtml=window.LoadnoteTrainingContinuityUI?.home(continuity)||'';
  const lifecycle=window.LoadnoteProgramLifecycleUI?.currentReport?.()||null;
  const active=report.active;
  const belongs=!!(active&&lifecycle?.program&&(active.id.startsWith('phase:'+lifecycle.program.id+':')||active.id.startsWith('meet:'+lifecycle.program.id+':')));
  const lifecycleGate=belongs&&['resolve-overdue','review-week','review-phase','review-programs'].includes(lifecycle.nextAction?.kind);
  const lifecycleMeta=belongs&&lifecycle.progress?'Week '+lifecycle.progress.week+' of '+lifecycle.progress.totalWeeks+(lifecycle.progress.phaseLabel?' · '+lifecycle.progress.phaseLabel+(lifecycle.progress.phaseWeek?' '+lifecycle.progress.phaseWeek:''):''):'';
  let programSession=null;
  if(active&&belongs&&window.LoadnoteProgramWorkoutViewer){try{programSession=LoadnoteProgramWorkoutViewer.day(data,today(),{asOf:today()}).find(s=>s.id===active.id)||null;}catch{}}
  const sessionMeta=[lifecycleMeta,programSession?.estimatedMinutes?'~'+programSession.estimatedMinutes+' min':''].filter(Boolean).join(' · ');
  // Preserve entered work: an unrelated local draft has priority over a new scheduled start.
  if(active?.draftOpen){
   const exercises=active.exercises.map(e=>'<span>'+esc(e.name)+(e.sets?' · '+e.sets+' set'+(e.sets===1?'':'s'):'')+'</span>').join('');
   host.innerHTML='<div class="today-training-head"><div><p class="eyebrow">Today</p><h2>'+esc(active.name)+'</h2><p>Workout in progress</p></div><span class="badge">In progress</span></div><div class="today-training-exercises">'+exercises+'</div><p class="more-hint">'+active.exerciseCount+' planned exercise'+(active.exerciseCount===1?'':'s')+' · '+active.setCount+' planned set'+(active.setCount===1?'':'s')+'.</p><div class="today-training-actions"><button type="button" class="btn-primary" data-today-resume>Resume workout</button></div>';
  }else if(report.unlinkedDraft){
   host.innerHTML='<p class="eyebrow">Today</p><h2>Workout in progress</h2><p>Your unfinished workout is saved on this device. Resume it before starting a new scheduled session.</p><button type="button" class="btn-primary" data-today-resume>Resume workout</button>';
  }else if(active){
   const exercises=active.exercises.map(e=>'<span>'+esc(e.name)+(e.sets?' · '+e.sets+' set'+(e.sets===1?'':'s'):'')+'</span>').join('');
   const adaptation=window.LoadnoteAdaptationExplanation?.forSession(data,active.id);
   const adaptationHtml=window.LoadnoteAdaptationExplanationUI?.render(adaptation)||'';
   const viewWorkout=belongs&&window.LoadnoteProgramWorkoutViewerUI?'<button type="button" class="btn-secondary" data-today-view-workout>View workout</button>':'';
   host.innerHTML='<div class="today-training-head"><div><p class="eyebrow">Today</p><h2>'+esc(active.name)+'</h2><p>'+esc(lifecycleGate?lifecycle.nextAction.label:sessionMeta||active.goal||'Scheduled training')+'</p></div><span class="badge">'+(lifecycleGate?'Review first':'Ready')+'</span></div><div class="today-training-exercises">'+exercises+'</div><p class="more-hint">'+active.exerciseCount+' planned exercise'+(active.exerciseCount===1?'':'s')+' · '+active.setCount+' planned set'+(active.setCount===1?'':'s')+(programSession?.estimatedMinutes?' · about '+programSession.estimatedMinutes+' min':'')+'. Planned work stays separate from what you actually log.</p>'+adaptationHtml+'<div class="today-training-actions"><button type="button" class="btn-primary" '+(lifecycleGate?'data-today-lifecycle':'data-today-train="'+esc(active.id)+'"')+'>'+esc(lifecycleGate?lifecycle.nextAction.label:'Start workout')+'</button>'+viewWorkout+'<button type="button" class="btn-secondary" data-today-calendar>Calendar</button></div>';
  }else if(report.completed){
   host.innerHTML='<p class="eyebrow">Today</p><h2>Training logged</h2><p>'+report.completed+' scheduled session'+(report.completed===1?' is':'s are')+' complete today.</p>'+continuityHtml+'<div class="today-training-actions"><button type="button" class="btn-secondary" data-today-history>View workout history</button><button type="button" class="btn-secondary" data-today-calendar>View calendar</button></div>';
  }else{
   host.innerHTML='<p class="eyebrow">Today</p><h2>No workout scheduled</h2><p>Train freely or use Calendar to schedule a reviewed plan.</p>'+continuityHtml+'<div class="today-training-actions"><button type="button" class="btn-primary" data-today-resume>Log workout</button><button type="button" class="btn-secondary" data-today-calendar>Open calendar</button></div>';
  }
  host.querySelector('[data-today-train]')?.addEventListener('click',e=>{const id=e.currentTarget.dataset.todayTrain;window.startScheduledWorkout?.(id);requestAnimationFrame(()=>{const next=loggerDraft();if(next?.sessionIntent?.schedule?.id===id)goTrain();});});
  host.querySelector('[data-today-lifecycle]')?.addEventListener('click',()=>window.LoadnoteProgramLifecycleUI?.route?.(lifecycle));
  host.querySelector('[data-today-view-workout]')?.addEventListener('click',()=>window.LoadnoteProgramWorkoutViewerUI?.open?.(lifecycle?.program?.id,active?.id));
  host.querySelector('[data-today-resume]')?.addEventListener('click',goTrain);
  host.querySelector('[data-today-history]')?.addEventListener('click',()=>{showTab('workouts');showSubTab('workouts','wo-history');});
  host.querySelector('[data-today-calendar]')?.addEventListener('click',()=>showTab('calendar'));
 }

 document.addEventListener('click',event=>{if(event.target.closest?.('#tab-workouts,.mobile-nav-btn[data-tab="workouts"]'))requestTrainLauncher();},true);
 window.renderTodayTraining=render;
 window.renderTrainLauncher=renderTrainLauncher;
 window.openFastStartLogger=openFastStartLogger;
 window.requestTrainLauncher=requestTrainLauncher;
 ensureFastStartUI();
})();
