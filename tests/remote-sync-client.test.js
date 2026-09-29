const assert=require('node:assert/strict');
const Sync=require('../src/product/sync-model');
const Remote=require('../src/product/remote-sync');

const memory=()=>{
 const map=new Map();
 return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key),_map:map};
};
const storage=memory();
const id1=Remote.clientId(storage),id2=Remote.clientId(storage);
assert.equal(id1,id2);
assert.match(id1,/^client_/);

const empty=()=>Object.fromEntries(Sync.COLLECTIONS.map(name=>[name,[]]));
const state={schemaVersion:25,...empty(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,workouts:[{id:'w1',date:'2026-09-28',exercises:[]}]};
const before=JSON.stringify(state);
const pkg=Remote.prepare(state,{client:id1,createdAt:'2026-09-28T23:10:00.000Z',releaseVersion:'2.58.0'});
assert.equal(Sync.verifyPackage(pkg).status,'verified');
assert.equal(JSON.stringify(state),before,'preparing remote data must not mutate local training state');

(async()=>{
 let status=await Remote.status({request:async(url,options)=>{
  assert.equal(url,'/api/sync/status');assert.equal(options.method,'GET');
  return new Response(JSON.stringify({protocol:Sync.PROTOCOL,status:'empty',hasSnapshot:false,revision:0}),{status:200,headers:{'Content-Type':'application/json'}});
 }});
 assert.equal(status.revision,0);

 const fetched=await Remote.fetchSnapshot({request:async()=>new Response(JSON.stringify({protocol:Sync.PROTOCOL,status:'stored',hasSnapshot:true,revision:1,package:pkg}),{status:200,headers:{'Content-Type':'application/json'}})});
 assert.equal(fetched.package.packageFingerprint,pkg.packageFingerprint);
 assert.equal(JSON.stringify(state),before,'fetching a remote snapshot must not replace local training state');

 const bad=structuredClone(pkg);bad.data.collections.workouts[0].date='tampered';
 await assert.rejects(()=>Remote.fetchSnapshot({request:async()=>new Response(JSON.stringify({hasSnapshot:true,revision:1,package:bad}),{status:200,headers:{'Content-Type':'application/json'}})}),/failed client verification/);

 let sent=null;
 const uploaded=await Remote.upload(state,{
  expectedRevision:0,client:id1,createdAt:'2026-09-28T23:11:00.000Z',releaseVersion:'2.58.0',accountId:'acct_test_remote_account_1234567890',storage,
  request:async(url,options)=>{
   sent={url,options};
   const body=JSON.parse(options.body);
   return new Response(JSON.stringify({status:'committed',revision:1,current:{packageFingerprint:body.package.packageFingerprint,manifestFingerprint:body.package.manifest.fingerprint}}),{status:200,headers:{'Content-Type':'application/json'}});
  }
 });
 assert.equal(sent.url,'/api/sync/state');
 assert.equal(sent.options.method,'PUT');
 const body=JSON.parse(sent.options.body);
 assert.equal(body.expectedRevision,0);
 assert.equal(Sync.verifyPackage(body.package).verified,true);
 assert.equal(uploaded.revision,1);
 const receipt=Remote.loadReceipt('acct_test_remote_account_1234567890',storage);
 assert.equal(receipt.revision,1);
 assert.equal(receipt.packageFingerprint,body.package.packageFingerprint);
 assert.equal(JSON.stringify(state),before,'explicit upload packaging must not mutate local training state');

 await assert.rejects(()=>Remote.upload(state,{expectedRevision:0,client:id1,accountId:'acct_test_remote_account_1234567890',storage,request:async()=>new Response(JSON.stringify({error:'Remote training revision changed before this commit.',code:'revision_conflict',remote:{revision:2}}),{status:409,headers:{'Content-Type':'application/json'}})}),error=>{
  assert.equal(error.status,409);assert.equal(error.code,'revision_conflict');assert.equal(error.remote.revision,2);return true;
 });
 assert.throws(()=>Remote.upload(state,{expectedRevision:-1,client:id1,storage,request:async()=>{throw Error('should not call');}}),/expected remote revision/);

 console.log('v2.58 explicit remote client status, verification, revision upload and receipt behavior passed');
})().catch(error=>{console.error(error);process.exit(1);});
