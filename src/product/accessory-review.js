/* Exact accessory evidence and athlete-approved, single-session Calendar revisions. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./session-intent'),require('./schedule'),require('./phase-builder'),require('./meet-cycle'),require('./programming-profile'),require('./athlete-intake'),require('./coach-support'));
 else root.LoadnoteAccessoryReview=factory(root.LoadnoteIntent,root.LoadnoteSchedule,root.LoadnotePhaseBuilder,root.LoadnoteMeetCycle,root.LoadnoteProgrammingProfile,root.LoadnoteAthleteIntake,root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(I,S,B,M,P,A,Support){
 'use strict';
 const POLICY='accessory-review-v1',clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const protectedPhase=s=>!s||!['accumulation','strength'].includes(s.phase);
 function origin(state,session){
  const id=session.prescription.source.referenceId;
  const candidates=[...(state.phasePrograms||[]).filter(p=>p.id===id&&session.id.startsWith('phase:'+p.id+':')).map(p=>({kind:'phase',raw:p})),...(state.meetCycles||[]).filter(p=>p.id===id&&session.id.startsWith('meet:'+p.id+':')).map(p=>({kind:'meet',raw:p}))];
  if(candidates.length!==1)return null;
  const c=candidates[0],program=(c.kind==='phase'?B:M).validate([c.raw])[0];
  const source=program.sessions.find(s=>session.id===c.kind+':'+program.id+':'+s.key);
  return source?{kind:c.kind,program,source,accessories:(c.kind==='phase'?program.config:program.sourceProgram.config).accessories||[]}:null;
 }
 function targets(state,{asOf}={}){
  if(!S.date(asOf))throw Error('Choose a valid review date');
  return S.list(S.validate(state.scheduledSessions||[])).filter(s=>s.status==='scheduled'&&s.date>asOf&&!(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===s.id)).flatMap(s=>{
   const o=origin(state,s);if(!o||protectedPhase(o.source))return [];
   return o.source.exercises.filter(e=>e.role==='accessory').map(e=>({sessionId:s.id,exerciseId:e.exerciseId,name:e.name,date:s.date,sessionName:s.name}));
  });
 }
 function analyze(state,{sessionId,exerciseId,asOf,now=new Date().toISOString()}={}){
  if(!S.date(asOf)||!stamp(now)||asOf>now.slice(0,10))throw Error('Review date must be today or earlier');
  const sessions=S.validate(state.scheduledSessions||[]),session=S.list(sessions).find(s=>s.id===sessionId),o=session&&origin(state,session);
  if(!o||session.status!=='scheduled'||session.date<=asOf||(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===sessionId))throw Error('Choose an unperformed future accessory from a reviewed phase or meet cycle');
  const source=o.source.exercises.filter(e=>e.role==='accessory'&&e.exerciseId===exerciseId),config=o.accessories.filter(a=>a.exerciseId===exerciseId&&a.day===o.source.day);
  // Older session rows encode the day in their stable key rather than a field.
  const day=Number(/d(\d+)$/.exec(o.source.key)?.[1]);
  const settings=config.length?config:o.accessories.filter(a=>a.exerciseId===exerciseId&&a.day===day);
  if(source.length!==1||settings.length!==1)throw Error('Accessory identity or source slot is ambiguous');
  const a=settings[0],matches=session.prescription.plannedExercises.filter(e=>e.exerciseId===exerciseId),target=matches.length===1?matches[0]:null;
  const profile=P.current(state.programmingProfiles||[]),catalog=(state.exerciseCatalog||[]).filter(e=>e.id===exerciseId);
  const gaps=[];let supported=true;
  const dose=e=>e?.type==='strength'&&e.trackBy==='reps'&&e.name===a.name&&e.sets?.length===a.sets&&e.sets.every(s=>Number.isFinite(s.weight)&&s.weight>=0&&s.weight<=500&&s.minReps===a.minReps&&s.maxReps===a.maxReps&&s.targetRpe===a.targetRpe)&&e.sets.every(s=>s.weight===e.sets[0].weight);
  if(protectedPhase(o.source)){gaps.push('Deload, peak, taper and event work stays protected.');supported=false;}
  if(a.mode!=='reps'||!dose(target)){gaps.push('Only unchanged rep-range accessory targets support this review. Holds, cardio and edited doses need manual review.');supported=false;}
  if(catalog.length!==1||catalog[0].name!==a.name){gaps.push('The exact movement identity changed.');supported=false;}
  if(!profile||profile.context.avoidedExerciseIds.includes(exerciseId)||profile.context.accessoryEquipment&&!profile.context.accessoryEquipment.includes(a.equipment)){gaps.push('Review current movement exclusions and equipment access.');supported=false;}
  if(A.assess(profile?.context.intake).hold||A.excluded(profile?.context.intake).includes(exerciseId)){gaps.push('Current intake concerns need an individual review.');supported=false;}
  if(session.date!==o.source.date||session.reason&&!/^Approved .* phase review \(|^Accessory review v1:/.test(session.reason)){gaps.push('This Calendar session was edited or moved; use its dedicated edit review.');supported=false;}
  const cutoff=now; // Current corrected records, filtered by workout date; not an as-recorded historical replay.
  if(o.program.createdAt>cutoff||o.program.scheduledAt>cutoff||session.revisionAt>cutoff)throw Error('The reviewed target was not known at this review time');
  const previous=o.program.sessions.filter(s=>s.date<=asOf&&s.date<session.date&&s.exercises.some(e=>e.role==='accessory'&&e.exerciseId===exerciseId)).sort((a,b)=>b.date.localeCompare(a.date)||b.key.localeCompare(a.key)).slice(0,2);
  const evidence=previous.map(s=>{
   const id=o.kind+':'+o.program.id+':'+s.key,record=sessions.find(r=>r.id===id);
   const logs=(state.workouts||[]).filter(w=>w.sessionIntent?.schedule?.id===id&&w.date<=asOf&&(!w.createdAt||w.createdAt<=cutoff));
   const w=logs.length===1?logs[0]:null,link=record?.revisions.find(v=>v.recordedAt===w?.sessionIntent?.schedule?.revisionAt&&v.recordedAt<=cutoff);
   const actuals=w?.exercises?.filter(e=>e.exerciseId===exerciseId)||[],actual=actuals.length===1?actuals[0]:null;
   const plans=link?.context.prescription.plannedExercises.filter(e=>e.exerciseId===exerciseId)||[],plan=plans.length===1?plans[0]:null;
   let valid=false;
   try{valid=!!(stamp(w?.createdAt)&&w.createdAt>=w.date+'T00:00:00.000Z'&&link?.context.status==='scheduled'&&w.date===s.date&&w.date===link.context.date&&same(I.prescription(w.sessionIntent.prescription),link.context.prescription)&&I.planTiming(link.context.prescription,w.date,w.sessionIntent.timing)==='before-training'&&(w.sessionIntent.deviationReason||'none')==='none'&&!protectedPhase(s)&&dose(plan)&&dose(target)&&same(plan.sets,target.sets)&&actual?.name===a.name&&actual.type==='strength'&&actual.trackBy!=='duration'&&actual.sets?.length===plan.sets.length&&(!actual.loadConvention||!plan.loadConvention||actual.loadConvention===plan.loadConvention)&&(!plan.loadConvention||!target.loadConvention||plan.loadConvention===target.loadConvention)&&actual.sets.every((x,j)=>Number.isFinite(x.weight)&&Math.abs(x.weight-plan.sets[j].weight)<=.01&&Number.isInteger(x.reps)&&x.reps>=a.minReps&&x.reps<=a.maxReps&&Number.isFinite(x.rpe)&&x.rpe>=1&&x.rpe<=10));}catch{/* Uncertain evidence cannot authorize a dose change. */}
   return {sessionId:id,date:s.date,workoutId:w?.id??null,valid,plan:clone(plan),actual:clone(actual),logCount:logs.length,reason:valid?'Exact planned load, rep range and effort recorded.':'Missing, ambiguous, changed or incomplete work; check the original log.',snapshot:clone({record:record||null,logs})};
  });
  if(evidence.length<2||evidence.some(e=>!e.valid)||new Set(evidence.map(e=>e.date)).size!==2)gaps.push('Two consecutive planned exposures on distinct dates need matching loads, sets, rep ranges and complete effort logs.');
  const complete=supported&&gaps.length===0;
  const above=complete&&evidence.some(e=>e.actual.sets.some(s=>s.rpe>a.targetRpe)),top=complete&&evidence.every(e=>e.actual.sets.every(s=>s.reps===a.maxReps&&s.rpe<=a.targetRpe));
  const status=!complete?'manual-review':above?'review-reduce':top&&target.sets[0].weight>0?'review-load':'hold';
  const reason=status==='manual-review'?'Keep the scheduled target while resolving the evidence gaps.':status==='review-reduce'?'Logged effort exceeded the reviewed cap. You can review a smaller load for the next exposure.':status==='review-load'?'Both latest exposures reached the top of the rep range within the effort cap. You can review a small load increase.':'Keep this target and work within its rep range.'+(target?.sets?.[0]?.weight===0?' Zero added load needs a separate starting-load review.':'');
  return {policy:POLICY,sessionId,exerciseId,name:a.name,asOf,date:session.date,equipment:a.equipment,status,reason,gaps,evidence,target:clone(target),basis:clone({program:o.program,session,profile,catalog}),notice:'This is a conservative software review, not proof of recovery, strength gain or an optimal dose. Equipment and load conventions need athlete confirmation. Only the selected future session can change.'};
 }
 function preview(state,report,request,{asOf,now=new Date().toISOString()}={}){
  if(asOf!==report?.asOf)throw Error('Review date changed; reopen the review');
  const fresh=analyze(state,{sessionId:report.sessionId,exerciseId:report.exerciseId,asOf,now});
  if(!same(fresh,report))throw Error('Evidence, profile or Calendar target changed; review again');
  if(!['review-load','review-reduce'].includes(report.status))throw Error('This evidence supports keeping the target or manual review only');
  const r=request,old=report.target.sets[0].weight;
  if(!r||r.equipmentConfirmed!==true||r.noCurrentConcerns!==true||!['total','per-hand','stack','added'].includes(r.loadConvention))throw Error('Confirm the same actual equipment, load convention and no current concerns');
  const conventions={dumbbells:['total','per-hand'],cable:['stack'],machine:['stack'],bodyweight:['added'],pullup:['added'],barbell:['total']};
  if(conventions[report.equipment]&&!conventions[report.equipment].includes(r.loadConvention)||[report.target,...report.evidence.flatMap(e=>[e.plan,e.actual])].some(e=>e?.loadConvention&&e.loadConvention!==r.loadConvention))throw Error('Load convention differs; use a fresh manual review');
  if(!Number.isFinite(r.weightKg)||r.weightKg<=0||r.weightKg>500||Math.abs(r.weightKg-Math.round(r.weightKg*100)/100)>.00001||report.status==='review-load'&&!(r.weightKg>old&&r.weightKg<=old*1.05+.00001)||report.status==='review-reduce'&&!(r.weightKg<old&&r.weightKg>=old*.95-.00001))throw Error('Choose a usable load within 5% of the scheduled load in the reviewed direction; larger changes need manual review');
  const after=clone(report.basis.session.prescription),e=after.plannedExercises.find(e=>e.exerciseId===report.exerciseId);
  e.loadConvention=r.loadConvention;e.sets.forEach(s=>s.weight=r.weightKg);
  return {report:clone(report),request:clone(request),before:clone(report.basis.session.prescription),after:I.prescription(after)};
 }
 function approve(state,p,{asOf,now=new Date().toISOString(),confirmed=false,draftOpen=false}={}){
  if(!confirmed||draftOpen)throw Error('Close training drafts and approve the exact next-session change');
  if(!stamp(now)||now<=p?.report?.basis?.session?.revisionAt)throw Error('Review time changed; reopen the review');
  const fresh=preview(state,p.report,p.request,{asOf,now});if(!same(fresh,p))throw Error('Preview changed; review again');
  const sessions=S.validate(state.scheduledSessions||[]),r=sessions.find(r=>r.id===p.report.sessionId),context=clone(r.revisions.at(-1).context);
  context.prescription=I.prescription({...p.after,capturedAt:now});
  context.reason='Accessory review v1: '+p.report.name+'; '+p.report.status+'; same equipment '+p.report.equipment+' / '+p.request.loadConvention+'; no current concerns confirmed; logs '+p.report.evidence.map(e=>e.workoutId).join(', ');
  r.revisions.push({recordedAt:now,context});return {...state,scheduledSessions:S.validate(sessions)};
 }
 function answer(state,question,{asOf,unit='kg',history=[],live=null}={}){
  const q=String(question||'');if(Support.health(q)||/\b(occupied|unavailable|replace|swap|substitut|training max|1rm)\w*\b/i.test(q))return null;
  if(!/\b(next time|next session|next target|progress|increase|add weight|review.*accessor)\w*\b/i.test(q))return null;
  const options=targets(state,{asOf});
  const words=x=>' '+String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' ';
  const named=options.filter(o=>words(q).includes(words(o.name))),prior=history.filter(r=>r.role==='user').at(-1)?.content;
  const current=live?.liveWorkout?.currentExercise?.name;
  let name=named[0]?.name;
  if(!name&&/\b(this|current|next time)\b/i.test(q)&&current&&options.some(o=>o.name===current))name=current;
  if(!name&&/\b(it|that|next time)\b/i.test(q))name=options.find(o=>words(prior).includes(words(o.name)))?.name;
  if(named.some(o=>o.name!==name))name=null;
  if(!name&&!/accessor/i.test(q)&&!(options.length&&/^what should i do next time\??$/i.test(q)))return null;
  const candidates=name?options.filter(o=>o.name===name):options;
  const reply={source:'Shared coaching · accessory review',readOnly:true,evidence:[],actions:[{kind:'accessory-review',label:'Review accessory targets'}]};
  if(!candidates.length)return {...reply,text:'No eligible future accessory target is scheduled. Schedule a reviewed phase or meet cycle first. Holds and cardio remain separate manual reviews.'};
  if(!name&&new Set(candidates.map(o=>o.name)).size>1)return {...reply,text:'Choose the movement you want to review: '+[...new Set(candidates.map(o=>o.name))].slice(0,5).join(', ')+'. I will compare its two latest planned exposures with the next target; chat changes no workout.',followUps:[...new Set(candidates.map(o=>o.name))].slice(0,3).map(name=>'What should I do next time for '+name+'?')};
  const o=candidates[0],r=analyze(state,{...o,asOf});reply.actions[0]={...reply.actions[0],sessionId:o.sessionId,exerciseId:o.exerciseId};
  const load=(r.target?.sets?.[0]?.weight??null),weight=load==null?'not available':Math.round(load*(unit==='lb'?2.2046226218:1)*100)/100+' '+unit;
  return {...reply,text:r.name+' — next target '+r.date+': '+weight+'. '+r.reason+' '+(r.gaps[0]||'Based on the two latest planned exposures and their actual rep/effort logs.')+' Open the review to confirm equipment and inspect the exact before → after. I have not changed your workout.',evidence:[r],followUps:['Review my accessory progression']};
 }
 return {POLICY,targets,analyze,preview,approve,answer};
});
