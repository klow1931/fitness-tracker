/* Athlete-entered session purpose and immutable planned-work snapshots. */
let pendingPrescription=null;
function sessionIntentValue(id){return document.getElementById(id)?.value||'';}
function readSessionIntentDraft(){
  return {role:sessionIntentValue('session-role')||'unspecified',goal:sessionIntentValue('session-goal'),deviationReason:sessionIntentValue('session-deviation-reason')||'none',deviationNotes:sessionIntentValue('session-deviation-notes'),prescription:pendingPrescription?JSON.parse(JSON.stringify(pendingPrescription)):null};
}
function restoreSessionIntentDraft(value){
  const input=value||{};pendingPrescription=input.prescription?window.LoadnoteIntent.prescription(input.prescription):null;
  const put=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value||'';};
  put('session-role',input.role==='unspecified'?'':input.role);put('session-goal',input.goal);put('session-deviation-reason',input.deviationReason==='none'?'':input.deviationReason);put('session-deviation-notes',input.deviationNotes);renderPrescriptionSummary();
}
function resetSessionIntent(){restoreSessionIntentDraft(null);}
function setPrescriptionFromExercises(exercises,source,intent={}){
  pendingPrescription=window.LoadnoteIntent.createPrescription(exercises,source);
  if(intent.role&&intent.role!=='unspecified')document.getElementById('session-role').value=intent.role;
  if(intent.goal)document.getElementById('session-goal').value=intent.goal;
  renderPrescriptionSummary();
}
function capturePlannedWork(){
  if(!validateWorkoutForm())return;
  const draft=captureLoggerDraft(),exercises=LoadnoteSession.fromDraft({...draft,sessionIntent:null},null,{template:true}).exercises;
  const plan=window.LoadnoteIntent.createPrescription(exercises,{type:'manual',label:'Entered before training'});
  if(!plan)return showToast('Enter at least one planned set or cardio target first.','error');
  pendingPrescription=plan;
  document.querySelectorAll('#exercise-rows .set-rpe').forEach(input=>input.value='');
  document.querySelectorAll('#exercise-rows .set-done-check').forEach(input=>{input.checked=false;input.closest('.logger-set')?.classList.remove('set-row-done');});
  renderPrescriptionSummary();saveLoggerDraft();showToast('Planned work captured · now record what you actually perform','success');
}
function clearPlannedWork(){
  if(!pendingPrescription)return;pendingPrescription=null;renderPrescriptionSummary();saveLoggerDraft();showToast('Planned-work snapshot removed from this draft','info');
}
function prescriptionSourceLabel(plan){
  if(!plan)return 'No planned work recorded';const source=plan.source||{},fallback={manual:'Manual plan',template:'Template',program:'Program','repeated-workout':'Repeated workout'}[source.type]||'Recorded plan';return source.label?`${fallback} · ${source.label}`:fallback;
}
function renderPrescriptionSummary(){
  const el=document.getElementById('planned-work-summary');if(!el)return;
  if(!pendingPrescription){el.innerHTML='<p><b>No planned-work snapshot.</b> Completed work will still save normally.</p>';document.getElementById('clear-planned-work').hidden=true;return;}
  const exercises=pendingPrescription.plannedExercises||[],sets=exercises.reduce((n,exercise)=>n+(exercise.type==='cardio'?1:(exercise.sets||[]).length),0);
  const detail=exercises.map(exercise=>{if(exercise.type==='cardio')return `<li>${escapeHtml(exercise.name)} · ${exercise.duration||0} min${exercise.distance?` · ${exercise.distance} ${escapeHtml(exercise.distanceUnit)}`:''}</li>`;const values=(exercise.sets||[]).map(set=>{const measure=exercise.trackBy==='duration'?`${set.duration}s`:`${set.reps} reps`,target=set.targetRpe?` @ target RPE ${set.targetRpe}`:'';return `${measure} × ${toDisplay(set.weight||0)} ${unitLabel()}${target}`;});return `<li>${escapeHtml(exercise.name)} · ${escapeHtml(values.join(' / '))}</li>`;}).join('');
  el.innerHTML=`<p><b>${escapeHtml(prescriptionSourceLabel(pendingPrescription))}</b></p><p>${exercises.length} planned exercises · ${sets} planned sets/targets. This snapshot stays separate from completed work.</p><ul>${detail}</ul>`;
  document.getElementById('clear-planned-work').hidden=false;
}
