/* v2.69.2 — active-program lifecycle surfaces plus direct workout viewing. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function currentReport(){
   if(!window.LoadnoteProgramLifecycle)return null;
   let draft=null;try{draft=typeof readLoggerDraft==='function'?readLoggerDraft():null;}catch{}
   let draftOpen=!!draft;try{draftOpen=typeof loggerHasContent==='function'?loggerHasContent():!!draft;}catch{}
   draftOpen=draftOpen||!!window.LoadnoteSportPlannerUI?.hasDraft?.();
   try{return window.LoadnoteProgramLifecycle.inspect(data,{asOf:today(),draft,draftOpen});}catch(error){return {status:'error',program:null,progress:null,schedule:null,nextAction:{kind:'error',label:'Program status needs review',detail:error.message}};}
 }
 function openCoachPrograms(){
   showTab('coach');showSubTab('coach','co-programs');
   document.getElementById('decision-action-center')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function route(report){
   const a=report?.nextAction;if(!a)return;
   if(a.kind==='resume-workout'||a.kind==='resume-draft'){const sport=window.LoadnoteSportPlannerUI?.readDraft?.();if(sport&&!loggerHasContent()){try{window.LoadnoteSportPlannerUI.record(sport.sessionId);}catch(e){showToast(e.message,'error');}return;}showTab('workouts');showSubTab('workouts','wo-log');return;}
   if(a.kind==='start-workout'){window.startScheduledWorkout?.(a.scheduleId);return;}
   if(a.kind==='resolve-overdue'||a.kind==='next-session'||a.kind==='program-upcoming'||a.kind==='wait-event'){showTab('calendar');return;}
   if(a.kind==='review-week'){window.LoadnoteCycleWeekReviewUI?.open?.(a.cycleId,a.week);return;}
   if(a.kind==='review-phase'){window.openPhaseReview?.(a.programId,a.phase);return;}
   if(a.kind==='record-event'){window.openMeetResult?.(a.cycleId);return;}
   if(a.kind==='review-sport'){openCoachPrograms();window.LoadnoteSportPlannerUI?.show?.(a.programId);return;}
   if(a.kind==='review-hypertrophy'){openCoachPrograms();window.LoadnoteHypertrophyBuilderUI?.show?.(a.programId);return;}
   if(a.kind==='save-transition'){window.LoadnoteTransitionBaselineUI?.open?.(a.programId);return;}
   if(a.kind==='review-next-program'){window.LoadnoteNextBlockHandoffUI?.open?.(data,today());return;}
   if(a.kind==='review-handoff'){openCoachPrograms();const tools=document.getElementById('programming-tools-panel'),panel=document.getElementById('phase-builder-panel');if(tools)tools.open=true;if(panel)panel.open=true;setTimeout(()=>document.getElementById('next-block-handoff')?.scrollIntoView({behavior:'smooth',block:'start'}),50);return;}
   if(a.kind==='no-program'||a.kind==='review-programs'){showTab('coach');showSubTab('coach','co-programs');setTimeout(()=>{window.renderProgrammingWorkspace?.();document.getElementById('programming-workspace')?.scrollIntoView({behavior:'smooth',block:'start'});},50);return;}
   openCoachPrograms();
 }
 function actionLabel(kind){
   return ({'review-week':'Review week','review-phase':'Review phase','record-event':'Record results','save-transition':'Review handoff','review-next-program':'Review next program','review-handoff':'Review handoff','resolve-overdue':'Resolve sessions','start-workout':'Start workout','resume-workout':'Resume workout','resume-draft':'Resume workout','next-session':'View next session','program-upcoming':'View calendar','wait-event':'View calendar','review-programs':'Review programs','no-program':'Open programming'}[kind]||'Review');
 }
 function programLine(r){
   if(!r.program)return '';
   const progress=r.progress?'Week '+r.progress.week+' of '+r.progress.totalWeeks+(r.progress.phaseLabel?' · '+r.progress.phaseLabel+(r.progress.phaseWeek?' '+r.progress.phaseWeek:''):''):'';
   const dates=r.program.startDate&&r.program.endDate?r.program.startDate+' → '+r.program.endDate:'';
   const schedule=r.schedule?r.schedule.completed+'/'+r.schedule.planned+' scheduled sessions logged':'';
   const next=r.schedule?.next?'Next '+r.schedule.next.date:'';
   return [progress,dates,schedule,next].filter(Boolean).join(' · ');
 }
 function card(r,{compact=false}={}){
   if(!r)return '';
   if(!r.program){
     return '<div class="program-lifecycle-empty"><p class="eyebrow">TRAINING PLAN</p><h3>'+esc(r.nextAction?.label||'No active program')+'</h3><p>'+esc(r.nextAction?.detail||'')+'</p><button type="button" class="btn-secondary" data-lifecycle-action>'+esc(actionLabel(r.nextAction?.kind))+'</button></div>';
   }
   const kind=r.program.kind==='sport-program'?'Sport development program':r.program.kind==='hypertrophy-program'?'Hypertrophy program':r.program.kind==='meet-cycle'?(r.program.eventType==='competition'?'Competition cycle':'Mock-meet cycle'):'Phase program';
   const missed=(r.missedReviews||[]).length?'<p class="program-lifecycle-history-note">'+r.missedReviews.length+' earlier review window'+(r.missedReviews.length===1?' passed':'s passed')+' without a saved review. Past prescriptions stay unchanged; this does not block current training.</p>':'';
   return '<div class="program-lifecycle-head"><div><p class="eyebrow">'+esc(kind.toUpperCase())+'</p><h3>'+esc(r.program.name)+'</h3><p class="program-lifecycle-meta">'+esc(programLine(r))+'</p></div><span class="badge">'+esc(r.status==='completed'?(['hypertrophy-program','sport-program'].includes(r.program.kind)?'Completed':'Handoff'):r.status==='upcoming'?'Upcoming':'Active')+'</span></div>'+
     '<div class="program-lifecycle-next"><span>Next action</span><b>'+esc(r.nextAction.label)+'</b><p>'+esc(r.nextAction.detail)+'</p></div>'+missed+
     '<div class="program-lifecycle-actions"><button type="button" class="btn-'+(compact?'secondary':'primary')+'" data-lifecycle-action>'+esc(actionLabel(r.nextAction.kind))+'</button><button type="button" class="btn-secondary" data-lifecycle-workouts>View workouts</button>'+(r.schedule?.next&&r.nextAction.kind!=='next-session'?'<button type="button" class="btn-secondary" data-lifecycle-calendar>Calendar</button>':'')+'</div>';
 }
 function bind(host,r){
   host?.querySelector('[data-lifecycle-action]')?.addEventListener('click',()=>route(r));
   host?.querySelector('[data-lifecycle-workouts]')?.addEventListener('click',()=>window.LoadnoteProgramWorkoutViewerUI?.open?.(r?.program?.id));
   host?.querySelector('[data-lifecycle-calendar]')?.addEventListener('click',()=>showTab('calendar'));
 }
 function home(r=currentReport()){
   const host=document.getElementById('program-lifecycle-home');if(!host)return;
   let todayActive=false;try{const draft=typeof readLoggerDraft==='function'?readLoggerDraft():null;todayActive=!!window.LoadnoteTodayTraining?.inspect(data,{day:today(),draft})?.active;}catch{}
   if(!r||(!r.program&&r.nextAction?.kind==='no-program')||todayActive){host.classList.add('hidden');host.replaceChildren();return;}
   host.classList.remove('hidden');host.innerHTML=card(r,{compact:true});bind(host,r);
 }
 function coach(r=currentReport()){
   const host=document.getElementById('decision-action-center');if(!host)return;
   host.innerHTML='<div class="card program-lifecycle-coach">'+card(r)+'<div class="adaptive-entry-actions"><button type="button" class="btn-secondary program-manage" data-manage-program>Manage programs</button><button type="button" class="btn-secondary" data-adapt-session>Adapt planned session</button><button type="button" class="btn-secondary" data-training-preferences>Training preferences</button></div></div>';bind(host,r);window.LoadnoteSmartCoachUI?.render?.(host);host.querySelector('[data-manage-program]').onclick=()=>window.LoadnoteProgramCancellationUI.open(r?.program?.id,r?.program?.kind);host.querySelector('[data-adapt-session]').onclick=()=>window.LoadnoteAdaptiveSessionUI.open();host.querySelector('[data-training-preferences]').onclick=()=>window.LoadnoteAdaptiveSessionUI.preferences();
 }
 function recap(host,state,asOf){
   if(!host||!window.LoadnoteProgramLifecycle)return;
   host.querySelector('.program-lifecycle-recap')?.remove();
   let r=null;try{r=window.LoadnoteProgramLifecycle.inspect(state,{asOf,draft:null,draftOpen:false});}catch{}
   if(!r?.program)return;
   const section=document.createElement('section');section.className='program-lifecycle-recap';
   section.innerHTML='<h3>Program next action</h3><p><b>'+esc(r.nextAction.label)+'</b> · '+esc(r.nextAction.detail)+'</p><button type="button" class="btn-secondary" data-lifecycle-action>'+esc(actionLabel(r.nextAction.kind))+'</button>';
   host.appendChild(section);bind(section,r);
 }
 function render(){const r=currentReport();home(r);if(!document.getElementById('panel-coach')?.classList.contains('hidden'))coach(r);}
 window.LoadnoteProgramLifecycleUI={currentReport,route,card,home,coach,recap,render};
 window.renderProgramLifecycle=render;
})();
