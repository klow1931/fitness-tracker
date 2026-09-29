const assert=require('node:assert/strict');
const Sync=require('../src/product/sync-model');
const Remote=require('../src/product/remote-sync');
const Coordinator=require('../src/product/sync-coordinator');

const empty=()=>Object.fromEntries(Sync.COLLECTIONS.map(name=>[name,[]]));
const state=overrides=>({schemaVersion:25,releaseVersion:'2.59.0',...empty(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,...overrides});
const workout=(id,note='')=>({id,date:'2026-09-29',createdAt:'2026-09-29T01:00:00.000Z',updatedAt:'2026-09-29T01:00:00.000Z',notes:note,exercises:[{name:'Bench',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}]});
const memory=()=>{
 const map=new Map();
 return {get:async key=>map.has(key)?structuredClone(map.get(key)):null,set:async(key,value)=>map.set(key,structuredClone(value)),remove:async key=>map.delete(key),map};
};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const accountId='acct_sync_coordinator_test_123';
const client='client_sync_coordinator_12345';

(async()=>{
 const storage=memory();
 let remoteRevision=0,remotePackage=null,putCount=0;
 const request=async(url,options)=>{
  if(url==='/api/sync/state'&&options.method==='GET')return response(remotePackage?{hasSnapshot:true,revision:remoteRevision,package:remotePackage}:{hasSnapshot:false,revision:0});
  if(url==='/api/sync/state'&&options.method==='PUT'){
   putCount++;
   const body=JSON.parse(options.body);
   assert.equal(body.expectedRevision,remoteRevision);
   remotePackage=body.package;remoteRevision++;
   return response({status:'committed',revision:remoteRevision,current:{packageFingerprint:remotePackage.packageFingerprint,manifestFingerprint:remotePackage.manifest.fingerprint}});
  }
  throw Error('Unexpected request '+url+' '+options.method);
 };

 const local1=state({workouts:[workout('w1','first')]});
 let preview=await Coordinator.preview(local1,{accountId,storage,request});
 assert.equal(preview.mode,'upload');
 let result=await Coordinator.commit(preview,local1,{client,createdAt:'2026-09-29T01:10:00.000Z',releaseVersion:'2.59.0',request});
 assert.equal(result.status,'committed');
 assert.equal(result.revision,1);
 assert.equal(result.uploadRequired,true);
 assert.equal(result.applyRequired,false);
 await Coordinator.acknowledge(accountId,result.base,{storage});
 assert.equal((await Coordinator.loadBase(accountId,{storage})).revision,1);

 const local2=state({workouts:[workout('w1','local-only edit')]});
 preview=await Coordinator.preview(local2,{accountId,storage,request});
 assert.equal(preview.mode,'merge');
 assert.equal(preview.uploadRequired,true);
 assert.equal(preview.applyRequired,false);
 result=await Coordinator.commit(preview,local2,{client,createdAt:'2026-09-29T01:11:00.000Z',releaseVersion:'2.59.0',request});
 await Coordinator.acknowledge(accountId,result.base,{storage});
 assert.equal(result.revision,2);
 assert.equal(remotePackage.data.collections.workouts[0].notes,'local-only edit');

 const baseState=state({workouts:[workout('w1','base')]});
 const basePackage=Remote.prepare(baseState,{client,createdAt:'2026-09-29T01:20:00.000Z',releaseVersion:'2.59.0'});
 remotePackage=basePackage;remoteRevision=3;
 await Coordinator.acknowledge(accountId,Coordinator.baseFromPackage(accountId,3,basePackage,{acknowledgedAt:'2026-09-29T01:20:30.000Z'}),{storage});
 const remoteEdit=state({workouts:[workout('w1','cloud edit')]});
 remotePackage=Remote.prepare(remoteEdit,{client:'client_cloud_device_12345',createdAt:'2026-09-29T01:21:00.000Z',releaseVersion:'2.59.0'});remoteRevision=4;
 const localEdit=state({workouts:[workout('w1','device edit')]});
 preview=await Coordinator.preview(localEdit,{accountId,storage,request});
 assert.equal(preview.mode,'conflict');
 assert.equal(preview.plan.counts.conflicts,1);
 const conflict=preview.plan.items.find(item=>item.resolution==='conflict');
 const conflictKey=Sync.itemKey(conflict);
 result=await Coordinator.commit(preview,localEdit,{resolutions:{[conflictKey]:'remote'},client,createdAt:'2026-09-29T01:22:00.000Z',releaseVersion:'2.59.0',request});
 assert.equal(result.status,'committed');
 assert.equal(result.applyRequired,true);
 assert.equal(result.uploadRequired,false);
 assert.equal(result.state.workouts[0].notes,'cloud edit');

 const freshStorage=memory();
 preview=await Coordinator.preview(localEdit,{accountId:'acct_fresh_device',storage:freshStorage,request});
 assert.equal(preview.mode,'first-link','a device without a shared base must not guess how to merge divergent data');
 result=await Coordinator.commit(preview,localEdit,{choice:'remote',request});
 assert.equal(result.status,'committed');
 assert.equal(result.applyRequired,true);
 assert.equal(result.uploadRequired,false);
 assert.equal(result.state.workouts[0].notes,'cloud edit');

 const corruptStorage=memory();
 await corruptStorage.set(Coordinator.key('acct_corrupt'),{version:1,accountId:'acct_corrupt',revision:1,manifestFingerprint:'bad',data:basePackage.data});
 preview=await Coordinator.preview(localEdit,{accountId:'acct_corrupt',storage:corruptStorage,request});
 assert.equal(preview.status,'blocked');
 assert.equal(preview.code,'sync_base_invalid');

 const staleStorage=memory();
 await Coordinator.acknowledge('acct_stale',Coordinator.baseFromPackage('acct_stale',4,remotePackage),{storage:staleStorage});
 const staleLocal=state({workouts:[workout('w1','new local')]});
 preview=await Coordinator.preview(staleLocal,{accountId:'acct_stale',storage:staleStorage,request});
 assert.equal(preview.mode,'merge');
 const staleRequest=async(url,options)=>{
  if(options.method==='PUT')return response({error:'Remote training revision changed before this commit.',code:'revision_conflict',remote:{revision:5}},409);
  return request(url,options);
 };
 result=await Coordinator.commit(preview,staleLocal,{client,createdAt:'2026-09-29T01:23:00.000Z',releaseVersion:'2.59.0',request:staleRequest});
 assert.equal(result.status,'stale');
 assert.equal(result.mode,'retry');

 const localChangedAfterPreview=state({workouts:[workout('w1','changed while reviewing')]});
 result=await Coordinator.commit(preview,localChangedAfterPreview,{client,createdAt:'2026-09-29T01:24:00.000Z',releaseVersion:'2.59.0',request});
 assert.equal(result.status,'stale');
 assert.equal(result.local,true);

 assert(putCount>=2);
 console.log('v2.59 safe account sync base, merge, first-link, conflict and stale-revision behavior passed');
})().catch(error=>{console.error(error);process.exit(1);});
