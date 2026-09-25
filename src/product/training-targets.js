/* v2.26: compact read-only training targets and provenance for a scheduled session. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./decision-readiness'),require('./phase-review'));
  else root.LoadnoteTrainingTargets=factory(root.LoadnoteSchedule,root.LoadnoteReadiness,root.LoadnotePhaseReview);
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule,Readiness,PhaseReview){
  'use strict';
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  function inspect(state,id,{asOf,now=new Date().toISOString()}={}){
    if(!Schedule.date(asOf)||!iso(now))throw Error('Choose a valid training context date');
    const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
    const record=Schedule.validate(state.scheduledSessions||[]).find(r=>r.id===id);
    const approved=record?.revisions.filter(r=>r.recordedAt<=cutoff).at(-1);
    if(!approved)throw Error('Scheduled workout is unavailable on this date');
    const ctx=approved.context,plan=ctx.prescription;
    const reviews=PhaseReview.validate(state.phaseReviews||[]).filter(r=>r.createdAt<=cutoff);
    const phaseReview=reviews.find(r=>r.changes.some(change=>change.id===id&&change.after.recordedAt===approved.recordedAt))||null;
    const phaseChange=phaseReview?.changes.find(c=>c.id===id)||null;
    const historical=Readiness.workoutsAt(state,asOf,cutoff,false).workouts.filter(w=>w.date<ctx.date&&iso(w.createdAt)&&w.createdAt<=cutoff);
    const exercises=(plan?.plannedExercises||[]).map(e=>{
      const eligible=historical.flatMap(w=>(w.exercises||[]).filter(x=>x.type!=='cardio'&&x.trackBy!=='duration'&&e.type!=='cardio'&&e.trackBy!=='duration'&&(e.exerciseId?x.exerciseId===e.exerciseId:!x.exerciseId&&x.name===e.name)).map(x=>({date:w.date,workoutId:w.id,sets:x.sets||[]}))).sort((a,b)=>b.date.localeCompare(a.date));
      const previous=eligible[0]||null;
      const relevantBefore=(phaseChange?.before?.context?.prescription?.plannedExercises||[]).filter(x=>e.exerciseId?x.exerciseId===e.exerciseId:x.name===e.name);
      const prior=relevantBefore.length===1?relevantBefore[0]:null;
      const changed=prior&&JSON.stringify(prior.sets)!==JSON.stringify(e.sets);
      return {exerciseId:e.exerciseId||null,name:e.name,type:e.type,trackBy:e.trackBy,sets:(e.sets||[]).map(s=>({weightKg:s.weight,reps:s.reps||0,duration:s.duration||0,targetRpe:s.targetRpe??null})),
        previous:previous?{date:previous.date,workoutId:previous.workoutId,sets:previous.sets.map(s=>({weightKg:s.weight,reps:s.reps||0,rpe:s.rpe??null}))}:null,
        approvedChange:changed?{beforeSets:prior.sets.length,afterSets:e.sets.length,beforeFirstWeightKg:prior.sets[0]?.weight??null,afterFirstWeightKg:e.sets[0]?.weight??null}:null};
    });
    const reviewChoices=phaseReview?Object.entries(phaseReview.choices).map(([lift,choice])=>({lift,choice,reason:phaseReview.findings[lift]?.reason||''})).filter(row=>row.choice!=='keep'):[];
    return {version:1,id,name:ctx.name,date:ctx.date,status:ctx.status,revisionAt:approved.recordedAt,asOf,exercises,
      phaseReview:phaseReview?{phase:phaseReview.phase,approvedAt:phaseReview.createdAt,choices:reviewChoices}:null,
      notice:'Approved targets are not completed performance. Previous work is observational and never automatically changes the workout. Current targets remain unchanged until a separate reviewed Calendar revision.'};
  }
  return {inspect};
});
