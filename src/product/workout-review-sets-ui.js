/* Scannable review and navigation to the existing logger nodes; never writes training data. */
(function(){
 'use strict';
 function edit(rowIndex){
  if(window.loggerSaving)return;
  const row=document.querySelectorAll('#exercise-rows > div')[rowIndex];if(!row)return;
  closeWorkoutReview();
  window.LoadnoteTrainingExecutionUI?.openOptions?.();
  expandedTrainingRows.add(row);updateTrainingFlow();
  requestAnimationFrame(()=>{
   const input=row.querySelector('.set-weight,.cardio-duration')||row.querySelector('.ex-name');
   row.scrollIntoView({block:'start'});input?.focus({preventScroll:true});
  });
 }
 function render(host,draft){
  const report=LoadnoteWorkoutReviewSets.inspect(draft);
  const add=(parent,tag,text)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
  if(report.missingRpe||report.excluded){
   const notice=add(host,'section','');notice.className='review-recording-notice';notice.setAttribute('aria-label','Recording notes');
   if(report.missingRpe)add(notice,'p',report.missingRpe+' included strength set'+(report.missingRpe===1?' has':'s have')+' no recorded RPE. You can save without it; effort-based comparisons will have less evidence.');
   if(report.excluded)add(notice,'p',report.excluded+' unchecked target'+(report.excluded===1?' is':'s are')+' excluded. Only completed work from this prescribed workout will be saved.');
  }
  for(const {rowIndex,exercise,setNumbers} of report.exercises){
   const section=add(host,'section','');section.className='review-exercise';
   const head=add(section,'div','');head.className='review-exercise-head';add(head,'h3',exercise.name);
   const button=add(head,'button','Edit exercise');button.type='button';button.className='btn-secondary';button.setAttribute('aria-label','Edit '+exercise.name+' exercise '+(rowIndex+1));button.onclick=()=>edit(rowIndex);
   if(exercise.type==='cardio'){add(section,'p',`${exercise.duration} min · ${exercise.distance} ${exercise.distanceUnit}${exercise.avgHr?' · HR '+exercise.avgHr:''}`);continue;}
   const list=add(section,'ol','');list.className='review-set-list';list.setAttribute('aria-label',exercise.name+' included sets');
   exercise.sets.forEach((set,index)=>{
    const item=add(list,'li','');add(item,'span','Set '+setNumbers[index]);add(item,'strong',formatStrengthSet(set));
    if(set.rpe==null)add(item,'span','RPE not recorded').className='review-rpe-missing';
   });
  }
 }
 window.LoadnoteWorkoutReviewSetsUI={render};
})();
