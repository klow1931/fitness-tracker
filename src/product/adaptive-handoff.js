/* v2.71 — deterministic post-session adaptive handoff.
 * Describes what was learned from a saved workout and whether the next
 * reviewed prescription changed, needs athlete review, or remains unchanged.
 * This module never mutates training data or applies an adaptation.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(
  require('./schedule'),require('./session-intent'),require('./training-continuity'),
  require('./program-lifecycle'),require('./adaptation-explanation')
 );
 else root.LoadnoteAdaptiveHandoff=factory(
  root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteTrainingContinuity,
  root.LoadnoteProgramLifecycle,root.LoadnoteAdaptationExplanation
 );
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule,Intent,Continuity,Lifecycle,Explanation){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const round=(x,d=1)=>{const p=10**d;return Math.round(Number(x)*p)/p;};
 const validRpe=x=>Number.isFinite(Number(x))&&Number(x)>=1&&Number(x)<=10;
 const mode=e=>e?.type==='cardio'?'cardio':e?.trackBy==='duration'?'duration':'reps';
 const key=e=>e?.exerciseId?'id:'+String(e.exerciseId)+'|'+mode(e):'name:'+String(e?.name||'').trim().toLowerCase()+'|'+mode(e);
 const strengthSets=e=>(e?.sets||[]).filter(s=>Number(s?.[e?.trackBy==='duration'?'duration':'reps'])>0);
 function groups(exercises){
  const out=new Map();
  for(const e of exercises||[]){
   if(e?.type==='cardio')continue;
   const k=key(e);
   if(!out.has(k))out.set(k,{key:k,name:e.name||'Exercise',exerciseId:e.exerciseId||null,trackBy:e.trackBy==='duration'?'duration':'reps',sets:[]});
   out.get(k).sets.push(...strengthSets(e));
  }
  return out;
 }
 function performance(workout){
  const comparison=Intent.compare(workout);
  const plan=workout?.sessionIntent?.prescription;
  if(!plan)return {comparison:null,exercises:[],comparableRpeSets:0,averageTargetRpe:null,averageActualRpe:null,averageRpeDelta:null};
  const planned=groups(plan.plannedExercises),actual=groups(workout.exercises||[]),exercises=[];
  let targetTotal=0,actualTotal=0,paired=0;
  for(const [k,p] of planned){
   const a=actual.get(k),n=Math.min(p.sets.length,a?.sets?.length||0);
   let pTarget=0,pActual=0,pairs=0;
   for(let i=0;i<n;i++){
    const target=p.sets[i]?.targetRpe,rpe=a.sets[i]?.rpe;
    if(validRpe(target)&&validRpe(rpe)){pTarget+=Number(target);pActual+=Number(rpe);pairs++;targetTotal+=Number(target);actualTotal+=Number(rpe);paired++;}
   }
   exercises.push({
    key:k,name:p.name,exerciseId:p.exerciseId,plannedSets:p.sets.length,completedSets:Math.min(p.sets.length,a?.sets?.length||0),
    comparableRpeSets:pairs,averageTargetRpe:pairs?round(pTarget/pairs):null,averageActualRpe:pairs?round(pActual/pairs):null,
    averageRpeDelta:pairs?round((pActual-pTarget)/pairs):null
   });
  }
  return {comparison,exercises,comparableRpeSets:paired,averageTargetRpe:paired?round(targetTotal/paired):null,averageActualRpe:paired?round(actualTotal/paired):null,averageRpeDelta:paired?round((actualTotal-targetTotal)/paired):null};
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
 function lifecycle(state,asOf){
  try{return Lifecycle.inspect(state,{asOf,draft:null,draftOpen:false});}catch{return null;}
 }
 function inspect(state,{asOf,workoutId}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid adaptive-handoff date');
  const workout=(state?.workouts||[]).find(w=>String(w.id)===String(workoutId));
  if(!workout)throw Error('Choose a saved workout for adaptive handoff');
  const continuity=Continuity.inspect(state,{asOf,workoutId:workout.id}),evidence=continuity.workoutEvidence,perf=performance(workout),life=lifecycle(state,asOf),next=continuity.next;
  const linked=!!evidence?.linked,reviewKind=['review-week','review-phase'].includes(life?.nextAction?.kind)?life.nextAction.kind:null;
  const adaptation=next?Explanation.forSession(state,next.id):null;
  let status='unchanged',label='Next workout unchanged',reason='';
  if(!next){
   status='no-next';label='No later workout scheduled';
   reason='This workout is saved as training history, but there is no later scheduled session to compare or revise.';
  }else if(adaptation?.changedLifts?.length){
   status='updated';label='Next workout updated';
   reason='An athlete-approved review changed the current scheduled prescription. The accepted before/after revision is shown below.';
  }else if(reviewKind){
   status='review-available';label=reviewKind==='review-week'?'Weekly review available':'Phase review available';
   reason=life.nextAction.detail+' No future prescription changes until you review and approve a supported choice.';
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
   performance:perf,evidence:copy(evidence),next:copy(next),
   lifecycle:life?{status:life.status,program:copy(life.program),progress:copy(life.progress),nextAction:copy(life.nextAction)}:null,
   adaptation:copy(adaptation),changes,
   notice:'Adaptive handoff reports saved training evidence and accepted schedule revisions. It does not diagnose recovery or change a prescription without the existing review and athlete-approval workflow.'
  };
 }
 return {inspect,performance,changedRows};
});