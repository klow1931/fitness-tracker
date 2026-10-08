(function(){
 'use strict';function open(selection={}){
  const u=LoadnoteReviewedPlanningUI,r=LoadnoteWorkoutBrief.review(data,{asOf:today(),question:selection.question||'Explain my next workout',sessionId:selection.sessionId}),d=u.dialog('workout-brief-dialog','Your next workout','<div id="workout-brief-report"></div>');if(!d)return;
  d.querySelector('h2').id='workout-brief-heading';d.setAttribute('aria-labelledby','workout-brief-heading');const host=d.querySelector('#workout-brief-report');
  if(r.status!=='ready'){host.innerHTML='<p>'+u.esc(LoadnoteWorkoutBrief.summary(r))+'</p>'+(r.candidates||[]).map(s=>'<p>'+u.esc(s.date+' · '+s.name)+'</p>').join('')+'<button class="btn-secondary" type="button" data-workout-calendar>Open Calendar</button>';}
  else host.innerHTML='<p class="eyebrow">'+u.esc(r.session.date+(r.progress?' · '+r.progress.phaseLabel:''))+'</p><h3>'+u.esc(r.session.name)+'</h3><p>'+u.esc(r.purpose)+'</p><p><b>Focus:</b> '+u.esc(r.focus)+'</p>'+(r.progress?'<p>Week '+r.progress.week+' of '+r.progress.totalWeeks+(r.program?' · '+u.esc(r.program.name):'')+'</p>':'')+(r.event?'<p>'+u.esc((r.event.type==='competition'?'Competition':'Mock meet')+' · '+r.event.date)+'</p>':'')+'<details><summary>Targets &amp; evidence</summary>'+r.targets.map(e=>'<p>'+u.esc(LoadnoteWorkoutBrief.describe(e,currentUnit()))+'</p>').join('')+'<p>'+u.esc('Calendar revision: '+r.session.revisionAt)+'</p>'+(r.recordedReason?'<p>'+u.esc('Saved reason: '+r.recordedReason)+'</p>':'')+r.reasons.map(g=>'<p>'+u.esc(g)+'</p>').join('')+'<p>'+u.esc(r.notice)+'</p></details><button class="btn-secondary" type="button" data-workout-calendar>Open Calendar</button>';
  host.querySelector('[data-workout-calendar]').onclick=()=>{d.close();showTab('calendar');};
 }
 window.LoadnoteWorkoutBriefUI={open};
})();
