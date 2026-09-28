/* v2.48 — first-class Home → today's workout → Train flow. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function goTrain(){showTab('workouts');showSubTab('workouts','wo-log');document.getElementById('workout-mode-title')?.scrollIntoView({block:'start'});}
 function render(){
  const host=document.getElementById('today-training');if(!host||!window.LoadnoteTodayTraining)return;
  const draft=typeof readLoggerDraft==='function'?readLoggerDraft():null,report=LoadnoteTodayTraining.inspect(data,{day:today(),draft});
  const active=report.active;
  if(active){
   const exercises=active.exercises.map(e=>'<span>'+esc(e.name)+(e.sets?' · '+e.sets+' set'+(e.sets===1?'':'s'):'')+'</span>').join('');
   host.innerHTML='<div class="today-training-head"><div><p class="eyebrow">Today</p><h2>'+esc(active.name)+'</h2><p>'+esc(active.draftOpen?'Workout in progress':active.goal||'Scheduled training')+'</p></div><span class="badge">'+(active.draftOpen?'In progress':'Ready')+'</span></div>'+
    '<div class="today-training-exercises">'+exercises+'</div><p class="more-hint">'+active.exerciseCount+' planned exercise'+(active.exerciseCount===1?'':'s')+' · '+active.setCount+' planned set'+(active.setCount===1?'':'s')+'. Planned work stays separate from what you actually log.</p>'+
    '<div class="today-training-actions"><button type="button" class="btn-primary" data-today-train="'+esc(active.id)+'">'+(active.draftOpen?'Resume workout':'Start workout')+'</button><button type="button" class="btn-secondary" data-today-calendar>View calendar</button></div>';
  }else if(report.unlinkedDraft){
   host.innerHTML='<p class="eyebrow">Today</p><h2>Workout in progress</h2><p>Your unfinished workout is saved on this device.</p><button type="button" class="btn-primary" data-today-resume>Resume workout</button>';
  }else if(report.completed){
   host.innerHTML='<p class="eyebrow">Today</p><h2>Training logged</h2><p>'+report.completed+' scheduled session'+(report.completed===1?' is':'s are')+' complete today.</p><div class="today-training-actions"><button type="button" class="btn-secondary" data-today-history>View workout history</button><button type="button" class="btn-secondary" data-today-calendar>View calendar</button></div>';
  }else{
   host.innerHTML='<p class="eyebrow">Today</p><h2>No workout scheduled</h2><p>Train freely or use Calendar to schedule a reviewed plan.</p><div class="today-training-actions"><button type="button" class="btn-primary" data-today-resume>Log workout</button><button type="button" class="btn-secondary" data-today-calendar>Open calendar</button></div>';
  }
  host.querySelector('[data-today-train]')?.addEventListener('click',e=>{const id=e.currentTarget.dataset.todayTrain;if(active?.draftOpen)goTrain();else window.startScheduledWorkout?.(id);});
  host.querySelector('[data-today-resume]')?.addEventListener('click',goTrain);
  host.querySelector('[data-today-history]')?.addEventListener('click',()=>{showTab('workouts');showSubTab('workouts','wo-history');});
  host.querySelector('[data-today-calendar]')?.addEventListener('click',()=>showTab('calendar'));
 }
 window.renderTodayTraining=render;
})();
