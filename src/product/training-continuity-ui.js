/* v2.51 — show continuity after save and on Home without changing the plan automatically. */
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
   const adaptation=report.next?window.LoadnoteAdaptationExplanation?.forSession(state,report.next.id):null;
   section.innerHTML='<h3>What Loadnote learned</h3><p>'+esc(evidenceLine(e))+'</p>'+reason+'<h3>What comes next</h3><p>'+esc(nextLine(report.next))+'</p>'+overdue+(window.LoadnoteAdaptationExplanationUI?.render(adaptation,{summary:'Why the next workout changed'})||'')+'<p class="more-hint">'+esc(report.notice)+'</p>';
   host.appendChild(section);
   window.LoadnoteProgramLifecycleUI?.recap?.(host,state,asOf);
 }
 window.LoadnoteTrainingContinuityUI={evidenceLine,nextLine,home,renderRecap};
})();
