/* v2.44 — descriptive learning from approved adaptive decisions and subsequent exact training. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./phase-outcomes'),require('./meet-cycle'),require('./schedule'),require('./decision-readiness'),require('./session-intent'));
 else root.LoadnoteAdaptiveOutcomeLearning=factory(root.LoadnoteCore,root.LoadnotePhaseOutcomes,root.LoadnoteMeetCycle,root.LoadnoteSchedule,root.LoadnoteReadiness,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,PhaseOutcomes,MeetCycle,Schedule,Readiness,Intent){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const median=xs=>{const a=[...xs].sort((x,y)=>x-y),n=a.length;return n?n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2:null;};
 const round=x=>Core.round(x,1);
 const outcomeClass=x=>x==null?'unobserved':x>=1?'improved':x<=-1?'declined':'stable';
 function best(exercises,id){
   let value=null,rpe=null,count=0;
   for(const e of exercises||[])if(e.exerciseId===id&&e.type!=='cardio'&&e.trackBy!=='duration')for(const s of e.sets||[]){
     const ev=Core.capacityEvidence(s.weight,s.reps,s.rpe);
     if(ev.estimate==null)continue;count++;if(value==null||ev.estimate>value){value=ev.estimate;rpe=Number(s.rpe);}
   }
   return {value,rpe,count};
 }
 function cycleRows(state,{asOf,now}){
   const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',cycles=MeetCycle.validate(state.meetCycles||[]),schedule=Schedule.validate(state.scheduledSessions||[]),workouts=Readiness.workoutsAt(state,asOf,cutoff,false).workouts.filter(w=>iso(w.createdAt)&&w.createdAt<=cutoff),rows=[];
   for(const cycle of cycles)for(const review of cycle.weeklyReviews||[]){
     if(review.createdAt>cutoff||review.asOf>asOf)continue;
     for(const lift of LIFTS){
       const action=review.choices?.[lift]||'keep';if(action==='keep')continue;
       const id=review.report?.findings?.[lift]?.exerciseId;if(!id)continue;
       const baseSessions=cycle.sessions.filter(s=>s.week===review.week&&s.exercises.some(e=>e.exerciseId===id)),nextSessions=cycle.sessions.filter(s=>s.week===review.report?.nextWeek&&s.exercises.some(e=>e.exerciseId===id));
       const collect=(sessions,approvedAt,requireApproved)=>{
         const values=[],rpes=[];let expected=0,matched=0,sets=0,status='observed';
         for(const target of sessions){
           const sid='meet:'+cycle.id+':'+target.key,record=schedule.find(s=>s.id===sid),raw=(state.scheduledSessions||[]).find(s=>s.id===sid),ws=workouts.filter(w=>w.sessionIntent?.schedule?.id===sid);expected++;
           if(!record||!raw||ws.length!==1){status='incomplete';continue;}
           const w=ws[0],link=raw.revisions.find(v=>v.recordedAt===w.sessionIntent?.schedule?.revisionAt&&v.recordedAt<=w.createdAt);
           const approved=requireApproved?raw.revisions.find(v=>v.recordedAt===approvedAt):raw.revisions[0];
           if(!link||!approved||link.recordedAt!==approved.recordedAt||raw.revisions.some(v=>v.recordedAt>approved.recordedAt&&v.recordedAt<=w.createdAt)||w.date!==approved.context.date||!same(w.sessionIntent?.prescription,approved.context.prescription)||Intent.planTiming(approved.context.prescription,w.date,w.sessionIntent?.timing)!=='before-training'){status='revised-or-deviated';continue;}
           const actual=best(w.exercises,id);if(actual.value==null||actual.count<1){status='missing-rpe';continue;}
           values.push(actual.value);rpes.push(actual.rpe);sets+=actual.count;matched++;
         }
         return {status:matched===expected&&expected>0?status:'unobserved',expected,matched,sets,capacityKg:values.length?median(values):null,averageRpe:rpes.length?round(rpes.reduce((a,b)=>a+b,0)/rpes.length):null};
       };
       const baseline=collect(baseSessions,null,false),followup=collect(nextSessions,review.createdAt,true);
       const change=baseline.capacityKg>0&&followup.capacityKg>0&&baseline.sets>=2&&followup.sets>=2?round((followup.capacityKg/baseline.capacityKg-1)*100):null;
       rows.push({scope:'cycle',reviewId:review.id,programId:cycle.id,programName:cycle.sourceProgram?.config?.name||'Meet cycle',lift,exerciseId:id,action,acceptedAt:review.createdAt,baseline,followup,capacityChangePct:change,outcomeClass:outcomeClass(change),status:change==null?'unobserved':'observed'});
     }
   }
   return rows;
 }
 function phaseRows(state,{asOf,now}){
   const report=PhaseOutcomes.analyze(state,{asOf,now}),rows=[];
   for(const review of report.reviews)for(const lift of LIFTS){
     const f=review.findings[lift];if(!f||f.choice==='keep'||f.choice==='gather')continue;
     rows.push({scope:'phase',reviewId:review.reviewId,programId:review.programId,programName:review.programName,lift,exerciseId:f.exerciseId,action:f.choice,acceptedAt:review.acceptedAt,
       baseline:{capacityKg:f.baselineEstimateKg},followup:{capacityKg:f.followupEstimateKg,matched:f.matched,expected:f.expected,withinCap:f.withinCap,aboveCap:f.aboveCap},
       capacityChangePct:f.observedChangePct,outcomeClass:outcomeClass(f.observedChangePct),status:f.status==='observed-follow-up'?'observed':'unobserved'});
   }
   return rows;
 }
 function summarize(rows){
   const observed=rows.filter(r=>r.status==='observed'),groups={};
   for(const row of rows){const key=row.lift+'|'+row.action,arr=groups[key]||(groups[key]=[]);arr.push(row);}
   const patterns=Object.entries(groups).map(([key,all])=>{
     const [lift,action]=key.split('|'),obs=all.filter(r=>r.status==='observed'),changes=obs.map(r=>r.capacityChangePct).filter(Number.isFinite),counts={improved:0,stable:0,declined:0};for(const r of obs)counts[r.outcomeClass]++;
     const med=changes.length?round(median(changes)):null;
     let evidence='collecting',pattern='Not enough repeated follow-up yet.';
     if(obs.length>=3){evidence=obs.length>=6?'reviewable-history':'early-pattern';pattern=counts.improved>counts.declined&&med>=1?'Repeated follow-ups have more improved than declined observations.':counts.declined>counts.improved&&med<=-1?'Repeated follow-ups have more declined than improved observations.':'Repeated follow-ups are mixed or mostly stable.';}
     return {lift,action,recorded:all.length,observed:obs.length,unobserved:all.length-obs.length,counts,medianCapacityChangePct:med,evidence,pattern};
   }).sort((a,b)=>a.lift.localeCompare(b.lift)||a.action.localeCompare(b.action));
   return {recorded:rows.length,observed:observed.length,unobserved:rows.length-observed.length,patterns};
 }
 function analyze(state,{asOf,now=new Date().toISOString()}={}){
   if(!Schedule.date(asOf)||!iso(now))throw Error('Choose a valid adaptive outcome date');
   const rows=[...phaseRows(state,{asOf,now}),...cycleRows(state,{asOf,now})].sort((a,b)=>b.acceptedAt.localeCompare(a.acceptedAt)||a.lift.localeCompare(b.lift));
   return {version:1,asOf,rows,summary:summarize(rows),notice:'Descriptive follow-up only. Associations after an approved change do not prove that the change caused the result, and patterns do not automatically alter future programming.'};
 }
 return {LIFTS,outcomeClass,phaseRows,cycleRows,summarize,analyze};
});
