/* Athlete-entered session purpose and immutable planned-work snapshots. */
let pendingPrescription=null;
let pendingSessionTiming=null;
let pendingScheduledSession=null;
function sessionIntentValue(id){return document.getElementById(id)?.value||'';}
function readSessionIntentDraft(){
  return {role:sessionIntentValue('session-role')||'unspecified',goal:sessionIntentValue('session-goal'),deviationReason:sessionIntentValue('session-deviation-reason')||'none',deviationNotes:sessionIntentValue('session-deviation-notes'),prescription:pendingPrescription?JSON.parse(JSON.stringify(pendingPrescription)):null,...(pendingSessionTiming?{timing:JSON.parse(JSON.stringify(pendingSessionTiming))}:{}),...(pendingScheduledSession?{schedule:{...pendingScheduledSession}}:{})};
}
function restoreSessionIntentDraft(value){
  pendingSessionTiming=window.LoadnoteIntent.provenance(value?.timing);
  const input=value||{};pendingScheduledSession=input.schedule?{...input.schedule}:null;pendingPrescription=input.prescription?window.LoadnoteIntent.prescription(input.prescription):null;
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
  if(workoutEdit)return showToast('Saved plan history is preserved. Edit actual work and explain changes instead.','info');
  if(!validateWorkoutForm())return;
  const draft=captureLoggerDraft(),exercises=LoadnoteSession.fromDraft({...draft,sessionIntent:null}).exercises;
  const plan=window.LoadnoteIntent.createPrescription(exercises,{type:'manual',label:'Captured entered work'});
  if(!plan)return showToast('Enter at least one planned set or cardio target first.','error');
  const clearActual=!pendingPrescription&&!pendingSessionTiming?.startedAt&&document.getElementById('wo-date').value>=today();
  try{const timing=pendingPrescription?LoadnoteIntent.revisePlan(pendingSessionTiming,plan,{now:plan.capturedAt}):pendingSessionTiming;if(!persistSessionTiming(pendingPrescription||plan,timing))return;}catch(e){return showToast(e.message,'error');}
  if(clearActual){document.querySelectorAll('#exercise-rows .set-rpe').forEach(input=>input.value='');
  document.querySelectorAll('#exercise-rows .set-done-check').forEach(input=>{input.checked=false;input.closest('.logger-set')?.classList.remove('set-row-done');});}
  renderPrescriptionSummary();saveLoggerDraft();showToast('Planned work captured · now record what you actually perform','success');
}
function clearPlannedWork(){
  if(workoutEdit)return showToast('Saved plan history cannot be removed from this editor.','info');
  if(pendingScheduledSession)return showToast('Clear the workout to start an unscheduled session.','info');
  if(!pendingPrescription)return;try{if(!persistSessionTiming(pendingPrescription,LoadnoteIntent.revisePlan(pendingSessionTiming,null)))return;renderPrescriptionSummary();saveLoggerDraft();showToast('Active plan removed; original plan and revision history retained','info');}catch(e){showToast(e.message,'error');}
}
function persistSessionTiming(plan,timing){
  const previousPlan=pendingPrescription,previousTiming=pendingSessionTiming;
  try{pendingPrescription=plan;pendingSessionTiming=timing;const draft=captureLoggerDraft();LoadnoteIntent.context(draft.sessionIntent);localStorage.setItem(LOGGER_DRAFT_KEY,JSON.stringify(draft));return true;}
  catch(e){pendingPrescription=previousPlan;pendingSessionTiming=previousTiming;showToast('Could not save timing. Nothing was changed.','error');return false;}
}
function startWorkoutNow(){
  if(workoutEdit)return showToast('Historical edits cannot acquire a new start time.','info');
  try{const timing=LoadnoteIntent.startTiming(pendingSessionTiming,document.getElementById('wo-date').value,today());if(!persistSessionTiming(pendingPrescription,timing))return;renderPrescriptionSummary();saveLoggerDraft();showToast('Session start recorded on this device','success');}catch(e){showToast(e.message,'error');}
}
function prescriptionSourceLabel(plan){
  if(!plan)return 'No planned work recorded';const source=plan.source||{},fallback={manual:'Manual plan',template:'Template',program:'Program','repeated-workout':'Repeated workout'}[source.type]||'Recorded plan';return source.label?`${fallback} · ${source.label}`:fallback;
}
function renderPrescriptionSummary(){
  const status=document.getElementById('session-timing-summary');if(status){const t=pendingSessionTiming,date=document.getElementById('wo-date')?.value;status.textContent=(t?.startedAt?'Recorded start: '+t.startedAt+(t.sessionDate!==date?' · workout date changed; timing unknown':''):'Start time not recorded')+' · Original plan: '+LoadnoteIntent.planTiming(pendingPrescription,date,t)+' · '+(t?.revisions.length||0)+' plan revisions';}
  const el=document.getElementById('planned-work-summary');if(!el)return;
  if(!pendingPrescription){el.innerHTML='<p><b>No planned-work snapshot.</b> Completed work will still save normally.</p>';document.getElementById('clear-planned-work').hidden=true;return;}
  const exercises=pendingPrescription.plannedExercises||[],sets=exercises.reduce((n,exercise)=>n+(exercise.type==='cardio'?1:(exercise.sets||[]).length),0);
  const detail=exercises.map(exercise=>{if(exercise.type==='cardio')return `<li>${escapeHtml(exercise.name)} · ${exercise.duration||0} min${exercise.distance?` · ${exercise.distance} ${escapeHtml(exercise.distanceUnit)}`:''}</li>`;const values=(exercise.sets||[]).map(set=>{const measure=exercise.trackBy==='duration'?`${set.duration}s`:`${set.reps} reps`,target=set.targetRpe?` @ target RPE ${set.targetRpe}`:'';return `${measure} × ${toDisplay(set.weight||0)} ${unitLabel()}${target}`;});return `<li>${escapeHtml(exercise.name)} · ${escapeHtml(values.join(' / '))}</li>`;}).join('');
  el.innerHTML=`<p><b>${escapeHtml(prescriptionSourceLabel(pendingPrescription))}</b></p><p>${exercises.length} planned exercises · ${sets} planned sets/targets. This snapshot stays separate from completed work.</p><ul>${detail}</ul>`;
  document.getElementById('clear-planned-work').hidden=false;
  if(pendingSessionTiming?.revisions.length){const history=document.createElement('details');history.innerHTML='<summary>Plan changes · original retained</summary>'+pendingSessionTiming.revisions.map(r=>'<p>'+escapeHtml(r.recordedAt+' · '+(r.plan?LoadnoteIntent.planTiming(r.plan,document.getElementById('wo-date').value,pendingSessionTiming):'Plan removed'))+'</p>'+(r.plan?'<p>'+escapeHtml(r.plan.plannedExercises.map(e=>e.name+': '+(e.sets||[]).map(s=>toDisplay(s.weight)+' '+unitLabel()+' × '+(s.reps||s.duration)).join(' / ')).join('; '))+'</p>':'')).join('');el.append(history);}
}
