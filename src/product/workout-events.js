/* Workout-only delegated events. Existing globals remain compatibility entry points. */
function initWorkoutEvents(){
  const click={
    'tab-log':()=>showSubTab('workouts','wo-log'),'tab-history':()=>showSubTab('workouts','wo-history'),'tab-templates':()=>showSubTab('workouts','wo-templates'),
    repeat:()=>repeatLastWorkout(),'cancel-edit':()=>cancelWorkoutEdit(),
    'add-strength':()=>addExerciseRow(),'add-cardio':()=>addExerciseRow({name:'',type:'cardio',duration:'',distance:'',distanceUnit:'km',avgHr:''}),
    review:()=>saveWorkout(),clear:()=>clearWorkoutForm(),'save-template':()=>saveCurrentAsTemplate(),
    'rest-60':()=>startRest(60),'rest-90':()=>startRest(90),'rest-180':()=>startRest(180),'stop-rest':()=>stopRest(),
    'pause-rest':()=>pauseRest(),'add-rest':()=>addRestTime(),
    'move-up':el=>moveTrainingExercise(el,-1),'move-down':el=>moveTrainingExercise(el,1),'swap-exercise':el=>openExerciseSwap(el),'expand-exercise':el=>expandTrainingExercise(el),
    'export-json':()=>exportData(),'export-csv':()=>exportCSV(),import:()=>importData(),
    'remove-exercise':el=>el.closest('[data-idx]')?.remove(),'remove-set':el=>el.parentElement.remove(),
    'track-reps':el=>setExerciseTrackBy(el,'reps'),'track-duration':el=>setExerciseTrackBy(el,'duration'),
    'last-weights':el=>fillLastWeights(el),'jump-weights':el=>fillLastWeights(el,true),'add-set':el=>addSetRow(el),
    edit:el=>editWorkout(el.dataset.workoutId),'history-template':el=>saveWorkoutAsTemplate(el.dataset.workoutId),delete:el=>deleteWorkout(el.dataset.workoutId),
    'load-template':el=>loadTemplate(el.dataset.templateId),'delete-template':el=>deleteTemplate(el.dataset.templateId),'focus-date':()=>document.getElementById('wo-date')?.focus(),
    'review-back':()=>closeWorkoutReview(),'review-save':()=>commitReviewedWorkout()
  };
  const change={'training-focus':()=>toggleTrainingFocus(),checklist:()=>toggleChecklistMode(),'select-template':el=>loadTemplate(el.value),'import-file':(el,event)=>handleImport(event),'exercise-note':el=>saveExerciseNoteFromRow(el)};
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
