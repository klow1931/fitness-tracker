/* Explicit PR/goal saves acknowledge durable storage, not a debounce timer. */
let manualPRSaving=false,simpleGoalSaving=false;
let savedRecordQueue=Promise.resolve();
function commitSavedRecords(collection,records){
 const operation=savedRecordQueue.then(async()=>{
  clearTimeout(saveTimer);await persistNow({...data,[collection]:records});
  data[collection]=records;invalidateViews();
 });
 savedRecordQueue=operation.catch(()=>{});return operation;
}
function lockSavedRecord(kind,locked){
 const root=kind==='pr'?document.getElementById('pr-entry'):document.getElementById('goal-type')?.closest('.card');
 if(!root)return;for(const el of root.querySelectorAll('input,select,button'))el.disabled=locked;
}
    async function savePR() {
      if(manualPRSaving)return;
      const exercise = document.getElementById('pr-exercise').value.trim();
      const weightRaw = parseFloat(document.getElementById('pr-weight').value);
      const reps = Number(document.getElementById('pr-reps').value||1);
      const date = document.getElementById('pr-date').value || today();

      if (!exercise || !Number.isFinite(weightRaw)||weightRaw<=0||!Number.isSafeInteger(reps)||reps<1) return alert('Enter an exercise, positive weight and whole reps.');

      const weight = toStorage(weightRaw);
      const est = estimated1RM(weight, reps);
      const records=(data.prs||[]).map(p=>({...p}));
      const existing = records.find(p => p.exercise.toLowerCase() === exercise.toLowerCase());
      const newBest = !existing || est > estimated1RM(existing.weight, existing.reps);
      if (existing) {
        existing.weight = weight;
        existing.reps = reps;
        existing.date = date;
        existing.estimated1RM = est;
        delete existing.source; delete existing.sourceWorkoutId; delete existing.baselinePR;
      } else {
        records.push({
          id: window.LoadnoteCore.createId(),
          exercise,
          weight,
          reps,
          date,
          estimated1RM: est
        });
      }
      records.sort((a,b)=>a.exercise.localeCompare(b.exercise));
      manualPRSaving=true;lockSavedRecord('pr',true);
      try{
      await commitSavedRecords('prs',records);
      document.getElementById('pr-exercise').value = '';
      document.getElementById('pr-weight').value = '';
      document.getElementById('pr-reps').value = '1';
      renderPRs();
      showToast(newBest ? 'PR saved · New personal best!' : 'PR updated', newBest ? 'milestone' : 'success');
      }catch(error){showToast('PR could not be saved. Keep your entry and retry.','error');}
      finally{manualPRSaving=false;lockSavedRecord('pr',false);}
    }

    async function saveGoal() {
      if(simpleGoalSaving)return;
      const type = document.getElementById('goal-type').value;
      const deadline = document.getElementById('goal-deadline').value || null;
      const notes = document.getElementById('goal-notes').value.trim();
      let goal = { id: window.LoadnoteCore.createId(), type, deadline, notes, created: today(), completed: false };

      if (type === 'strength') {
        const exercise = document.getElementById('goal-exercise').value.trim();
        const weightRaw = parseFloat(document.getElementById('goal-weight').value);
        if (!exercise || !Number.isFinite(weightRaw) || weightRaw<=0) return alert('Exercise and positive target weight required');
        goal.exercise = exercise;
        goal.targetWeight = toStorage(weightRaw);
        goal.exerciseId=window.LoadnoteIntegrity?.resolveExercise(data.exerciseCatalog,exercise)?.id||null;
        goal.startDate=today();const starting=document.getElementById('goal-start-weight').value;
        goal.startWeight=starting===''?LoadnoteGoalProgress.best(data,goal,today()):toStorage(Number(starting));
        if(goal.startWeight===null||!Number.isFinite(goal.startWeight)||goal.startWeight<0)return alert('Enter a starting estimated 1RM or log a performance first.');
        if(goal.targetWeight<=goal.startWeight)return alert('Choose a target above your starting estimated 1RM.');
      } else if(type==='workout-count'){
        const target=Number(document.getElementById('goal-session-target').value);if(!Number.isSafeInteger(target)||target<1||target>10000)return alert('Choose 1–10000 workouts.');goal.targetSessions=target;goal.startDate=today();
      } else if (type === 'protein') {
        const target = parseFloat(document.getElementById('goal-protein-target').value);
        if (!target) return alert('Protein target required');
        goal.targetProtein = target;
      } else if (type === 'consistency') {
        const perWeek = parseInt(document.getElementById('goal-workouts-week').value);
        if (!perWeek) return alert('Workouts per week required');
        goal.targetPerWeek = perWeek;
      }

      const records=[...(data.goals||[]),goal];
      simpleGoalSaving=true;lockSavedRecord('goal',true);
      try{
      await commitSavedRecords('goals',records);
      // Clear form
      document.getElementById('goal-start-weight').value='';document.getElementById('goal-session-target').value='';
      document.getElementById('goal-exercise').value = '';
      document.getElementById('goal-weight').value = '';
      document.getElementById('goal-protein-target').value = '';
      document.getElementById('goal-workouts-week').value = '';
      document.getElementById('goal-deadline').value = '';
      document.getElementById('goal-notes').value = '';
      renderCoach();
      showToast('Goal saved on this device','success');
      }catch(error){showToast('Goal could not be saved. Keep your entry and retry.','error');}
      finally{simpleGoalSaving=false;lockSavedRecord('goal',false);}
    }

