/* Home displays one existing goal, using the same progress engine as Progress/Coach. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function label(g){return g.type==='workout-count'?g.targetSessions+' logged workouts':g.exercise+' · estimated 1RM';}
 function render(){
  const host=document.getElementById('simple-home-goal');if(!host)return;host.hidden=!document.body.classList.contains('loadnote-simple-view');if(host.hidden)return;
  const prefs=LoadnoteUIFlow.read(localStorage),report=LoadnoteUIFlow.homeGoal(data,prefs.goalId,today()),selected=report.selected;
  host.innerHTML='<h2>Your goal</h2>'+(selected?'<h3 class="home-goal-name">'+esc(label(selected.goal))+'</h3><details class="home-goal-choice"><summary>Change goal on Home</summary><label class="home-goal-picker">Goal on Home<select class="input" data-home-goal-picker>'+report.goals.map(r=>'<option value="'+esc(r.goal.id)+'">'+esc(label(r.goal))+'</option>').join('')+'</select></label></details>':'<p>Choose a strength target or a workout-count goal to see your start and finish here.</p>');
  if(selected){
   const {goal:g,progress:r}=selected,value=v=>r.kind==='sessions'?v+' workout'+(v===1?'':'s'):v===null?'Not recorded':toDisplay(v)+' '+unitLabel();
   host.insertAdjacentHTML('beforeend','<div class="home-goal-values"><div><span>Start</span><b>'+esc(value(r.start))+'</b></div><div><span>Now</span><b>'+esc(value(r.current))+'</b></div><div><span>Finish</span><b>'+esc(value(r.target))+'</b></div></div>'+(r.percent===null?'<p class="more-hint">This older goal has no captured starting strength; no percentage is invented.</p>':'<progress max="100" value="'+r.percent+'" aria-label="'+esc(label(g))+' progress"></progress><p>'+r.percent+'% of the start-to-finish distance</p>')+'<p class="more-hint">'+(r.kind==='strength'?'Estimated strength, not a tested maximum. Attendance alone does not increase this value.':'Saved workout sessions count once; drafts and future dates do not count.')+'</p>');
   const picker=host.querySelector('[data-home-goal-picker]');picker.value=String(g.id);picker.onchange=()=>{let saved=true;try{LoadnoteUIFlow.write(localStorage,{goalId:picker.value});}catch{saved=false;showToast('Could not save your Home goal preference. Nothing changed.','error');}render();const choice=host.querySelector('.home-goal-choice');if(!saved&&choice)choice.open=true;(saved?choice?.querySelector('summary'):host.querySelector('[data-home-goal-picker]'))?.focus({preventScroll:true});};
  }
  host.insertAdjacentHTML('beforeend','<button type="button" class="btn-secondary" data-home-goals>'+(selected?'Manage goals':'Set a goal')+'</button>');
  host.querySelector('[data-home-goals]').onclick=()=>{showTab('coach');showSubTab('coach','co-goals');document.getElementById('goal-type')?.focus();};
 }
 window.LoadnoteHomeGoalUI={render};
})();
