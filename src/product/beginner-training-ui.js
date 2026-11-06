/* v7.1 — early-session presentation. No workout or programming mutations. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function history(){showTab('workouts');showSubTab('workouts','wo-history');}
 function progress(report){
  const early=window.LoadnoteBeginnerUI?.early?.();if(!early?.guided)return null;
  const milestones=report.summary?.milestones||[];
  const html='<div class="progress-story-head"><div><p class="eyebrow">YOUR PROGRESS</p><h2>Your training is taking shape.</h2><p>'+early.weekCount+' workout'+(early.weekCount===1?'':'s')+' saved in the last 7 days.</p></div></div>'+
   '<p>'+(early.workouts.length?'Keep logging your workouts. Strength trends appear as comparable sessions build up.':'Your first saved workout will appear here.')+'</p>'+
   '<div class="beginner-progress-list">'+early.recent.map(w=>'<article><b>'+esc(formatDate(w.date))+'</b><p>'+w.exercises.map(e=>esc(e.name)).join(' · ')+'</p></article>').join('')+'</div>'+
   (milestones.length?'<details><summary>Recent milestones</summary>'+milestones.map(m=>'<p>'+esc(m.headline)+'</p>').join('')+'</details>':'')+
   '<div class="beginner-progress-actions"><button type="button" class="btn-primary" data-beginner-progress-log>Go to Train</button><button type="button" class="btn-secondary" data-beginner-progress-history>Workout history</button></div>';
  return {html,bind:host=>{host.querySelector('[data-beginner-progress-log]').onclick=()=>showTab('workouts');host.querySelector('[data-beginner-progress-history]').onclick=history;}};
 }
 function coach(){
  const guided=!!window.LoadnoteBeginnerUI?.refreshPresentation?.();
  for(const [sub,id] of [['co-programs','beginner-coach-plan'],['co-today','beginner-coach-today']]){
   const parent=document.querySelector('[data-panel="coach"][data-sub="'+sub+'"]');if(!parent)continue;
   let host=document.getElementById(id);
   if(!guided){host?.remove();document.body.classList.remove('beginner-coach-expanded');continue;}
   if(!host){host=document.createElement('section');host.id=id;host.className='card';parent.prepend(host);}
   let plans=[];try{plans=LoadnoteBeginnerProgram.saved(data,LoadnoteBeginnerProgramUI.dateOptions());}catch{}
   const expanded=document.body.classList.contains('beginner-coach-expanded');
   host.innerHTML='<p class="eyebrow">YOUR TRAINING</p><h2>'+(plans.length?'Your saved training plan':'Start with one workout')+'</h2><p>'+
    (plans.length?plans.map(p=>esc(p.config.name)).join(' · '):'Log exercises you know, or create a simple first plan. No max or account is required.')+'</p>'+
    '<div class="beginner-progress-actions"><button type="button" class="btn-primary" data-beginner-coach-train>Go to Train</button><button type="button" class="btn-secondary" data-beginner-coach-plan>'+(plans.length?'Review saved plan':'Create my first plan')+'</button><button type="button" class="btn-secondary" data-beginner-coach-ask>Ask Coach</button></div>'+
    '<button type="button" class="btn-secondary" data-beginner-coach-tools aria-expanded="'+expanded+'">'+(expanded?'Hide training tools':'More training tools')+'</button>';
   host.querySelector('[data-beginner-coach-train]').onclick=()=>showTab('workouts');
   host.querySelector('[data-beginner-coach-plan]').onclick=()=>plans.length?LoadnoteBeginnerProgramUI.openSaved():LoadnoteBeginnerProgramUI.open();
   host.querySelector('[data-beginner-coach-ask]').onclick=()=>showSubTab('coach','co-chat');
   host.querySelector('[data-beginner-coach-tools]').onclick=()=>{document.body.classList.toggle('beginner-coach-expanded');coach();};
  }
 }
 window.LoadnoteBeginnerTrainingUI={progress,coach};
 window.renderBeginnerCoach=coach;
})();
