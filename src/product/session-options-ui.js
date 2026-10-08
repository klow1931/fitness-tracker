/* Constraint tools are handoffs, not silently equivalent prescriptions. */
(function(){
 function open(){
  const u=window.LoadnoteReviewedPlanningUI,d=u.dialog('session-options-dialog','Adjust your session','<p>Choose what changed. Preview exact targets in the existing review before approving anything.</p><div class="training-option-list"><button type="button" class="btn-secondary" data-session-option="adapt">Less time or a different session preference</button><button type="button" class="btn-secondary" data-session-option="edit">Equipment unavailable or change an exercise</button><button type="button" class="btn-secondary" data-session-option="calendar">Move or review a training day</button></div><details><summary>What stays protected?</summary><p>Completed workouts and frozen source plans are preserved. Replacements need fresh loads and targets; exercises in the same muscle group are not equivalent prescriptions. Open drafts and stale evidence can block approval.</p><p>These tools do not diagnose pain, provide medical clearance or choose rehabilitation exercises.</p></details>');
  if(!d)return;d.setAttribute('aria-label','Adjust your session');
  d.querySelectorAll('[data-session-option]').forEach(b=>b.onclick=()=>{const choice=b.dataset.sessionOption;d.close();if(choice==='adapt')window.LoadnoteAdaptiveSessionUI.open();else if(choice==='edit')window.LoadnoteProgramEditUI.open();else showTab('calendar');});
 }
 window.LoadnoteSessionOptionsUI={open};
})();
