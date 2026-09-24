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
  return refs;
 }
 function normalizedEntry(raw){
  if(!raw||typeof raw!=='object'||!name(raw.name))return null;
  const aliases=[...new Set((Array.isArray(raw.aliases)?raw.aliases:[]).map(name).filter(Boolean).filter(alias=>nameKey(alias)!==nameKey(raw.name)))];
  return {id:String(raw.id||stableExerciseId(raw.name)),name:name(raw.name),aliases};
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
  for(const ref of references(state)){const holder=ref.owner||ref;if(holder.exerciseId===source.id)holder.exerciseId=target.id;}
  const roles=Array.isArray(state.exerciseRoles)?state.exerciseRoles:[],targetRole=roles.find(record=>record.revisions?.at(-1)?.context?.exerciseId===target.id);
  for(const record of roles.filter(row=>row.revisions?.at(-1)?.context?.exerciseId===source.id)){
   if(targetRole){const recordedAt=new Date(Math.max(Date.now(),Date.parse(record.updatedAt)+1)).toISOString();record.revisions.push({recordedAt,context:null});record.updatedAt=recordedAt;}
   else for(const revision of record.revisions||[])if(revision.context)revision.context.exerciseId=target.id;
  }
  state.exerciseCatalog=state.exerciseCatalog.filter(e=>e.id!==source.id);return normalizeState(state);
 }
 function previewImport(current,incoming){
  const diff=(before,after)=>{const a=new Map((before||[]).map(x=>[String(x.id),x])),b=new Map((after||[]).map(x=>[String(x.id),x]));let added=0,changed=0,removed=0;for(const [id,value]of b)a.has(id)?changed+=same(a.get(id),value)?0:1:added++;for(const id of a.keys())if(!b.has(id))removed++;return {before:a.size,after:b.size,added,changed,removed};};
  return {phasePrograms:diff(current?.phasePrograms,incoming?.phasePrograms),programmingProfiles:diff(current?.programmingProfiles,incoming?.programmingProfiles),programReviews:diff(current?.programReviews,incoming?.programReviews),reviewedPrograms:diff(current?.reviewedPrograms,incoming?.reviewedPrograms),athleteGoals:diff(current?.athleteGoals,incoming?.athleteGoals),workouts:diff(current?.workouts,incoming?.workouts),trainingBlocks:diff(current?.trainingBlocks,incoming?.trainingBlocks),templates:diff(current?.templates,incoming?.templates),exerciseRoles:diff(current?.exerciseRoles,incoming?.exerciseRoles),decisionEvents:diff(current?.decisionEvents,incoming?.decisionEvents)};
 }
 function addRecoverySnapshot(target,source,label,{now=new Date().toISOString(),id}={}){
  if(!iso(now))throw Error('Invalid recovery snapshot time.');const next=clone(target)||{},payload=clone(source)||{};delete payload.recoverySnapshots;
  const snapshot={id:String(id||('recovery_'+hash(now+Math.random()))),createdAt:now,label:name(label)||'Recovery snapshot',payload:JSON.stringify(payload)};
  next.recoverySnapshots=[...(Array.isArray(next.recoverySnapshots)?next.recoverySnapshots:[]),snapshot].slice(-3);return next;
 }
 function restoreRecoverySnapshot(state,id){const snapshot=(state?.recoverySnapshots||[]).find(s=>String(s.id)===String(id));if(!snapshot||typeof snapshot.payload!=='string')throw Error('Recovery snapshot is unavailable.');return JSON.parse(snapshot.payload);}
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
 return {nameKey,compactKey,stableExerciseId,resolveExercise,normalizeState,mergeExercises,previewImport,addRecoverySnapshot,restoreRecoverySnapshot,appendWorkoutRevision,undoableWorkoutRevisions,undoWorkoutRevision};
});
