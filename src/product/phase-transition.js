(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./phase-review'));
  else root.LoadnotePhaseTransition=factory(root.LoadnotePhaseReview);
})(typeof globalThis!=='undefined'?globalThis:this,function(Review){
  'use strict';
  const LIFTS=['squat','bench','deadlift'];
  const round=n=>Math.round(n*100)/100;
  function summarize(sessions,lift,planFor){
    let exposures=0,sets=0,tonnageKg=0;
    for(const session of sessions){
      const source=session.source;
      const ids=new Set(source.exercises.filter(e=>e.lift===lift).map(e=>e.exerciseId));
      const plan=planFor(session);
      if(!plan)continue;
      const relevant=(plan.plannedExercises||[]).filter(e=>ids.has(e.exerciseId));
      if(!relevant.length)continue;
      exposures++;
      for(const ex of relevant)for(const set of ex.sets||[]){
        if(!(Number.isFinite(set.weight)&&Number.isInteger(set.reps)&&set.weight>0&&set.reps>0))continue;
        sets++;tonnageKg+=set.weight*set.reps;
      }
    }
    return {exposures,sets,tonnageKg:round(tonnageKg)};
  }
  function assess(report,choices){
    if(!report?.basis?.program||!Array.isArray(report.targets)||!report.findings)throw Error('Generate a phase review first');
    // Reuse the exact approved-transformation preview rather than creating parallel adjustment rules.
    const edits=Review.preview(report,choices),byId=new Map(edits.map(e=>[e.id,e]));
    const original=report.basis.program.sessions,next=report.nextPhase;
    const lastWeek=Math.max(...original.filter(s=>s.phase===report.phase).map(s=>s.week));
    if(!Number.isFinite(lastWeek))throw Error('Missing reviewed phase schedule');
    const previous=original.filter(s=>s.week===lastWeek).map(source=>({source}));
    const firstWeek=next?Math.min(...original.filter(s=>s.phase===next).map(s=>s.week)):null;
    const future=next?report.targets.filter(t=>original.some(s=>s.key===t.key&&s.week===firstWeek)).map(t=>({source:original.find(s=>s.key===t.key),target:t})):[],findings={};
    const rest=original.filter(s=>s.phase===report.phase&&s.week===lastWeek);
    for(const lift of LIFTS){
      const finding=report.findings[lift],old=summarize(previous,lift,({source})=>({plannedExercises:source.exercises}));
      const relevant=future.filter(({source})=>source.exercises.some(e=>e.lift===lift));
      const unavailable=relevant.filter(({source,target})=>!target.session||target.session.status!=='scheduled'||target.session.date!==source.date);
      const planned=summarize(relevant,lift,({target})=>target.session?.prescription);
      const proposed=summarize(relevant,lift,({target})=>byId.get(target.id)?.after||target.session?.prescription);
      const choice=choices[lift],warnings=[];
      if(unavailable.length)warnings.push('Some next-phase exposures are missing, changed or no longer scheduled. Review Calendar manually.');
      if(next&&relevant.length&&proposed.exposures!==relevant.length)warnings.push('Not all next-phase exposures have a usable prescription.');
      if(next&&old.tonnageKg>0&&proposed.tonnageKg>old.tonnageKg*1.2)warnings.push('First-week prescribed tonnage is over 20% above the last-week prescription. Review this transition; tonnage is not fatigue.');
      if(next&&old.sets>0&&proposed.sets>old.sets*1.25)warnings.push('First-week prescribed sets are over 25% above the last-week prescription. Review the change.');
      if(next&&proposed.exposures>old.exposures)warnings.push('Planned lift exposure frequency increases. Confirm scheduling and recovery needs manually.');
      if(finding.decision==='gather')warnings.push(finding.reason);
      let status=next==='deload'?'planned-deload':next==null?'sequence-complete':warnings.length?'manual-review':choice==='keep'?'keep-plan':'proposed-adjustment';
      if(next==='deload'&&finding.decision==='gather'&&finding.reason)warnings.push('The existing deload stays unchanged. Review any concerns before building another sequence.');
      findings[lift]={name:finding.name,status,choice,completedSessions:finding.completedSessions,expectedSessions:finding.expectedSessions,matchedSets:finding.comparedSets,observedWeeks:finding.weeklyWorkload||[],lastPhaseWeek:old,nextPhaseWeekBefore:planned,nextPhaseWeekAfter:proposed,warnings};
    }
    return {version:1,phase:report.phase,nextPhase:next,from:report.from,through:report.through,firstNextWeek:firstWeek,findings,sessionRevisions:edits.length,disclaimer:'Prescriptions and completed work are separate. This review does not measure readiness, fatigue or a proven optimal workload. No phase dates, deloads, training maxes or workout history change automatically.'};
  }
  return {assess};
});
