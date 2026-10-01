/* v2.74 — one-tap RPE, completion, and exercise-aware next-set flow. */
(function(){
 'use strict';
 let focusedSet=null;
 const H=()=>window.LoadnoteLoggerQuickEntry;
 function snapshot(set){return {reps:set.querySelector('.set-reps')?.value||'',duration:set.querySelector('.set-duration')?.value||'',done:!!set.querySelector('.set-done-check')?.checked};}
 function ensureCheck(set){
  let check=set.querySelector('.set-done-check');if(check)return check;
  check=document.createElement('input');check.type='checkbox';check.className='set-done-check';check.setAttribute('aria-label','Mark set done');check.title='Mark set done';
  check.addEventListener('change',()=>{set.classList.toggle('set-row-done',check.checked);if(check.checked&&data.gymMode)startRest(90);});
  const number=set.querySelector('.set-number');number?.after(check);return check;
 }
 function bar(set){
  let host=set.querySelector('.quick-set-entry');if(host)return host;
  host=document.createElement('div');host.className='quick-set-entry';host.hidden=true;
  const chips=H().RPE_VALUES.map(v=>'<button type="button" class="quick-rpe-chip" data-quick-rpe="'+v+'">'+v+'</button>').join('');
  host.innerHTML='<span class="quick-set-label">Finish set · RPE</span><div class="quick-rpe-chips">'+chips+'</div><button type="button" class="quick-done-no-rpe" data-quick-done>Done without RPE</button>';
  set.appendChild(host);return host;
 }
 function setState(set,active){
  set.classList.toggle('logger-active-set',active);
  const host=bar(set);host.hidden=!(active&&H().entered(snapshot(set)));
 }
 function rows(){return [...document.querySelectorAll('#exercise-rows .sets-container > div')];}
 function activeSet(){
  const all=rows(),eligible=all.filter(s=>H().entered(snapshot(s))&&!s.querySelector('.set-done-check')?.checked);
  if(focusedSet?.isConnected&&!focusedSet.querySelector('.set-done-check')?.checked)return focusedSet;
  return eligible[0]||null;
 }
 function refresh(){
  if(!window.LoadnoteLoggerQuickEntry)return;const active=activeSet();
  for(const set of rows())setState(set,set===active);
 }
 function complete(set,rpe){
  const input=set.querySelector('.set-rpe');if(rpe!=null&&input){input.value=String(H().normalizeRpe(rpe));input.dispatchEvent(new Event('input',{bubbles:true}));}
  const check=ensureCheck(set);check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
  const all=rows(),index=all.indexOf(set);focusedSet=null;saveLoggerDraft();updateTrainingFlow();refresh();
  const model=all.map(row=>({done:!!row.querySelector('.set-done-check')?.checked})),nextIndex=window.LoadnoteGymFloor?.nextUnfinishedIndex(model,index)??-1,next=nextIndex>=0?all[nextIndex]:null;
  if(next){
    const transitioned=window.LoadnoteTrainingCockpitUI?.onSetComplete?.(set,next)||false;
    focusedSet=transitioned?null:next;refresh();
    if(!transitioned){
      next.scrollIntoView({block:'center',behavior:'smooth'});
      const weight=next.querySelector('.set-weight'),measure=next.querySelector('.set-reps,.set-duration'),rpeInput=next.querySelector('.set-rpe');
      const target=weight&&weight.value===''?weight:measure&&measure.value===''?measure:rpeInput||measure||weight;
      setTimeout(()=>{target?.focus({preventScroll:true});try{target?.select();}catch{}},120);
    }
  }
  window.refreshGymFloorUI?.();window.refreshTrainingCockpit?.();
 }
 document.addEventListener('focusin',event=>{
  const input=event.target.matches?.('.set-reps,.set-duration,.set-weight,.set-rpe')?event.target:null;
  const set=input?.closest?.('.sets-container > div');
  if(set){focusedSet=set;refresh();}
 });
 document.addEventListener('click',event=>{
  const chip=event.target.closest?.('[data-quick-rpe]');if(chip){const set=chip.closest('.sets-container > div');if(set)complete(set,chip.dataset.quickRpe);return;}
  const done=event.target.closest?.('[data-quick-done]');if(done){const set=done.closest('.sets-container > div');if(set)complete(set,null);}
 });
 window.refreshLoggerQuickEntry=refresh;
 window.completeLoggerSetQuickly=complete;
})();
