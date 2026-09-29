/* v2.59 — explicit, conflict-first account sync orchestration.
 * Sync remains user-initiated. A trustworthy shared base is stored device-locally
 * and remote data is never applied without an explicit safe plan.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./sync-model'),require('./remote-sync'));
 else root.LoadnoteSyncCoordinator=factory(root.LoadnoteSync,root.LoadnoteRemoteSync);
})(typeof globalThis!=='undefined'?globalThis:this,function(Sync,Remote){
 'use strict';
 if(!Sync||!Remote)throw Error('Account sync coordinator requires sync model and remote client');
 const BASE_PREFIX='loadnote_sync_base_v1:';
 const clean=value=>String(value??'').trim();
 const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
 const nowIso=()=>new Date().toISOString();
 function key(accountId){
  const id=clean(accountId);if(!id)throw Error('A signed-in account is required for sync');
  return BASE_PREFIX+id;
 }
 function store(custom){
  const value=custom||globalThis.LoadnoteDeviceStorage;
  if(!value||typeof value.get!=='function'||typeof value.set!=='function')throw Error('Device sync-base storage is unavailable');
  return value;
 }
 function verifyBase(record,accountId){
  if(!record)return null;
  if(record.version!==1||record.accountId!==clean(accountId)||!Number.isInteger(record.revision)||record.revision<0||!record.data)return null;
  try{
   const manifest=Sync.manifestFromProject(record.data);
   if(record.manifestFingerprint!==manifest.fingerprint)return null;
   return {...clone(record),manifestFingerprint:manifest.fingerprint};
  }catch{return null;}
 }
 async function loadBase(accountId,{storage}={}){
  const raw=await store(storage).get(key(accountId));
  if(raw==null)return null;
  const base=verifyBase(raw,accountId);
  if(!base){const error=Error('The saved sync base on this device is invalid. Loadnote will not guess how to merge it.');error.code='sync_base_invalid';throw error;}
  return base;
 }
 function baseFromPackage(accountId,revision,pkg,{acknowledgedAt=nowIso()}={}){
  const verification=Sync.verifyPackage(pkg);
  if(!verification.verified)throw Error('Cannot acknowledge an invalid sync package');
  if(!Number.isInteger(revision)||revision<1)throw Error('Cannot acknowledge an invalid remote revision');
  return {version:1,accountId:clean(accountId),revision,schemaVersion:pkg.schemaVersion??null,releaseVersion:pkg.releaseVersion||'',manifestFingerprint:verification.manifest.fingerprint,packageFingerprint:verification.packageFingerprint,acknowledgedAt,data:clone(pkg.data)};
 }
 async function acknowledge(accountId,base,{storage}={}){
  const checked=verifyBase(base,accountId);
  if(!checked)throw Error('Cannot save an invalid sync base');
  await store(storage).set(key(accountId),checked);
  return checked;
 }
 async function clearBase(accountId,{storage}={}){
  const target=store(storage);if(typeof target.remove==='function')await target.remove(key(accountId));
 }
 function projectFingerprint(stateOrProject){
  const project=stateOrProject?.version===1&&stateOrProject.collections&&stateOrProject.documents?stateOrProject:Sync.project(stateOrProject||{});
  return Sync.manifestFromProject(project).fingerprint;
 }
 function overlayProject(localState,project){
  const next=clone(localState)||{},incoming=Sync.projectState(project);
  for(const name of Sync.COLLECTIONS)next[name]=clone(incoming[name]||[]);
  for(const name of Sync.DOCUMENTS)next[name]=clone(incoming[name]??null);
  return next;
 }
 function blocked(code,message,extra={}){return {status:'blocked',code,message,...extra};}
 async function preview(localState,{accountId,storage,request}={}){
  const id=clean(accountId);if(!id)return blocked('account_required','Sign in before syncing.');
  const preflight=Sync.preflight(localState||{});
  if(preflight.blockers)return blocked('local_preflight','Training data needs review before it can sync.',{preflight});
  let base=null;
  try{base=await loadBase(id,{storage});}catch(error){return blocked(error.code||'sync_base_invalid',error.message);}
  const remote=await Remote.fetchSnapshot({request});
  const localProject=Sync.project(localState),localFingerprint=Sync.manifestFromProject(localProject).fingerprint;
  if(!remote.hasSnapshot){
   if(base&&base.revision>0)return blocked('remote_missing_after_sync','This device remembers a cloud revision, but the account storage is now empty. Loadnote will not recreate or erase data automatically.',{base,remote});
   return {status:'ready',mode:'upload',accountId:id,base:null,remote,remoteRevision:0,localFingerprint,localProject,applyRequired:false,uploadRequired:true};
  }
  const remotePackage=remote.package,remoteRevision=Number(remote.revision);
  if(!Number.isInteger(remoteRevision)||remoteRevision<1)return blocked('remote_revision_invalid','Cloud training revision is invalid.',{remote});
  if(Number(remotePackage.schemaVersion||0)>Number(localState?.schemaVersion||0))return blocked('upgrade_required','Cloud training was saved by a newer Loadnote data schema. Update this device before syncing.',{remote});
  const remoteFingerprint=remotePackage.manifest.fingerprint;
  if(!base){
   if(localFingerprint===remoteFingerprint)return {status:'ready',mode:'same',accountId:id,base:null,remote,remoteRevision,remotePackage,localFingerprint,remoteFingerprint,applyRequired:false,uploadRequired:false};
   return {status:'review',mode:'first-link',accountId:id,base:null,remote,remoteRevision,remotePackage,localFingerprint,remoteFingerprint,message:'This device and the cloud have different training data, and this device has no shared sync base yet.'};
  }
  if(base.revision>remoteRevision)return blocked('remote_revision_regressed','Cloud training revision is older than the last revision acknowledged by this device. Loadnote will not guess which history is authoritative.',{base,remote});
  if(base.revision===remoteRevision&&base.packageFingerprint&&remotePackage.packageFingerprint!==base.packageFingerprint)return blocked('remote_revision_changed','Cloud contents changed without advancing the revision. Sync is stopped to protect training history.',{base,remote});
  const merged=Sync.mergeThreeWay(base.data,localState,remotePackage.data);
  if(merged.status==='conflict')return {status:'review',mode:'conflict',accountId:id,base,remote,remoteRevision,remotePackage,localFingerprint,remoteFingerprint,plan:merged.plan,message:'The same training data changed differently on this device and in the cloud.'};
  if(merged.status!=='merged')return blocked('invalid_merge','These changes cannot be combined without breaking training-record relationships.',{base,remote,relationshipAudit:merged.relationshipAudit,plan:merged.plan});
  const mergedFingerprint=projectFingerprint(merged.state);
  const applyRequired=mergedFingerprint!==localFingerprint,uploadRequired=mergedFingerprint!==remoteFingerprint;
  return {status:'ready',mode:applyRequired||uploadRequired?'merge':'same',accountId:id,base,remote,remoteRevision,remotePackage,localFingerprint,remoteFingerprint,mergedFingerprint,mergedState:merged.state,plan:merged.plan,applyRequired,uploadRequired};
 }
 function preparePackage(state,{client,createdAt,releaseVersion}={}){
  return Remote.prepare(state,{client,createdAt,releaseVersion});
 }
 async function commit(previewResult,localState,{choice,resolutions,client,createdAt,releaseVersion,request,receiptStorage}={}){
  const p=previewResult;
  if(!p||!['ready','review'].includes(p.status))throw Error('A current sync preview is required');
  const currentLocalFingerprint=projectFingerprint(localState);
  if(p.localFingerprint&&currentLocalFingerprint!==p.localFingerprint)return {status:'stale',mode:'retry',message:'Training on this device changed while this sync was being reviewed. Run Sync now again.',local:true};
  const id=p.accountId,expectedRevision=p.remoteRevision;
  let nextState=localState,applyRequired=false,uploadRequired=false,basePackage=p.remotePackage||null,revision=expectedRevision;
  if(p.mode==='upload'){
   uploadRequired=true;
  }else if(p.mode==='same'){
   if(!basePackage)throw Error('Cloud snapshot is unavailable');
  }else if(p.mode==='first-link'){
   if(choice==='local')uploadRequired=true;
   else if(choice==='remote'){nextState=overlayProject(localState,p.remotePackage.data);applyRequired=true;}
   else throw Error('Choose this device or cloud before syncing.');
  }else if(p.mode==='merge'){
   nextState=clone(p.mergedState);applyRequired=!!p.applyRequired;uploadRequired=!!p.uploadRequired;
  }else if(p.mode==='conflict'){
   const resolved=Sync.mergeThreeWayResolved(p.base.data,localState,p.remotePackage.data,resolutions||{});
   if(resolved.status==='conflict')return {status:'review',mode:'conflict',plan:resolved.plan,preview:p};
   if(resolved.status!=='merged')return blocked('invalid_merge','The selected conflict choices would break training-record relationships.',{plan:resolved.plan,relationshipAudit:resolved.relationshipAudit});
   nextState=resolved.state;
   const mergedFingerprint=projectFingerprint(nextState);
   applyRequired=mergedFingerprint!==p.localFingerprint;
   uploadRequired=mergedFingerprint!==p.remoteFingerprint;
  }else throw Error('Unsupported sync preview mode');
  if(uploadRequired){
   const pkg=preparePackage(nextState,{client,createdAt,releaseVersion});
   try{
    const result=await Remote.uploadPackage(pkg,{expectedRevision,request,accountId:id,storage:receiptStorage});
    revision=result.revision;basePackage=pkg;
   }catch(error){
    if(error?.code==='revision_conflict')return {status:'stale',mode:'retry',message:'Cloud training changed while this sync was being reviewed. Run Sync now again.',remote:error.remote||null};
    throw error;
   }
  }else{
   const latest=await Remote.fetchSnapshot({request});
   const sameRevision=latest.hasSnapshot&&Number(latest.revision)===Number(expectedRevision);
   const samePackage=sameRevision&&latest.package?.packageFingerprint===p.remotePackage?.packageFingerprint;
   if(!samePackage)return {status:'stale',mode:'retry',message:'Cloud training changed while this sync was being reviewed. Run Sync now again.',remote:latest||null};
   revision=latest.revision;basePackage=latest.package;
  }
  if(!basePackage)throw Error('No acknowledged cloud package is available');
  const base=baseFromPackage(id,revision,basePackage);
  return {status:'committed',mode:p.mode,revision,state:nextState,applyRequired,uploadRequired,base,plan:p.plan||null};
 }
 function conflictLabel(item){
  if(item.scope==='document'){
   const labels={athleteProfile:'Athlete profile',exerciseNotes:'Exercise notes',programStates:'Program state',activeProgramId:'Active program'};
   return labels[item.document]||item.document;
  }
  const labels={workouts:'Workout',scheduledSessions:'Calendar session',workoutRevisions:'Workout history revision',trainingBlocks:'Training block',exerciseCatalog:'Exercise',exerciseRoles:'Exercise role',athleteGoals:'Athlete goal',reviewedPrograms:'Reviewed program',programReviews:'Program review',programmingProfiles:'Programming profile',phasePrograms:'Phase program',phaseReviews:'Phase review',meetCycles:'Meet cycle',adoptedPrograms:'Adopted program',transitionSnapshots:'Transition baseline',decisionEvents:'Decision record',templates:'Template',prs:'PR record',goals:'Goal',programs:'Program',restDays:'Rest day',nutrition:'Nutrition entry',foodLibrary:'Food',bodyweight:'Bodyweight entry',measurements:'Measurement',formReviews:'Form review'};
  const value=item.local||item.remote||item.base||{},detail=value.date||value.name||value.title||value.label||item.id;
  return (labels[item.collection]||item.collection)+(detail?' · '+detail:'');
 }
 function conflictSummary(value){
  if(value===undefined)return 'Deleted';
  if(value===null)return 'None';
  if(Array.isArray(value))return value.length+' items';
  if(typeof value!=='object')return String(value);
  if(Array.isArray(value.exercises)){
   const names=value.exercises.map(row=>row.name).filter(Boolean).slice(0,3);
   const sets=value.exercises.reduce((n,row)=>n+(Array.isArray(row.sets)?row.sets.length:0),0);
   return [value.date,names.join(', '),sets?sets+' sets':null].filter(Boolean).join(' · ')||'Workout record';
  }
  const latest=Array.isArray(value.revisions)?value.revisions.at(-1)?.context:null;
  if(latest)return [latest.date,latest.name,latest.status].filter(Boolean).join(' · ');
  const parts=[value.date,value.name,value.title,value.label,value.goal,value.weight!=null?value.weight+' kg':null].filter(Boolean);
  return parts.slice(0,3).join(' · ')||'Saved record';
 }
 return {BASE_PREFIX,key,verifyBase,loadBase,baseFromPackage,acknowledge,clearBase,projectFingerprint,overlayProject,preview,commit,conflictLabel,conflictSummary};
});
