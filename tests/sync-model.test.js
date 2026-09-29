const assert=require('node:assert/strict');
const Sync=require('../src/product/sync-model');

const empty=()=>Object.fromEntries(Sync.COLLECTIONS.map(name=>[name,[]]));
const state=overrides=>({schemaVersion:25,releaseVersion:'2.55.0',...empty(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,...overrides});
const workout=(id,note='')=>({id,date:'2026-09-28',createdAt:'2026-09-28T18:00:00.000Z',updatedAt:'2026-09-28T18:00:00.000Z',notes:note,exercises:[{name:'Bench',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}]});

let report=Sync.preflight(state({progressPhotos:[{id:'photo',dataUrl:'data:image/png;base64,abc'}],recoverySnapshots:[{id:'snap'}],api:{provider:'secret-ish-client-setting'}}));
assert.equal(report.status,'ready');
assert.equal(report.excluded.progressPhotos,1);
assert.equal(report.excluded.recoverySnapshots,1);

const a=state({workouts:[workout('a'),workout('b')]});
const b=state({workouts:[workout('b'),workout('a')]});
assert.equal(Sync.manifest(a).fingerprint,Sync.manifest(b).fingerprint,'collection order must not create a sync conflict');

const pkg=Sync.createPackage(a,{clientId:'device-a',createdAt:'2026-09-28T20:00:00.000Z'});
assert.equal(pkg.protocol,'loadnote-sync-v1');
assert.equal(Sync.verifyPackage(pkg).status,'verified');
assert.equal(pkg.data.progressPhotos,undefined);
assert.equal(pkg.data.recoverySnapshots,undefined);
assert.equal(pkg.data.api,undefined);
const tampered=structuredClone(pkg);tampered.data.collections.workouts[0].notes='changed after manifest';
assert.equal(Sync.verifyPackage(tampered).status,'invalid');
const metadataTampered=structuredClone(pkg);metadataTampered.schemaVersion=999;
assert.equal(Sync.verifyPackage(metadataTampered).status,'invalid');

const base=state({workouts:[workout('w','base')]});
const localSame=structuredClone(base);
const remoteUpdate=state({workouts:[workout('w','remote edit')]});
let plan=Sync.planThreeWay(base,localSame,remoteUpdate);
assert.equal(plan.status,'mergeable');
assert.equal(plan.counts.remote,1);
let merged=Sync.mergeThreeWay(base,localSame,remoteUpdate);
assert.equal(merged.status,'merged');
assert.equal(merged.state.workouts[0].notes,'remote edit');
merged=Sync.mergeThreeWay(Sync.project(base),localSame,Sync.project(remoteUpdate));
assert.equal(merged.status,'merged');
assert.equal(merged.state.workouts[0].notes,'remote edit','downloaded sync-project snapshots must apply remote records, not delete them');

const localUpdate=state({workouts:[workout('w','local edit')]});
plan=Sync.planThreeWay(base,localUpdate,remoteUpdate);
assert.equal(plan.status,'conflict');
assert.equal(plan.counts.conflicts,1);
assert.equal(Sync.mergeThreeWay(base,localUpdate,remoteUpdate).state,null);
const conflictKey=Sync.itemKey(plan.items.find(item=>item.resolution==='conflict'));
let resolved=Sync.mergeThreeWayResolved(base,localUpdate,remoteUpdate,{[conflictKey]:'local'});
assert.equal(resolved.status,'merged');
assert.equal(resolved.state.workouts[0].notes,'local edit');
resolved=Sync.mergeThreeWayResolved(base,localUpdate,remoteUpdate,{[conflictKey]:'remote'});
assert.equal(resolved.status,'merged');
assert.equal(resolved.state.workouts[0].notes,'remote edit');
resolved=Sync.mergeThreeWayResolved(base,localUpdate,remoteUpdate,{});
assert.equal(resolved.status,'conflict');
assert.deepEqual(resolved.plan.unresolved,[conflictKey]);

const identical=state({workouts:[workout('w','same edit')]});
plan=Sync.planThreeWay(base,identical,structuredClone(identical));
assert.equal(plan.status,'mergeable');
assert.equal(plan.counts.same,1);

const deleteConflict=state({workouts:[]});
plan=Sync.planThreeWay(base,localUpdate,deleteConflict);
assert.equal(plan.status,'conflict');
assert.equal(plan.items[0].localChange,'update');
assert.equal(plan.items[0].remoteChange,'delete');

const disjointBase=state({});
const disjointLocal=state({workouts:[workout('local')]});
const disjointRemote=state({nutrition:[{id:'meal',date:'2026-09-28',calories:500,protein:40}]});
merged=Sync.mergeThreeWay(disjointBase,disjointLocal,disjointRemote);
assert.equal(merged.status,'merged');
assert.deepEqual(merged.state.workouts.map(w=>w.id),['local']);
assert.deepEqual(merged.state.nutrition.map(n=>n.id),['meal']);

const prescription={version:1,capturedAt:'2026-09-28T12:00:00.000Z',source:{type:'program',label:'Bench'},plannedExercises:[{name:'Bench',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:8}]}]};
const schedule={id:'session',revisions:[{recordedAt:'2026-09-28T12:00:00.000Z',context:{date:'2026-09-28',name:'Bench',status:'scheduled',reason:'',blockId:null,role:'volume',goal:'Bench',prescription}}]};
const linked={...workout('linked'),sessionIntent:{version:1,role:'volume',goal:'Bench',prescription,schedule:{id:'session',revisionAt:'2026-09-28T12:00:00.000Z'}}};
const relationBase=state({scheduledSessions:[schedule]});
const relationLocal=state({scheduledSessions:[schedule],workouts:[linked]});
const relationRemote=state({scheduledSessions:[]});
merged=Sync.mergeThreeWay(relationBase,relationLocal,relationRemote);
assert.equal(merged.status,'invalid-merge','individually safe changes must not combine into an orphaned training link');
assert(merged.relationshipAudit.blocking>0);

const numericId=state({prs:[{id:1,exercise:'Bench',weight:100,reps:1,date:'2026-09-28'}]});
merged=Sync.mergeThreeWay(numericId,structuredClone(numericId),structuredClone(numericId));
assert.equal(merged.status,'merged');
assert.equal(typeof merged.state.prs[0].id,'number','evaluating a merge must not rewrite a legacy id representation');

const duplicate=state({workouts:[workout('dup'),workout('dup')]});
report=Sync.preflight(duplicate);
assert.equal(report.status,'blocked');
assert(report.issues.some(issue=>issue.code==='duplicate-id'));

console.log('v2.55 sync manifest, package verification, three-way conflicts and relationship-safe merge planning passed');
