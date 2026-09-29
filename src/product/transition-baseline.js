/* v2.61 — immutable end-of-program transition baseline for phase programs and meet cycles. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./phase-builder'),require('./decision-readiness'),require('./schedule'),require('./goal-programming'),require('./meet-cycle'));
 else root.LoadnoteTransitionBaseline=factory(root.LoadnoteCore,root.LoadnotePhaseBuilder,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteGoalProgramming,root.LoadnoteMeetCycle);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,PhaseBuilder,Readiness,Schedule,GoalProgramming,MeetCycle){
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
     if(r.programType!=null&&!['phase-program','meet-cycle'].includes(r.programType))throw Error('Invalid transition program type');
     ids.add(r.id);programs.add(r.programId);
     if(!r.schedule||!Number.isInteger(r.schedule.expected)||r.schedule.expected<1||!Number.isInteger(r.schedule.completed)||r.schedule.completed<0||r.schedule.completed>r.schedule.expected||r.schedule.adherence!==null&&!Number.isFinite(r.schedule.adherence))throw Error('Invalid transition schedule evidence');
     if(!r.lifts||LIFTS.some(l=>!r.lifts[l]||r.lifts[l].lift!==l))throw Error('Invalid transition lift evidence');
     if(r.event!=null&&(r.programType!=='meet-cycle'||!['mock','competition'].includes(r.event.type)||!date(r.event.date)||typeof r.event.resultRecorded!=='boolean'))throw Error('Invalid transition event evidence');
     return copy(r);
   });
 }
 function source(state,programId){
   const phase=PhaseBuilder.validate(state.phasePrograms||[]).find(p=>p.id===programId)||null;
   const meet=MeetCycle?.validate?MeetCycle.validate(state.meetCycles||[]).find(p=>p.id===programId)||null:null;
   if(phase&&meet)throw Error('Program identity is ambiguous');
   if(phase)return {type:'phase-program',program:phase,config:phase.config,start:phase.config.startDate,end:endDate(phase),sessions:phase.sessions,prefix:'phase:',goalSnapshot:phase.goalSnapshot||null,phaseReviews:(state.phaseReviews||[]).filter(x=>x.programId===phase.id)};
   if(meet)return {type:'meet-cycle',program:meet,config:meet.sourceProgram.config,start:meet.config.startDate,end:meet.config.meetDate,sessions:meet.sessions,prefix:'meet:',goalSnapshot:meet.sourceProgram.goalSnapshot||null,phaseReviews:[],weeklyReviews:meet.weeklyReviews||[]};
   return null;
 }
 function eventEvidence(s){
   if(s.type!=='meet-cycle')return null;
   const cycle=s.program,type=MeetCycle.eventType(cycle.config),record=type==='competition'?cycle.meetResult:cycle.mockMeet,rev=record?.revisions?.at(-1)||null;
   const attempts=rev?.context?.attempts||{},bests={};
   for(const lift of LIFTS){const made=(attempts[lift]||[]).filter(x=>x.status==='made'&&Number(x.weightKg)>0);bests[lift]=made.length?Math.max(...made.map(x=>Number(x.weightKg))):null;}
   const total=LIFTS.every(l=>bests[l]>0)?round(LIFTS.reduce((n,l)=>n+bests[l],0),2):null;
   return {type,date:cycle.config.meetDate,name:cycle.config.eventName||null,resultRecorded:!!rev,revisionAt:rev?.recordedAt||null,bestKg:bests,totalKg:total};
 }
 function preview(state,{programId,asOf,knownAt,now=new Date().toISOString()}={}){
   if(!date(asOf)||!iso(now)||knownAt&&!iso(knownAt))throw Error('Choose a valid transition review date');
   const s=source(state,programId),program=s?.program;
   if(!s||!program?.scheduledAt)throw Error('Choose a scheduled reviewed program');
   const through=s.end;if(!through||asOf<through)throw Error('This program has not reached its final scheduled date or event date');
   if((state.transitionSnapshots||[]).some(x=>x.programId===program.id))throw Error('A transition baseline already exists for this program');
   const cutoff=[asOf+'T23:59:59.999Z',now,...(knownAt?[knownAt]:[])].sort()[0];
   const workouts=Readiness.workoutsAt(state,asOf,cutoff,false).workouts;
   const ids=new Set(s.sessions.map(row=>s.prefix+program.id+':'+row.key));
   const summary=Schedule.summary(state.scheduledSessions||[],workouts,{from:s.start,to:through,asOf,knownAt:cutoff});
   const scoped=summary.sessions.filter(row=>ids.has(row.id)),counts={completed:0,skipped:0,cancelled:0,unconfirmed:0,scheduled:0};for(const row of scoped)counts[row.state]=(counts[row.state]||0)+1;
   const resolved=counts.completed+counts.skipped,adherence=resolved?round(counts.completed/resolved*100,1):null;
   const readiness=Readiness.snapshot(state,{asOf,knownAt:cutoff,retrospective:false}),recentFrom=move(asOf,-27),lifts={};
   for(const lift of LIFTS){
     const cfg=s.config.lifts[lift],r=readiness.lifts[lift],workload=exactWorkload(workouts,cfg.exerciseId,recentFrom,asOf);
     const start=s.goalSnapshot?.lifts?.[lift]||null,current=Number(r?.evidence?.estimatedCapacity?.kg)>0?{kg:Number(r.evidence.estimatedCapacity.kg),date:r.evidence.estimatedCapacity.date,source:r.evidence.estimatedCapacity.source}:Number(r?.evidence?.known1RM?.kg)>0?{kg:Number(r.evidence.known1RM.kg),date:r.evidence.known1RM.observedOn||null,source:'known 1RM'}:null;
     const startKg=Number(start?.reference?.kg),endKg=Number(current?.kg),changePct=startKg>0&&endKg>0?round((endKg/startKg-1)*100,1):null;
     lifts[lift]={lift,name:cfg.name,exerciseId:cfg.exerciseId,targetKg:Number(start?.targetKg)||null,startReference:start?.reference?copy(start.reference):null,currentReference:current,changePct,selectedTrainingMaxKg:cfg.trainingMaxKg,readiness:r?.status||'not-ready',recent28d:workload,prescription:copy(r?.metrics?.prescription||null)};
   }
   let currentGoal=null;try{currentGoal=GoalProgramming.inspect(state,{asOf,knownAt:cutoff,goalId:s.goalSnapshot?.goal?.id,config:s.config});}catch(e){currentGoal={status:'unavailable',summary:e.message};}
   const phaseReviews=(s.phaseReviews||[]).filter(x=>iso(x.createdAt)&&x.createdAt<=cutoff).map(x=>({id:x.id,phase:x.phase,createdAt:x.createdAt,choices:copy(x.choices||{}),policy:x.policy||null}));
   const weeklyReviews=(s.weeklyReviews||[]).filter(x=>iso(x.createdAt)&&x.createdAt<=cutoff).map(x=>({id:x.id,week:x.week,phase:x.phase,createdAt:x.createdAt,choices:copy(x.choices||{}),policy:x.policy||null}));
   const base={version:1,programId:program.id,programName:s.type==='phase-program'?program.config.name:program.sourceProgram.config.name,programCreatedAt:program.createdAt,programStart:s.start,programEnd:through,asOf,knowledgeCutoff:cutoff,goalAtStart:copy(s.goalSnapshot||null),goalAtTransition:copy(currentGoal),schedule:{expected:scoped.length,completed:counts.completed,skipped:counts.skipped,cancelled:counts.cancelled,unconfirmed:counts.unconfirmed,upcoming:counts.scheduled,adherence,definition:'Completed / (completed + explicitly skipped). Cancelled and unconfirmed sessions remain visible but are excluded from the denominator.'},lifts,decisionHistory:{phaseReviews,weeklyReviews,count:phaseReviews.length+weeklyReviews.length},notes:['This is a transition snapshot of recorded evidence, not a new max test or a readiness diagnosis.','Estimated-capacity changes are descriptive and do not prove the program caused the change.','Missing, skipped, cancelled, pending or unconfirmed sessions remain part of the handoff context.','Future programming should compare against this frozen record rather than silently recomputing what was known at transition.']};
   if(s.type==='meet-cycle'){base.programType=s.type;base.event=eventEvidence(s);base.notes.push('Event results stay separate from estimated capacity and training maxes; athlete-entered attempts are preserved as event evidence only.');}
   return base;
 }
 function save(state,report,{confirmed=false,notes=''}={}, {now=new Date().toISOString(),id=Core.createId()}={}){
   if(!confirmed||typeof notes!=='string'||notes.length>1000||!iso(now))throw Error('Review the transition evidence before saving');
   const fresh=preview(state,{programId:report.programId,asOf:report.asOf,knownAt:report.knowledgeCutoff,now});
   if(JSON.stringify(fresh)!==JSON.stringify(report))throw Error('Training, goal, schedule, event or decision evidence changed; review a fresh transition snapshot');
   const record={...copy(fresh),id,createdAt:now,review:{confirmed:true,recordedAt:now,notes:notes.trim()}};
   return {...state,transitionSnapshots:validate([...(state.transitionSnapshots||[]),record])};
 }
 return {LIFTS,endDate,exactWorkload,validate,source,eventEvidence,preview,save};
});
