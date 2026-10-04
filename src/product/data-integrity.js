(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteIntegrity=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
 const name=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,120);
 const nameKey=value=>name(value).toLocaleLowerCase();
 const compactKey=value=>nameKey(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
 function hash(value){let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
 const stableExerciseId=value=>'exercise_'+hash(compactKey(value)||nameKey(value)||'unnamed');
 function resolveExercise(catalog,label){const key=compactKey(label);return (catalog||[]).find(entry=>[entry.name,...(entry.aliases||[])].some(value=>compactKey(value)===key))||null;}
 const same=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
 const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
 function references(state){
  const refs=[];
  const exercises=collection=>(collection||[]).forEach(item=>(item.exercises||[]).forEach(ex=>{if(ex&&name(ex.name))refs.push(ex);}));
  const plans=collection=>(collection||[]).forEach(item=>(item?.sessionIntent?.prescription?.plannedExercises||[]).forEach(ex=>{if(ex&&name(ex.name))refs.push(ex);}));
  exercises(state.workouts);plans(state.workouts);exercises(state.templates);
  (state.prs||[]).forEach(p=>{if(p&&name(p.exercise))refs.push({owner:p,name:p.exercise,exerciseId:p.exerciseId});if(p?.baselinePR&&name(p.baselinePR.exercise))refs.push({owner:p.baselinePR,name:p.baselinePR.exercise,exerciseId:p.baselinePR.exerciseId||p.exerciseId});});
  (state.trainingBlocks||[]).forEach(block=>(block.revisions||[]).forEach(revision=>{const context=revision?.context;if(!context)return;for(const field of ['trainingMaxes','known1RMs'])(context[field]||[]).forEach(row=>{if(row&&name(row.exercise))refs.push({owner:row,name:row.exercise,exerciseId:row.exerciseId});});}));
  (state.workoutRevisions||[]).forEach(revision=>{exercises(revision.before?[revision.before]:[]);plans(revision.before?[revision.before]:[]);exercises(revision.after?[revision.after]:[]);plans(revision.after?[revision.after]:[]);});
  // Explicit identity merges update technical-practice links, including revisions.
  (state.olympicPractice||[]).forEach(record=>(record.revisions||[]).forEach(v=>{if(v.context?.exerciseId){const e=(state.exerciseCatalog||[]).find(e=>e.id===v.context.exerciseId);if(e)refs.push({owner:v.context,name:e.name,exerciseId:e.id});}}));
  return refs;
 }
 function normalizedEntry(raw){
  if(!raw||typeof raw!=='object'||!name(raw.name))return null;
  const aliases=[...new Set((Array.isArray(raw.aliases)?raw.aliases:[]).map(name).filter(Boolean).filter(alias=>nameKey(alias)!==nameKey(raw.name)))];
  return {id:String(raw.id||stableExerciseId(raw.name)),name:name(raw.name),aliases,...(raw.muscles?{muscles:clone(raw.muscles)}:{})};
 }
 function normalizeState(input){
  const state=clone(input)||{};state.exerciseCatalog=(Array.isArray(state.exerciseCatalog)?state.exerciseCatalog:[]).map(normalizedEntry).filter(Boolean);
  state.workoutRevisions=Array.isArray(state.workoutRevisions)?state.workoutRevisions:[];state.recoverySnapshots=Array.isArray(state.recoverySnapshots)?state.recoverySnapshots:[];state.exerciseRoles=Array.isArray(state.exerciseRoles)?state.exerciseRoles:[];
  (state.trainingBlocks||[]).forEach(block=>(block.revisions||[]).forEach(revision=>{if(revision?.context&&!revision.context.dataCompleteness)revision.context.dataCompleteness='unknown';}));
  const byId=new Map(),byName=new Map();
  for(const entry of state.exerciseCatalog){
   if(byId.has(entry.id)){const existing=byId.get(entry.id);existing.aliases.push(entry.name,...entry.aliases);continue;}
   byId.set(entry.id,entry);
  }
  state.exerciseCatalog=[...byId.values()];
  for(const entry of state.exerciseCatalog)for(const label of [entry.name,...entry.aliases])if(compactKey(label))byName.set(compactKey(label),entry);
  for(const ref of references(state)){
   const holder=ref.owner||ref,rawName=name(ref.name),key=compactKey(rawName);let entry=ref.exerciseId&&byId.get(String(ref.exerciseId));
   if(!entry&&key)entry=byName.get(key);
   if(!entry){
    let id=stableExerciseId(rawName),suffix=1;while(byId.has(id)&&compactKey(byId.get(id).name)!==key)id=stableExerciseId(rawName)+'_'+suffix++;
    entry={id,name:rawName,aliases:[]};state.exerciseCatalog.push(entry);byId.set(id,entry);if(key)byName.set(key,entry);
   }
   if(rawName&&nameKey(rawName)!==nameKey(entry.name)&&!entry.aliases.some(alias=>nameKey(alias)===nameKey(rawName)))entry.aliases.push(rawName);
   holder.exerciseId=entry.id;
  }
  state.exerciseCatalog.forEach(entry=>entry.aliases=[...new Set(entry.aliases.map(name).filter(Boolean).filter(alias=>nameKey(alias)!==nameKey(entry.name)))].sort((a,b)=>a.localeCompare(b)));
  state.exerciseCatalog.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  state.integrityVersion=1;return state;
 }
 function mergeExercises(input,sourceId,targetId){
  if(String(sourceId)===String(targetId))throw Error('Choose two different exercises.');
  const state=normalizeState(input),source=state.exerciseCatalog.find(e=>e.id===String(sourceId)),target=state.exerciseCatalog.find(e=>e.id===String(targetId));
  if(!source||!target)throw Error('Exercise identity no longer exists.');
  target.aliases.push(source.name,...source.aliases);
  // Conflicting identity mappings become unknown until the athlete confirms again.
  if(source.muscles && target.muscles && !same(source.muscles,target.muscles))delete target.muscles;
  else if(source.muscles && !target.muscles)target.muscles=clone(source.muscles);
  for(const ref of references(state)){const holder=ref.owner||ref;if(holder.exerciseId===source.id)holder.exerciseId=target.id;}
  const roles=Array.isArray(state.exerciseRoles)?state.exerciseRoles:[],targetRole=roles.find(record=>record.revisions?.at(-1)?.context?.exerciseId===target.id);
  for(const record of roles.filter(row=>row.revisions?.at(-1)?.context?.exerciseId===source.id)){
   if(targetRole){const recordedAt=new Date(Math.max(Date.now(),Date.parse(record.updatedAt)+1)).toISOString();record.revisions.push({recordedAt,context:null});record.updatedAt=recordedAt;}
   else for(const revision of record.revisions||[])if(revision.context)revision.context.exerciseId=target.id;
  }
  state.exerciseCatalog=state.exerciseCatalog.filter(e=>e.id!==source.id);return normalizeState(state);
 }

 function median(values){const a=[...values].sort((x,y)=>x-y),n=a.length;return n?n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2:null;}
 function auditWorkouts(workouts){
  const groups=new Map(),issues=[];let strengthSets=0,missingRpe=0,invalidRpe=0,invalidLoad=0;
  for(const workout of Array.isArray(workouts)?workouts:[])for(const exercise of workout?.exercises||[]){
   if(exercise?.type==='cardio'||exercise?.trackBy==='duration')continue;
   const key=String(exercise?.exerciseId||compactKey(exercise?.name)||nameKey(exercise?.name)||'unknown'),rows=groups.get(key)||[];
   for(let i=0;i<(exercise?.sets||[]).length;i++){
    const set=exercise.sets[i],reps=Number(set?.reps),weight=Number(set?.weight),rawRpe=set?.rpe;
    if(!Number.isInteger(reps)||reps<1)continue;
    strengthSets++;
    if(!Number.isFinite(weight)||weight<0){invalidLoad++;issues.push({code:'invalid-load',workoutId:String(workout?.id||''),date:workout?.date||null,exerciseId:exercise?.exerciseId||null,exercise:name(exercise?.name),setIndex:i+1,detail:'Load is missing, negative, or not numeric.'});}
    else if(weight>0)rows.push({weight,workoutId:String(workout?.id||''),date:workout?.date||null,exerciseId:exercise?.exerciseId||null,exercise:name(exercise?.name),setIndex:i+1});
    if(rawRpe==null||rawRpe==='')missingRpe++;
    else {const rpe=Number(rawRpe);if(!Number.isFinite(rpe)||rpe<1||rpe>10){invalidRpe++;issues.push({code:'invalid-rpe',workoutId:String(workout?.id||''),date:workout?.date||null,exerciseId:exercise?.exerciseId||null,exercise:name(exercise?.name),setIndex:i+1,detail:'RPE must be between 1 and 10 when recorded.'});}}
   }
   groups.set(key,rows);
  }
  let suspiciousLoads=0;
  for(const rows of groups.values()){
   if(rows.length<4)continue;const center=median(rows.map(r=>r.weight));if(!(center>0))continue;
   for(const row of rows)if(row.weight>=center*3&&row.weight-center>=100){suspiciousLoads++;issues.push({...row,code:'suspicious-load',detail:'Load is at least 3× the median logged load for this exercise. Review the entry before using it as performance evidence.',medianKg:Math.round(center*100)/100});}
  }
  const rpeCoverage=strengthSets?Math.round((strengthSets-missingRpe-invalidRpe)/strengthSets*1000)/10:null;
  return {strengthSets,missingRpe,invalidRpe,invalidLoad,suspiciousLoads,rpeCoverage,issues};
 }
 function auditTrainingData(state,{asOf}={}){
  const current=auditWorkouts((state?.workouts||[]).filter(w=>!asOf||!w?.date||w.date<=asOf)),historical=[];
  for(const revision of state?.workoutRevisions||[])for(const side of ['before','after'])if(revision?.[side])historical.push(revision[side]);
  const history=auditWorkouts(historical),blocking=current.invalidLoad+current.invalidRpe+current.suspiciousLoads;
  return {version:1,asOf:asOf||null,status:blocking?'review':'clean',current,history:{...history,issues:history.issues.slice(0,50)},notes:[
   'Current-workout issues can affect analytics and adaptive evidence; review them before relying on a new program.',
   'Missing RPE is allowed and lowers evidence coverage rather than inventing effort.',
   'Historical revision warnings are audit history only; corrected current workouts remain the active record.'
  ]};
 }

 function canonicalStringify(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonicalStringify).join(',')+']';
  return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalStringify(value[key])).join(',')+'}';
 }
 function fingerprint(value){return hash(canonicalStringify(value));}
 const BACKUP_COLLECTIONS=['workouts','scheduledSessions','workoutRevisions','trainingBlocks','templates','exerciseCatalog','exerciseRoles','athleteGoals','reviewedPrograms','programReviews','programmingProfiles','phasePrograms','phaseReviews','meetCycles','adoptedPrograms','transitionSnapshots','decisionEvents','workloadProfiles','olympicPractice','hypertrophyPrograms'];
 function addBackupManifest(input,{exportedAt=new Date().toISOString(),releaseVersion=''}={}){
  if(!iso(exportedAt))throw Error('Invalid backup export time.');
  const payload=clone(input)||{};delete payload._loadnoteBackup;
  const counts={};for(const key of BACKUP_COLLECTIONS)counts[key]=Array.isArray(payload[key])?payload[key].length:0;
  payload._loadnoteBackup={version:1,algorithm:'fnv1a32-canonical-json',exportedAt,releaseVersion:String(releaseVersion||payload.releaseVersion||''),schemaVersion:Number(payload.schemaVersion)||null,counts,fingerprint:fingerprint(payload),
   notice:'This fingerprint detects accidental backup corruption or truncation; it is not cryptographic authentication.'};
  return payload;
 }
 function verifyBackupManifest(input){
  const manifest=input?._loadnoteBackup;
  if(manifest==null)return {status:'legacy',verified:false,reason:'Legacy backup has no Loadnote v2.52 integrity fingerprint.'};
  if(!manifest||manifest.version!==1||manifest.algorithm!=='fnv1a32-canonical-json'||!iso(manifest.exportedAt)||typeof manifest.fingerprint!=='string'||!manifest.fingerprint)return {status:'invalid',verified:false,reason:'Backup integrity metadata is malformed.'};
  const payload=clone(input);delete payload._loadnoteBackup;
  const expected=fingerprint(payload);
  if(expected!==manifest.fingerprint)return {status:'invalid',verified:false,reason:'Backup contents do not match the recorded integrity fingerprint.'};
  if(manifest.schemaVersion!=null&&Number(manifest.schemaVersion)!==Number(payload.schemaVersion))return {status:'invalid',verified:false,reason:'Backup schema metadata does not match the file contents.'};
  const counts=manifest.counts||{};
  for(const key of BACKUP_COLLECTIONS)if(Object.hasOwn(counts,key)&&Number(counts[key])!==(Array.isArray(payload[key])?payload[key].length:0))return {status:'invalid',verified:false,reason:'Backup collection counts do not match the file contents.'};
  return {status:'verified',verified:true,exportedAt:manifest.exportedAt,releaseVersion:manifest.releaseVersion||'',schemaVersion:manifest.schemaVersion??null,fingerprint:manifest.fingerprint};
 }
 function planKey(plan){
  const value=clone(plan);if(!value)return null;
  for(const exercise of value.plannedExercises||[])delete exercise.exerciseId;
  return canonicalStringify(value);
 }
 function auditRelationships(state){
  const issues=[];let blocking=0,warnings=0;
  const add=(code,severity,detail,extra={})=>{issues.push({code,severity,detail,...extra});if(severity==='blocking')blocking++;else warnings++;};
  const workouts=Array.isArray(state?.workouts)?state.workouts:[],schedules=Array.isArray(state?.scheduledSessions)?state.scheduledSessions:[],revisions=Array.isArray(state?.workoutRevisions)?state.workoutRevisions:[];
  const workoutIds=new Map();
  for(const workout of workouts){const id=String(workout?.id??'');if(!id){add('missing-workout-id','blocking','A current workout is missing its identity.');continue;}const list=workoutIds.get(id)||[];list.push(workout);workoutIds.set(id,list);}
  for(const [id,rows] of workoutIds)if(rows.length>1)add('duplicate-workout-id','blocking','Multiple current workouts share the same identity.',{workoutId:id,count:rows.length});
  const scheduleIds=new Map();
  for(const record of schedules){const id=String(record?.id??'');if(!id){add('missing-schedule-id','blocking','A Calendar session is missing its identity.');continue;}const list=scheduleIds.get(id)||[];list.push(record);scheduleIds.set(id,list);}
  for(const [id,rows] of scheduleIds)if(rows.length>1)add('duplicate-schedule-id','blocking','Multiple Calendar sessions share the same identity.',{scheduleId:id,count:rows.length});
  const scheduleById=new Map([...scheduleIds].filter(([,rows])=>rows.length===1).map(([id,rows])=>[id,rows[0]])),links=new Map();
  for(const workout of workouts){
   const link=workout?.sessionIntent?.schedule;if(!link?.id)continue;const scheduleId=String(link.id),rows=links.get(scheduleId)||[];rows.push(String(workout.id??''));links.set(scheduleId,rows);
   const record=scheduleById.get(scheduleId);
   if(!record){add('orphan-schedule-link','blocking','A saved workout links to a Calendar session that no longer exists.',{workoutId:String(workout.id??''),scheduleId});continue;}
   const revision=(record.revisions||[]).find(row=>row?.recordedAt===link.revisionAt);
   if(!revision){add('missing-schedule-revision','blocking','A saved workout points to a Calendar revision that cannot be found.',{workoutId:String(workout.id??''),scheduleId,revisionAt:link.revisionAt||null});continue;}
   if(revision.context?.status!=='scheduled')add('linked-nonscheduled-revision','blocking','A saved workout links to a Calendar revision that was not scheduled.',{workoutId:String(workout.id??''),scheduleId});
   if(revision.context?.date&&workout?.date&&revision.context.date!==workout.date)add('linked-date-mismatch','blocking','A saved workout date differs from the Calendar date captured when the session was started.',{workoutId:String(workout.id??''),scheduleId,workoutDate:workout.date,scheduleDate:revision.context.date});
   if(planKey(revision.context?.prescription)!==planKey(workout?.sessionIntent?.prescription))add('linked-plan-mismatch','blocking','A saved workout planned-work snapshot differs from its captured Calendar revision.',{workoutId:String(workout.id??''),scheduleId});
   const latest=record.revisions?.at(-1);
   if(latest?.context?.status&&latest.context.status!=='scheduled')add('completed-calendar-status-conflict','blocking','A Calendar session with linked training is currently marked '+latest.context.status+'.',{workoutId:String(workout.id??''),scheduleId,status:latest.context.status});
  }
  for(const [scheduleId,ids] of links)if(ids.length>1)add('duplicate-schedule-completion','blocking','More than one saved workout is linked to the same Calendar session.',{scheduleId,workoutIds:ids,count:ids.length});
  const revisionIds=new Map();
  for(const revision of revisions){
   const id=String(revision?.id??'');if(!id){add('missing-revision-id','warning','A workout-history revision is missing its identity.');continue;}
   const rows=revisionIds.get(id)||[];rows.push(revision);revisionIds.set(id,rows);
   if(!iso(revision?.recordedAt))add('invalid-revision-time','warning','A workout-history revision has an invalid recorded time.',{revisionId:id,workoutId:String(revision?.workoutId??'')});
   const workoutId=String(revision?.workoutId??''),beforeId=revision?.before?.id==null?null:String(revision.before.id),afterId=revision?.after?.id==null?null:String(revision.after.id);
   if(!workoutId||(beforeId&&beforeId!==workoutId)||(afterId&&afterId!==workoutId))add('revision-identity-mismatch','warning','A workout-history revision does not consistently reference one workout identity.',{revisionId:id,workoutId});
   const shape=revision?.action==='create'?!revision.before&&!!revision.after:revision?.action==='edit'?!!revision.before&&!!revision.after:revision?.action==='delete'?!!revision.before&&!revision.after:revision?.action==='undo'?Object.hasOwn(revision,'targetRevisionId'):false;
   if(!shape)add('revision-shape-mismatch','warning','A workout-history revision does not match its recorded action.',{revisionId:id,workoutId,action:revision?.action||null});
  }
  for(const [id,rows] of revisionIds)if(rows.length>1)add('duplicate-revision-id','warning','Workout-history revisions share an identity, reducing audit-history reliability.',{revisionId:id,count:rows.length});
  const revisionIdSet=new Set(revisionIds.keys());
  for(const revision of revisions)if(revision?.action==='undo'&&revision.targetRevisionId&&!revisionIdSet.has(String(revision.targetRevisionId)))add('orphan-undo-target','warning','A workout-history undo points to a revision that is no longer available.',{revisionId:String(revision.id??''),targetRevisionId:String(revision.targetRevisionId)});
  return {version:1,status:blocking?'review':warnings?'warning':'clean',blocking,warnings,issues,counts:{workouts:workouts.length,scheduledSessions:schedules.length,linkedWorkouts:[...links.values()].reduce((n,ids)=>n+ids.length,0),workoutRevisions:revisions.length},
   notes:['Blocking relationship issues can make planned-versus-performed evidence ambiguous and should be resolved before adaptive programming relies on it.','Workout revision-history warnings do not replace the current workout record; they indicate reduced audit/undo reliability.']};
 }
 function auditReliability(state,{asOf}={}){
  const training=auditTrainingData(state,{asOf}),relationships=auditRelationships(state),trainingBlocking=training.current.invalidLoad+training.current.invalidRpe+training.current.suspiciousLoads,blocking=trainingBlocking+relationships.blocking;
  return {version:2,asOf:asOf||null,status:blocking?'review':relationships.warnings?'warning':'clean',blocking,trainingBlocking,relationships,training};
 }

 function previewImport(current,incoming){
  const diff=(before,after)=>{const a=new Map((before||[]).map(x=>[String(x.id),x])),b=new Map((after||[]).map(x=>[String(x.id),x]));let added=0,changed=0,removed=0;for(const [id,value]of b)a.has(id)?changed+=same(a.get(id),value)?0:1:added++;for(const id of a.keys())if(!b.has(id))removed++;return {before:a.size,after:b.size,added,changed,removed};};
  return {
   hypertrophyPrograms:diff(current?.hypertrophyPrograms,incoming?.hypertrophyPrograms),olympicPractice:diff(current?.olympicPractice,incoming?.olympicPractice),workloadProfiles:diff(current?.workloadProfiles,incoming?.workloadProfiles),
   transitionSnapshots:diff(current?.transitionSnapshots,incoming?.transitionSnapshots),adoptedPrograms:diff(current?.adoptedPrograms,incoming?.adoptedPrograms),meetCycles:diff(current?.meetCycles,incoming?.meetCycles),scheduledSessions:diff(current?.scheduledSessions,incoming?.scheduledSessions),
   phaseReviews:diff(current?.phaseReviews,incoming?.phaseReviews),phasePrograms:diff(current?.phasePrograms,incoming?.phasePrograms),programmingProfiles:diff(current?.programmingProfiles,incoming?.programmingProfiles),programReviews:diff(current?.programReviews,incoming?.programReviews),reviewedPrograms:diff(current?.reviewedPrograms,incoming?.reviewedPrograms),
   athleteGoals:diff(current?.athleteGoals,incoming?.athleteGoals),workouts:diff(current?.workouts,incoming?.workouts),workoutRevisions:diff(current?.workoutRevisions,incoming?.workoutRevisions),trainingBlocks:diff(current?.trainingBlocks,incoming?.trainingBlocks),templates:diff(current?.templates,incoming?.templates),exerciseCatalog:diff(current?.exerciseCatalog,incoming?.exerciseCatalog),exerciseRoles:diff(current?.exerciseRoles,incoming?.exerciseRoles),decisionEvents:diff(current?.decisionEvents,incoming?.decisionEvents),
   prs:diff(current?.prs,incoming?.prs),nutrition:diff(current?.nutrition,incoming?.nutrition),bodyweight:diff(current?.bodyweight,incoming?.bodyweight),measurements:diff(current?.measurements,incoming?.measurements),progressPhotos:diff(current?.progressPhotos,incoming?.progressPhotos),restDays:diff(current?.restDays,incoming?.restDays)
  };
 }
 function addRecoverySnapshot(target,source,label,{now=new Date().toISOString(),id}={}){
  if(!iso(now))throw Error('Invalid recovery snapshot time.');const next=clone(target)||{},payload=clone(source)||{};delete payload.recoverySnapshots;
  const snapshot={id:String(id||('recovery_'+hash(now+Math.random()))),createdAt:now,label:name(label)||'Recovery snapshot',payload:JSON.stringify(payload),fingerprintVersion:1,fingerprint:fingerprint(payload)};
  next.recoverySnapshots=[...(Array.isArray(next.recoverySnapshots)?next.recoverySnapshots:[]),snapshot].slice(-3);return next;
 }
 function restoreRecoverySnapshot(state,id){const snapshot=(state?.recoverySnapshots||[]).find(s=>String(s.id)===String(id));if(!snapshot||typeof snapshot.payload!=='string')throw Error('Recovery snapshot is unavailable.');const payload=JSON.parse(snapshot.payload);if(snapshot.fingerprint&&fingerprint(payload)!==snapshot.fingerprint)throw Error('Recovery snapshot integrity check failed.');return payload;}
 function appendWorkoutRevision(list,before,after,{now=new Date().toISOString(),id}={}){
  if(!iso(now))throw Error('Invalid workout revision time.');const workoutId=String(before?.id??after?.id??'');if(!workoutId||before&&after&&String(before.id)!==String(after.id))throw Error('Invalid workout revision identity.');
  const revision={id:String(id||('revision_'+hash(now+workoutId+Math.random()))),workoutId,recordedAt:now,action:before&&after?'edit':before?'delete':'create',before:clone(before)||null,after:clone(after)||null};
  return [...(Array.isArray(list)?clone(list):[]),revision].slice(-1000);
 }
 function undoableWorkoutRevisions(state,limit=5){
  const revisions=Array.isArray(state?.workoutRevisions)?state.workoutRevisions:[],undone=new Set(revisions.filter(r=>r.action==='undo').map(r=>r.targetRevisionId)),workouts=new Map((state?.workouts||[]).map(w=>[String(w.id),w])),seen=new Set(),result=[];
  for(let i=revisions.length-1;i>=0&&result.length<limit;i--){const r=revisions[i];if(!r||!['edit','delete'].includes(r.action)||undone.has(r.id)||seen.has(String(r.workoutId)))continue;seen.add(String(r.workoutId));const current=workouts.get(String(r.workoutId))||null;if(same(current,r.after))result.push(clone(r));}
  return result;
 }
 function undoWorkoutRevision(input,revisionId,{now=new Date().toISOString(),id}={}){
  if(!iso(now))throw Error('Invalid undo time.');const state=clone(input),revision=undoableWorkoutRevisions(state,1000).find(r=>String(r.id)===String(revisionId));if(!revision)throw Error('This change can no longer be undone.');
  state.workouts=(state.workouts||[]).filter(w=>String(w.id)!==String(revision.workoutId));if(revision.before)state.workouts.push(clone(revision.before));state.workouts.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id)));
  state.workoutRevisions.push({id:String(id||('revision_'+hash(now+revision.id+Math.random()))),workoutId:revision.workoutId,recordedAt:now,action:'undo',targetRevisionId:revision.id,before:clone(revision.after),after:clone(revision.before)});return state;
 }
 return {nameKey,compactKey,stableExerciseId,resolveExercise,normalizeState,mergeExercises,auditTrainingData,auditRelationships,auditReliability,addBackupManifest,verifyBackupManifest,previewImport,addRecoverySnapshot,restoreRecoverySnapshot,appendWorkoutRevision,undoableWorkoutRevisions,undoWorkoutRevision};
});
