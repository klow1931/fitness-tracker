(function(root){
 'use strict';
 function fieldName(exercise,index,field,unit){return (exercise||'Unnamed exercise')+' · Set '+index+' · '+({reps:'Repetitions',duration:'Hold duration in seconds',weight:'Load in '+(unit==='lb'?'pounds':'kilograms'),rpe:'RPE, 1 to 10',done:'Mark set done',remove:'Remove set'}[field]||field);}
 function decorateLogger(){
  const unit=typeof unitLabel==='function'?unitLabel():'kg';
  document.querySelectorAll('#exercise-rows > div').forEach((exercise,i)=>{
   const name=exercise.querySelector('.ex-name');name?.setAttribute('aria-label','Exercise '+(i+1)+' name');
   exercise.querySelector('.ex-note')?.setAttribute('aria-label','Exercise '+(i+1)+' personal notes and form cues');
   exercise.querySelectorAll('.sets-container > div').forEach((set,j)=>{
    for(const [field,selector] of Object.entries({reps:'.set-reps',duration:'.set-duration',weight:'.set-weight',rpe:'.set-rpe',done:'.set-done-check',remove:'[data-workout-action="remove-set"]'}))set.querySelector(selector)?.setAttribute('aria-label',fieldName(name?.value.trim(),j+1,field,unit));
    set.querySelectorAll('[data-quick-rpe]').forEach(button=>button.setAttribute('aria-label',fieldName(name?.value.trim(),j+1,'rpe',unit)+' · Finish at '+button.dataset.quickRpe));
   });
   for(const [selector,label,mode] of [['.cardio-duration','Cardio duration in minutes','decimal'],['.cardio-distance','Cardio distance','decimal'],['.cardio-distance-unit','Cardio distance unit',null],['.cardio-hr','Average heart rate in beats per minute','numeric']]){
    const input=exercise.querySelector(selector);if(input){input.setAttribute('aria-label','Exercise '+(i+1)+' · '+label);if(mode)input.inputMode=mode;}
   }
  });
 }
 function clearErrors(){document.querySelectorAll('#exercise-rows [aria-invalid="true"]').forEach(input=>{input.removeAttribute('aria-invalid');const ids=(input.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!=='logger-validation-error');if(ids.length)input.setAttribute('aria-describedby',ids.join(' '));else input.removeAttribute('aria-describedby');});const error=document.getElementById('logger-validation-error');if(error){error.textContent='';error.hidden=true;}}
 function reportError(input,message){
  clearErrors();const error=document.getElementById('logger-validation-error');if(error){error.hidden=false;error.textContent=message;}
  if(input){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',((input.getAttribute('aria-describedby')||'')+' logger-validation-error').trim());input.focus();}
  return false;
 }
 function syncTabs(){
  document.querySelectorAll('[role="tablist"]').forEach(list=>{
   list.querySelectorAll('.section-tab[data-sub]').forEach(button=>{
    const panel=button.closest('section[id^="panel-"]')?.id.slice(6);if(!panel)return;
    const sub=button.dataset.sub,target=[...document.querySelectorAll('.sub-panel')].find(node=>node.dataset.panel===panel&&node.dataset.sub===sub);if(!target)return;
    const selected=button.classList.contains('active');button.id=button.id||'section-tab-'+panel+'-'+sub;target.id=target.id||'section-panel-'+panel+'-'+sub;
    button.setAttribute('role','tab');button.setAttribute('aria-selected',String(selected));button.setAttribute('aria-controls',target.id);button.tabIndex=selected?0:-1;
    target.setAttribute('role','tabpanel');target.setAttribute('aria-labelledby',button.id);target.tabIndex=0;
   });
   // Secondary screens can be opened from More without selecting a primary tab.
   const tabs=[...list.querySelectorAll('[role="tab"]')];if(tabs.length&&!tabs.some(tab=>tab.tabIndex===0))tabs[0].tabIndex=0;
  });
 }
 function skip(event){event.preventDefault();const panel=[...document.querySelectorAll('section[id^="panel-"]')].find(node=>!node.classList.contains('hidden'));if(panel){panel.tabIndex=-1;panel.focus();panel.scrollIntoView({block:'start'});}}
 function init(){syncTabs();decorateLogger();document.addEventListener('keydown',event=>{
  const button=event.target.closest?.('[role="tablist"] [role="tab"]');if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return;
  const tabs=[...button.closest('[role="tablist"]').querySelectorAll('[role="tab"]')],index=tabs.indexOf(button),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  event.preventDefault();tabs[next].click();tabs[next].focus();
 });document.getElementById('exercise-rows')?.addEventListener('input',event=>{if(event.target.getAttribute('aria-invalid')==='true')clearErrors();});}
 const api={fieldName,decorateLogger,syncTabs,clearErrors,reportError,skip};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else {root.LoadnoteAccessibility=api;document.addEventListener('DOMContentLoaded',init,{once:true});}
})(typeof globalThis==='undefined'?this:globalThis);
