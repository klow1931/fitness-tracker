/* v2.46 — next-program handoff readiness and phase-builder launch context. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./transition-baseline'),require('./block-objectives'),require('./schedule'),require('./programming-profile'),require('./decision-readiness'),require('./data-integrity'));
 else root.LoadnoteNextBlockHandoff=factory(root.LoadnoteTransitionBaseline,root.LoadnoteBlockObjectives,root.LoadnoteSchedule,root.LoadnoteProgrammingProfile,root.LoadnoteReadiness,root.LoadnoteIntegrity);
})(typeof globalThis!=='undefined'?globalThis:this,function(Transition,Objectives,Schedule,Profile,Readiness,Integrity){
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

   const reliability=Integrity.auditReliability(state,{asOf}),health=reliability.training,healthIssues=reliability.trainingBlocking,relationships=reliability.relationships;
   add('data-health','Training data health',healthIssues===0,healthIssues?healthIssues+' current strength-set data issue'+(healthIssues===1?'':'s')+' need review before starting the next block.':'Current strength-set load/RPE integrity checks are clear.');
   const programPrefix=(transition.programType==='meet-cycle'?'meet:':'phase:')+transition.programId+':',programWorkoutIds=new Set((state.workouts||[]).filter(w=>w.date>=transition.programStart&&w.date<=transition.programEnd).map(w=>String(w.id??'')));
   const relevantLinkIssues=relationships.issues.filter(i=>i.severity==='blocking'&&((i.scheduleId&&String(i.scheduleId).startsWith(programPrefix))||(i.workoutId&&programWorkoutIds.has(String(i.workoutId)))||(i.workoutIds||[]).some(id=>programWorkoutIds.has(String(id)))));
   add('record-links','Prior-program training record links',relevantLinkIssues.length===0,relevantLinkIssues.length?relevantLinkIssues.length+' blocking workout/Calendar relationship issue'+(relevantLinkIssues.length===1?' affects':'s affect')+' the completed program and need review before starting the next block.':'Completed-program workout, Calendar and planned-work links are internally consistent.');
   if(!healthIssues&&health.history.suspiciousLoads)warnings.push(health.history.suspiciousLoads+' suspicious historical revision load'+(health.history.suspiciousLoads===1?' remains':'s remain')+' in audit history; corrected current workouts are used for launch readiness.');
   const unrelatedLinkIssues=relationships.blocking-relevantLinkIssues.length;
   if(unrelatedLinkIssues>0)warnings.push(unrelatedLinkIssues+' blocking record-link issue'+(unrelatedLinkIssues===1?' exists':'s exist')+' outside the completed program; review it in Tools, but it is not used as this handoff\'s prior-program completion link.');
   if(relationships.warnings)warnings.push(relationships.warnings+' workout revision-history warning'+(relationships.warnings===1?' does':'s do')+' not change current workouts but may reduce undo/audit confidence.');

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
