/* v2.49 — one-tap RPE + completion and automatic next-set focus. */
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
  const host=bar(set);host.hidden=!active;
 }
 function rows(){return [...document.querySelectorAll('#exercise-rows .sets-container > div')];}
 function activeSet(){
  const all=rows(),eligible=all.filter(s=>H().entered(snapshot(s))&&!s.querySelector('.set-done-check')?.checked);
  if(focusedSet?.isConnected&&eligible.includes(focusedSet))return focusedSet;
  return eligible[0]||null;
 }
 function refresh(){
  if(!window.LoadnoteLoggerQuickEntry)return;const active=activeSet();
  for(const set of rows())setState(set,set===active);
 }
 function complete(set,rpe){
  const input=set.querySelector('.set-rpe');if(rpe!=null&&input){input.value=String(H().normalizeRpe(rpe));input.dispatchEvent(new Event('input',{bubbles:true}));}
  const check=ensureCheck(set);check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
  focusedSet=null;saveLoggerDraft();updateTrainingFlow();refresh();
  const next=activeSet();if(next){next.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(()=>next.querySelector('.set-rpe')?.focus({preventScroll:true}),120);}
 }
 document.addEventListener('focusin',event=>{const set=event.target.closest?.('.sets-container > div');if(set){focusedSet=set;refresh();}});
 document.addEventListener('click',event=>{
  const chip=event.target.closest?.('[data-quick-rpe]');if(chip){const set=chip.closest('.sets-container > div');if(set)complete(set,chip.dataset.quickRpe);return;}
  const done=event.target.closest?.('[data-quick-done]');if(done){const set=done.closest('.sets-container > div');if(set)complete(set,null);}
 });
 window.refreshLoggerQuickEntry=refresh;
 window.completeLoggerSetQuickly=complete;
})();
