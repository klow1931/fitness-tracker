const assert=require('node:assert/strict');
const Records=require('../src/product/device-records');
const Coordinator=require('../src/product/sync-coordinator');
const Sync=require('../src/product/sync-model');

function memory(){
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),map};
}
async function test(){
 const storage=memory(),idb=new Map(),entry={version:1,accountId:'acct_test_reliable_sync1234567',revision:4,data:{version:1,collections:{},documents:{}},manifestFingerprint:'saved'};
 const io={local:storage,idbGet:async k=>idb.get(k)??null,idbSet:async(k,v)=>idb.set(k,structuredClone(v)),idbRemove:async k=>idb.delete(k)};
 await Records.set('base',entry,io);assert.deepEqual(await Records.get('base',io),entry);
 const newer={...entry,revision:5};
 io.idbSet=async()=>{throw Error('IDB disk quota full');};
 await Records.set('base',newer,io);
 assert.equal(idb.get('base').revision,4,'failed IndexedDB update leaves old durable revision');
 assert.equal(storage.getItem(Records.marker('base')),'1','explicit fallback precedence survives restart');
 io.idbSet=async(k,v)=>idb.set(k,structuredClone(v));
 assert.equal((await Records.get('base',io)).revision,5,'newer fallback must win over stale IDB even when IDB returns');
 await Records.set('base',newer,io);
 assert.equal(storage.getItem(Records.marker('base')),null,'healthy subsequent IDB write retires marker');
 assert.equal((await Records.get('base',io)).revision,5);
 const migrated=memory(),legacy={...entry,revision:8};
 migrated.setItem(Records.key('legacy'),JSON.stringify(legacy));
 const legacyIo={...io,local:migrated};
 assert.deepEqual(await Records.get('legacy',legacyIo),legacy,'prior unmarked device base migrates without resetting sync');
 assert.equal(idb.get('legacy').revision,8);
 assert.equal(migrated.getItem(Records.key('legacy')),null);
 const corrupted=memory();
 corrupted.setItem(Records.marker('bad'),'1');corrupted.setItem(Records.key('bad'),'{broken-json');
 await assert.rejects(Records.get('bad',{...io,local:corrupted}),/damaged/);
 await assert.rejects(Records.get('lost',{...io,idbGet:async()=>{throw Error('storage denied');}}),/cannot confirm the previous sync base/);
 io.idbRemove=async()=>{throw Error('IDB delete failed');};
 await assert.rejects(Records.remove('base',io),/Could not clear/);
 assert.equal((await Records.get('base',io)).revision,5);
 io.idbRemove=async k=>idb.delete(k);
 await Records.remove('base',io);
 assert.equal(await Records.get('base',io),null);
 // A response fingerprint comes back to the account UI, allowing an
 // additional check after cloud latency but before local data is replaced.
 const blank=()=>Object.fromEntries(Sync.COLLECTIONS.map(k=>[k,[]]));
 const workout={id:'new-set',date:'2026-10-18',createdAt:'2026-10-18T12:00:00.000Z',exercises:[{name:'Bench',exerciseId:'b',sets:[{weight:100,reps:5,rpe:8}]}]};
 const local={schemaVersion:32,...blank(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,workouts:[workout]};
 const pkg=Sync.createPackage(local,{clientId:'client_phase6_test012345',createdAt:'2026-10-18T12:00:00.000Z'});
 const preview={status:'ready',mode:'upload',accountId:entry.accountId,remoteRevision:0,localFingerprint:Coordinator.projectFingerprint(local)};
 const request=async(url,opt)=>new Response(JSON.stringify({revision:1,changed:true,current:{packageFingerprint:pkg.packageFingerprint,manifestFingerprint:pkg.manifest.fingerprint}}),{status:200,headers:{'Content-Type':'application/json'}});
 const committed=await Coordinator.commit(preview,local,{request,client:'client_phase6_test012345',createdAt:'2026-10-18T12:00:00.000Z'});
 assert.equal(committed.status,'committed');
 assert.equal(committed.expectedLocalFingerprint,preview.localFingerprint);
 assert.notEqual(Coordinator.projectFingerprint({...local,workouts:[...local.workouts,{...workout,id:'new-workout'}]}),committed.expectedLocalFingerprint,'late local logs invalidate returned sync fingerprint');
 console.log('Phase 6 device records: stale IDB fallback, legacy migration, corruption, no silent base reset and late sync fingerprint validated');
}
test().catch(error=>{console.error(error);process.exit(1);});
