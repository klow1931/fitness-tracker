/* v2.42 — immutable end-of-program transition baseline for goal-aware phase programs. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./phase-builder'),require('./decision-readiness'),require('./schedule'),require('./goal-programming'));
 else root.LoadnoteTransitionBaseline=factory(root.LoadnoteCore,root.LoadnotePhaseBuilder,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteGoalProgramming);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,PhaseBuilder,Readiness,Schedule,GoalProgramming){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'));
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const round=(x,n=1)=>{const p=10**n;return Math.round(Number(x)*p)/p;};
 function endDate(program){return [...(program.sessions||[])].map(s=>s.date).filter(date).sort().at(-1)||null;}
 function exactWorkload(workouts,id,from,to){
   const rows=(workouts||[]).filter(w=>w.date>=from&&w.date<=to),dates=new Set();let sets=0,volumeKg=0,rpe=0,rpeN=0,bestLoad=null;
   for(const w of rows)for(const e of w.exercises||[]){if(e.exerciseId!==id||e.type==='cardio'||e.trackBy==='duration')continue;dates.add(w.date);for(const s of e.sets||[]){const weight=Number(s.weight),reps=Number(s.reps),effort=Number(s.rpe);if(!(weight>0&&Number.isInteger(reps)&&reps>0))continue;sets++;volumeKg+=weight*reps;if(Number.isFinite(effort)&&effort>=1&&effort<=10){rpe+=effort;rpeN++;}if(bestLoad===null||weight>bestLoad)bestLoad=weight;}}
   return {sessions:dates.size,sets,volumeKg:round(volumeKg,1),averageRpe:rpeN?round(rpe/rpeN,1):null,rpeSets:rpeN,bestLoggedLoadKg:bestLoad};
 }
 function validate(records){
   if(!Array.isArray(records)||records.length>250)throw Error('Invalid transition baselines');const ids=new Set(),programs=new Set();
   return records.map(r=>{
     if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.programId!=='string'||!r.programId||programs.has(r.programId)||!iso(r.createdAt)||!date(r.asOf)||!date(r.programEnd)||r.asOf<r.programEnd||typeof r.programName!=='string'||!r.programName||!r.review||r.review.confirmed!==true||r.review.recordedAt!==r.createdAt||typeof r.review.notes!=='string'||r.review.notes.length>1000)throw Error('Invalid transition baseline');
     ids.add(r.id);programs.add(r.programId);
     if(!r.schedule||!Number.isInteger(r.schedule.expected)||r.schedule.expected<1||!Number.isInteger(r.schedule.completed)||r.schedule.completed<0||r.schedule.completed>r.schedule.expected||r.schedule.adherence!==null&&!Number.isFinite(r.schedule.adherence))throw Error('Invalid transition schedule evidence');
     if(!r.lifts||LIFTS.some(l=>!r.lifts[l]||r.lifts[l].lift!==l))throw Error('Invalid transition lift evidence');
     return copy(r);
   });
 }
 function preview(state,{programId,asOf,knownAt,now=new Date().toISOString()}={}){
   if(!date(asOf)||!iso(now)||knownAt&&!iso(knownAt))throw Error('Choose a valid transition review date');
   const programs=PhaseBuilder.validate(state.phasePrograms||[]),program=programs.find(p=>p.id===programId);
   if(!program||!program.scheduledAt)throw Error('Choose a scheduled reviewed phase program');
   const through=endDate(program);if(!through||asOf<through)throw Error('This program has not reached its final scheduled date');
   if((state.transitionSnapshots||[]).some(x=>x.programId===program.id))throw Error('A transition baseline already exists for this program');
   const cutoff=[asOf+'T23:59:59.999Z',now,...(knownAt?[knownAt]:[])].sort()[0];
   const workouts=Readiness.workoutsAt(state,asOf,cutoff,false).workouts;
   const ids=new Set(program.sessions.map(s=>'phase:'+program.id+':'+s.key));
   const summary=Schedule.summary(state.scheduledSessions||[],workouts,{from:program.config.startDate,to:through,asOf,knownAt:cutoff});
   const scoped=summary.sessions.filter(s=>ids.has(s.id)),counts={completed:0,skipped:0,cancelled:0,unconfirmed:0,scheduled:0};for(const s of scoped)counts[s.state]=(counts[s.state]||0)+1;
   const resolved=counts.completed+counts.skipped,adherence=resolved?round(counts.completed/resolved*100,1):null;
   const readiness=Readiness.snapshot(state,{asOf,knownAt:cutoff,retrospective:false}),recentFrom=move(asOf,-27),lifts={};
   for(const lift of LIFTS){
     const cfg=program.config.lifts[lift],r=readiness.lifts[lift],workload=exactWorkload(workouts,cfg.exerciseId,recentFrom,asOf);
     const start=program.goalSnapshot?.lifts?.[lift]||null,current=Number(r?.evidence?.estimatedCapacity?.kg)>0?{kg:Number(r.evidence.estimatedCapacity.kg),date:r.evidence.estimatedCapacity.date,source:r.evidence.estimatedCapacity.source}:Number(r?.evidence?.known1RM?.kg)>0?{kg:Number(r.evidence.known1RM.kg),date:r.evidence.known1RM.observedOn||null,source:'known 1RM'}:null;
     const startKg=Number(start?.reference?.kg),endKg=Number(current?.kg),changePct=startKg>0&&endKg>0?round((endKg/startKg-1)*100,1):null;
     lifts[lift]={lift,name:cfg.name,exerciseId:cfg.exerciseId,targetKg:Number(start?.targetKg)||null,startReference:start?.reference?copy(start.reference):null,currentReference:current,changePct,selectedTrainingMaxKg:cfg.trainingMaxKg,readiness:r?.status||'not-ready',recent28d:workload,prescription:copy(r?.metrics?.prescription||null)};
   }
   let currentGoal=null;try{currentGoal=GoalProgramming.inspect(state,{asOf,knownAt:cutoff,goalId:program.goalSnapshot?.goal?.id,config:program.config});}catch(e){currentGoal={status:'unavailable',summary:e.message};}
   const reviews=(state.phaseReviews||[]).filter(x=>x.programId===program.id&&iso(x.createdAt)&&x.createdAt<=cutoff).map(x=>({id:x.id,phase:x.phase,createdAt:x.createdAt,choices:copy(x.choices||{}),policy:x.policy||null}));
   return {version:1,programId:program.id,programName:program.config.name,programCreatedAt:program.createdAt,programStart:program.config.startDate,programEnd:through,asOf,knowledgeCutoff:cutoff,goalAtStart:copy(program.goalSnapshot||null),goalAtTransition:copy(currentGoal),schedule:{expected:scoped.length,completed:counts.completed,skipped:counts.skipped,cancelled:counts.cancelled,unconfirmed:counts.unconfirmed,upcoming:counts.scheduled,adherence,definition:'Completed / (completed + explicitly skipped). Cancelled and unconfirmed sessions remain visible but are excluded from the denominator.'},lifts,decisionHistory:{phaseReviews:reviews,count:reviews.length},notes:['This is a transition snapshot of recorded evidence, not a new max test or a readiness diagnosis.','Estimated-capacity changes are descriptive and do not prove the program caused the change.','Missing, skipped, cancelled or unconfirmed sessions remain part of the handoff context.','Future programming should compare against this frozen record rather than silently recomputing what was known at transition.']};
 }
 function save(state,report,{confirmed=false,notes=''}={}, {now=new Date().toISOString(),id=Core.createId()}={}){
   if(!confirmed||typeof notes!=='string'||notes.length>1000||!iso(now))throw Error('Review the transition evidence before saving');
   const fresh=preview(state,{programId:report.programId,asOf:report.asOf,knownAt:report.knowledgeCutoff,now});
   if(JSON.stringify(fresh)!==JSON.stringify(report))throw Error('Training, goal, schedule or decision evidence changed; review a fresh transition snapshot');
   const record={...copy(fresh),id,createdAt:now,review:{confirmed:true,recordedAt:now,notes:notes.trim()}};
   return {...state,transitionSnapshots:validate([...(state.transitionSnapshots||[]),record])};
 }
 return {LIFTS,endDate,exactWorkload,validate,preview,save};
});
