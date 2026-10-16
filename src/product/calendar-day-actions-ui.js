/* Calendar entry points select a date; only the destination's save commits data. */
(function(){
 'use strict';
 function openLogger(date){
  const input=document.getElementById('wo-date'),previous=input.value;
  if(previous!==date&&(workoutEdit||pendingScheduledSession||pendingProgramSession)){
   showToast('Finish or clear the current linked workout before logging another date.','info');return false;
  }
  if(previous!==date&&loggerHasContent()&&!confirm('Move your unfinished workout from '+formatDate(previous)+' to '+formatDate(date)+'? Your exercises and notes will be kept.'))return false;
  input.value=date;saveLoggerDraft();
  window.openFastStartLogger({compact:false});
  // Fast-start schedules its own scroll. Give this explicit date priority.
  requestAnimationFrame(()=>revealNavigationTarget('wo-date'));
  return true;
 }
 function openNutrition(date){
  document.getElementById('nu-date').value=date;
  showTab('nutrition');showSubTab('nutrition','nu-add');loadDayFoods();updateFoodEntrySummary();
  const target=document.querySelector('[data-panel="nutrition"][data-sub="nu-add"]');
  if(target&&!target.id)target.id='nutrition-add-page';
  revealNavigationTarget(target.id,'input');
 }
 function open(date){
  let dialog=document.getElementById('calendar-day-actions');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='calendar-day-actions';dialog.className='card schedule-dialog';dialog.setAttribute('aria-labelledby','calendar-actions-title');document.body.append(dialog);}
  if(dialog.open)dialog.close();
  const future=date>today(),past=date<today();
  dialog.innerHTML='<h2 id="calendar-actions-title"></h2><p>What would you like to do?</p><div class="calendar-day-actions">'+
   '<button type="button" class="btn-primary" data-calendar-action="workout" '+(future?'disabled':'')+'>'+(past?'Log past workout':'Log workout')+'</button>'+
   '<button type="button" class="btn-secondary" data-calendar-action="schedule">Schedule a new workout</button>'+
   '<button type="button" class="btn-secondary" data-calendar-action="nutrition" '+(future?'disabled':'')+'>'+(past?'Log past nutrition':'Log nutrition')+'</button></div>'+
   (future?'<p>Workout and nutrition logs are available for today and earlier dates.</p>':'')+
   '<p id="calendar-actions-status" role="status"></p><button type="button" class="btn-secondary" data-calendar-action="view">View this day</button> <button type="button" class="btn-secondary" data-calendar-action="cancel">Cancel</button>';
  dialog.querySelector('h2').textContent=formatDate(date);
  let restoreFocus=true;
  dialog.onclick=event=>{
   const button=event.target.closest('[data-calendar-action]');if(!button||button.disabled)return;
   const action=button.dataset.calendarAction;
   if(action==='workout'){
    if(openLogger(date)){restoreFocus=false;dialog.close();}
    else dialog.querySelector('#calendar-actions-status').textContent='Your unfinished workout is unchanged. Resume it from Train, or finish or clear it before logging another date.';
    return;
   }
   restoreFocus=action==='cancel';dialog.close();
   if(action==='nutrition')openNutrition(date);
   if(action==='schedule')window.LoadnoteScheduleUI.open(null,{date});
   if(action==='view')revealNavigationTarget('cal-day-detail');
  };
  dialog.onclose=()=>{if(restoreFocus&&LoadnoteNavigation.active==='calendar')document.querySelector('#calendar-grid [aria-label^="'+date+'"]')?.focus({preventScroll:true});};
  dialog.showModal();
 }
 window.LoadnoteCalendarDayActionsUI={open,openLogger,openNutrition};
})();
