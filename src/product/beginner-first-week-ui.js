/* v3.94 — render an unobtrusive first-week handoff within existing Today. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(host,state,{asOf,report,continuity}={}){
  if(!host||!window.LoadnoteBeginnerFirstWeek)return;
  let entry=null;try{entry=window.LoadnoteBeginnerUI?.entry?.()||null;}catch{}
  const result=window.LoadnoteBeginnerFirstWeek.inspect(state,{asOf,entry,todayReport:report,continuity});
  host.querySelector('#beginner-first-week')?.remove();
  if(!result)return;
  const section=document.createElement('section');section.id='beginner-first-week';
  section.className='beginner-first-week';section.setAttribute('aria-label','Your first week');
  section.innerHTML='<p class="more-hint"><b>Your first week</b> · '+result.count+' saved workout'+(result.count===1?'':'s')+'</p>'+
   '<h3>'+esc(result.title)+'</h3><p>'+esc(result.detail)+'</p>'+
   '<button type="button" class="btn-secondary" data-first-week-action>'+esc(result.label)+'</button>';
  section.querySelector('[data-first-week-action]').addEventListener('click',()=>{
   switch(result.action){
    case 'resume':
      host.querySelector('[data-today-resume]')?.click();break;
    case 'today':
      // Pass through the existing session action, including any lifecycle gate.
      (host.querySelector('[data-today-lifecycle]')||host.querySelector('[data-today-train]'))?.click();break;
    case 'calendar':
      window.showTab?.('calendar');break;
    case 'history':
      window.showTab?.('workouts');window.showSubTab?.('workouts','wo-history');break;
    default:
      (host.querySelector('[data-today-resume]')||window.openFastStartLogger)&&
       (host.querySelector('[data-today-resume]')?.click()||(!host.querySelector('[data-today-resume]')&&window.openFastStartLogger?.({compact:true})));
   }
  });
  host.append(section);
 }
 window.LoadnoteBeginnerFirstWeekUI={render};
})();
