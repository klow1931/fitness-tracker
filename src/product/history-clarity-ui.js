/* v7.2 — reversible Simple history layout; never changes saved sessions. */
(function(){
 'use strict';
 const anchors=new Map();let compact=false;
 function move(node,target){if(!node)return;if(!anchors.has(node)){const anchor=document.createComment('History control position');node.before(anchor);anchors.set(node,anchor);}target.append(node);}
 function restore(){for(const [node,anchor] of anchors)anchor.after(node);}
 function disclosure(id,label,parent,after){
  let el=document.getElementById(id);if(el)return el;
  el=document.createElement('details');el.id=id;el.className='history-optional';
  const title=document.createElement('summary');title.textContent=label;el.append(title);
  const body=document.createElement('div');el.append(body);if(after)after.after(el);else parent.append(el);return el;
 }
 function layout(){
  const panel=document.querySelector('[data-panel="workouts"][data-sub="wo-history"]'),list=document.getElementById('workout-history');if(!panel||!list)return;
  const simple=document.body.classList.contains('loadnote-simple-view')&&(window.LoadnoteBeginnerUI?.selected?.()||document.body.classList.contains('loadnote-first-workout'));
  compact=!!simple;panel.classList.toggle('history-simple',compact);
  const filters=document.querySelector('.history-filter-grid'),search=document.getElementById('history-search')?.closest('label');
  const filterDetails=disclosure('history-extra-filters','Filters & order',filters,search);
  const manage=disclosure('history-manage','Manage history',panel.querySelector('.card'),list);
  filterDetails.hidden=manage.hidden=!compact;
  if(panel.dataset.historyCompact!==String(compact)){
   panel.dataset.historyCompact=String(compact);
   if(compact){
    filterDetails.open=['history-from','history-to'].some(id=>!!document.getElementById(id)?.value)||
     ['history-source','history-quality'].some(id=>document.getElementById(id)?.value!=='all')||document.getElementById('history-sort')?.value!=='newest';
    manage.open=false;
   }
  }
  if(!compact){restore();const notice=document.getElementById('history-review-notice');if(notice)notice.hidden=true;return;}
  for(const child of [...filters.children])if(child!==search&&child!==filterDetails)move(child,filterDetails.lastElementChild);
  const exportButton=panel.querySelector('[data-workout-action="export-json"]');
  if(exportButton)move(exportButton.parentElement,manage.lastElementChild);
  for(const id of ['history-reliability-summary','history-cleanup'])move(document.getElementById(id),manage.lastElementChild);
 }
 function decorate(report){
  layout();if(!compact)return;
  const list=document.getElementById('workout-history');if(!list)return;
  let notice=document.getElementById('history-review-notice');
  if(!notice){notice=document.createElement('p');notice.id='history-review-notice';notice.setAttribute('role','status');list.before(notice);}
  const count=Number(report?.counts?.needsReview)||0;notice.hidden=!count;notice.textContent=count+' saved record'+(count===1?' needs':'s need')+' review. Look for the Review labels below.';
  for(const card of list.querySelectorAll('[data-hist-id]')){
   const names=[...card.querySelectorAll('.history-exercise>[data-exercise-name]')].map(button=>String(button.dataset.exerciseName||'').trim()).filter(Boolean);
   if(!card.querySelector('.history-session-preview')){
    const preview=document.createElement('p');preview.className='history-session-preview';
    preview.textContent=names.slice(0,3).join(' · ')+(names.length>3?' · +'+(names.length-3)+' more':'');
    card.querySelector('.history-session-heading')?.after(preview);
   }
   const actions=card.querySelector('.history-session-actions');if(!actions||actions.querySelector('.history-card-more'))continue;
   const more=document.createElement('details');more.className='history-card-more';const summary=document.createElement('summary');summary.textContent='More actions';more.append(summary);
   const body=document.createElement('div');more.append(body);
   for(const button of [...actions.children])if(button.dataset.workoutAction!=='edit')body.append(button);
   const metric=card.querySelector('.history-session-heading>span');if(metric)body.prepend(metric);
   actions.append(more);
  }
 }
 window.LoadnoteHistoryClarityUI={layout,decorate};
})();
