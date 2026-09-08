/* v1.2: recoverable workout drafts and logger validation. History stays in the existing schema. */
const LOGGER_DRAFT_KEY = 'loadnote-workout-draft-v1';
function validLoggerNumber(value, min, max = Infinity, integer = false) {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max && (!integer || Number.isInteger(Number(value)));
}
function readLoggerDraft() {
  try { return LoadnoteDraft.normalize(JSON.parse(localStorage.getItem(LOGGER_DRAFT_KEY))); } catch (_) { return null; }
}
function loggerHasContent() {
  return [...document.querySelectorAll('#exercise-rows input:not([type=checkbox]), #wo-notes')].some(i => i.value !== '');
}
function captureLoggerDraft() {
  const value = (row, selector) => row.querySelector(selector)?.value || '';
  return { version: 2, date: document.getElementById('wo-date').value, notes: document.getElementById('wo-notes').value,
    unit: currentUnit(), program: pendingProgramSession, edit: workoutEdit, updatedAt: Date.now(),
    rows: [...document.querySelectorAll('#exercise-rows > div')].map(row => ({
      type: row.dataset.type, trackBy: row.dataset.trackBy,
      name:value(row,'.ex-name'),note:value(row,'.ex-note'),duration:value(row,'.cardio-duration'),distance:value(row,'.cardio-distance'),distanceUnit:value(row,'.cardio-distance-unit'),avgHr:value(row,'.cardio-hr'),
      sets:[...row.querySelectorAll('.sets-container > div')].map(s=>({reps:value(s,'.set-reps'),duration:value(s,'.set-duration'),weight:value(s,'.set-weight'),rpe:value(s,'.set-rpe'),done:!!s.querySelector('.set-done-check')?.checked,showCompletion:!!s.querySelector('.set-done-check')}))
    })) };
}
function saveLoggerDraft() {
  const status = document.getElementById('logger-draft-status');
  if (!status) return;
  try {
    if (loggerHasContent()) { localStorage.setItem(LOGGER_DRAFT_KEY, JSON.stringify(captureLoggerDraft())); status.textContent = 'Draft saved on this device'; }
    else { localStorage.removeItem(LOGGER_DRAFT_KEY); status.textContent = 'Draft saves on this device as you train.'; }
  } catch (_) { status.textContent = 'Draft could not be saved. Keep this page open and export your data.'; }
  updateLoggerSummary();
  updateSessionComparisons();
}
function updateLoggerSummary() {
  let total = 0, done = 0;
  document.querySelectorAll('#exercise-rows .sets-container').forEach(c => {
    [...c.children].forEach((s, i) => {
      const label = s.querySelector('.set-number');
      if (label && label.textContent !== String(i + 1)) label.textContent = String(i + 1);
      if (s.querySelector('.set-done-check')?.checked) done++;
      total++;
    });
  });
  document.getElementById('logger-summary').textContent = `${document.querySelectorAll('#exercise-rows > div').length} exercises · ${done}/${total} sets checked`;
}
function validateWorkoutForm() {
  for (const row of document.querySelectorAll('#exercise-rows > div')) {
    const name = row.querySelector('.ex-name');
    const entered = [...row.querySelectorAll('input[type=number]')].some(i => i.value !== '' || i.validity.badInput);
    if (entered && !name.value.trim()) { name.focus(); showToast('Name every exercise with entered values.', 'error'); return false; }
    for (const input of row.querySelectorAll('input[type=number]')) {
      const isReps = input.classList.contains('set-reps');
      const isRpe = input.classList.contains('set-rpe');
      if (input.validity.badInput || (input.value !== '' && !validLoggerNumber(input.value, Number(input.min || 0), isRpe ? 10 : Infinity, isReps))) {
        input.focus(); showToast(isRpe ? 'RPE must be between 1 and 10.' : 'Use valid, nonnegative values and whole-number reps.', 'error'); return false;
      }
    }
    for (const set of row.querySelectorAll('.sets-container > div')) {
      const measure = set.querySelector('.set-reps, .set-duration');
      if ([...set.querySelectorAll('input[type=number]')].some(i => i.value !== '') && !measure.value) {
        measure.focus(); showToast('Enter reps or hold seconds for each filled set.', 'error'); return false;
      }
    }
    if (name.value.trim() && row.dataset.type === 'cardio' && !(Number(row.querySelector('.cardio-duration').value) > 0 || Number(row.querySelector('.cardio-distance').value) > 0)) {
      showToast('Enter a duration or distance for cardio.', 'error'); return false;
    }
  }
  return true;
}
function initWorkoutLogger() {
  const draft = readLoggerDraft();
  const container = document.getElementById('exercise-rows');
  if (!container) return;
  if (draft) {
    container.innerHTML = '';
    draft.rows.forEach(saved => {
      addExerciseRow({ type: saved.type, trackBy: saved.trackBy, sets: (saved.sets || []).map(s=>({done:s.done,showCompletion:s.showCompletion})) });
      const row = container.lastElementChild;
      const put = (target,selector,value) => { const input=target.querySelector(selector); if(input) input.value=value ?? ''; };
      put(row,'.ex-name',saved.name); put(row,'.ex-note',saved.note);
      for (const key of ['duration','distance','avgHr','distanceUnit']) put(row, {duration:'.cardio-duration',distance:'.cardio-distance',avgHr:'.cardio-hr',distanceUnit:'.cardio-distance-unit'}[key],saved[key]);
      [...row.querySelectorAll('.sets-container > div')].forEach((set,i) => {
        const values=saved.sets[i];
        for (const key of ['reps','duration','weight','rpe']) put(set,'.set-'+key,values[key]);
        const weight=set.querySelector('.set-weight');
        if(weight.value !== '' && draft.unit !== currentUnit()) weight.value=Math.round(Number(weight.value)*(currentUnit()==='lb'?2.2046226218:1/2.2046226218)*100)/100;
      });
      row.querySelectorAll('.set-done-check').forEach(c => c.parentElement.classList.toggle('set-row-done', c.checked));
    });
    document.getElementById('wo-date').value = draft.date;
    document.getElementById('wo-notes').value = draft.notes;
    pendingProgramSession = draft.program || null;
    workoutEdit = draft.edit || null;
    document.getElementById('logger-draft-status').textContent = 'Recovered your unfinished workout';
  }
  const panel = document.getElementById('workout-log-card');
  panel.addEventListener('input', saveLoggerDraft);
  panel.addEventListener('change', saveLoggerDraft);
  new MutationObserver(saveLoggerDraft).observe(container, { childList: true, subtree: true });
  window.addEventListener('pagehide', saveLoggerDraft);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveLoggerDraft(); });
  updateLoggerSummary();
  refreshSessionMode();
  updateSessionComparisons();
  document.getElementById('workout-review').addEventListener('cancel',event=>{if(window.loggerSaving)event.preventDefault();else reviewedSession=null;});
}
if (typeof module !== 'undefined') module.exports = { validLoggerNumber };
