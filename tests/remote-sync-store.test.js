const assert=require('node:assert/strict');
const fs=require('fs'),os=require('os'),path=require('path');
const Sync=require('../src/product/sync-model');
const {createFileSyncStore}=require('../backend/sync-store');

const empty=()=>Object.fromEntries(Sync.COLLECTIONS.map(name=>[name,[]]));
const state=overrides=>({schemaVersion:25,...empty(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,...overrides});
const workout=(id,note='')=>({id,date:'2026-09-28',createdAt:'2026-09-28T18:00:00.000Z',updatedAt:'2026-09-28T18:00:00.000Z',notes:note,exercises:[{name:'Bench',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}]});
const accountA='acct_remote_store_account_A1234567890';
const accountB='acct_remote_store_account_B1234567890';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-sync-store-'));
let now=Date.parse('2026-09-28T23:00:00.000Z');
const makeStore=()=>createFileSyncStore({rootDir:dir,verifyPackage:Sync.verifyPackage,now:()=>now,maxHistory:5});
let store=makeStore();

let status=store.status(accountA);
assert.equal(status.status,'empty');
assert.equal(status.revision,0);

const first=Sync.createPackage(state({workouts:[workout('w1','first')]}),{clientId:'device-a',createdAt:'2026-09-28T22:59:00.000Z',releaseVersion:'2.58.0'});
let result=store.commit(accountA,first,{expectedRevision:0});
assert.equal(result.status,'committed');
assert.equal(result.revision,1);
assert.equal(result.current.records,1);

result=store.commit(accountA,first,{expectedRevision:0});
assert.equal(result.status,'unchanged','retrying the same package must be idempotent even with the old expected revision');
assert.equal(result.revision,1);

const second=Sync.createPackage(state({workouts:[workout('w1','second')]}),{clientId:'device-b',createdAt:'2026-09-28T23:01:00.000Z',releaseVersion:'2.58.0'});
assert.throws(()=>store.commit(accountA,second,{expectedRevision:0}),error=>{
 assert.equal(error.code,'revision_conflict');
 assert.equal(error.statusCode,409);
 assert.equal(error.remote.revision,1);
 assert.equal(error.remote.current.packageFingerprint,first.packageFingerprint);
 return true;
});

now+=120000;
result=store.commit(accountA,second,{expectedRevision:1});
assert.equal(result.revision,2);
assert.equal(store.get(accountA).package.packageFingerprint,second.packageFingerprint);
assert.equal(store.status(accountA).recentRevisions.length,2);

const other=Sync.createPackage(state({nutrition:[{id:'meal',date:'2026-09-28',calories:500,protein:40}]}),{clientId:'device-c',createdAt:'2026-09-28T23:02:00.000Z',releaseVersion:'2.58.0'});
assert.equal(store.commit(accountB,other,{expectedRevision:0}).revision,1);
assert.equal(store.get(accountA).package.packageFingerprint,second.packageFingerprint,'account stores must be isolated');
assert.equal(store.get(accountB).package.packageFingerprint,other.packageFingerprint);

store=makeStore();
assert.equal(store.get(accountA).revision,2,'remote revision must survive store restart');
assert.equal(store.get(accountB).revision,1);

const tampered=structuredClone(second);
tampered.data.collections.workouts[0].notes='tampered after manifest';
assert.throws(()=>store.commit(accountA,tampered,{expectedRevision:2}),error=>error.code==='invalid_package');

const unknown=structuredClone(second);
unknown.data.collections.futureCollection=[];
assert.equal(Sync.verifyPackage(unknown).status,'invalid','sync protocol must reject unknown collection sets instead of silently omitting them');

const prescription={version:1,capturedAt:'2026-09-28T12:00:00.000Z',source:{type:'program',label:'Bench'},plannedExercises:[{name:'Bench',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:8}]}]};
const brokenState=state({workouts:[{...workout('linked'),sessionIntent:{version:1,role:'volume',goal:'Bench',prescription,schedule:{id:'missing-session',revisionAt:'2026-09-28T12:00:00.000Z'}}}]});
const brokenData={version:1,collections:{},documents:{}};
for(const name of Sync.COLLECTIONS)brokenData.collections[name]=structuredClone(brokenState[name]||[]);
for(const name of Sync.DOCUMENTS)brokenData.documents[name]=structuredClone(brokenState[name]??null);
const brokenManifest=Sync.manifestFromProject(brokenData);
const brokenMeta={protocol:Sync.PROTOCOL,createdAt:'2026-09-28T23:03:00.000Z',clientId:'device-bad',schemaVersion:25,releaseVersion:'2.58.0',manifestFingerprint:brokenManifest.fingerprint};
const brokenPackage={...brokenMeta,manifest:brokenManifest,data:brokenData,packageFingerprint:Sync.fingerprint(brokenMeta)};
const verification=Sync.verifyPackage(brokenPackage);
assert.equal(verification.status,'invalid');
assert.match(verification.reason,/relationship/i);

assert.throws(()=>store.commit(accountA,second,{expectedRevision:-1}),error=>error.code==='invalid_revision');

console.log('v2.58 remote store revisions, idempotency, account isolation, persistence and package validation passed');
