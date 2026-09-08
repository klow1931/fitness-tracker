/* Session review and editing. Draft identity is separate from saved history. */
let workoutEdit=null;
let reviewedSession=null;
function refreshSessionMode(){
  const banner=document.getElementById('workout-edit-banner');
  if(banner)banner.hidden=!workoutEdit;
  const title=document.getElementById('workout-mode-title');
  if(title)title.textContent=workoutEdit?'Editing saved workout':'Your workout';
}
function resetSessionEdit(){workoutEdit=null;reviewedSession=null;refreshSessionMode();}
function cancelWorkoutEdit(){
  if(window.loggerSaving)return;
  if(!confirm('Discard this edit? The saved workout will stay unchanged.'))return;
  clearWorkoutForm(true);saveLoggerDraft();showSubTab('workouts','wo-history');
}
function editWorkout(id){
  if(window.loggerSaving)return;
  const original=data.workouts.find(w=>String(w.id)===String(id));
  if(!original)return showToast('Workout not found.','error');
  if(fillWorkoutForm(original.exercises,original.notes,true)===false)return;
  workoutEdit={id:original.id,original:JSON.parse(JSON.stringify(original))};
  pendingProgramSession=null;
  document.getElementById('wo-date').value=original.date;
  showTab('workouts');showSubTab('workouts','wo-log');refreshSessionMode();saveLoggerDraft();
  document.getElementById('workout-mode-title').scrollIntoView({block:'start'});
}
function reviewWorkout(){
  if(window.loggerSaving || !validateWorkoutForm())return;
  const draft=captureLoggerDraft();
  if(!draft.date)return showToast('Please select a date','error');
  const workout=LoadnoteSession.fromDraft(draft,workoutEdit?.id || window.LoadnoteCore.createId());
  if(!workout.exercises.length)return showToast('Add at least one strength set or cardio entry','error');
  reviewedSession={draft:JSON.stringify(draft),workout,edit:workoutEdit?JSON.parse(JSON.stringify(workoutEdit)):null,program:pendingProgramSession?JSON.parse(JSON.stringify(pendingProgramSession)):null};
  const content=document.getElementById('workout-review-content');content.replaceChildren();
  const add=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;content.appendChild(el);return el;};
  document.getElementById('workout-review-title').textContent=workoutEdit?'Review workout changes':'Review your workout';
  add('p',formatDate(workout.date));
  if(workoutEdit)add('p','This replaces the saved session. It will not add another workout.');
  const count=workout.exercises.reduce((n,e)=>n+(e.sets?.length || 0),0);
  add('p',`${workout.exercises.length} exercises · ${count} strength sets · ${Math.round(toDisplay(calcVolume(workout)))} ${unitLabel()} rep volume`);
  for(const exercise of workout.exercises){
    add('h3',exercise.name);
    if(exercise.type==='cardio')add('p',`${exercise.duration} min · ${exercise.distance} ${exercise.distanceUnit}${exercise.avgHr?' · HR '+exercise.avgHr:''}`);
    else add('p',exercise.sets.map((s,i)=>`${i+1}. ${formatStrengthSet(s)}`).join(' / '));
  }
  if(workout.notes)add('p','Notes: '+workout.notes);
  const unchecked=draft.rows.reduce((n,r)=>n+(r.sets || []).filter(s=>Number(s.reps || s.duration)>0 && !s.done).length,0);
  add('p',unchecked?`${unchecked} entered sets are unchecked. They are included in this review and will be saved.`:'All entered sets shown above will be saved.');
  const button=document.getElementById('confirm-workout-save');button.textContent=workoutEdit?'Save changes':'Save workout';button.disabled=false;
  const dialog=document.getElementById('workout-review');if(!dialog.open)dialog.showModal();
}
function closeWorkoutReview(){if(!window.loggerSaving){document.getElementById('workout-review').close();reviewedSession=null;}}
function lockSessionSaving(locked){
  window.loggerSaving=locked;
  document.getElementById('confirm-workout-save').disabled=locked;
  document.getElementById('back-to-workout').disabled=locked;
}
async function commitReviewedWorkout(){
  if(window.loggerSaving || !reviewedSession)return;
  // Timestamps are excluded: opening review itself does not change the draft.
  const stable=d=>{const value=typeof d==='string'?JSON.parse(d):d;delete value.updatedAt;return JSON.stringify(value);};
  if(stable(captureLoggerDraft())!==stable(reviewedSession.draft)){
    reviewWorkout();showToast('The workout changed. Please review the updated details.','info');return;
  }
  let next;
  try{
    next=LoadnoteSession.apply(data,reviewedSession.workout,reviewedSession.edit,reviewedSession.program,estimated1RM,()=>window.LoadnoteCore.createId());
    next.exerciseNotes=next.exerciseNotes || {};
    for(const row of JSON.parse(reviewedSession.draft).rows)if(row.type!=='cardio' && row.name.trim() && row.note.trim())next.exerciseNotes[row.name.trim()]=row.note.trim();
  }catch(error){showToast(error.message,'error');return;}
  lockSessionSaving(true);
  try{clearTimeout(saveTimer);await persistNow(next);}
  catch(error){lockSessionSaving(false);showToast('Could not save. Your draft and saved workout are unchanged.','error');return;}
  const editing=!!reviewedSession.edit;data=next;
  lockSessionSaving(false);closeWorkoutReview();clearWorkoutForm(true);saveLoggerDraft();
  renderWorkoutHistory();updateBackupBanner();
  if(editing)showSubTab('workouts','wo-history');
  showToast(editing?'Workout updated':'Workout saved','success');
}
function updateSessionComparisons(){
  const date=document.getElementById('wo-date')?.value;if(!date)return;
  for(const row of document.querySelectorAll('#exercise-rows > div')){
    const name=row.querySelector('.ex-name')?.value.trim();
    const last=name?LoadnoteSession.previous(data.workouts,name,date,workoutEdit?.id,row.dataset.type,row.dataset.trackBy):null;
    let panel=row.querySelector('.previous-performance');
    if(!panel){panel=document.createElement('div');panel.className='previous-performance';row.appendChild(panel);}
    const inputs=[...row.querySelectorAll('.sets-container > div')].map(s=>({reps:s.querySelector('.set-reps')?.value,duration:s.querySelector('.set-duration')?.value,weight:s.querySelector('.set-weight')?.value,rpe:s.querySelector('.set-rpe')?.value}));
    const signature=JSON.stringify({last,name,inputs,unit:currentUnit(),edit:workoutEdit?.id});if(panel._signature===signature)continue;panel._signature=signature;panel.replaceChildren();
    if(!name)continue;
    const heading=document.createElement('p');heading.textContent=last?'Previous session · '+formatDate(last.date):'No previous session for this exercise and tracking mode.';panel.appendChild(heading);
    if(!last)continue;
    if(row.dataset.type==='cardio'){const p=document.createElement('p');const e=last.exercise;p.textContent=`${e.duration || 0} min · ${e.distance || 0} ${e.distanceUnit || 'km'}`;panel.appendChild(p);continue;}
    const table=document.createElement('table');const header=table.createTHead().insertRow();
    for(const label of ['Set','Previous',workoutEdit?'This session':'Today']){const th=document.createElement('th');th.scope='col';th.textContent=label;header.appendChild(th);}
    const body=table.createTBody();
    for(let i=0;i<Math.max(inputs.length,last.exercise.sets.length);i++){
      const s=inputs[i],tr=body.insertRow();const current=s && (s.reps || s.duration)?formatStrengthSet({...s,weight:toStorage(Number(s.weight)||0)}):'—';
      for(const value of [i+1,last.exercise.sets[i]?formatStrengthSet(last.exercise.sets[i]):'—',current])tr.insertCell().textContent=String(value);
    }
    panel.appendChild(table);
  }
}
