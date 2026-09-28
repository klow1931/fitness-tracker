/* v2.46 — next-program handoff readiness and phase-builder launch context. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./transition-baseline'),require('./block-objectives'),require('./schedule'),require('./programming-profile'),require('./decision-readiness'));
 else root.LoadnoteNextBlockHandoff=factory(root.LoadnoteTransitionBaseline,root.LoadnoteBlockObjectives,root.LoadnoteSchedule,root.LoadnoteProgrammingProfile,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Transition,Objectives,Schedule,Profile,Readiness){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const mondayOnOrAfter=day=>{const d=new Date(day+'T12:00:00Z'),delta=(8-d.getUTCDay())%7;d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);};
 function latestTransition(state,asOf){
   return Transition.validate(state.transitionSnapshots||[]).filter(x=>x.asOf<=asOf).sort((a,b)=>a.asOf.localeCompare(b.asOf)||a.createdAt.localeCompare(b.createdAt)).at(-1)||null;
 }
 function inspect(state,{asOf,draftOpen=false}={}){
   if(!Schedule.date(asOf))throw Error('Choose a valid handoff review date');
   const blockers=[],warnings=[],checks=[],transition=latestTransition(state,asOf);
   const add=(id,label,ok,detail,severity='blocker')=>{checks.push({id,label,ok,detail,severity});if(!ok)(severity==='blocker'?blockers:warnings).push(detail);};
   add('transition','Frozen transition baseline',!!transition,transition?'Transition baseline '+transition.programName+' saved '+transition.asOf+'.':'Save the completed program transition baseline before starting the next block.');
   if(!transition)return {version:1,asOf,status:'blocked',ready:false,transition:null,objectives:null,prefill:null,checks,blockers,warnings,summary:'Next-block handoff is blocked until the completed program has a frozen transition baseline.'};

   const profile=Profile.current(state.programmingProfiles||[]);
   add('profile','Programming profile',!!profile,profile?'Programming profile is available.':'Create or restore a programming profile before starting the next block.');

   const roles=Readiness.list(state.exerciseRoles||[]),catalog=new Map((state.exerciseCatalog||[]).map(e=>[e.id,e])),ids={};
   for(const lift of LIFTS){
     const rows=roles.filter(r=>r.role==='competition'&&r.competitionLift===lift),id=rows.length===1?rows[0].exerciseId:null;ids[lift]=id;
     add('role-'+lift,lift+' competition identity',!!id&&catalog.has(id),id&&catalog.has(id)?catalog.get(id).name+' is the current competition '+lift+'.':'Resolve the competition '+lift+' exercise mapping before starting the next block.');
     if(id&&transition.lifts?.[lift]?.exerciseId&&id!==transition.lifts[lift].exerciseId)warnings.push('Competition '+lift+' identity changed since the frozen transition; prior response evidence for that lift will not transfer automatically.');
   }

   const config={lifts:Object.fromEntries(LIFTS.map(l=>[l,{exerciseId:ids[l]}]))};
   let objectives=null;try{objectives=Objectives.inspect(state,{asOf,config});}catch(e){blockers.push('Next-block objective context could not be created: '+e.message);}
   add('objectives','Next-block objective context',!!objectives&&objectives.status==='ready',objectives?.status==='ready'?(objectives.transition?'Transition-derived lift objectives are available.':'Goal-distance objectives are available.'):'Resolve the active powerlifting goal context before starting the next block.');

   const unresolved=Number(transition.schedule?.unconfirmed||0)+Number(transition.schedule?.upcoming||0);
   add('prior-resolution','Prior program schedule resolved',unresolved===0,unresolved===0?'No pending or unconfirmed prior-program sessions remain.':unresolved+' prior-program session'+(unresolved===1?' is':'s are')+' still pending or unconfirmed.');
   if(Number(transition.schedule?.skipped||0)+Number(transition.schedule?.cancelled||0)>0)warnings.push('The prior block contains skipped or cancelled sessions; those remain part of the next-block evidence.');

   add('draft','No unfinished workout draft',!draftOpen,draftOpen?'An unfinished workout draft exists on this device. Finish, save, or clear it before starting the next block.':'No unfinished workout draft is blocking the handoff.');

   const laterPrograms=(state.phasePrograms||[]).filter(p=>p.createdAt>transition.createdAt&&p.id!==transition.programId),unscheduled=laterPrograms.filter(p=>!p.scheduledAt);
   add('reviewed-conflict','No newer unscheduled reviewed program',unscheduled.length===0,unscheduled.length?'A newer reviewed phase program ('+(unscheduled[0].config?.name||unscheduled[0].id)+') already exists and is not scheduled.':'No newer unscheduled reviewed phase program is competing with this handoff.');

   let prefill=null;
   if(objectives?.status==='ready'&&objectives.recommendation&&profile){
     const startFloor=asOf>transition.programEnd?asOf:move(transition.programEnd,1),startDate=mondayOnOrAfter(startFloor),weeks=objectives.recommendation.totalWeeks,endDate=move(startDate,weeks*7-1);
     const conflicts=Schedule.list(state.scheduledSessions||[]).filter(s=>s.status==='scheduled'&&s.date>=startDate&&s.date<=endDate);
     add('calendar','No Calendar overlap',conflicts.length===0,conflicts.length?conflicts.length+' scheduled Calendar session'+(conflicts.length===1?' overlaps':'s overlap')+' the proposed '+startDate+'–'+endDate+' next-block window.':'No scheduled Calendar sessions overlap the proposed '+startDate+'–'+endDate+' next-block window.');
     prefill={source:'next-block-handoff-v1',transitionId:transition.id,transitionProgramId:transition.programId,name:objectives.recommendation.label,startDate,accumulationWeeks:objectives.recommendation.accumulationWeeks,strengthWeeks:objectives.recommendation.strengthWeeks,deloadWeeks:1,totalWeeks:weeks,endDate,days:profile.context.availableDays.slice(0,3),sessionMinutes:profile.context.sessionMinutes,trainingMaxKg:Object.fromEntries(LIFTS.map(l=>[l,Number(transition.lifts?.[l]?.selectedTrainingMaxKg)||null]))};
   }
   const ready=blockers.length===0;
   return {version:1,asOf,status:ready?'ready':'blocked',ready,transition:{id:transition.id,programId:transition.programId,programName:transition.programName,asOf:transition.asOf,programEnd:transition.programEnd},objectives:objectives?copy(objectives):null,prefill,checks,blockers,warnings,
    summary:ready?'Next-block handoff is ready for athlete review. The phase builder can open with evidence-backed timing and prior training-max references.':'Next-block handoff has blocking issues that should be resolved before a new reviewed block is created.',
    notes:['This handoff does not create or schedule a program by itself.','Prior training maxes are carried only as editable review references; they are not automatically progressed.','Exercise selection, exposures, set counts, frequency, load increments and all final prescriptions remain athlete-reviewed in the phase builder.']};
 }
 return {LIFTS,latestTransition,inspect,mondayOnOrAfter};
});
