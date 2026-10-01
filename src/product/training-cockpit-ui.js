/* v2.74 — focused in-workout cockpit.
 * Read-only prescription/previous-performance context plus display-unit input
 * shortcuts. The existing logger remains authoritative for saved performance.
 */
(function(){
 'use strict';
 let transitionState=null,scheduledRefresh=false,timer=null;
 const H=()=>window.LoadnoteTrainingCockpit;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function visible(){
  const panel=document.getElementById('panel-workouts'),sub=document.querySelector('[data-panel="workouts"][data-sub="wo-log"]');
  let edit=null;try{edit=typeof workoutEdit!=='undefined'?workoutEdit:null;}catch{}
  return !!panel&&!panel.classList.contains('hidden')&&!!sub&&!sub.classList.contains('hidden')&&!edit;
 }
 function rows(){return [...document.querySelectorAll('#exercise-rows > div')];}
 function setRows(row){return row?[...row.querySelectorAll('.sets-container > div')]:[];}
 function rowEntered(row){
  if(!row)return false;
  if(row.dataset.type==='cardio')return !!row.querySelector('.ex-name')?.value.trim()&&(Number(row.querySelector('.cardio-duration')?.value)>0||Number(row.querySelector('.cardio-distance')?.value)>0);
  const name=row.querySelector('.ex-name')?.value.trim();
  return !!name&&setRows(row).some(s=>s.querySelector('.set-reps,.set-duration')?.value!==''||s.querySelector('.set-weight')?.value!=='');
 }
 function setDone(set){return !!set?.querySelector('.set-done-check')?.checked;}
 function current(){
  const all=rows(),usable=all.filter(row=>row.querySelector('.ex-name')?.value.trim()||rowEntered(row));
  for(let exerciseIndex=0;exerciseIndex<usable.length;exerciseIndex++){
   const row=usable[exerciseIndex];
   if(row.dataset.type==='cardio'){
    if(!row.querySelector('.cardio-done')?.checked)return {rows:usable,row,exerciseIndex,set:null,setIndex:0,setCount:1};
    continue;
   }
   const sets=setRows(row);
   const setIndex=sets.findIndex(set=>!setDone(set));
   if(setIndex>=0)return {rows:usable,row,exerciseIndex,set:sets[setIndex],setIndex,setCount:sets.length};
  }
  return {rows:usable,row:null,exerciseIndex:usable.length,set:null,setIndex:-1,setCount:0};
 }
 function marker(row){
  if(!row)return null;
  const name=row.querySelector('.ex-name')?.value.trim()||'';
  let exerciseId=null;try{exerciseId=window.LoadnoteIntegrity?.resolveExercise(data.exerciseCatalog,name)?.id||null;}catch{}
  return {exerciseId,name,trackBy:row.dataset.trackBy==='duration'?'duration':'reps'};
 }
 function plan(){
  try{return typeof pendingPrescription!=='undefined'?pendingPrescription:null;}catch{return null;}
 }
 function target(ctx){
  if(!ctx?.set)return null;
  return H()?.targetSet(plan(),marker(ctx.row),ctx.setIndex)||null;
 }
 function previous(ctx){
  if(!ctx?.row||ctx.row.dataset.type==='cardio')return null;
  const mark=marker(ctx.row),day=document.getElementById('wo-date')?.value;
  if(!mark?.name||!day||!window.LoadnoteSession)return null;
  let editId=null;try{editId=typeof workoutEdit!=='undefined'?workoutEdit?.id:null;}catch{}
  try{
   const found=LoadnoteSession.previous(data.workouts||[],mark.name,day,editId,'strength',mark.trackBy,mark.exerciseId);
   return found?.exercise?.sets?.[ctx.setIndex]||null;
  }catch{return null;}
 }
 function weightText(kg){
  const n=Number(kg);if(!Number.isFinite(n))return '';
  try{return (Math.round(toDisplay(n)*100)/100)+' '+unitLabel();}catch{return Math.round(n*100)/100+' kg';}
 }
 function targetText(ctx,value){
  if(!value)return 'No captured target for this set';
  const load=value.weight!=null?weightText(value.weight):'';
  const measure=ctx.row.dataset.trackBy==='duration'&&value.duration!=null?value.duration+' sec':value.reps!=null?String(value.reps):'';
  return [load,measure].filter(Boolean).join(' × ')+(value.targetRpe!=null?' @'+value.targetRpe:'');
 }
 function previousText(ctx,value){
  if(!value)return 'No earlier matching set';
  const load=Number.isFinite(Number(value.weight))?weightText(value.weight):'';
  const measure=ctx.row.dataset.trackBy==='duration'&&Number(value.duration)>0?value.duration+' sec':Number(value.reps)>0?String(value.reps):'';
  return [load,measure].filter(Boolean).join(' × ')+(Number(value.rpe)>=1&&Number(value.rpe)<=10?' @'+value.rpe:'');
 }
 function workoutMeta(){
  let scheduled=null,timing=null;
  try{scheduled=typeof pendingScheduledSession!=='undefined'?pendingScheduledSession:null;timing=typeof pendingSessionTiming!=='undefined'?pendingSessionTiming:null;}catch{}
  let record=null;if(scheduled)try{record=window.LoadnoteSchedule?.list(data.scheduledSessions||[]).find(x=>x.id===scheduled.id)||null;}catch{}
  const p=plan(),name=record?.name||p?.source?.label||document.getElementById('session-goal')?.value.trim()||'Workout';
  let program='';
  if(scheduled&&window.LoadnoteProgramLifecycle)try{
   const report=LoadnoteProgramLifecycle.inspect(data,{asOf:today(),draft:null,draftOpen:true});
   if(report?.program&&scheduled.id.startsWith(report.program.prefix)&&report.progress){
    const x=report.progress;program='Week '+x.week+' of '+x.totalWeeks+(x.phaseLabel?' · '+x.phaseLabel+(x.phaseWeek?' '+x.phaseWeek:''):'');
   }
  }catch{}
  let elapsed=null;
  if(timing?.startedAt&&timing?.sessionDate===document.getElementById('wo-date')?.value)elapsed=H()?.elapsedMinutes(timing.startedAt);
  return {name,program,elapsed,scheduled:!!scheduled,started:!!timing?.startedAt};
 }
 function completionCounts(ctx){
  let total=0,done=0;
  for(const row of ctx.rows){
   if(row.dataset.type==='cardio'){total++;if(row.querySelector('.cardio-done')?.checked)done++;continue;}
   for(const set of setRows(row)){total++;if(setDone(set))done++;}
  }
  return {total,done};
 }
 function ensure(){
  let host=document.getElementById('training-cockpit');
  if(host)return host;
  const card=document.getElementById('workout-log-card');if(!card)return null;
  host=document.createElement('section');host.id='training-cockpit';host.className='training-cockpit';host.hidden=true;host.setAttribute('aria-label','Current workout');
  card.querySelector('.flex.flex-wrap.items-center.justify-between')?.after(host);
  return host;
 }
 function activeInputs(ctx){
  if(!ctx?.set)return {};
  return {
   weight:ctx.set.querySelector('.set-weight'),
   measure:ctx.set.querySelector(ctx.row.dataset.trackBy==='duration'?'.set-duration':'.set-reps'),
   rpe:ctx.set.querySelector('.set-rpe')
  };
 }
 function changed(input){input?.dispatchEvent(new Event('input',{bubbles:true}));}
 function useTarget(){
  const ctx=current(),value=target(ctx);if(!ctx.set||!value)return;
  const inputs=activeInputs(ctx);
  if(inputs.weight&&value.weight!=null){inputs.weight.value=String(Math.round(toDisplay(value.weight)*100)/100);changed(inputs.weight);}
  const amount=ctx.row.dataset.trackBy==='duration'?value.duration:value.reps;
  if(inputs.measure&&amount!=null){inputs.measure.value=String(amount);changed(inputs.measure);}
  saveLoggerDraft();window.updateTrainingFlow?.();refresh();
  inputs.rpe?.focus({preventScroll:true});
 }
 function adjust(delta){
  const ctx=current(),input=activeInputs(ctx).weight;if(!input)return;
  const next=H()?.adjustDisplayWeight(input.value,delta);if(next==null)return;
  input.value=String(next);changed(input);saveLoggerDraft();window.updateTrainingFlow?.();refresh();input.focus({preventScroll:true});try{input.select();}catch{}
 }
 function focusSet(set){
  if(!set)return;
  const weight=set.querySelector('.set-weight'),measure=set.querySelector('.set-reps,.set-duration'),rpe=set.querySelector('.set-rpe');
  const target=weight&&weight.value===''?weight:measure&&measure.value===''?measure:rpe||measure||weight;
  set.scrollIntoView({block:'center',behavior:'smooth'});
  setTimeout(()=>{target?.focus({preventScroll:true});try{target?.select();}catch{}},120);
 }
 function startNextExercise(){
  const next=transitionState?.nextSet;transitionState=null;render();focusSet(next);
 }
 function openWhy(){
  const details=document.getElementById('workout-plan-context');if(!details)return;
  details.hidden=false;details.open=true;window.LoadnoteTrainingTargetsUI?.current?.();
  details.scrollIntoView({block:'center',behavior:'smooth'});
 }
 function transitionHtml(){
  if(!transitionState)return '';
  return '<div class="training-cockpit-transition" data-cockpit-transition><div><span>'+esc(transitionState.from)+' complete</span><b>Up next: '+esc(transitionState.to)+'</b><small>'+transitionState.setCount+' set'+(transitionState.setCount===1?'':'s')+'</small></div><button type="button" class="btn-primary" data-cockpit-next>Start next exercise</button></div>';
 }
 function render(){
  const host=ensure();if(!host)return;
  let hasDraft=false;try{hasDraft=loggerHasContent();}catch{}
  if(!visible()||!hasDraft){host.hidden=true;return;}
  const ctx=current(),meta=workoutMeta(),counts=completionCounts(ctx),value=target(ctx),prior=previous(ctx),steps=H()?.loadSteps(currentUnit())||{small:2.5,large:5};
  const complete=!ctx.row&&counts.total>0&&counts.done===counts.total;
  const exerciseName=ctx.row?.querySelector('.ex-name')?.value.trim()||'Workout complete';
  const position=complete?'All entered work checked complete':('Exercise '+Math.min(ctx.exerciseIndex+1,ctx.rows.length)+' of '+ctx.rows.length+(ctx.set?' · Set '+(ctx.setIndex+1)+' of '+ctx.setCount:''));
  const progress=counts.total?counts.done+'/'+counts.total+' sets':'';
  const elapsed=meta.elapsed==null?'':(' · '+meta.elapsed+' min');
  const targetLine=ctx.set?'<div><span>Today</span><b>'+esc(targetText(ctx,value))+'</b></div>':'';
  const previousLine=ctx.set?'<div><span>Last</span><b>'+esc(previousText(ctx,prior))+'</b></div>':'';
  const quick=ctx.set?'<div class="training-cockpit-quick">'+
    (value?'<button type="button" class="btn-secondary" data-cockpit-target>Use target</button>':'')+
    '<button type="button" data-cockpit-adjust="'+(-steps.large)+'">−'+steps.large+'</button>'+
    '<button type="button" data-cockpit-adjust="'+(-steps.small)+'">−'+steps.small+'</button>'+
    '<button type="button" data-cockpit-adjust="'+steps.small+'">+'+steps.small+'</button>'+
    '<button type="button" data-cockpit-adjust="'+steps.large+'">+'+steps.large+'</button>'+
    '</div>':'';
  const timer=!meta.started&&document.getElementById('wo-date')?.value===today()?'<button type="button" class="btn-secondary" data-cockpit-start>Start timer</button>':'';
  const why=meta.scheduled?'<button type="button" class="training-cockpit-link" data-cockpit-why>Why?</button>':'';
  host.innerHTML='<div class="training-cockpit-top"><div class="training-cockpit-title"><span>'+esc(meta.program||'IN WORKOUT')+'</span><b>'+esc(meta.name)+'</b><small>'+esc(position+(progress?' · '+progress:'')+elapsed)+'</small></div><div class="training-cockpit-actions">'+timer+'<button type="button" class="'+(complete?'btn-primary':'btn-secondary')+'" data-cockpit-review>'+(complete?'Review workout':'Finish')+'</button></div></div>'+
    '<div class="training-cockpit-current"><div><span>Current</span><b>'+esc(exerciseName)+'</b></div><div class="training-cockpit-comparison">'+targetLine+previousLine+'</div>'+why+'</div>'+
    quick+transitionHtml();
  host.hidden=false;
  host.querySelector('[data-cockpit-target]')?.addEventListener('click',useTarget);
  host.querySelectorAll('[data-cockpit-adjust]').forEach(button=>button.addEventListener('click',()=>adjust(Number(button.dataset.cockpitAdjust))));
  host.querySelector('[data-cockpit-start]')?.addEventListener('click',()=>{startWorkoutNow();queueRefresh();});
  host.querySelector('[data-cockpit-review]')?.addEventListener('click',()=>reviewWorkout());
  host.querySelector('[data-cockpit-why]')?.addEventListener('click',openWhy);
  host.querySelector('[data-cockpit-next]')?.addEventListener('click',startNextExercise);
 }
 function queueRefresh(){
  if(scheduledRefresh)return;scheduledRefresh=true;requestAnimationFrame(()=>{scheduledRefresh=false;render();});
 }
 function onSetComplete(fromSet,nextSet){
  if(!fromSet||!nextSet)return false;
  const fromRow=fromSet.closest('#exercise-rows > div'),toRow=nextSet.closest('#exercise-rows > div'),all=rows(),fromIndex=all.indexOf(fromRow),toIndex=all.indexOf(toRow);
  if(fromRow===toRow||!H()?.transition(fromIndex,toIndex))return false;
  transitionState={
   from:fromRow.querySelector('.ex-name')?.value.trim()||'Exercise',
   to:toRow.querySelector('.ex-name')?.value.trim()||'Exercise',
   setCount:setRows(toRow).length,
   nextSet
  };
  render();document.getElementById('training-cockpit')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  return true;
 }
 function init(){
  ensure();queueRefresh();
  const card=document.getElementById('workout-log-card');
  if(card){
   card.addEventListener('input',queueRefresh);
   card.addEventListener('change',queueRefresh);
   card.addEventListener('focusin',event=>{
    if(transitionState&&event.target.closest?.('#exercise-rows > div')===transitionState.nextSet?.closest?.('#exercise-rows > div')){transitionState=null;queueRefresh();}
    else queueRefresh();
   });
  }
  const rowHost=document.getElementById('exercise-rows');if(rowHost)new MutationObserver(queueRefresh).observe(rowHost,{childList:true,subtree:true});
  timer=setInterval(()=>{if(!document.hidden)queueRefresh();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueRefresh();});
 }
 window.LoadnoteTrainingCockpitUI={init,refresh:render,onSetComplete,useTarget,adjust,current,startNextExercise};
 window.refreshTrainingCockpit=render;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();