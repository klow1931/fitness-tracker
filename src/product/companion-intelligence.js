/* v2.83 — deterministic, read-only intelligence for Coach Companion.
 * Reuses existing lifecycle, set-guidance, progress-story and accepted-change
 * evidence. It never creates or applies a programming decision.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(
  require('./program-lifecycle'),require('./progress-story'),require('./adaptation-explanation'),
  require('./set-guidance'),require('./session-intent')
 );
 else root.LoadnoteCompanionIntelligence=factory(
  root.LoadnoteProgramLifecycle,root.LoadnoteProgressStory,root.LoadnoteAdaptationExplanation,
  root.LoadnoteSetGuidance,root.LoadnoteIntent
 );
})(typeof globalThis!=='undefined'?globalThis:this,function(Lifecycle,Progress,Explanation,SetGuidance,Intent){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const key=x=>String(x||'').trim().toLowerCase();
 const finite=x=>Number.isFinite(Number(x))?Number(x):null;
 const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'));
 const phasePurpose={
  weightlifting:'Develop the reviewed technical lifting with separately reported attempts and quality; follow the coach-reviewed stop protocol.',
  athlete:'Develop the reviewed strength, speed/jump/agility and conditioning tasks while coordinating sport practice and games.',
  accumulation:'Build repeatable training volume and technical practice while staying inside the reviewed prescription.',
  strength:'Emphasize heavier strength work while preserving enough volume and practice to support the main lifts.',
  deload:'Reduce planned workload while retaining practice so the next training phase starts from a reviewed baseline.',
  peaking:'Increase competition specificity and heavy exposure while managing the amount of remaining work before the event.',
  taper:'Reduce planned workload close to the event while keeping the reviewed competition-lift plan intact.',
  'mock-meet':'Execute the planned mock-meet session and record actual attempts as training evidence.',
  meet:'Execute the competition plan and record actual attempts; Loadnote does not infer meet-day attempt loads.'
 };
 const rolePurpose={
  'heavy-exposure':'Practice the planned heavier exposure without turning it into an unplanned max-out.',
  volume:'Complete the reviewed volume target and record actual effort.',
  technique:'Prioritize repeatable technique / skill practice at the reviewed prescription.',
  recovery:'Complete the deliberately reduced training prescription as written unless you intentionally modify it.',
  testing:'Record the planned test accurately so later decisions use real evidence.',
  deload:'Complete the reduced-load or reduced-volume session as planned.',
  mixed:'Follow the stated goal for each exercise rather than treating the whole session as one intensity target.'
 };
 function toKg(value,unit){const n=finite(value);if(n==null)return null;return unit==='lb'?Math.round(n/2.2046226218*100)/100:n;}
 function plannedExercise(intent,name){
  const rows=intent?.prescription?.plannedExercises||[],target=key(name);
  return rows.find(x=>key(x.name)===target)||null;
 }
 function draftExercise(draft,name,index){
  const rows=(draft?.rows||[]).filter(x=>x.type!=='cardio'),target=key(name);
  return rows.find(x=>key(x.name)===target)||rows[index]||null;
 }
 function compactSet(set,trackBy){
  if(!set)return null;const out={};
  if(Object.hasOwn(set,'weight')&&finite(set.weight)!=null)out.weightKg=finite(set.weight);
  if(trackBy==='duration'&&finite(set.duration)>0)out.durationSeconds=finite(set.duration);
  else if(finite(set.reps)>0)out.reps=finite(set.reps);
  if(finite(set.targetRpe)>=1&&finite(set.targetRpe)<=10)out.targetRpe=finite(set.targetRpe);
  return out;
 }
 function setGuidance(draft,liveWorkout){
  const current=liveWorkout?.currentExercise;if(!draft||!current?.name)return null;
  const intent=draft.sessionIntent,plan=plannedExercise(intent,current.name),row=draftExercise(draft,current.name,current.index);
  if(!plan||!row||plan.type==='cardio'||row.type==='cardio')return null;
  const trackBy=plan.trackBy==='duration'?'duration':'reps';
  const planned=(plan.sets||[]).map(s=>({weight:finite(s.weight),reps:finite(s.reps),duration:finite(s.duration),targetRpe:finite(s.targetRpe)}));
  const performed=(row.sets||[]).map(s=>({done:!!s.done,weightKg:toKg(s.weight,draft.unit),reps:finite(s.reps),duration:finite(s.duration),rpe:s.rpe===''||s.rpe==null?'':finite(s.rpe)}));
  let result=null;try{result=SetGuidance?.evaluate?.(planned,performed)||null;}catch{return null;}
  if(!result)return null;
  const next=result.nextIndex>=0?compactSet(plan.sets?.[result.nextIndex],trackBy):null;
  return {status:result.status,message:result.message,rpeDifference:result.rpeDifference??null,nextIndex:result.nextIndex,nextTarget:next};
 }
 function sessionSummary(state,draft,liveWorkout){
  const intent=draft?.sessionIntent||null,current=liveWorkout?.currentExercise||null,scheduleId=intent?.schedule?.id||null;
  const plan=current?.name?plannedExercise(intent,current.name):null,setIndex=Math.max(0,Number(current?.set?.index)||0),plannedSet=compactSet(plan?.sets?.[setIndex],plan?.trackBy);
  let accepted=null;
  try{
   const explanation=scheduleId?Explanation?.forSession?.(state,scheduleId):null;
   if(explanation)accepted={sourceLabel:explanation.sourceLabel,createdAt:explanation.createdAt||null,scheduleId,lifts:(explanation.changedLifts||[]).slice(0,3).map(l=>({lift:l.lift,name:l.name,action:l.action,why:l.why,evidence:(l.evidence||[]).slice(0,5),impact:{sessionCount:l.impact?.sessionCount||0,setDelta:l.impact?.setDelta||0,loadDeltasKg:(l.impact?.loadDeltasKg||[]).slice(0,6),repsChanged:!!l.impact?.repsChanged}}))};
  }catch{}
  const role=intent?.role||'unspecified';
  const sourceId=intent?.prescription?.source?.referenceId;
  const sources=[...(state.phasePrograms||[]),...(state.reviewedPrograms||[]),...(state.meetCycles||[])].filter(p=>sourceId&&p.id===sourceId);
  const source=sources.length===1?sources[0]:null;
  const accessory=(source?.config?.accessories||source?.sourceProgram?.config?.accessories||[]).find(a=>plan?.exerciseId&&a.exerciseId===plan.exerciseId&&a.name===plan.name);
  const purpose=accessory?'Athlete-selected '+accessory.purpose+' work for '+accessory.group.replace(/-/g,' '):null;
  return {
   scheduleId,role,roleLabel:Intent?.SESSION_ROLES?.[role]||role,goal:String(intent?.goal||'').trim()||null,
   rolePurpose:rolePurpose[role]||null,plannedExercise:plan?{name:plan.name,purpose,trackBy:plan.trackBy||'reps',setCount:(plan.sets||[]).length}:null,
   currentPlannedSet:plannedSet,guidance:setGuidance(draft,liveWorkout),acceptedChange:accepted
  };
 }
 function lifecycleSummary(state,asOf,draft){
  let report=null;try{report=Lifecycle?.inspect?.(state,{asOf,draft,draftOpen:!!draft})||null;}catch{return null;}
  if(!report)return null;
  const p=report.program,progress=report.progress;
  return {
   status:report.status,selection:report.selection||null,
   program:p?{kind:p.kind,id:p.id,name:p.name,startDate:p.startDate,endDate:p.endDate,totalWeeks:p.totalWeeks,eventType:p.eventType||null,eventName:p.eventName||null,eventDate:p.eventDate||null}:null,
   progress:progress?{week:progress.week,totalWeeks:progress.totalWeeks,phase:progress.phase,phaseLabel:progress.phaseLabel,phaseWeek:progress.phaseWeek,purpose:phasePurpose[progress.phase]||null}:null,
   schedule:report.schedule?{planned:report.schedule.planned,completed:report.schedule.completed,skipped:report.schedule.skipped,cancelled:report.schedule.cancelled,unconfirmed:report.schedule.unconfirmed,upcoming:report.schedule.upcoming,next:copy(report.schedule.next)}:null,
   nextAction:report.nextAction?{kind:report.nextAction.kind,label:report.nextAction.label,detail:report.nextAction.detail}:null,
   notes:(report.notes||[]).slice(0,4)
  };
 }
 function compactStrength(row){return {name:row.name,label:row.label||row.name,lift:row.lift||null,status:row.status,startKg:row.startKg??null,endKg:row.endKg??null,deltaKg:row.deltaKg??null,deltaPct:row.deltaPct??null,baselineDays:row.baselineDays||0,recentDays:row.recentDays||0,reason:row.reason||null};}
 function progressSummary(state,asOf,currentName){
  let report=null;try{report=Progress?.analyze?.(state,{asOf,weeks:12})||null;}catch{return null;}
  if(!report)return null;
  let currentMovement=null;
  if(currentName){
   try{
    const story=Progress.movementStory(state,{key:'name:'+key(currentName),name:currentName,label:currentName,source:'exercise',lift:null},{asOf,weeks:12});
    currentMovement={name:currentName,direction:copy(story.direction),latest:story.latest?{date:story.latest.date,averageRpe:story.latest.averageRpe,bestCapacity:copy(story.latest.bestCapacity),bestLoad:copy(story.latest.bestLoad)}:null,baseline:{sessions:story.baseline.sessions,capacityDays:story.baseline.capacityDays,medianCapacityKg:story.baseline.medianCapacityKg},recent:{sessions:story.recent.sessions,capacityDays:story.recent.capacityDays,medianCapacityKg:story.recent.medianCapacityKg}};
   }catch{}
  }
  const summary=report.summary||{};
  return {
   strength:(summary.strength||[]).slice(0,6).map(compactStrength),
   consistency:copy(summary.consistency)||null,
   milestones:(summary.milestones||[]).slice(0,3).map(copy),
   changes:summary.changes?{changed:!!summary.changes.changed,rows:(summary.changes.rows||[]).slice(0,3).map(row=>({date:row.date,sourceLabel:row.sourceLabel,lift:row.lift||null,name:row.name,action:row.action,why:row.why,evidence:(row.evidence||[]).slice(0,5)})),latestReview:copy(summary.changes.latestReview)}:null,
   currentMovement,
   note:summary.note||null
  };
 }
 function build(state,{asOf,liveWorkout=null,draft=null}={}){
  const day=validDay(asOf)?asOf:(validDay(liveWorkout?.date)?liveWorkout.date:null);if(!day)throw Error('Choose a valid Companion intelligence date.');
  const lifecycle=lifecycleSummary(state,day,draft),session=sessionSummary(state,draft,liveWorkout),progress=progressSummary(state,day,liveWorkout?.currentExercise?.name||null);
  const focus=[];
  if(session.goal)focus.push(session.goal);
  else if(session.rolePurpose)focus.push(session.rolePurpose);
  else if(lifecycle?.progress?.purpose)focus.push(lifecycle.progress.purpose);
  if(session.guidance?.message)focus.push(session.guidance.message);
  return {version:1,asOf:day,lifecycle,session,progress,todayFocus:focus.slice(0,3),limits:[
   'Progress direction is descriptive evidence, not a readiness score or proof that programming caused the result.',
   'Only stored athlete-approved review changes are described as programming changes.',
   'This intelligence layer is read-only and cannot alter workouts, programs, training maxes or Decisions state.'
  ]};
 }
 function answer(snapshot,question){
  if(!snapshot)return null;const q=String(question||'').toLowerCase().replace(/[’‘]/g,"'");
  const life=snapshot.lifecycle,session=snapshot.session,progress=snapshot.progress;
  if(/\b(what phase|which phase|where.*program|what week|which week)\b/.test(q)){
   if(!life?.program)return 'There is no single active reviewed program for me to describe right now.';
   const p=life.progress,parts=[life.program.name];if(p?.week)parts.push('week '+p.week+' of '+p.totalWeeks);if(p?.phaseLabel)parts.push(p.phaseLabel+(p.phaseWeek?' · phase week '+p.phaseWeek:''));
   let text='You are in '+parts.join(' · ')+'.';if(p?.purpose)text+=' '+p.purpose;return text;
  }
  if(/\b(why (this|am i doing)|why.*set|why.*weight|why.*load|reason.*set)\b/.test(q)){
   const change=session?.acceptedChange?.lifts?.[0];
   if(change){let text='This session reflects the accepted '+session.acceptedChange.sourceLabel+'. '+change.why;const evidence=(change.evidence||[]).slice(0,2);if(evidence.length)text+=' Evidence: '+evidence.join('; ')+'.';return text;}
   const pieces=[];if(session?.goal)pieces.push('Session goal: '+session.goal+'.');else if(session?.rolePurpose)pieces.push(session.rolePurpose);else if(life?.progress?.purpose)pieces.push(life.progress.purpose);
   if(session?.guidance?.message)pieces.push(session.guidance.message);return pieces.join(' ')||'I do not have enough reviewed prescription evidence to explain this set without guessing.';
  }
  if(/\b(what changed|why did.*change|recent change|adaptation)\b/.test(q)){
   const rows=progress?.changes?.rows||[];if(rows.length){const row=rows[0];let text='The latest stored accepted change was '+row.name+' · '+row.action+' from the '+row.sourceLabel+'. '+row.why;const evidence=(row.evidence||[]).slice(0,2);if(evidence.length)text+=' Evidence: '+evidence.join('; ')+'.';return text;}
   const latest=progress?.changes?.latestReview;if(latest)return 'The latest stored '+latest.sourceLabel+' did not record a programming change. Loadnote will not invent one.';
   return 'There is no stored accepted programming change in the current progress window.';
  }
  if(/\b(how.*training|how am i doing|trend|trending|progress)\b/.test(q)){
   const move=progress?.currentMovement;if(move?.direction&&move.direction.status!=='insufficient'&&move.direction.status!=='sparse'){
    const d=move.direction,delta=d.deltaPct==null?'':(' ('+(d.deltaPct>0?'+':'')+d.deltaPct+'%)');return move.name+': '+d.label+delta+' across the compared training windows. This is descriptive RPE-aware training evidence, not a tested 1RM or readiness score.';
   }
   const rows=(progress?.strength||[]).filter(x=>!['insufficient','sparse'].includes(x.status));if(rows.length){const row=rows[0],delta=row.deltaPct==null?'':(' ('+(row.deltaPct>0?'+':'')+row.deltaPct+'%)');return row.label+': '+(row.status==='higher'?'recent evidence is higher':row.status==='lower'?'recent evidence is lower':'recent evidence is similar')+delta+'. '+(progress.consistency?.mode==='scheduled'&&progress.consistency.adherence!=null?'Recent resolved-session adherence is '+progress.consistency.adherence+'%. ':'')+'These are descriptive training signals, not a readiness score.';}
   return 'There is not enough comparable RPE-aware training evidence yet to call a strength trend without guessing.';
  }
  if(/\b(focus|care about|priority|today)\b/.test(q)&&snapshot.todayFocus?.length)return snapshot.todayFocus.join(' ');
  return null;
 }
 return {build,answer,phasePurpose,rolePurpose,setGuidance,sessionSummary,lifecycleSummary,progressSummary};
});
