/* v2.55 — deterministic, conflict-first sync model. No network transport. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./data-integrity'));
  else root.LoadnoteSync=factory(root.LoadnoteIntegrity);
})(typeof globalThis!=='undefined'?globalThis:this,function(Integrity){
  'use strict';
  if(!Integrity)throw Error('Loadnote sync requires data integrity');
  const PROTOCOL='loadnote-sync-v1';
  const COLLECTIONS=[
    'workouts','scheduledSessions','workoutRevisions','trainingBlocks','exerciseCatalog','exerciseRoles',
    'athleteGoals','reviewedPrograms','programReviews','programmingProfiles','phasePrograms','phaseReviews',
    'meetCycles','adoptedPrograms','transitionSnapshots','decisionEvents',
    'templates','prs','goals','programs','restDays','nutrition','foodLibrary','bodyweight','measurements','formReviews'
  ];
  const DOCUMENTS=['athleteProfile','exerciseNotes','programStates','activeProgramId'];
  const LOCAL_ONLY=['recoverySnapshots','progressPhotos','api','unit','measureUnit','dark','gymMode','gymModeUserSet','onboardingDismissed','lastExportDate','backupBannerDismissed'];
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
  function canonicalStringify(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(canonicalStringify).join(',')+']';
    return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalStringify(value[key])).join(',')+'}';
  }
  function hash(value){let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
  const fingerprint=value=>hash(canonicalStringify(value));
  function normalizedRecord(record){
    const value=clone(record);
    if(value&&Object.hasOwn(value,'id'))value.id=String(value.id);
    return value;
  }
  function recordMap(rows,collection){
    if(!Array.isArray(rows))throw Error(collection+' must be an array before sync');
    const map=new Map();
    for(const raw of rows){
      if(!raw||raw.id==null||String(raw.id)==='')throw Error(collection+' contains a record without a stable id');
      const id=String(raw.id);
      if(map.has(id))throw Error(collection+' contains duplicate id '+id);
      map.set(id,normalizedRecord(raw));
    }
    return map;
  }
  function preflight(state){
    const issues=[];let records=0;
    for(const collection of COLLECTIONS){
      const rows=state?.[collection]??[];
      if(!Array.isArray(rows)){issues.push({severity:'blocking',collection,code:'not-array',detail:collection+' is not an array.'});continue;}
      const ids=new Set();
      for(const row of rows){
        records++;
        if(!row||row.id==null||String(row.id)===''){issues.push({severity:'blocking',collection,code:'missing-id',detail:collection+' contains a record without a stable identity.'});continue;}
        const id=String(row.id);
        if(ids.has(id))issues.push({severity:'blocking',collection,id,code:'duplicate-id',detail:collection+' contains duplicate identity '+id+'.'});
        ids.add(id);
      }
    }
    const relationships=Integrity.auditRelationships(state||{});
    for(const issue of relationships.issues.filter(row=>row.severity==='blocking'))issues.push({severity:'blocking',collection:'relationships',code:issue.code,detail:issue.detail});
    const blockers=issues.filter(issue=>issue.severity==='blocking').length;
    return {
      version:1,status:blockers?'blocked':'ready',blockers,records,issues,
      excluded:{
        progressPhotos:Array.isArray(state?.progressPhotos)?state.progressPhotos.length:0,
        recoverySnapshots:Array.isArray(state?.recoverySnapshots)?state.recoverySnapshots.length:0
      },
      notes:[
        'v2.55 sync planning covers structured account data only; progress-photo binaries and local recovery snapshots stay device-local.',
        'Device preferences and AI/provider configuration are intentionally excluded from the sync payload.',
        'No network synchronization occurs in v2.55.'
      ]
    };
  }
  function project(state){
    const check=preflight(state);
    if(check.blockers)throw Error('Sync preflight failed: '+check.issues[0].detail);
    const collections={};
    for(const name of COLLECTIONS)collections[name]=(state?.[name]||[]).map(normalizedRecord);
    const documents={};
    for(const name of DOCUMENTS)documents[name]=clone(state?.[name]??null);
    return {version:1,collections,documents};
  }
  function projectState(data){
    if(!data||data.version!==1||!data.collections||typeof data.collections!=='object'||!data.documents||typeof data.documents!=='object')throw Error('Invalid sync project');
    const collectionKeys=Object.keys(data.collections).sort(),documentKeys=Object.keys(data.documents).sort();
    const expectedCollections=[...COLLECTIONS].sort(),expectedDocuments=[...DOCUMENTS].sort();
    if(collectionKeys.length!==expectedCollections.length||collectionKeys.some((key,index)=>key!==expectedCollections[index]))throw Error('Sync project collection set does not match the protocol.');
    if(documentKeys.length!==expectedDocuments.length||documentKeys.some((key,index)=>key!==expectedDocuments[index]))throw Error('Sync project document set does not match the protocol.');
    const state={};
    for(const name of COLLECTIONS)state[name]=data.collections[name];
    for(const name of DOCUMENTS)state[name]=data.documents[name]??null;
    return state;
  }
  function manifestFromProject(data){
    projectState(data);
    const collections={},documents={};let records=0;
    for(const name of COLLECTIONS){
      const map=recordMap(data.collections[name],name),entries=[...map].sort(([a],[b])=>a.localeCompare(b)).map(([id,value])=>({id,fingerprint:fingerprint(value)}));
      collections[name]={count:entries.length,entries,fingerprint:fingerprint(entries)};records+=entries.length;
    }
    for(const name of DOCUMENTS)documents[name]={fingerprint:fingerprint(data.documents[name]??null)};
    const basis={version:1,collections,documents};
    return {version:1,records,collections,documents,fingerprint:fingerprint(basis)};
  }
  function manifest(state){return manifestFromProject(project(state));}
  function createPackage(state,{clientId,createdAt=new Date().toISOString(),releaseVersion}={}){
    if(typeof clientId!=='string'||!clientId.trim()||clientId.length>160)throw Error('A stable sync client id is required');
    if(!iso(createdAt))throw Error('Invalid sync package time');
    const data=project(state),m=manifestFromProject(data),meta={protocol:PROTOCOL,createdAt,clientId:clientId.trim(),schemaVersion:Number(state?.schemaVersion)||null,releaseVersion:String(releaseVersion||state?.releaseVersion||''),manifestFingerprint:m.fingerprint};
    return {...meta,manifest:m,data,packageFingerprint:fingerprint(meta)};
  }
  function verifyPackage(pkg){
    if(!pkg||pkg.protocol!==PROTOCOL)return {status:'invalid',verified:false,reason:'Unsupported sync protocol.'};
    if(!iso(pkg.createdAt)||typeof pkg.clientId!=='string'||!pkg.clientId.trim()||pkg.clientId!==pkg.clientId.trim()||pkg.clientId.length>160)return {status:'invalid',verified:false,reason:'Sync package metadata is malformed.'};
    if(pkg.schemaVersion!=null&&(!Number.isInteger(pkg.schemaVersion)||pkg.schemaVersion<1))return {status:'invalid',verified:false,reason:'Sync package schema metadata is malformed.'};
    if(typeof (pkg.releaseVersion??'')!=='string'||String(pkg.releaseVersion||'').length>80)return {status:'invalid',verified:false,reason:'Sync package release metadata is malformed.'};
    try{
      const actual=manifestFromProject(pkg.data);
      if(!pkg.manifest||pkg.manifest.fingerprint!==actual.fingerprint)return {status:'invalid',verified:false,reason:'Sync package contents do not match the recorded manifest fingerprint.'};
      if(Number(pkg.manifest.records)!==actual.records)return {status:'invalid',verified:false,reason:'Sync package record count does not match its manifest.'};
      const meta={protocol:pkg.protocol,createdAt:pkg.createdAt,clientId:pkg.clientId,schemaVersion:pkg.schemaVersion??null,releaseVersion:pkg.releaseVersion||'',manifestFingerprint:actual.fingerprint};
      if(typeof pkg.packageFingerprint!=='string'||pkg.packageFingerprint!==fingerprint(meta))return {status:'invalid',verified:false,reason:'Sync package metadata does not match its recorded fingerprint.'};
      const relationships=Integrity.auditRelationships(projectState(pkg.data));
      if(relationships.blocking)return {status:'invalid',verified:false,reason:'Sync package contains blocking training-record relationship problems.',relationshipAudit:relationships};
      return {status:'verified',verified:true,protocol:PROTOCOL,clientId:pkg.clientId,createdAt:pkg.createdAt,schemaVersion:pkg.schemaVersion??null,releaseVersion:pkg.releaseVersion||'',manifest:actual,packageFingerprint:pkg.packageFingerprint,relationshipAudit:relationships};
    }catch(error){return {status:'invalid',verified:false,reason:error.message||'Invalid sync package.'};}
  }
  const valueFingerprint=value=>value===undefined?'__missing__':fingerprint(value);
  const same=(a,b)=>valueFingerprint(a)===valueFingerprint(b);
  function change(base,value){
    if(base===undefined)return value===undefined?'none':'create';
    if(value===undefined)return 'delete';
    return same(base,value)?'unchanged':'update';
  }
  function resolution(base,local,remote){
    if(same(local,remote))return 'same';
    if(same(local,base))return 'remote';
    if(same(remote,base))return 'local';
    return 'conflict';
  }
  function projected(input){return input?.version===1&&input.collections&&input.documents?clone(input):project(input||{});}
  function planThreeWay(baseInput,localInput,remoteInput){
    const base=projected(baseInput),local=projected(localInput),remote=projected(remoteInput),items=[];
    for(const collection of COLLECTIONS){
      const maps=[recordMap(base.collections[collection]||[],collection),recordMap(local.collections[collection]||[],collection),recordMap(remote.collections[collection]||[],collection)];
      const ids=[...new Set([...maps[0].keys(),...maps[1].keys(),...maps[2].keys()])].sort();
      for(const id of ids){
        const [b,l,r]=maps.map(map=>map.get(id)),resolve=resolution(b,l,r);
        if(resolve==='same'&&same(b,l)&&same(b,r))continue;
        items.push({scope:'collection',collection,id,base:b,local:l,remote:r,localChange:change(b,l),remoteChange:change(b,r),resolution:resolve});
      }
    }
    for(const document of DOCUMENTS){
      const b=base.documents[document]??null,l=local.documents[document]??null,r=remote.documents[document]??null,resolve=resolution(b,l,r);
      if(resolve==='same'&&same(b,l)&&same(b,r))continue;
      items.push({scope:'document',document,base:b,local:l,remote:r,localChange:change(b,l),remoteChange:change(b,r),resolution:resolve});
    }
    const counts={local:0,remote:0,same:0,conflicts:0};
    for(const item of items){if(item.resolution==='conflict')counts.conflicts++;else if(item.resolution==='local')counts.local++;else if(item.resolution==='remote')counts.remote++;else counts.same++;}
    return {version:1,status:counts.conflicts?'conflict':'mergeable',counts,items,
      policy:'three-way-conflict-first-v1',
      notes:[
        'A side is auto-selected only when the other side still matches the shared base, or both sides independently reached identical content.',
        'Concurrent edits, edit-versus-delete, and different same-id creations are conflicts; Loadnote does not use last-write-wins.',
        'Record identity is stable id based. Collection array order is not treated as user data in this protocol.'
      ]};
  }
  function itemKey(item){
    if(!item||!item.scope)throw Error('Invalid sync plan item');
    return item.scope==='collection'?'collection:'+item.collection+':'+item.id:'document:'+item.document;
  }
  function applyPlan(localState,remoteState,plan){
    const merged=clone(localState)||{},localProject=project(localState),remoteProject=project(remoteState);
    const rawMap=(rows,collection)=>{const map=new Map();for(const row of rows||[]){if(!row||row.id==null)throw Error(collection+' contains a record without a stable id');const id=String(row.id);if(map.has(id))throw Error(collection+' contains duplicate id '+id);map.set(id,clone(row));}return map;};
    const byCollection=new Map(COLLECTIONS.map(name=>[name,plan.items.filter(item=>item.scope==='collection'&&item.collection===name)]));
    for(const collection of COLLECTIONS){
      const localRows=Array.isArray(localState?.[collection])?localState[collection]:[],remoteMap=rawMap(Array.isArray(remoteState?.[collection])?remoteState[collection]:[],collection),decisions=new Map((byCollection.get(collection)||[]).map(item=>[item.id,item]));
      const used=new Set(),rows=[];
      for(const row of localRows){
        const id=String(row.id),item=decisions.get(id);
        if(item?.resolution==='remote'){const next=remoteMap.get(id);if(next!==undefined)rows.push(clone(next));}
        else rows.push(clone(row));
        used.add(id);
      }
      for(const [id,row] of remoteMap)if(!used.has(id)){
        const item=decisions.get(id);
        if(item?.resolution==='remote'||item?.resolution==='same')rows.push(clone(row));
      }
      merged[collection]=rows;
    }
    for(const document of DOCUMENTS){
      const item=plan.items.find(row=>row.scope==='document'&&row.document===document);
      if(item?.resolution==='remote')merged[document]=clone(remoteState?.[document]??null);
      else if(item?.resolution==='same'&&same(localProject.documents[document],remoteProject.documents[document]))merged[document]=clone(localState?.[document]??null);
    }
    const relationshipAudit=Integrity.auditRelationships(merged);
    if(relationshipAudit.blocking)return {version:1,status:'invalid-merge',plan,state:null,relationshipAudit};
    return {version:1,status:'merged',plan,state:merged,relationshipAudit};
  }
  function mergeThreeWay(baseState,localState,remoteState){
    const plan=planThreeWay(baseState,localState,remoteState);
    if(plan.status==='conflict')return {version:1,status:'conflict',plan,state:null};
    return applyPlan(localState,remoteState,plan);
  }
  function mergeThreeWayResolved(baseState,localState,remoteState,resolutions={}){
    const plan=planThreeWay(baseState,localState,remoteState);
    if(plan.status!=='conflict')return applyPlan(localState,remoteState,plan);
    const unresolved=[];
    const items=plan.items.map(item=>{
      if(item.resolution!=='conflict')return item;
      const choice=resolutions[itemKey(item)];
      if(!['local','remote'].includes(choice)){unresolved.push(itemKey(item));return item;}
      return {...item,resolution:choice,manualResolution:true};
    });
    if(unresolved.length)return {version:1,status:'conflict',plan:{...plan,unresolved},state:null};
    const counts={local:0,remote:0,same:0,conflicts:0};
    for(const item of items){if(item.resolution==='local')counts.local++;else if(item.resolution==='remote')counts.remote++;else counts.same++;}
    const resolvedPlan={...plan,status:'mergeable',counts,items,manualResolutions:true,unresolved:[]};
    return applyPlan(localState,remoteState,resolvedPlan);
  }
  return {PROTOCOL,COLLECTIONS,DOCUMENTS,LOCAL_ONLY,canonicalStringify,fingerprint,preflight,project,projectState,manifest,manifestFromProject,createPackage,verifyPackage,planThreeWay,itemKey,mergeThreeWay,mergeThreeWayResolved};
});
