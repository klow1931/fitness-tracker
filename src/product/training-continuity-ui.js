/* v2.70 — post-workout continuity with clear next actions. */
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
   const comparison=e?.comparison;
   const execution=comparison?'<p class="training-continuity-execution"><b>Plan vs actual:</b> '+comparison.completedSets+'/'+comparison.plannedSets+' planned sets represented · '+comparison.exactRate+'% matched the captured load/reps exactly · RPE logged on '+e.rpeSets+'/'+e.actualStrengthSets+' strength sets.</p>':'';
   let nextProgram=null;
   if(report.next&&window.LoadnoteProgramLifecycle){try{nextProgram=LoadnoteProgramLifecycle.programs(state).find(p=>report.next.id.startsWith(p.prefix))||null;}catch{}}
   const nextAction=report.next?'<button type="button" class="btn-secondary" data-continuity-next>View next workout</button>':'';
   section.innerHTML='<h3>Session result</h3><p>'+esc(evidenceLine(e))+'</p>'+execution+reason+'<h3>What comes next</h3><p>'+esc(nextLine(report.next))+'</p>'+overdue+(window.LoadnoteAdaptationExplanationUI?.render(adaptation,{summary:'Why the next workout changed'})||'')+'<div class="training-continuity-actions"><button type="button" class="btn-primary" data-continuity-done>Done</button>'+nextAction+'</div><p class="more-hint">'+esc(report.notice)+'</p>';
   host.appendChild(section);
   section.querySelector('[data-continuity-done]')?.addEventListener('click',()=>showTab('dashboard'));
   section.querySelector('[data-continuity-next]')?.addEventListener('click',()=>{
     if(nextProgram&&window.LoadnoteProgramWorkoutViewerUI?.open){window.LoadnoteProgramWorkoutViewerUI.open(nextProgram.id,report.next.id);return;}
     showTab('calendar');setTimeout(()=>{if(typeof selectCalDay==='function')selectCalDay(report.next.date);},30);
   });
   window.LoadnoteProgramLifecycleUI?.recap?.(host,state,asOf);
 }
 window.LoadnoteTrainingContinuityUI={evidenceLine,nextLine,home,renderRecap};
})();
