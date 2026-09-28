/* v2.40 — bridge athlete strength goals into reviewed programming context without turning targets into prescriptions. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./athlete-goals'),require('./decision-readiness'),require('./programming-profile'));
 else root.LoadnoteGoalProgramming=factory(root.LoadnoteGoals,root.LoadnoteReadiness,root.LoadnoteProgrammingProfile);
})(typeof globalThis!=='undefined'?globalThis:this,function(Goals,Readiness,Profile){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const round=x=>Math.round(Number(x)*10)/10;
 function powerlifting(goal){return String(goal?.sport||'').trim().toLowerCase()==='powerlifting';}
 function reference(row){
   const e=row?.evidence||{};
   if(Number(e.estimatedCapacity?.kg)>0)return {kg:Number(e.estimatedCapacity.kg),kind:'estimated-capacity',date:e.estimatedCapacity.date||null,label:'Latest RPE-aware estimated capacity',estimated:true};
   if(Number(e.known1RM?.kg)>0)return {kg:Number(e.known1RM.kg),kind:'known-1rm',date:e.known1RM.observedOn||e.known1RM.date||null,label:'Known 1RM',estimated:false};
   if(Number(e.profileBenchmark?.kg)>0)return {kg:Number(e.profileBenchmark.kg),kind:'profile-benchmark',date:null,label:'Profile benchmark',estimated:false};
   return null;
 }
 function objective(target,ref){
   if(!target)return {code:'no-target',label:'No lift target',reason:'No explicit long-term target is saved for this lift.'};
   if(!ref)return {code:'establish-baseline',label:'Establish a trustworthy baseline',reason:'A target exists, but there is not enough supported competition-lift evidence to quantify the current gap.'};
   const gap=target-ref.kg,pct=gap/ref.kg*100;
   if(gap<=0)return {code:ref.estimated?'verify-target':'consolidate-target',label:ref.estimated?'Verify target-level strength':'Consolidate target-level strength',reason:ref.estimated?'Estimated capacity is at or above the target, but an estimate does not establish that the target lift has been achieved.':'The current reference is at or above the saved target; the next block should consolidate performance rather than force a larger jump.'};
   if(pct<=5)return {code:'specific-strength',label:'Close the remaining strength gap',reason:'The target is within 5% of the current reference. Keep progression specific and evidence-led rather than accelerating the weekly loading rate.'};
   if(pct<=15)return {code:'build-strength',label:'Build competition-lift strength',reason:'The target is 5–15% above the current reference. Use the next block to improve demonstrated competition-lift capacity while preserving execution quality.'};
   return {code:'long-range-development',label:'Long-range strength development',reason:'The target is more than 15% above the current reference. Treat it as a multi-block direction, not a near-term loading instruction.'};
 }
 function inspect(state,{asOf,knownAt,goalId,config}={}){
   if(!asOf||!/^\d{4}-\d{2}-\d{2}$/.test(asOf))throw Error('A valid goal-programming review date is required');
   const goals=Goals.list(state.athleteGoals||[],knownAt).filter(g=>g.status==='active'&&powerlifting(g)&&Array.isArray(g.targets)&&g.targets.length);
   let goal=null,selection='none';
   if(goalId){goal=goals.find(g=>g.id===goalId)||null;if(!goal)throw Error('Selected active powerlifting goal is unavailable');selection='explicit';}
   else if(goals.length===1){goal=goals[0];selection='single-active';}
   else if(goals.length>1){return {version:1,asOf,status:'ambiguous',selection:'ambiguous',goal:null,lifts:{},summary:'Multiple active powerlifting goals contain lift targets. Keep the programs unchanged until one goal is selected or the others are archived.',notes:['Goal targets never become training maxes or direct load prescriptions.','No timeline is inferred from target distance alone.']};}
   if(!goal)return {version:1,asOf,status:'no-goal',selection,goal:null,lifts:{},summary:'No active powerlifting goal with squat, bench or deadlift targets is available. Programming remains evidence-led without a long-term target snapshot.',notes:['A target date is optional.','Goal targets never become training maxes or direct load prescriptions.']};
   const ready=Readiness.snapshot(state,{asOf,knownAt,retrospective:false}),profile=Profile.current(state.programmingProfiles||[],knownAt),lifts={};
   for(const lift of LIFTS){
     const t=goal.targets.find(x=>x.lift===lift),targetKg=t?Number(t.kg):null,row=ready.lifts[lift],ref=reference(row),gapKg=targetKg&&ref?round(targetKg-ref.kg):null,gapPct=targetKg&&ref?round((targetKg-ref.kg)/ref.kg*100):null,obj=objective(targetKg,ref),selectedTm=Number(config?.lifts?.[lift]?.trainingMaxKg);
     lifts[lift]={lift,name:row?.competitionExercise||lift,targetKg,reference:ref,gapKg,gapPct,readiness:row?.status||'not-ready',trainingMaxKg:Number(row?.evidence?.trainingMax?.kg)>0?Number(row.evidence.trainingMax.kg):null,selectedProgramTrainingMaxKg:selectedTm>0?selectedTm:null,objective:obj,horizon:{kind:'not-estimated',label:'No target date required',reason:'Loadnote does not infer a calendar date from a strength gap alone. Reassess after the next reviewed block as additional performance evidence accumulates.'}};
   }
   const targeted=Object.values(lifts).filter(x=>x.targetKg),withReference=targeted.filter(x=>x.reference);
   const objectiveCodes=[...new Set(targeted.map(x=>x.objective.code))];
   return {version:1,asOf,status:'ready',selection,goal:{id:goal.id,name:goal.name,eventDate:goal.eventDate||null,updatedAt:goal.updatedAt,targets:copy(goal.targets)},profileId:profile?.id||null,lifts,
    summary:(goal.eventDate?'Goal has a saved target date. ':'No target date is required. ')+(withReference.length===targeted.length?'All targeted lifts have a current comparison reference.':'Some targeted lifts still need stronger baseline evidence.')+' Block objectives: '+objectiveCodes.join(', ')+'.',
    notes:['Targets are long-term aspirations, not training maxes, tested maxes or automatic prescriptions.','Estimated capacity can describe distance to a target but does not prove the target has been achieved.','Goal distance changes block context only; weekly load/set decisions still require the separate evidence and approval rules.']};
 }
 return {LIFTS,inspect,reference,objective};
});
