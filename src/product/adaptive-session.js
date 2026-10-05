/* Reviewed session alternatives. Pure previews never mutate a plan or training. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./session-intent'),require('./schedule'));
 else root.LoadnoteAdaptiveSession=factory(root.LoadnoteIntent,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Intent,Schedule){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const text=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
 const EQUIPMENT=['barbell','rack','bench','dumbbells','cable','machine','bands','bodyweight'];
 function preferences(raw={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid athlete preferences');
  const equipment=raw.equipment||[],excludedExerciseIds=raw.excludedExerciseIds||[];
  if(!Array.isArray(equipment)||equipment.some(x=>!EQUIPMENT.includes(x))||new Set(equipment).size!==equipment.length||!Array.isArray(excludedExerciseIds)||excludedExerciseIds.length>100||excludedExerciseIds.some(x=>!text(x,160))||new Set(excludedExerciseIds).size!==excludedExerciseIds.length)throw Error('Invalid confirmed equipment or exclusions');
  if(raw.minutes!=null&&(!Number.isInteger(raw.minutes)||raw.minutes<10||raw.minutes>240))throw Error('Choose a session budget from 10 to 240 minutes');
  return {version:1,equipment:[...equipment],equipmentConfirmed:raw.equipmentConfirmed===true,excludedExerciseIds:[...excludedExerciseIds],minutes:raw.minutes??null};
 }
 function movement(raw){
  if(!raw||!text(raw.exerciseId,160)||!text(raw.name,160)||!text(raw.purpose,120)||!text(raw.group,120)||raw.confirmed!==true||!Array.isArray(raw.equipment)||!raw.equipment.length||raw.equipment.some(x=>!EQUIPMENT.includes(x))||!['total','per-hand','stack','added'].includes(raw.loadConvention))throw Error('Review movement identity, purpose, muscles, equipment and load convention');
  return {exerciseId:raw.exerciseId,name:raw.name,purpose:raw.purpose,group:raw.group,equipment:[...raw.equipment],loadConvention:raw.loadConvention,confirmed:true};
 }
 function deviceProfile(raw){
  if(raw==null)return {version:1,preferences:preferences(),movements:[]};
  if(raw.version!==1||!Array.isArray(raw.movements)||raw.movements.length>100)throw Error('Invalid saved adaptation preferences');
  const movements=raw.movements.map(movement);if(new Set(movements.map(m=>m.exerciseId)).size!==movements.length)throw Error('Duplicate saved movement identity');
  return {version:1,preferences:preferences(raw.preferences),movements};
 }
 function alternatives(source,rules,profile={}){
  const from=movement(source),p=preferences(profile);if(!p.equipmentConfirmed)return {choices:[],reason:'Confirm available equipment before reviewing alternatives.'};
  const ids=new Set();const choices=[];
  for(const input of rules||[]){const to=movement(input);if(ids.has(to.exerciseId))throw Error('Duplicate movement identity');ids.add(to.exerciseId);
   if(to.exerciseId===from.exerciseId||p.excludedExerciseIds.includes(to.exerciseId)||to.group!==from.group||to.purpose!==from.purpose||!to.equipment.every(x=>p.equipment.includes(x)))continue;
   choices.push({...to,reason:'Matches the athlete-confirmed purpose and muscle group; available equipment is compatible.',tradeOff:'Matching purpose does not establish equivalent stimulus, technique or load.',requiresStartingDose:true});
  }
  return {choices,reason:choices.length?'Review a new starting dose before replacing work.':'No confirmed compatible alternative is available.'};
 }
 function estimate(exercises,{setupSeconds=120,transitionSeconds=90,setSeconds=45,defaultRestSeconds=null}={}){
  if(![setupSeconds,transitionSeconds,setSeconds].every(x=>Number.isInteger(x)&&x>=0&&x<=600)||setSeconds<1)throw Error('Invalid timing assumptions');
  if(defaultRestSeconds!=null&&(!Number.isInteger(defaultRestSeconds)||defaultRestSeconds<60||defaultRestSeconds>600))throw Error('Review the missing-rest assumption (60–600 seconds)');
  let seconds=0,known=true;const rows=[];
  for(const e of exercises||[]){let duration=null;
   const rest=e.restSeconds??defaultRestSeconds;
   if(e.type==='strength'&&Array.isArray(e.sets)&&e.sets.length&&Number.isInteger(rest)&&rest>=60&&rest<=600){duration=setupSeconds+e.sets.reduce((n,s)=>n+(e.trackBy==='duration'?s.duration:setSeconds),0)+Math.max(0,e.sets.length-1)*rest;if(!Number.isFinite(duration)||duration<0)duration=null;}
   if(duration==null)known=false;else seconds+=duration;
   rows.push({exerciseId:e.exerciseId||null,name:e.name,seconds:duration});
  }
  seconds+=Math.max(0,rows.length-1)*transitionSeconds;
  return {known,minutes:known?Math.ceil(seconds/60):null,knownWorkMinutes:Math.ceil(seconds/60),rows,assumptions:{setupSeconds,transitionSeconds,setSeconds,defaultRestSeconds},notice:'Planning estimate, not a completion-time guarantee. Warm-up, queues and interruptions are not included. Rest targets are retained; missing rest uses only your explicit timing assumption.'};
 }
 function timePreview(plan,{minutes,optionalExerciseIds=[],assumptions}={}){
  const before=Intent.prescription(plan);if(!before)throw Error('Capture a reviewed prescription first');preferences({minutes});if(minutes==null)throw Error('Choose a session budget');
  if(!Array.isArray(optionalExerciseIds)||optionalExerciseIds.some(x=>!text(x,160))||new Set(optionalExerciseIds).size!==optionalExerciseIds.length)throw Error('Invalid optional work');
  const exercises=before.plannedExercises,ids=new Set(optionalExerciseIds);
  if(optionalExerciseIds.some(id=>exercises.filter(e=>e.exerciseId===id).length!==1))throw Error('Choose unambiguous optional work from this prescription');
  // A mixed technical/drill session requires a dedicated protocol review.
  if(exercises.some(e=>e.type==='practice'))return {supported:false,before,reason:'Olympic and athletic protocols require their dedicated review; no generic shortening is proposed.'};
  const initial=estimate(exercises,assumptions),after=clone(before),omitted=[];
  if(!initial.known)return {supported:false,before,reason:'Rest or execution-time evidence is missing; no guessed duration or automatic omission is proposed.',estimate:initial};
  for(let i=exercises.length-1;i>=0&&estimate(after.plannedExercises,assumptions).minutes>minutes;i--){const e=exercises[i];if(!ids.has(e.exerciseId)||after.plannedExercises.length<=1)continue;
   after.plannedExercises=exercises.filter(x=>!omitted.includes(x.exerciseId)&&x.exerciseId!==e.exerciseId).map(clone);omitted.push(e.exerciseId);
  }
  const final=estimate(after.plannedExercises,assumptions);
  return {version:1,kind:'time',supported:true,before,after,minutes,optionalExerciseIds:[...optionalExerciseIds],omittedExerciseIds:omitted,assumptions:initial.assumptions,estimateBefore:initial,estimateAfter:final,fitsEstimate:final.minutes<=minutes,notice:'Only explicitly optional exercises may be omitted. This reduces dose, not rest. If essential work exceeds the budget, review a different session or reschedule.'};
 }
 function replacementPreview(plan,{source,target,startingDose,profile}={}){
  const before=Intent.prescription(plan),from=movement(source),to=movement(target);if(!before)throw Error('Capture a reviewed prescription first');
  if(before.plannedExercises.some(e=>e.type==='practice'))throw Error('Technical and athletic protocols need a dedicated review');
  const matches=before.plannedExercises.filter(e=>e.exerciseId===from.exerciseId);if(matches.length!==1||matches[0].type!=='strength'||matches[0].name!==from.name)throw Error('Choose one unambiguous strength exercise');
  if(!alternatives(from,[to],profile).choices.length)throw Error('Replacement is not compatible with confirmed preferences');
  if(!startingDose||!Array.isArray(startingDose.sets)||startingDose.sets.length<1||startingDose.sets.length>3||startingDose.sets.some(s=>!s||!Number.isFinite(s.weight)||s.weight<0||s.weight>500||s.weight===0&&!to.equipment.includes('bodyweight')||!Number.isInteger(s.reps)||s.reps<6||s.reps>20||!Number.isFinite(s.targetRpe)||s.targetRpe<6||s.targetRpe>8))throw Error('Review 1–3 accessory sets, 6–20 reps, explicit load (zero only for bodyweight) and an RPE cap of 6–8');
  const replacement=Intent.createPrescription([{...startingDose,type:'strength',name:to.name,exerciseId:to.exerciseId,loadConvention:to.loadConvention}],before.source,before.capturedAt)?.plannedExercises[0];
  if(!replacement||replacement.trackBy!=='reps'||replacement.sets.length>6||!replacement.restSeconds||replacement.sets.some(s=>!Number.isFinite(s.weight)||s.weight>1000||s.reps>30||!Number.isFinite(s.targetRpe)))throw Error('Review a fresh starting load, sets, reps, effort cap and rest');
  const after=clone(before);after.plannedExercises=after.plannedExercises.map(e=>e.exerciseId===from.exerciseId?replacement:e);
  return {version:1,kind:'replacement',before,after,source:from,target:to,profile:preferences(profile),startingDose:clone(startingDose),notice:'A replacement is a new movement dose. Do not transfer a training max, previous result or progression eligibility.'};
 }
 function approve(current,preview,{confirmed=false,now=new Date().toISOString()}={}){
  if(confirmed!==true||!preview?.supported&&preview?.kind==='time')throw Error('Explicitly review and confirm a supported adaptation');
  const p=Intent.prescription(current);if(!same(p,preview?.before))throw Error('Prescription changed; reopen the preview');
  const fresh=preview.kind==='time'?timePreview(p,preview):preview.kind==='replacement'?replacementPreview(p,preview):null;
  if(!fresh||!same(fresh,preview))throw Error('Adaptation changed; reopen the preview');
  if(now<=p.capturedAt)throw Error('Adaptation must follow the captured prescription');
  return Intent.prescription({...fresh.after,capturedAt:now});
 }
 function optionalIds(state,session){
  for(const [prefix,records] of [['phase',state.phasePrograms],['meet',state.meetCycles]]){const p=(records||[]).find(p=>session.id.startsWith(prefix+':'+p.id+':'));if(p){const config=prefix==='phase'?p.config:p.sourceProgram?.config;return [...new Set((config?.accessories||[]).map(e=>e.exerciseId))].filter(id=>session.prescription.plannedExercises.some(e=>e.exerciseId===id));}}
  return [];
 }
 function applySchedule(state,id,preview,{confirmed=false,asOf,expectedRevisionAt,now=new Date().toISOString(),draftOpen=false}={}){
  if(draftOpen||!Schedule.date(asOf))throw Error('Close open workout and sport drafts before reviewing Calendar targets');
  const sessions=Schedule.validate(state.scheduledSessions||[]),record=sessions.find(r=>r.id===id),latest=record?.revisions.at(-1),session=Schedule.list(sessions).find(s=>s.id===id);
  if(!session||session.status!=='scheduled'||session.date<asOf||latest.recordedAt!==expectedRevisionAt||(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===id))throw Error('Only current unperformed sessions can change; refresh the review');
  if(preview.kind==='time'&&preview.optionalExerciseIds.some(x=>!optionalIds(state,session).includes(x)))throw Error('Only reviewed program accessories are optional');
  if(preview.kind==='time'&&!preview.omittedExerciseIds.length)throw Error('No dose change to approve; keep the current targets');
  if(preview.kind==='replacement'&&!optionalIds(state,session).includes(preview.source.exerciseId))throw Error('Primary and technical work is protected; choose a reviewed accessory');
  if(preview.kind==='replacement'&&[preview.source,preview.target].some(m=>!(state.exerciseCatalog||[]).some(e=>e.id===m.exerciseId&&e.name===m.name)))throw Error('Movement identity changed; review the current catalog mapping');
  const prescription=approve(session.prescription,preview,{confirmed,now});
  record.revisions.push({recordedAt:now,context:{...clone(latest.context),prescription,reason:('Adaptive '+preview.kind+' review: '+(preview.kind==='time'?'omitted '+preview.omittedExerciseIds.join(', '):preview.source.name+' → '+preview.target.name)+'. '+preview.notice).slice(0,500)}});
  return {...state,scheduledSessions:Schedule.validate(sessions)};
 }
 return {EQUIPMENT,preferences,movement,deviceProfile,alternatives,estimate,timePreview,replacementPreview,approve,optionalIds,applySchedule};
});
