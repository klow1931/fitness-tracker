/* v2.27: in-the-moment context for logged sets; never adjusts approved prescriptions. */
(function(){
  'use strict';
  const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
  function render(){
    const link=typeof pendingScheduledSession!=='undefined'?pendingScheduledSession:null;
    const rows=[...document.querySelectorAll('#exercise-rows > div')];
    const hide=()=>rows.forEach(row=>{row.querySelectorAll('.set-target-note,.next-set-guidance').forEach(el=>{el.hidden=true;});});
    if(!link||typeof workoutEdit!=='undefined'&&workoutEdit||!pendingPrescription){hide();return;}
    const record=LoadnoteSchedule.list(data.scheduledSessions||[]).find(s=>s.id===link.id);
    if(!record||record.revisionAt!==link.revisionAt||JSON.stringify(record.prescription)!==JSON.stringify(pendingPrescription)){hide();return;}
    const plan=record.prescription.plannedExercises||[];
    for(const row of rows){
      const summary=row.querySelector('.next-set-guidance'),sets=[...row.querySelectorAll('.sets-container > div')];
      if(!summary||row.dataset.type==='cardio'||row.dataset.trackBy==='duration'){row.querySelectorAll('.set-target-note,.next-set-guidance').forEach(el=>el.hidden=true);continue;}
      const name=row.querySelector('.ex-name')?.value.trim()||'';
      const id=window.LoadnoteIntegrity?.resolveExercise(data.exerciseCatalog,name)?.id;
      const matches=plan.filter(e=>e.type!=='cardio'&&e.trackBy!=='duration'&&(id?e.exerciseId===id:!e.exerciseId&&e.name===name));
      const duplicates=rows.filter(r=>r.dataset.type!=='cardio'&&r.querySelector('.ex-name')?.value.trim()===name);
      const exercise=matches.length===1&&duplicates.length===1?matches[0]:null;
      if(!exercise){sets.forEach(s=>{const note=s.querySelector('.set-target-note');if(note)note.hidden=true;});summary.hidden=true;continue;}
      const done=sets.map(s=>({done:!!s.querySelector('.set-done-check')?.checked,reps:Number(s.querySelector('.set-reps')?.value||0),weightKg:s.querySelector('.set-weight')?.value===''?null:toStorage(Number(s.querySelector('.set-weight')?.value)),rpe:s.querySelector('.set-rpe')?.value??''}));
      const guidance=LoadnoteSetGuidance.evaluate(exercise.sets,done);
      sets.forEach((set,i)=>{const note=set.querySelector('.set-target-note'),target=exercise.sets[i];if(!note)return;
        if(!target){note.hidden=true;return;}
        const text='Target '+toDisplay(target.weight)+' '+unitLabel()+' × '+target.reps+(target.targetRpe==null?'':' · RPE cap '+target.targetRpe);
        note.hidden=false;setText(note,text);
      });
      let message=guidance.message;
      if(guidance.nextIndex>=0&&guidance.nextTarget){
        const p=guidance.nextTarget;message='Next set '+(guidance.nextIndex+1)+': '+toDisplay(p.weight)+' '+unitLabel()+' × '+p.reps+(p.targetRpe==null?'':' · RPE cap '+p.targetRpe)+'. '+message;
      }
      summary.hidden=false;summary.dataset.status=guidance.status;setText(summary,message);
    }
  }
  window.LoadnoteSetGuidanceUI={render};
})();
