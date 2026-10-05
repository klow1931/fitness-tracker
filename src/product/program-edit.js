/* Athlete-authored Calendar revisions. New identities never inherit strength evidence. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./session-intent'),require('./schedule'),require('./data-integrity'),require('./programming-profile'),require('./athlete-intake'));else root.LoadnoteProgramEdit=factory(root.LoadnoteIntent,root.LoadnoteSchedule,root.LoadnoteIntegrity,root.LoadnoteProgrammingProfile,root.LoadnoteAthleteIntake);})(typeof globalThis!=='undefined'?globalThis:this,function(I,S,D,P,A){
 'use strict';const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const REASONS={preference:'Exercise preference',equipment:'Equipment access',time:'Time available',symptoms:'Symptoms / clinician restrictions',coach:'Reported coach instruction',other:'Other'};
 const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 function selected(state,id,asOf){if(!S.date(asOf))throw Error('Choose a current review date');const r=S.validate(state.scheduledSessions||[]).find(s=>s.id===id),s=S.list(r?[r]:[])[0];if(!s||s.status!=='scheduled'||s.date<asOf||(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===id))throw Error('Only unperformed current/future Calendar targets may be edited');return s;}
 function target(state,raw){
  if(!raw||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>160||!['strength','cardio'].includes(raw.type))throw Error('Enter an exact strength or cardio movement');
  if(raw.exerciseId&&!(state.exerciseCatalog||[]).some(e=>e.id===raw.exerciseId))throw Error('Selected movement no longer exists');
  const name=raw.name.trim(),existing=(state.exerciseCatalog||[]).find(e=>e.id===raw.exerciseId)||(state.exerciseCatalog||[]).find(e=>e.name===name),id=existing?.id||D.stableExerciseId(name);
  if(existing&&existing.name!==name||(state.exerciseCatalog||[]).some(e=>e.id===id&&e.name!==name))throw Error('Movement identity changed; review the catalog');
  let e;
  if(raw.type==='cardio'){if(!Number.isInteger(raw.duration)||raw.duration<5||raw.duration>90)throw Error('Choose 5–90 cardio minutes');e={name,exerciseId:id,type:'cardio',duration:raw.duration,distance:0,distanceUnit:'km'};}
  else {if(!['total','per-hand','stack','added'].includes(raw.loadConvention)||!Number.isInteger(raw.restSeconds)||raw.restSeconds<60||raw.restSeconds>600||!Array.isArray(raw.sets)||raw.sets.length<1||raw.sets.length>6||raw.sets.some(s=>!s||!Number.isFinite(s.weight)||s.weight<0||s.weight>1000||!Number.isInteger(s.reps)||s.reps<1||s.reps>30||!Number.isFinite(s.targetRpe)||s.targetRpe<1||s.targetRpe>9))throw Error('Enter a fresh load in kg, 1–6 sets, 1–30 reps, RPE cap 1–9, load convention and 60–600 seconds rest');e={name,exerciseId:id,type:'strength',trackBy:'reps',loadConvention:raw.loadConvention,restSeconds:raw.restSeconds,sets:clone(raw.sets)};}
  e=I.createPrescription([e],{type:'manual'},'2026-01-01T00:00:00.000Z').plannedExercises[0];
  return {exercise:e,catalogEntry:existing?null:{id,name,aliases:[]}};
 }
 function preview(state,id,raw,{asOf}={}){
  const session=selected(state,id,asOf),before=I.prescription(session.prescription),profile=P.current(state.programmingProfiles||[]),intake=profile?.context.intake;
  if(!raw||!['remove','replace','add'].includes(raw.action)||!Object.hasOwn(REASONS,raw.reason)||typeof raw.notes!=='string'||!raw.notes.trim()||raw.notes.length>250)throw Error('Choose an edit, reason and a short explanation');
  if(before.plannedExercises.some(e=>e.type==='practice'))throw Error('Technical and athletic protocols need their dedicated plan review');
  const after=clone(before),match=before.plannedExercises.filter(e=>e.exerciseId===raw.sourceId);
  if(raw.action!=='add'&&match.length!==1)throw Error('Select an unambiguous planned exercise');
  const protectedWork=raw.action!=='add'&&!['cardio'].includes(match[0].type)&&!requireOptional(state,session).includes(raw.sourceId);
  if(protectedWork&&raw.primaryAcknowledged!==true)throw Error('Explicitly acknowledge changing primary work and its comparison context');
  let added=null;
  if(raw.action!=='remove'){
   added=target(state,raw.target);A.guard(intake,[added.exercise.exerciseId]);
   if(profile?.context.avoidedExerciseIds.includes(added.exercise.exerciseId))throw Error('This movement is marked avoided in your training setup');
   if(after.plannedExercises.some(e=>e.exerciseId===added.exercise.exerciseId))throw Error('Choose a new exact identity; do not duplicate or silently redose an existing movement');
   if(session.role==='deload'||/taper|peak|event/i.test(session.name))throw Error('Protected deload, peak and event work needs a dedicated review; additions/replacements are not offered here');
  }
  if(raw.action==='remove')after.plannedExercises=after.plannedExercises.filter(e=>e.exerciseId!==raw.sourceId);
  if(raw.action==='replace')after.plannedExercises=after.plannedExercises.map(e=>e.exerciseId===raw.sourceId?added.exercise:e);
  if(raw.action==='add')after.plannedExercises.push(added.exercise);
  if(!after.plannedExercises.length||after.plannedExercises.length>20)throw Error('Keep 1–20 movements; use program cancellation instead of removing all work');
  const addedMinutes=after.plannedExercises.filter(e=>e.type==='cardio').reduce((n,e)=>n+e.duration,0);if(addedMinutes&&(addedMinutes>profile?.context.sessionMinutes))throw Error('Cardio duration exceeds your reported session availability');
  const normalized=I.prescription(after);if(!same(normalized,after))throw Error('Targets changed during validation');
  return {version:1,id,asOf,revisionAt:session.revisionAt,before,after,request:clone(raw),profileSnapshot:clone(profile),catalogEntry:added?.catalogEntry||null,notice:'Athlete-authored change, not a Loadnote recommendation. Original program and logged history remain intact. New movements use fresh targets and do not inherit a training max or progression evidence.'};
 }
 function requireOptional(state,s){for(const [prefix,records] of [['phase',state.phasePrograms],['meet',state.meetCycles]]){const p=(records||[]).find(p=>s.id.startsWith(prefix+':'+p.id+':'));if(p)return (prefix==='phase'?p.config:p.sourceProgram?.config)?.accessories?.map(e=>e.exerciseId)||[];}return [];}
 function approve(state,p,{asOf,confirmed=false,draftOpen=false,now=new Date().toISOString()}={}){
  if(!confirmed||draftOpen)throw Error('Close open training drafts and explicitly approve this Calendar edit');
  if(!stamp(now)||asOf!==p?.asOf||now<=p.revisionAt)throw Error('Review time changed; reopen the edit');
  const fresh=preview(state,p.id,p.request,{asOf});if(!same(fresh,p))throw Error('Prescription, intake or movement identity changed; preview again');
  const sessions=S.validate(state.scheduledSessions),r=sessions.find(r=>r.id===p.id),c=clone(r.revisions.at(-1).context);
  c.prescription=I.prescription({...p.after,capturedAt:now});c.reason='Athlete edit v1 ['+p.request.reason+']: '+p.request.notes;
  r.revisions.push({recordedAt:now,context:c});return {...state,scheduledSessions:S.validate(sessions),exerciseCatalog:p.catalogEntry?[...(state.exerciseCatalog||[]),p.catalogEntry]:state.exerciseCatalog};
 }
 function learning(state,{asOf}={}){if(!S.date(asOf))throw Error('Choose an evidence date');const events=[],counts=new Map();
  for(const r of S.validate(state.scheduledSessions||[]))for(let j=1;j<r.revisions.length;j++){const v=r.revisions[j],prior=r.revisions[j-1],reason=/^Athlete edit v1 \[(preference|equipment|time|symptoms|coach|other)\]:/.exec(v.context.reason);if(!reason||v.recordedAt.slice(0,10)>asOf)continue;
   const before=prior.context.prescription.plannedExercises,after=v.context.prescription.plannedExercises,removed=before.filter(e=>!after.some(a=>a.exerciseId===e.exerciseId)),added=after.filter(e=>!before.some(a=>a.exerciseId===e.exerciseId));
   const linked=(state.workouts||[]).filter(w=>w.date<=asOf&&w.sessionIntent?.schedule?.id===r.id&&w.sessionIntent.schedule.revisionAt===v.recordedAt);
   events.push({sessionId:r.id,recordedAt:v.recordedAt,reason:reason[1],removed:removed.map(e=>e.name),added:added.map(e=>e.name),observedLogs:linked.length});
   if(['preference','equipment'].includes(reason[1]))for(const e of removed){const c=counts.get(e.exerciseId)||{exerciseId:e.exerciseId,name:e.name,sessions:new Set()};c.sessions.add(r.id);counts.set(e.exerciseId,c);}
  }
  return {events,suggestions:[...counts.values()].filter(c=>c.sessions.size>=2).map(c=>({exerciseId:c.exerciseId,name:c.name,count:c.sessions.size})),notice:'Repeated edits describe stated choices. Linked logs describe observed work, not proof that an edit improved training or healed an injury. Confirm a preference before future programming uses it.'};
 }
 function acceptAvoided(state,id,{asOf,confirmed=false,now=new Date().toISOString()}={}){const p=P.current(state.programmingProfiles||[]);if(!confirmed||!p||!learning(state,{asOf}).suggestions.some(s=>s.exerciseId===id))throw Error('Review a repeated preference and confirm it explicitly');const c=clone(p.context);c.avoidedExerciseIds=[...new Set([...c.avoidedExerciseIds,id])];c.preferredExerciseIds=c.preferredExerciseIds.filter(x=>x!==id);return {...state,programmingProfiles:P.save(state.programmingProfiles,c,{now})};}
 return {REASONS,target,preview,approve,learning,acceptAvoided};
});
