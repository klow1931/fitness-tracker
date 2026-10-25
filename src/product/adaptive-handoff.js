/* v2.71 — deterministic post-session adaptive handoff.
 * Describes what was learned from a saved workout and whether the next
 * reviewed prescription changed, needs athlete review, or remains unchanged.
 * This module never mutates training data or applies an adaptation.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(
  require('./schedule'),require('./session-intent'),require('./training-continuity'),
  require('./program-lifecycle'),require('./adaptation-explanation'),require('./workout-feedback')
 );
 else root.LoadnoteAdaptiveHandoff=factory(
  root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteTrainingContinuity,
  root.LoadnoteProgramLifecycle,root.LoadnoteAdaptationExplanation,root.LoadnoteWorkoutFeedback
 );
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule,Intent,Continuity,Lifecycle,Explanation,Feedback){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const round=(x,d=1)=>{const p=10**d;return Math.round(Number(x)*p)/p;};
 const validRpe=x=>Number.isFinite(Number(x))&&Number(x)>=1&&Number(x)<=10;
 const mode=e=>e?.type==='cardio'?'cardio':e?.trackBy==='duration'?'duration':'reps';
 const key=e=>e?.exerciseId?'id:'+String(e.exerciseId)+'|'+mode(e):'name:'+String(e?.name||'').trim().toLowerCase()+'|'+mode(e);
 const strengthSets=e=>(e?.sets||[]).filter(s=>Number(s?.[e?.trackBy==='duration'?'duration':'reps'])>0);
 function groups(exercises,identities){
  const out=new Map();
  for(const e of exercises||[]){
   if(e?.type==='cardio'||e?.type==='practice')continue;
   // Mirror the existing Session Intent identity rule: a missing ID can only
   // map by name/mode if exactly one known ID uses that name and mode.
   const name=String(e?.name||'').trim().replace(/\\s+/g,' ').toLowerCase(),kind=mode(e);
   const known=identities?.get(name+'|'+kind),resolvedId=e.exerciseId||known?.size===1?[...known][0]:null;
   const k=resolvedId?'id:'+resolvedId+'|'+kind:'name:'+name+'|'+kind;
   if(!out.has(k))out.set(k,{key:k,name:e.name||'Exercise',exerciseId:resolvedId||null,trackBy:e.trackBy==='duration'?'duration':'reps',sets:[],loadConventions:new Set()});
   const group=out.get(k);
   if(e.loadConvention)group.loadConventions.add(e.loadConvention);
   group.sets.push(...strengthSets(e));
  }
  return out;
 }
 function identityNames(exercises){
  const names=new Map();
  for(const e of exercises||[]){
   if(!e?.exerciseId||e.type==='cardio'||e.type==='practice')continue;
   const name=String(e.name||'').trim().replace(/\\s+/g,' ').toLowerCase()+'|'+mode(e);
   if(!names.has(name))names.set(name,new Set());
   names.get(name).add(String(e.exerciseId));
  }
  return names;
 }
 function performance(workout){
  const comparison=Intent.compare(workout);
  const plan=workout?.sessionIntent?.prescription;
  if(!plan)return {comparison:null,exercises:[],comparableRpeSets:0,unmatchedRpeSets:0,unknownActualRpeSets:0,averageTargetRpe:null,averageActualRpe:null,averageRpeDelta:null};
  const identityMap=identityNames([...(plan.plannedExercises||[]),...(workout.exercises||[])]),
   planned=groups(plan.plannedExercises,identityMap),actual=groups(workout.exercises||[],identityMap),exercises=[];
  let targetTotal=0,actualTotal=0,paired=0,unmatchedRpeSets=0,unknownActualRpeSets=0;
  for(const [k,p] of planned){
   const a=actual.get(k),n=Math.min(p.sets.length,a?.sets?.length||0);
   let pTarget=0,pActual=0,pairs=0,unmatched=0,unknown=0;
   for(let i=0;i<p.sets.length;i++){
    const target=p.sets[i]?.targetRpe,performed=a?.sets?.[i],rpe=performed?.rpe;
    if(!validRpe(target))continue;
    const conventionMatch=!a||!p.loadConventions.size||!a.loadConventions.size||
      (p.loadConventions.size===1&&a.loadConventions.size===1&&[...p.loadConventions][0]===[...a.loadConventions][0]);
    if(!performed||!conventionMatch||!Intent.sameSet(p.sets[i],performed,p.trackBy)){
     unmatched++;unmatchedRpeSets++;continue;
    }
    if(!validRpe(rpe)){unknown++;unknownActualRpeSets++;continue;}
    pTarget+=Number(target);pActual+=Number(rpe);pairs++;targetTotal+=Number(target);actualTotal+=Number(rpe);paired++;
   }
   exercises.push({
    key:k,name:p.name,exerciseId:p.exerciseId,plannedSets:p.sets.length,completedSets:n,
    comparableRpeSets:pairs,unmatchedRpeSets:unmatched,unknownActualRpeSets:unknown,
    averageTargetRpe:pairs?round(pTarget/pairs):null,averageActualRpe:pairs?round(pActual/pairs):null,
    averageRpeDelta:pairs?round((pActual-pTarget)/pairs):null
   });
  }
  return {comparison,exercises,comparableRpeSets:paired,unmatchedRpeSets,unknownActualRpeSets,averageTargetRpe:paired?round(targetTotal/paired):null,averageActualRpe:paired?round(actualTotal/paired):null,averageRpeDelta:paired?round((actualTotal-targetTotal)/paired):null};
 }
 function acceptedChange(state,scheduleId){
  const rows=[];
  for(const review of state?.phaseReviews||[])for(const change of review?.changes||[])if(change.id===scheduleId)rows.push({review,change});
  for(const cycle of state?.meetCycles||[])for(const review of cycle?.weeklyReviews||[])for(const change of review?.changes||[])if(change.id===scheduleId)rows.push({review,change});
  return rows.sort((a,b)=>String(a.review.createdAt).localeCompare(String(b.review.createdAt))).at(-1)||null;
 }
 function changedRows(state,scheduleId){
  const accepted=acceptedChange(state,scheduleId);if(!accepted)return [];
  const before=accepted.change.before?.context?.prescription?.plannedExercises||[],after=accepted.change.after?.context?.prescription?.plannedExercises||[];
  const map=new Map();
  for(const e of before)map.set(key(e),{name:e.name||'Exercise',exerciseId:e.exerciseId||null,trackBy:e.trackBy||'reps',before:copy(e.sets||[]),after:[]});
  for(const e of after){
   const k=key(e),row=map.get(k)||{name:e.name||'Exercise',exerciseId:e.exerciseId||null,trackBy:e.trackBy||'reps',before:[],after:[]};
   row.after=copy(e.sets||[]);map.set(k,row);
  }
  return [...map.values()].filter(x=>JSON.stringify(x.before)!==JSON.stringify(x.after));
 }
 // Explain the saved set-level evidence using the EXISTING planned-vs-actual
 // contract. It verifies exercise identity, load/reps, chronology and effort.
 // This is a training observation, never permission to edit future sessions.
 function learning(workout){
  const row=Feedback.compare(workout),matched=row.matchedSets,planned=row.plannedSets,effort=row.effortCompared,above=row.aboveCap;
  const base={version:1,status:row.status,verified:['within-cap','above-cap','missing-effort','different-work'].includes(row.status),
   plannedSets:planned,matchedSets:matched,effortCompared:effort,aboveCap:above,
   heading:'What this workout tells Loadnote',summary:'',nextStep:'',reasons:copy(row.reasons||[])};
  if(row.status==='within-cap'){
   base.summary=matched+'/'+planned+' planned strength sets matched logged load and reps; '+effort+' had paired target and actual RPE, all at or below the planned cap.';
   base.nextStep='This is adherence evidence, not proof that the next load should increase. Keep the scheduled targets until the normal review gate.';
  }else if(row.status==='above-cap'){
   base.summary=matched+'/'+planned+' planned strength sets matched logged load and reps; '+above+' of '+effort+' paired effort ratings exceeded target.';
   base.nextStep='The higher effort is recorded for the next eligible weekly or phase review. No automatic reduction or medical fatigue claim.';
  }else if(row.status==='missing-effort'){
   base.summary=matched+'/'+planned+' sets matched the captured load and reps, but '+row.missingRpe+' matched set'+(row.missingRpe===1?'':'s')+' lacked comparable RPE.';
   base.nextStep='Effort remains unknown for those sets. Enter actual RPE only when known; do not infer progression from the missing ratings.';
  }else if(row.status==='different-work'){
   base.summary=matched+'/'+planned+' planned strength sets matched recorded load and reps. Other work was changed, missing, or not directly comparable.';
   base.nextStep='Keep the actual workout as logged. Review substitutions or incomplete work before drawing a program-progression conclusion.';
  }else if(row.status==='unverified-timing'||row.status==='invalid-plan'){
   base.summary='The saved prescription cannot be verified as a valid plan captured before this workout.';
   base.nextStep='Preserve the session as history. Do not score this as prescribed effort or infer an adaptation from unverified plan timing.';
  }else if(row.status==='no-prior-plan'){
   base.summary='This workout has no saved pre-training prescription to compare against.';
   base.nextStep='The performed training remains in history. Capture a plan before a future session for an exact comparison.';
  }else{
   base.summary='There is no supported strength-set comparison for this workout.';
   base.nextStep='Keep the saved result. Other modalities and unverified work are not automatically treated as successful or failed strength prescriptions.';
  }
  return base;
 }
 function lifecycle(state,asOf){
  try{return Lifecycle.inspect(state,{asOf,draft:null,draftOpen:false});}catch{return null;}
 }
 function inspect(state,{asOf,workoutId}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid adaptive-handoff date');
  const workout=(state?.workouts||[]).find(w=>String(w.id)===String(workoutId));
  if(!workout)throw Error('Choose a saved workout for adaptive handoff');
  const continuity=Continuity.inspect(state,{asOf,workoutId:workout.id}),evidence=continuity.workoutEvidence,perf=performance(workout),signal=learning(workout),life=lifecycle(state,asOf),next=continuity.next;
  const linked=!!evidence?.linked,reviewKind=['review-week','review-phase'].includes(life?.nextAction?.kind)?life.nextAction.kind:null;
  const adaptation=next?Explanation.forSession(state,next.id):null;
  let status='unchanged',label='Next workout unchanged',reason='';
  if(!next){
   status='no-next';label='No later workout scheduled';
   reason='This workout is saved as training history, but there is no later scheduled session to compare or revise.';
  }else if(reviewKind){
   status='review-available';label=reviewKind==='review-week'?'Weekly review available':'Phase review available';
   reason=life.nextAction.detail+' No future prescription changes until you review and approve a supported choice.';
  }else if(adaptation?.changedLifts?.length){
   status='updated';label='Next workout updated';
   reason='An athlete-approved review changed the current scheduled prescription. The accepted before/after revision is shown below.';
  }else if(life?.nextAction?.kind==='resolve-overdue'){
   reason=life.nextAction.detail+' Loadnote keeps the next workout unchanged until those earlier sessions have explicit outcomes.';
  }else if(!linked){
   reason='This workout was not linked to a scheduled prescription, so saving it did not revise the reviewed program.';
  }else if(!evidence?.comparison){
   reason='The workout is linked to Calendar, but no comparable planned-work snapshot is available. The next prescription stays unchanged.';
  }else{
   reason='This session is recorded as evidence, but no review window is open yet. Loadnote does not revise the next workout from a single save outside the reviewed adaptation workflow.';
  }
  const changes=next&&status==='updated'?changedRows(state,next.id):[];
  return {
   version:1,asOf,workoutId:workout.id,status,label,reason,
   performance:perf,learning:signal,evidence:copy(evidence),next:copy(next),
   lifecycle:life?{status:life.status,program:copy(life.program),progress:copy(life.progress),nextAction:copy(life.nextAction)}:null,
   adaptation:copy(adaptation),changes,
   notice:'Adaptive handoff reports saved training evidence and accepted schedule revisions. It does not diagnose recovery or change a prescription without the existing review and athlete-approval workflow.'
  };
 }
 return {inspect,performance,learning,changedRows};
});