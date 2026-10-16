/* One reversible action per surface. Restores retained DOM or appends a calendar revision. */
(function(){
 'use strict';
 const entries=new Map();
 function clear(scope){const entry=entries.get(scope);entry?.bar.remove();entries.delete(scope);}
 function offer(scope,{host,label,undo}){
  clear(scope);if(!host)return;
  const bar=document.createElement('section');bar.className='edit-undo-bar';bar.dataset.undoScope=scope;bar.setAttribute('aria-label',label);
  const text=document.createElement('p');text.textContent=label;
  const button=document.createElement('button');button.type='button';button.className='btn-secondary';button.textContent='Undo';button.dataset.undoAction=scope;
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='btn-secondary';dismiss.textContent='Dismiss';
  const status=document.createElement('p');status.setAttribute('role','status');
  const entry={bar};bar.append(text,button,dismiss,status);host.prepend(bar);entries.set(scope,entry);
  button.onclick=async()=>{if(button.disabled)return;button.disabled=true;dismiss.disabled=true;try{await undo();if(entries.get(scope)===entry)clear(scope);window.showToast?.('Change undone','success');}catch(error){status.textContent=error.message;button.disabled=false;dismiss.disabled=false;}};
  dismiss.onclick=()=>{clear(scope);host.querySelector('input,select,button')?.focus();};
  button.focus();
 }
 function retain(node,label){
  const parent=node.parentElement,next=node.nextSibling;
  return ()=>{
   if(!parent.isConnected||node.isConnected)throw Error('This workout changed. The removed work can no longer be restored here.');
   parent.insertBefore(node,next?.parentElement===parent?next:null);
   saveLoggerDraft();updateLoggerSummary();window.refreshLoggerQuickEntry?.();window.refreshGymFloorUI?.();
   node.querySelector('input,button')?.focus();
  };
 }
 function removed(node,label){const undo=retain(node,label);node.remove();offer('logger',{host:document.getElementById('workout-log-card'),label,undo});}
 function plannerRemoved(node,form,invalidate){
  const parent=node.parentElement,next=node.nextSibling;node.remove();invalidate();
  offer('planner',{host:form,label:'Movement removed from this unsaved plan. Undo restores its entered settings.',undo:()=>{
   if(!parent.isConnected||node.isConnected)throw Error('This plan form changed. Reopen it and review the current movements.');
   parent.insertBefore(node,next?.parentElement===parent?next:null);invalidate();node.querySelector('input,select')?.focus();
  }});
 }
 function calendar(before,after){
  const host=document.getElementById('panel-calendar')?.classList.contains('hidden')?document.getElementById('week-plan'):document.getElementById('calendar-plan');
  offer('calendar',{host,label:'Calendar change saved. Undo restores the previous date and status as a new revision.',undo:async()=>{
   const draft=typeof readLoggerDraft==='function'?readLoggerDraft():null,sportDraft=window.LoadnoteSportPlannerUI?.readDraft?.();
   const next=LoadnoteProgramUsability.undoSchedule(data,before,after,{draft,sportDraft});
   clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();window.renderSchedule?.();window.renderTodayTraining?.();window.renderProgramLifecycle?.();
   [...host.querySelectorAll('[data-change]')].find(button=>button.dataset.change===before.id)?.focus();
  }});
 }
 window.LoadnoteEditUndoUI={clear,removed,plannerRemoved,calendar};
})();
