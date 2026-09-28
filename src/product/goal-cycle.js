/* v2.41 — date-free strength-goal cycles and evidence-bound block horizons. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./goal-programming'),require('./phase-builder'),require('./decision-readiness'));
 else root.LoadnoteGoalCycle=factory(root.LoadnoteGoalProgramming,root.LoadnotePhaseBuilder,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(GoalProgramming,PhaseBuilder,Readiness){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const round=x=>Math.round(Number(x)*10)/10;
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const median=xs=>{const a=[...xs].sort((a,b)=>a-b),n=a.length;return n?a.length%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2:null;};
 function blockShape(code){
   if(code==='establish-baseline'||code==='long-range-development')return {accumulationWeeks:4,strengthWeeks:3,deloadWeeks:1,label:'Development block'};
   if(code==='build-strength')return {accumulationWeeks:3,strengthWeeks:4,deloadWeeks:1,label:'Strength-development block'};
   if(code==='specific-strength')return {accumulationWeeks:2,strengthWeeks:4,deloadWeeks:1,label:'Specific-strength block'};
   return {accumulationWeeks:2,strengthWeeks:3,deloadWeeks:1,label:'Consolidation block'};
 }
 function overallShape(lifts){
   const rank={'establish-baseline':0,'long-range-development':1,'build-strength':2,'specific-strength':3,'verify-target':4,'consolidate-target':4,'no-target':0};
   const targeted=Object.values(lifts).filter(x=>x.targetKg),codes=targeted.map(x=>x.objective.code);
   if(!codes.length)return null;
   const code=codes.sort((a,b)=>rank[a]-rank[b])[Math.floor((codes.length-1)/2)];
   return {objectiveCode:code,...blockShape(code)};
 }
 function endDate(program){
   const dates=(program.sessions||[]).map(s=>s.date).filter(Boolean).sort();
   return dates.at(-1)||null;
 }
 function competitionId(snapshot,lift){
   return snapshot?.lifts?.[lift]?.relatedExercises?.find(x=>x.role==='competition')?.exerciseId||null;
 }
 function blockResponses(state,current,asOf){
   const programs=PhaseBuilder.validate(state.phasePrograms||[]).filter(p=>p.scheduledAt&&p.goalSnapshot?.status==='ready'&&p.goalSnapshot.goal?.id===current.goal?.id);
   const rows=[];
   for(const p of programs){
     const through=endDate(p);if(!through||through>asOf)continue;
     let end;
     try{end=Readiness.snapshot(state,{asOf:through,knownAt:through+'T23:59:59.999Z',retrospective:false});}catch(e){continue;}
     const lifts={};
     for(const lift of LIFTS){
       const start=p.goalSnapshot.lifts?.[lift],startRef=Number(start?.reference?.kg),endRef=Number(end.lifts?.[lift]?.evidence?.estimatedCapacity?.kg),sameExercise=competitionId(end,lift)===p.config.lifts?.[lift]?.exerciseId;
       const comparable=startRef>0&&endRef>0&&sameExercise;
       const changePct=comparable?round((endRef/startRef-1)*100):null;
       lifts[lift]={comparable,startKg:startRef>0?startRef:null,endKg:endRef>0?endRef:null,changePct,exerciseId:p.config.lifts?.[lift]?.exerciseId||null};
     }
     rows.push({programId:p.id,name:p.config.name,createdAt:p.createdAt,through,lifts});
   }
   return rows.sort((a,b)=>a.through.localeCompare(b.through)||a.programId.localeCompare(b.programId));
 }
 function horizon(currentLift,responses,lift){
   if(!currentLift?.targetKg||!currentLift.reference)return {kind:'not-estimated',label:'No block range yet',reason:'A current target and comparison reference are required.'};
   if(currentLift.gapKg<=0)return {kind:'target-level',label:'Target-level evidence reached',reason:'The current comparison reference is at or above the saved target. Verify or consolidate rather than projecting additional blocks.'};
   const history=responses.map(r=>r.lifts[lift]).filter(x=>x?.comparable&&Number.isFinite(x.changePct));
   if(history.length<2)return {kind:'not-estimated',label:'Need more completed blocks',reason:'At least two completed, comparable goal-aware blocks are required before estimating a personal block range.',comparableBlocks:history.length};
   const gains=history.map(x=>x.changePct).filter(x=>x>0);
   if(gains.length<2)return {kind:'not-estimated',label:'No stable positive block trend yet',reason:'Two or more comparable blocks exist, but there is not yet a repeated positive capacity trend to support a goal horizon.',comparableBlocks:history.length,positiveBlocks:gains.length};
   const typical=median(gains),lowRate=Math.max(.1,typical*.5),highRate=Math.max(lowRate,typical*1.25),ratio=currentLift.targetKg/currentLift.reference.kg;
   const blocksAt=rate=>Math.ceil(Math.log(ratio)/Math.log(1+rate/100));
   let min=Math.max(1,blocksAt(highRate)),max=Math.max(min,blocksAt(lowRate));
   if(max>12)return {kind:'long-range',label:'More than 12 similar productive blocks',reason:'The remaining gap is too large relative to the athlete’s observed positive block-response rate for a useful bounded range. Reassess after each block.',comparableBlocks:history.length,positiveBlocks:gains.length,medianPositiveChangePct:round(typical)};
   return {kind:'block-range',label:min===max?min+' productive block'+(min===1?'':'s'):min+'–'+max+' productive blocks',minBlocks:min,maxBlocks:max,reason:'Range is based on the athlete’s completed comparable goal-aware blocks and will be recalculated after each block. It is not a calendar-date prediction.',comparableBlocks:history.length,positiveBlocks:gains.length,medianPositiveChangePct:round(typical)};
 }
 function inspect(state,{asOf,knownAt,goalId,config}={}){
   const current=GoalProgramming.inspect(state,{asOf,knownAt,goalId,config});
   if(current.status!=='ready')return {version:1,asOf,status:current.status,goalProgramming:current,responses:[],recommendation:null,lifts:{},summary:current.summary};
   const responses=blockResponses(state,current,asOf),lifts={};
   for(const lift of LIFTS)lifts[lift]={...copy(current.lifts[lift]),horizon:horizon(current.lifts[lift],responses,lift)};
   const recommendation=overallShape(lifts);
   return {version:1,asOf,status:'ready',goalProgramming:current,responses,lifts,recommendation:recommendation?{...recommendation,totalWeeks:recommendation.accumulationWeeks+recommendation.strengthWeeks+recommendation.deloadWeeks,reason:'The next sequence is selected from the current goal-distance objectives. It changes phase emphasis only; training maxes, exercise selection, exposure frequency and set counts still require normal athlete review.'}:null,
    summary:(recommendation?recommendation.label+' · '+(recommendation.accumulationWeeks+recommendation.strengthWeeks+recommendation.deloadWeeks)+' weeks. ':'')+'Goal horizons are expressed in productive blocks only when personal completed-block evidence is sufficient.',
    notes:['No event or PR date is required.','A block range is descriptive planning context, not a promise that the target will be achieved in that many blocks.','Only positive, comparable completed goal-aware blocks contribute to a horizon; changed competition-lift identity or missing capacity evidence is excluded.','The recommended phase shape never changes training maxes, sets, exercise selection or weekly adaptive rules automatically.']};
 }
 function applyToConfig(cycle,raw){
   if(!cycle?.recommendation||!raw)throw Error('A goal-cycle recommendation and phase configuration are required');
   const c=copy(raw);
   c.phases=[{type:'accumulation',weeks:cycle.recommendation.accumulationWeeks},{type:'strength',weeks:cycle.recommendation.strengthWeeks},{type:'deload',weeks:1}];
   return c;
 }
 return {LIFTS,blockShape,overallShape,blockResponses,horizon,inspect,applyToConfig};
});
