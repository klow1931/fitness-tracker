/* One read-only weekly view; adjustments remain in the existing Decisions policies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./program-lifecycle'),require('./decision-readiness'),require('./weekly-evidence'),require('./cycle-review'),require('./cycle-adaptive-controller'),require('./cycle-response'),require('./adaptive-outcome-learning'),require('./primary-follow-up'),require('./coach-support'));else root.LoadnoteWeeklyCoaching=factory(root.LoadnoteSchedule,root.LoadnoteProgramLifecycle,root.LoadnoteReadiness,root.LoadnoteWeeklyEvidence,root.LoadnoteCycleReview,root.LoadnoteCycleAdaptiveController,root.LoadnoteCycleResponse,root.LoadnoteAdaptiveOutcomeLearning,root.LoadnotePrimaryFollowUp,root.LoadnoteCoachSupport);})(typeof globalThis!=='undefined'?globalThis:this,function(S,L,R,E,C,Controller,Response,Learning,Follow,Support){
 'use strict';const move=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
 const NOTICE='This review uses corrected logs and saved Calendar targets. Missing evidence stays unknown. Only explicit approval in Decisions can change future targets.';
 function inspect(state,{asOf,now=new Date().toISOString(),programId=null,programKind=null,week=null}={}){
  if(!S.date(asOf)||!E.stamp(now)||asOf>now.slice(0,10))throw Error('Choose a valid weekly review date');
  const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',all=L.programs(state).filter(p=>p.record.scheduledAt<=cutoff),active=all.filter(p=>p.startDate<=asOf&&p.endDate>=asOf);
  let candidates=programId?all.filter(p=>p.id===programId&&(!programKind||p.kind===programKind)):active;
  if(!programId&&!candidates.length){const ended=all.filter(p=>p.endDate<asOf),latest=ended.map(p=>p.endDate).sort().at(-1);candidates=ended.filter(p=>p.endDate===latest);}
  if(candidates.length!==1)return {status:candidates.length?'ambiguous':'empty',candidates:candidates.map(p=>({id:p.id,kind:p.kind,name:p.name})),notice:NOTICE};
  const p=candidates[0];if(!['meet-cycle','phase-program'].includes(p.kind))return {status:'unsupported',program:{id:p.id,kind:p.kind,name:p.name},notice:NOTICE};
  const weeks=Array.from({length:p.totalWeeks},(_,i)=>({week:i+1,from:move(p.startDate,i*7),through:move(p.startDate,i*7+6)})).filter(w=>w.through<=asOf);
  if(week!=null&&(!Number.isInteger(week)||!weeks.some(w=>w.week===week)))throw Error('Choose a completed program week');
  const w=week==null?weeks.at(-1):weeks.find(w=>w.week===week);
  if(!w)return {status:'waiting',program:{id:p.id,kind:p.kind,name:p.name},through:move(p.startDate,6),notice:NOTICE};
  const records=S.validate(state.scheduledSessions||[]),workouts=R.workoutsAt(state,asOf,cutoff,false).workouts,groups=new Map(),sessions=[];
  for(const source of p.record.sessions.filter(s=>s.date>=w.from&&s.date<=w.through)){
   const id=p.prefix+source.key,record=records.find(r=>r.id===id),logs=workouts.filter(w=>w.sessionIntent?.schedule?.id===id),linked=logs.length===1?record?.revisions.find(v=>v.recordedAt===logs[0].sessionIntent.schedule.revisionAt&&v.recordedAt<=cutoff):null,visible=record?.revisions.filter(v=>v.recordedAt<=cutoff).at(-1),revision=linked||visible;
   let comparable=false;try{comparable=revision?.context.prescription.source.referenceId===p.id;}catch{}
   const exercises=comparable?revision.context.prescription.plannedExercises:source.exercises;
   for(const exercise of exercises){
    if(exercise.type==='cardio'||!exercise.sets?.length)continue;
    const original=source.exercises.filter(e=>e.exerciseId===exercise.exerciseId),lift=original.length===1&&['squat','bench','deadlift'].includes(original[0].lift)?original[0].lift:null,key=lift||'accessories',name=lift?lift[0].toUpperCase()+lift.slice(1):'Accessories';
    if(!groups.has(key))groups.set(key,{key,name,plannedSets:0,completedSets:0,comparedSets:0,aboveCap:0,rows:[]});
    const g=groups.get(key),row=E.compare(record,comparable?revision:null,logs,exercise,{asOf,cutoff});g.plannedSets+=row.plannedSets;g.completedSets+=row.completedSets;g.comparedSets+=row.comparedSets;g.aboveCap+=row.aboveCap;g.rows.push({...row,date:revision?.context.date||source.date,sessionId:id,name:exercise.name});
   }
   sessions.push({id,date:revision?.context.date||source.date,name:source.name,logs:logs.length});
  }
  const progress=L.progress(p,w.from),proposal={status:'maintain',label:'Keep scheduled targets',reason:'Continue the reviewed plan; weekly observations do not create a new prescription.',changes:[],route:null};let controller=null,report=null;
  if(p.kind==='meet-cycle'){
   const accepted=(p.record.weeklyReviews||[]).find(r=>r.week===w.week&&r.createdAt<=cutoff);
   if(accepted){proposal.status='approved';proposal.label='Weekly review already approved';proposal.reason='Follow the saved Calendar targets. Approved changes appear in follow-ups.';}
   else if(w.week<p.totalWeeks){
    try{report=C.analyze(state,{cycleId:p.id,week:w.week,asOf,now:cutoff});const response=Response.inspect(state,{cycleId:p.id,asOf,now:cutoff}),learning=Learning.analyze(state,{asOf,now:cutoff}).summary;controller=Controller.recommendFromReports(report,response,learning);proposal.changes=C.previewTargets(state,report,controller.choices,{now:cutoff});proposal.status=proposal.changes.length?'review':'maintain';proposal.label=proposal.changes.length?'Review next-week proposal':'Keep scheduled targets';proposal.reason=controller.summary;proposal.route={kind:'cycle',cycleId:p.id,week:w.week};}
    catch(error){proposal.status='gather';proposal.label='Review evidence first';proposal.reason=error.message;proposal.route={kind:'cycle',cycleId:p.id,week:w.week};}
   }
  }else if(p.kind==='phase-program'){
   const boundary=p.phaseBounds.find(b=>b.type===progress.phase),accepted=(state.phaseReviews||[]).some(r=>r.programId===p.id&&r.phase===progress.phase&&r.createdAt<=cutoff);
   proposal.reason='Keep the planned '+progress.phaseLabel.toLowerCase()+' targets. Primary-lift adjustments use a completed-phase review, not an automatic weekly change.';
   if(boundary?.endDate<=asOf&&boundary.index<p.phaseBounds.length-1&&!accepted){proposal.status='phase-review';proposal.label='Review the completed phase';proposal.reason='Review the full phase and your check-in before considering supported future targets.';proposal.route={kind:'phase',programId:p.id,phase:progress.phase};}
  }
  for(const g of groups.values()){
   const choice=controller?.lifts?.[g.key],missing=g.rows.some(r=>!['within','above'].includes(r.status));
   g.status=choice&&choice.action!=='keep'?'review':missing?'gather':'maintain';g.label=g.status==='review'?'Review adjustment':g.status==='gather'?'Gather evidence':'Maintain';
   g.policyReason=choice?.why||null;
   g.reason=choice&&choice.action!=='keep'?({'reduce-one':'Repeated above-cap effort supports reviewing one fewer set per next-week exposure.','reduce-load':'The existing phase policy supports reviewing one load increment lower next week.','increase-load':'Complete below-cap work and the existing capacity comparison support reviewing one load increment higher.'}[choice.action]):missing?(g.rows.find(r=>!['within','above'].includes(r.status)).gaps[0]||'Resolve missing, skipped or changed work; completion and effort are not assumed.'):g.aboveCap?'Recorded effort exceeded a cap. Keep targets until a supported Decisions review is approved.':g.comparedSets+' of '+g.plannedSets+' prescribed sets matched their loads, reps and effort caps.';
   if(g.key!=='accessories'&&report?.phasePolicy.allowedActions.length===1)g.reason+=' This phase protects the planned targets.';
  }
  if(proposal.status==='maintain'&&[...groups.values()].some(g=>g.status==='gather')){proposal.status='gather';proposal.label='Keep targets; gather evidence';}
  const followups=Follow.inspect(state,{asOf,now:cutoff}).rows.filter(r=>r.programId===p.id&&r.programKind===p.kind&&r.date>=w.from&&r.date<=w.through);
  return {status:'ready',asOf,cutoff,program:{id:p.id,kind:p.kind,name:p.name},week:w.week,nextWeek:w.week<p.totalWeeks?w.week+1:null,weeks,from:w.from,through:w.through,progress,groups:[...groups.values()],sessions,proposal,followups,notice:NOTICE};
 }
 function review(state,options){try{return inspect(state,options);}catch(error){return {status:'invalid',reason:error.message,candidates:[],notice:NOTICE};}}
 function summary(r){if(r.status==='unsupported')return 'Use the weekly check-in and dedicated '+(r.program.kind==='sport-program'?'sport-plan':'hypertrophy')+' evidence review in Decisions. Primary-lift week adjustments do not apply to this program.';if(r.status==='invalid')return 'The weekly evidence could not be validated. Open Decisions to resolve it; no change is proposed.';if(r.status==='empty')return 'No scheduled source program is available for a weekly review. Review your program in Decisions.';if(r.status==='ambiguous')return 'More than one program covers this review. Choose the exact program; I will not combine their evidence.';if(r.status==='waiting')return 'The first program week ends '+r.through+'. Continue the saved targets; a completed-week review is not available yet.';
  return 'Week '+r.week+' · '+r.from+'–'+r.through+' · '+r.program.name+'.\n\n'+r.groups.map(g=>g.name+': '+g.label+'. '+g.comparedSets+'/'+g.plannedSets+' sets with comparable effort; '+g.aboveCap+' above cap. '+g.reason).join('\n\n')+'\n\nNext: '+r.proposal.label+'. '+r.proposal.reason+' '+(r.proposal.changes.length?r.proposal.changes.length+' future session(s) have an exact target preview. ':'')+NOTICE;
 }
 function answer(state,q,options){
  if(Support.health(q))return null;
  if(/\bprimary.lift\b.*\b(follow|change|outcome|result)\w*\b|\b(follow|change|outcome|result)\w*\b.*\bprimary.lift\b|\b(how did|follow.?up|what happened|outcome|result)\b.*\b(squat|bench|deadlift)\b.*\b(change|adjustment)\b/i.test(q)){
   let r;try{r=Follow.inspect(state,options);}catch{return {text:'Primary-lift follow-ups could not be validated. Open Decisions to resolve the saved evidence.',source:'Shared coaching · primary-lift follow-up',readOnly:true};}
   const named=['squat','bench','deadlift'].filter(l=>new RegExp('\\b'+l+'\\b','i').test(q)),rows=r.rows.filter(row=>!named.length||named.includes(row.lift)),unit=options?.unit==='lb'?'lb':'kg';
   const weight=n=>Number.isFinite(n)?Math.round(n*(unit==='lb'?2.2046226218:1)*100)/100+' '+unit:'unknown load';
   const target=e=>e.sets.length+' sets · '+e.sets.map(s=>weight(s.weight)+' × '+s.reps+' · cap '+s.targetRpe).join(' / ');
   return {text:rows.length?rows.slice(0,3).map(row=>row.name+' ('+row.date+'): '+row.label+'. Previous '+target(row.before)+'; approved '+target(row.approved)+'. Recorded '+(row.actual?.sets?.map(s=>weight(s?.weight)+' × '+(s?.reps??'unknown')+' · RPE '+(s?.rpe??'unknown')).join(' / ')||'no unique linked performance')+'. '+row.comparedSets+'/'+row.plannedSets+' sets with comparable effort. '+(row.gaps[0]||Follow.NOTICE)).join('\n\n'):'No approved primary-lift changes are saved for that review yet.',source:'Shared coaching · primary-lift follow-up',readOnly:true,evidence:[r],actions:[{kind:'primary-follow-up',label:'See primary-lift follow-ups'}]};
  }
  if(!/\b(weekly program review|how did (this|my|last) week go|review (my |this |last )?week|what should i do next week)\b/i.test(q))return null;
  const r=review(state,options);return {text:summary(r),source:'Shared coaching · weekly review',readOnly:true,evidence:[r],actions:[{kind:'weekly-coaching',label:'See weekly review'}],followUps:['Why?']};
 }

 return {inspect,review,summary,answer,NOTICE};
});
