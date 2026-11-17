/* Small Home summary; Today keeps the existing guarded workout/draft handoff. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const host=document.getElementById('simple-home-summary');if(!host)return;
  host.hidden=!document.body.classList.contains('loadnote-simple-view');if(host.hidden){window.LoadnoteHomeGoalUI?.render?.();return;}
  let report;try{report=LoadnoteSimpleHome.inspect(data,{asOf:today()});}catch{
   host.innerHTML='<h2>Your training</h2><p>Your summary could not be loaded. Open Train to continue, or History to review saved workouts.</p><button type="button" class="btn-primary" data-simple-train>Open Train</button><button type="button" class="btn-secondary" data-simple-history>Open history</button>';
   bind(host);return;
  }
  const last=report.latest,format=day=>typeof formatDate==='function'?formatDate(day):day;
  host.innerHTML='<div class="simple-home-heading"><div><p class="eyebrow">Your recent training</p><h2>Last 7 days</h2></div><div class="simple-home-count"><strong>'+report.sessions+'</strong><span>workout'+(report.sessions===1?'':'s')+' in the last 7 days</span></div></div>'+
   (last?'<div class="simple-home-latest"><h3>Last saved workout</h3><p>'+esc(format(last.date))+'</p><p>'+last.names.map(esc).join(' · ')+(last.exerciseCount>last.names.length?' · '+(last.exerciseCount-last.names.length)+' more':'')+'</p><button type="button" class="btn-secondary" data-simple-history>Recent workout history</button></div>':'<div class="simple-home-latest"><p>Your saved workouts will appear here. Start with today’s training action above.</p></div>')+
   '<div class="simple-home-links"><button type="button" class="btn-secondary" data-simple-progress>View progress</button><button type="button" class="btn-secondary" data-simple-calendar>Training calendar</button></div>'+
   '<details class="simple-home-method"><summary>Summary details</summary><p class="more-hint">Saved sessions dated '+esc(format(report.from))+'–'+esc(format(report.to))+'. Open Full Home for detailed reports and tools.</p></details>';
  bind(host);window.LoadnoteHomeGoalUI?.render?.();
 }
 function bind(host){
  host.querySelector('[data-simple-train]')?.addEventListener('click',()=>window.openFastStartLogger?.({compact:true}));
  host.querySelector('[data-simple-history]')?.addEventListener('click',()=>{showTab('workouts');showSubTab('workouts','wo-history');});
  host.querySelector('[data-simple-progress]')?.addEventListener('click',()=>showTab('prs'));
  host.querySelector('[data-simple-calendar]')?.addEventListener('click',()=>showTab('calendar'));
 }
 window.LoadnoteSimpleHomeUI={render};
})();
