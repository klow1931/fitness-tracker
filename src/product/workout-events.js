/* Workout-only delegated events. Existing globals remain compatibility entry points. */
function removeWorkoutSet(button){
  const set=button?.closest?.('.logger-set');
  if(!set)return false;
  const entered=[...set.querySelectorAll('input[type=number]')].some(input=>input.value!=='')||!!set.querySelector('.set-done-check')?.checked;
  if(entered&&!confirm('Remove this entered set?'))return false;
  set.remove();
  saveLoggerDraft();
  updateLoggerSummary();
  window.refreshLoggerQuickEntry?.();
  window.refreshGymFloorUI?.();
  return true;
}
function removeWorkoutExercise(button){
  const row=button?.closest?.('[data-idx]');
  if(!row)return false;
  const entered=!!row.querySelector('.ex-name')?.value.trim()||[...row.querySelectorAll('input[type=number],.ex-note')].some(input=>input.value!=='')||!!row.querySelector('.cardio-done:checked,.set-done-check:checked');
  if(entered&&!confirm('Remove this exercise and its entered work?'))return false;
  row.remove();
  saveLoggerDraft();
  updateLoggerSummary();
  window.refreshGymFloorUI?.();
  return true;
}
function initWorkoutEvents(){
  const click={
    'tab-log':()=>showSubTab('workouts','wo-log'),'tab-history':()=>showSubTab('workouts','wo-history'),'tab-templates':()=>showSubTab('workouts','wo-templates'),
    repeat:()=>repeatLastWorkout(),'cancel-edit':()=>cancelWorkoutEdit(),
    'add-strength':()=>addExerciseRow(),'add-cardio':()=>addExerciseRow({name:'',type:'cardio',duration:'',distance:'',distanceUnit:'km',avgHr:''}),
    review:()=>saveWorkout(),clear:()=>clearWorkoutForm(),'save-template':()=>saveCurrentAsTemplate(),
    'rest-60':()=>startRest(60),'rest-90':()=>startRest(90),'rest-180':()=>startRest(180),'stop-rest':()=>stopRest(),
    'pause-rest':()=>pauseRest(),'add-rest':()=>addRestTime(),
    'capture-plan':()=>capturePlannedWork(),'clear-plan':()=>clearPlannedWork(),'start-session':()=>startWorkoutNow(),
    'exercise-detail':el=>openExerciseDetail(el.dataset.exerciseName,el.dataset.tracking),'compare-session':el=>openSessionComparison(el.dataset.workoutId),
    'history-prev':()=>changeHistoryPage(-1),'history-next':()=>changeHistoryPage(1),'clear-history-filters':()=>clearHistoryFilters(),'review-duplicate':el=>reviewDuplicateGroup(el.dataset.duplicateIndex),
    'move-up':el=>moveTrainingExercise(el,-1),'move-down':el=>moveTrainingExercise(el,1),'swap-exercise':el=>openExerciseSwap(el),'expand-exercise':el=>expandTrainingExercise(el),
    'export-json':()=>exportData(),'export-csv':()=>exportCSV(),import:()=>importData(),
    'remove-exercise':el=>removeWorkoutExercise(el),'remove-set':el=>removeWorkoutSet(el),
    'track-reps':el=>setExerciseTrackBy(el,'reps'),'track-duration':el=>setExerciseTrackBy(el,'duration'),
    'last-weights':el=>fillLastWeights(el),'jump-weights':el=>fillLastWeights(el,true),'add-set':el=>addSetRow(el),
    edit:el=>editWorkout(el.dataset.workoutId),duplicate:el=>duplicateWorkout(el.dataset.workoutId),'undo-change':el=>undoWorkoutChange(el.dataset.revisionId),'history-template':el=>saveWorkoutAsTemplate(el.dataset.workoutId),delete:el=>deleteWorkout(el.dataset.workoutId),
    'load-template':el=>loadTemplate(el.dataset.templateId),'delete-template':el=>deleteTemplate(el.dataset.templateId),'focus-date':()=>document.getElementById('wo-date')?.focus(),
    'review-back':()=>closeWorkoutReview(),'review-save':()=>commitReviewedWorkout()
  };
  const change={'history-date':()=>renderWorkoutHistory(),'history-filter':()=>renderWorkoutHistory(),'training-focus':()=>toggleTrainingFocus(),checklist:()=>toggleChecklistMode(),'select-template':el=>loadTemplate(el.value),'import-file':(el,event)=>handleImport(event),'exercise-note':el=>saveExerciseNoteFromRow(el),'session-intent':()=>saveLoggerDraft()};
  const input={'history-search':()=>debouncedHistorySearch()};
  for(const root of [document.getElementById('panel-workouts'),document.getElementById('workout-review')]){
    if(!root || root.dataset.eventsBound)continue;
    root.dataset.eventsBound='true';
    for(const [eventName,attribute,actions] of [['click','action',click],['change','change',change],['input','input',input]]){
      root.addEventListener(eventName,event=>{
        const target=event.target.closest?.(`[data-workout-${attribute}]`);
        if(!target || !root.contains(target) || window.loggerSaving)return;
        const action=actions[target.getAttribute(`data-workout-${attribute}`)];
        if(typeof action==='function')action(target,event);
      });
    }
  }
}
