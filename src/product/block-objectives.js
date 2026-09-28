/* v2.43 — derive next-block objectives from goal distance plus frozen transition evidence. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./goal-programming'));
 else root.LoadnoteBlockObjectives=factory(root.LoadnoteGoalProgramming);
})(typeof globalThis!=='undefined'?globalThis:this,function(GoalProgramming){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const round=(x,n=1)=>{const p=10**n;return Math.round(Number(x)*p)/p;};
 function validTransition(x){return x&&x.version===1&&typeof x.id==='string'&&typeof x.programId==='string'&&typeof x.createdAt==='string'&&x.goalAtStart&&x.schedule&&x.lifts;}
 function latestTransition(state,goalId,asOf){
   return (state.transitionSnapshots||[]).filter(validTransition).filter(x=>x.asOf<=asOf&&x.goalAtStart?.status==='ready'&&x.goalAtStart?.goal?.id===goalId).sort((a,b)=>a.asOf.localeCompare(b.asOf)||a.createdAt.localeCompare(b.createdAt)).at(-1)||null;
 }
 function adjustmentCount(snapshot,lift){
   let n=0;for(const review of snapshot?.decisionHistory?.phaseReviews||[]){const action=review?.choices?.[lift];if(action&&action!=='keep')n++;}return n;
 }
 function responseObjective(goalLift,transitionLift,schedule,adjustments,{sameExercise=true}={}){
   const base=goalLift?.objective||{code:'no-target',label:'No lift target',reason:'No target context is available.'};
   if(!goalLift?.targetKg)return {code:'no-target',label:'No lift target',reason:'No explicit target is saved for this lift.',source:'goal-only',base};
   if(!transitionLift||!sameExercise)return {code:base.code,label:base.label,reason:(transitionLift&&!sameExercise?'The competition exercise identity changed since the last transition, so its response is not used. ':'No comparable frozen transition response is available. ')+base.reason,source:'goal-only',base};
   const expected=Number(schedule?.expected||0),completed=Number(schedule?.completed||0),coverage=expected?completed/expected:null,pending=Number(schedule?.unconfirmed||0)+Number(schedule?.upcoming||0),change=Number.isFinite(Number(transitionLift.changePct))?Number(transitionLift.changePct):null,rpe=Number.isFinite(Number(transitionLift.recent28d?.averageRpe))?Number(transitionLift.recent28d.averageRpe):null;
   if(coverage==null||coverage<.75||pending>0)return {code:'restore-consistency',label:'Restore consistent training exposure',reason:'The prior block has insufficient completed-session coverage for an aggressive response-based progression. Preserve the long-term goal direction while rebuilding a cleaner evidence base.',source:'transition',base,signals:{coveragePct:coverage==null?null:round(coverage*100),changePct:change,averageRpe:rpe,adjustments}};
   if(change==null)return {code:'establish-response',label:'Establish a clearer block response',reason:'The block was sufficiently covered, but no comparable competition-lift capacity change is available. Keep the next block evidence-focused rather than escalating from an unknown response.',source:'transition',base,signals:{coveragePct:round(coverage*100),changePct:null,averageRpe:rpe,adjustments}};
   if(change<=-2||rpe!=null&&rpe>=9)return {code:'rebuild-tolerance',label:'Rebuild tolerable loading',reason:'The prior block ended with a declining capacity comparison or very high recent effort. Use the next block to restore productive training tolerance before adding more stress.',source:'transition',base,signals:{coveragePct:round(coverage*100),changePct:change,averageRpe:rpe,adjustments}};
   if(change>=2&&rpe!=null&&rpe<=8.5)return {code:'continue-productive',label:'Continue productive progression',reason:'The prior block had strong coverage, a positive competition-lift capacity comparison, and manageable recent effort. Continue progressing while preserving the existing weekly adaptation safeguards.',source:'transition',base,signals:{coveragePct:round(coverage*100),changePct:change,averageRpe:rpe,adjustments}};
   if(change>=1)return {code:'continue-cautious',label:'Continue with conservative progression',reason:'The prior block shows a positive capacity comparison, but not enough combined evidence for a more aggressive progression objective. Keep the goal direction and progress conservatively.',source:'transition',base,signals:{coveragePct:round(coverage*100),changePct:change,averageRpe:rpe,adjustments}};
   return {code:'consolidate-response',label:'Consolidate and reassess',reason:'The prior block was adequately completed but the competition-lift capacity comparison was essentially flat. Consolidate productive work and reassess before increasing program stress.',source:'transition',base,signals:{coveragePct:round(coverage*100),changePct:change,averageRpe:rpe,adjustments}};
 }
 function shape(lifts){
   const codes=Object.values(lifts).filter(x=>x.targetKg).map(x=>x.nextObjective.code);
   if(!codes.length)return null;
   if(codes.some(c=>c==='restore-consistency'||c==='rebuild-tolerance'))return {label:'Rebuild-development block',accumulationWeeks:4,strengthWeeks:2,deloadWeeks:1,driver:codes.find(c=>c==='restore-consistency'||c==='rebuild-tolerance')};
   if(codes.some(c=>c==='establish-response'||c==='long-range-development'||c==='establish-baseline'))return {label:'Development block',accumulationWeeks:4,strengthWeeks:3,deloadWeeks:1,driver:codes.find(c=>['establish-response','long-range-development','establish-baseline'].includes(c))};
   if(codes.some(c=>c==='consolidate-response'))return {label:'Consolidation block',accumulationWeeks:3,strengthWeeks:3,deloadWeeks:1,driver:'consolidate-response'};
   if(codes.every(c=>c==='continue-productive'||c==='continue-cautious'||c==='specific-strength'||c==='verify-target'||c==='consolidate-target'))return {label:'Strength-focused block',accumulationWeeks:2,strengthWeeks:4,deloadWeeks:1,driver:'productive-response'};
   return {label:'Strength-development block',accumulationWeeks:3,strengthWeeks:4,deloadWeeks:1,driver:'mixed-response'};
 }
 function inspect(state,{asOf,knownAt,goalId,config}={}){
   const goal=GoalProgramming.inspect(state,{asOf,knownAt,goalId,config});
   if(goal.status!=='ready')return {version:1,asOf,status:goal.status,goalProgramming:goal,transition:null,lifts:{},recommendation:null,summary:goal.summary};
   const transition=latestTransition(state,goal.goal.id,asOf),lifts={};
   for(const lift of LIFTS){
     const current=goal.lifts[lift],prior=transition?.lifts?.[lift]||null,same=!transition||!prior||!config?.lifts?.[lift]?.exerciseId||prior.exerciseId===config.lifts[lift].exerciseId,adjustments=adjustmentCount(transition,lift),nextObjective=responseObjective(current,prior,transition?.schedule,adjustments,{sameExercise:same});
     lifts[lift]={...copy(current),transition:prior?{programId:transition.programId,programName:transition.programName,asOf:transition.asOf,exerciseId:prior.exerciseId,changePct:prior.changePct,recent28d:copy(prior.recent28d),coverage:copy(transition.schedule),adjustments,sameExercise}:null,nextObjective};
   }
   const recommendation=shape(lifts);
   return {version:1,asOf,status:'ready',goalProgramming:goal,transition:transition?{id:transition.id,programId:transition.programId,programName:transition.programName,asOf:transition.asOf,createdAt:transition.createdAt}:null,lifts,recommendation:recommendation?{...recommendation,totalWeeks:recommendation.accumulationWeeks+recommendation.strengthWeeks+recommendation.deloadWeeks,reason:'Whole-program phase duration follows the most conservative unresolved lift objective. Per-lift training maxes, exercises, frequency, sets and weekly changes remain separately reviewed.'}:null,
    summary:(transition?'Latest frozen transition: '+transition.programName+' ('+transition.asOf+'). ':'No frozen transition is available yet; goal-distance objectives remain primary. ')+(recommendation?recommendation.label+' · '+(recommendation.accumulationWeeks+recommendation.strengthWeeks+recommendation.deloadWeeks)+' weeks.':''),
    notes:['Goal distance sets long-term direction; frozen transition evidence sets the immediate next-block objective.','Low coverage blocks cannot justify aggressive progression.','Capacity comparisons and RPE are descriptive training signals, not diagnoses or proof of causation.','The most conservative lift can lengthen development emphasis without automatically changing any lift-specific prescription.']};
 }
 return {LIFTS,latestTransition,adjustmentCount,responseObjective,shape,inspect};
});
