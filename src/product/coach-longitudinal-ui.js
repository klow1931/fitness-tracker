/* Phase 5 — compact, read-only long-term coaching view under Decisions. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteLongitudinalCoachUI=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function markup(report){
  if(!report)return '';
  const program=report.program,patterns=report.learning?.patterns||[],repeated=patterns.filter(p=>p.observed>=3);
  const phase=program?'Week '+(program.week||'?')+' of '+(program.totalWeeks||'?')+(program.phase?' · '+program.phase:''):'No confirmed current program';
  const step=report.nextAction?report.nextAction.label+' — '+report.nextAction.detail:'Review saved plans to resolve the next action';
  const session=report.nextSession?'<p><b>Next scheduled:</b> '+esc(report.nextSession.date+' · '+report.nextSession.name)+'</p>':'';
  const setup=report.setup.status==='confirmed'?'Saved athlete preferences dated '+report.setup.recordedAt.slice(0,10)+'.':'Training preferences have not been confirmed.';
  const follow=report.learning?report.learning.observed+' of '+report.learning.recorded+' approved changes have exact follow-up; '+repeated.length+' lift/action groups have 3+ comparable observations.':'Historical outcomes need validation.';
  const links=report.nextAction&&['review-phase','review-week','resolve-overdue','review-next-program','review-handoff','save-transition','review-custom','review-sport','review-hypertrophy'].includes(report.nextAction.kind)?
   '<button class="btn-secondary" type="button" data-longitudinal-review>Open next review</button>':'';
  return '<details class="more-details longitudinal-coach" id="phase5-coaching"><summary>Long-term coaching · '+esc(phase)+'</summary>'+
   '<p>'+esc(program?.name||'Loadnote')+' · '+esc(phase)+'</p>'+
   '<p><b>Next:</b> '+esc(step)+'</p>'+session+
   (report.handoff?'<p><b>Last linked session:</b> '+esc(report.handoff.label)+'. '+esc(report.handoff.reason)+'</p>':'')+
   '<p><b>Past adjustments:</b> '+esc(follow)+'</p><p><b>Coaching context:</b> '+esc(setup)+'</p>'+
   (report.unavailable?.length?'<p role="status">'+esc(report.unavailable.join(' '))+'</p>':'')+
   '<p class="more-hint">'+esc(report.notice)+'</p>'+links+'</details>';
 }
 function render(host,state,asOf){
  if(!host||!globalThis.LoadnoteLongitudinalCoach)return;
  host.querySelector('#phase5-coaching')?.remove();
  let report=null;
  try{report=globalThis.LoadnoteLongitudinalCoach.inspect(state,{asOf});}catch{return;}
  const section=document.createElement('div');section.innerHTML=markup(report);const details=section.firstElementChild;
  if(!details)return;
  host.append(details);
  details.querySelector('[data-longitudinal-review]')?.addEventListener('click',()=>{
   const current=globalThis.LoadnoteProgramLifecycleUI?.currentReport?.();
   if(current?.nextAction&&['review-phase','review-week','resolve-overdue','review-next-program','review-handoff','save-transition','review-custom','review-sport','review-hypertrophy'].includes(current.nextAction.kind))
    globalThis.LoadnoteProgramLifecycleUI.route(current);
  });
 }
 return {markup,render};
});
