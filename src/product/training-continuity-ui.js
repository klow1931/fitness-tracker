/* v2.71 — post-workout continuity plus adaptive handoff transparency. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function evidenceLine(e){
   if(!e)return '';
   if(!e.linked)return 'Free training was added to history. Because it was not linked to a scheduled prescription, Loadnote will not treat it as exact planned-versus-performed evidence.';
   const c=e.comparison;
   if(!c)return 'This session is linked to Calendar, but there is no comparable planned-work snapshot to score.';
   const rpe=e.actualStrengthSets?e.rpeSets+'/'+e.actualStrengthSets+' logged strength sets include RPE':'No valid strength sets were logged';
   if(e.partial)return 'Partial session preserved: '+c.completedSets+'/'+c.plannedSets+' planned sets represented · '+rpe+'. Loadnote keeps the actual work instead of assuming the rest was completed.';
   if(e.modifiedComplete)return 'Scheduled session logged: '+c.completedSets+'/'+c.plannedSets+' planned sets represented · '+rpe+'. Some load/reps differed from the captured plan, and those differences remain part of the evidence.';
   return 'Scheduled session logged: '+c.completedSets+'/'+c.plannedSets+' planned sets represented · '+rpe+'. This linked session is now available to future weekly and phase reviews.';
 }
 function nextLine(next){
   if(!next)return 'No later scheduled workout is currently waiting.';
   return 'Next: '+next.date+' · '+next.name+' · '+next.exerciseCount+' exercise'+(next.exerciseCount===1?'':'s')+' · '+next.setCount+' planned set'+(next.setCount===1?'':'s')+(next.rescheduled?' · rescheduled from '+next.originalDate:'')+'.';
 }
 function home(report){
   if(!report)return '';
   const overdue=report.unresolvedOverdue.length?'<p class="training-continuity-warning"><b>'+report.unresolvedOverdue.length+' earlier scheduled session'+(report.unresolvedOverdue.length===1?' needs':'s need')+' review.</b> Loadnote will not assume '+(report.unresolvedOverdue.length===1?'it was':'they were')+' skipped.</p>':'';
   const next=report.next?'<p class="training-continuity-next"><b>Next scheduled:</b> '+esc(report.next.date)+' · '+esc(report.next.name)+(report.next.rescheduled?' · rescheduled from '+esc(report.next.originalDate):'')+'</p>':'';
   return overdue+next;
 }
 function renderRecap(workout,state,{editing=false,asOf}={}){
   const host=document.getElementById('workout-recap');if(!host||editing||!workout||!window.LoadnoteTrainingContinuity)return;
   host.querySelector('.training-continuity-recap')?.remove();
   const report=window.LoadnoteTrainingContinuity.inspect(state,{asOf,workoutId:workout.id}),e=report.workoutEvidence;
   const section=document.createElement('section');section.className='training-continuity-recap';
   const reason=e?.linked&&e?.deviationReason!=='none'?'<p><b>Session change recorded:</b> '+esc(e.deviationLabel)+(e.deviationNotes?' · '+esc(e.deviationNotes):'')+'</p>':'';
   const overdue=report.unresolvedOverdue.length?'<p class="training-continuity-warning"><b>'+report.unresolvedOverdue.length+' earlier scheduled session'+(report.unresolvedOverdue.length===1?' is':'s are')+' unresolved.</b> Resolve '+(report.unresolvedOverdue.length===1?'it':'them')+' in Calendar before relying on week-level adherence/review.</p>':'';
   let handoff=null;
   try{handoff=window.LoadnoteAdaptiveHandoff?.inspect?.(state,{asOf,workoutId:workout.id})||null;}catch{}
   const handoffHtml=window.LoadnoteAdaptiveHandoffUI?.render?.(handoff)||'';
   const compact=e?.comparison?(e.partial?'Partial workout saved':'Workout saved')+' · '+e.comparison.completedSets+'/'+e.comparison.plannedSets+' planned sets represented.':e?.linked?'Workout saved · linked to Calendar.':'Workout saved · free training.';
   section.innerHTML='<h3>Session result</h3><p class="session-result-summary"'+(e?.partial?' role="status"':'')+'>'+esc(compact)+'</p>'+reason+overdue+'<details class="session-result-evidence"><summary>Plan comparison</summary><p>'+esc(evidenceLine(e))+'</p></details>'+handoffHtml;
   host.appendChild(section);
   if(handoffHtml)host.querySelector('.recap-dismiss')?.remove();
   window.LoadnoteAdaptiveHandoffUI?.bind?.(section,handoff,state);
   const lifecycleKind=handoff?.lifecycle?.nextAction?.kind;
   if(!handoff||['resolve-overdue','record-event','save-transition','review-next-program','review-handoff'].includes(lifecycleKind))window.LoadnoteProgramLifecycleUI?.recap?.(host,state,asOf);
 } window.LoadnoteTrainingContinuityUI={evidenceLine,nextLine,home,renderRecap};
})();
