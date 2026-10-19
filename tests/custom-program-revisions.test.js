const assert=require('node:assert/strict');
const Custom=require('../src/product/custom-program');
const Schedule=require('../src/product/schedule');
const Lifecycle=require('../src/product/program-lifecycle');
const Integrity=require('../src/product/data-integrity');
const Sync=require('../src/product/sync-model');

const rows=[1,2,3].map(week=>({week,day:'Monday',exercise:'Bench Press',sets:5,reps:5,weight:100,unit:'kg',rpe:7,rest:180}));
const base={customPrograms:[],scheduledSessions:[],exerciseCatalog:[],workouts:[]};
const original=Custom.build(base,{name:'My bench block',weeks:3,startDate:'2026-11-02',rows,unit:'kg'});
let state=Custom.save(base,original,{confirmed:true,now:'2026-10-19T12:00:00.000Z',id:'first'});
state=Custom.schedule(state,'first',{now:'2026-10-20T12:00:00.000Z'});
const firstSession=Schedule.list(state.scheduledSessions)[0];
state.workouts=[{id:'completed1',date:firstSession.date,createdAt:'2026-11-02T17:00:00.000Z',sessionIntent:{schedule:{id:firstSession.id,revisionAt:firstSession.revisionAt},prescription:firstSession.prescription},exercises:[]}];
const originalSnapshot=JSON.stringify(state.customPrograms[0].entries);

const changed=Custom.build(state,{name:'My adjusted bench block',weeks:3,startDate:'2026-11-02',rows:rows.map((r,i)=>i===1?{...r,sets:3}:r),unit:'kg'});
const diff=Custom.compare(state.customPrograms[0],changed);
assert.equal(diff.count,2);
assert.deepEqual(diff.kinds,['config','exercise']);
assert.throws(()=>Custom.save(state,changed,{confirmed:true,parentId:'first',reason:{kind:'recovery',detail:'',coachVisible:true,exerciseReasons:[{changeIndex:0,kind:'performance',detail:'Different bench work'}]}}),/Review each exercise reason/);
state=Custom.save(state,changed,{confirmed:true,now:'2026-11-03T12:00:00.000Z',id:'second',parentId:'first',reason:{kind:'recovery',detail:'I needed a lighter week',coachVisible:true,exerciseReasons:[{changeIndex:1,kind:'performance',detail:'Three sets kept bar speed consistent'}]}});
assert.equal(state.customPrograms[1].revision.exerciseReasons[0].changeIndex,1);
assert.throws(()=>Custom.validate([{...state.customPrograms[1],revision:{...state.customPrograms[1].revision,exerciseReasons:[{changeIndex:1,kind:'other',detail:''}]}}]),/exercise edit reasons/);

const preview=Custom.replacementPreview(state,'second',{asOf:'2026-11-04'});
assert.deepEqual(preview.blockers,[]);
assert.equal(preview.remove.length,2);
assert.equal(preview.add.length,2);
assert.equal(preview.preserved,1);
assert.throws(()=>Custom.replaceFuture(state,preview,{asOf:'2026-11-04',now:'2026-11-04T15:00:00.000Z'}),/Confirm/);
assert.throws(()=>Custom.replaceFuture(state,preview,{confirmed:true,draftOpen:true,asOf:'2026-11-04',now:'2026-11-04T15:00:00.000Z'}),/draft/);
const savedWorkouts=JSON.stringify(state.workouts),originalCalendar=JSON.stringify(state.scheduledSessions);
const next=Custom.replaceFuture(state,preview,{confirmed:true,asOf:'2026-11-04',now:'2026-11-04T15:00:00.000Z'});
assert.equal(JSON.stringify(next.workouts),savedWorkouts);
assert.equal(JSON.stringify(next.customPrograms[0].entries),originalSnapshot);
assert.equal(next.customPrograms[0].replacedBy,'second');
assert.equal(next.customPrograms[1].scheduledAt,'2026-11-04T15:00:00.000Z');
assert.equal(Schedule.list(next.scheduledSessions).filter(s=>s.status==='scheduled').length,3); // The past first session plus two from the new plan.
assert.equal(Schedule.list(next.scheduledSessions).filter(s=>s.status==='cancelled').length,2);
assert.equal(Schedule.list(next.scheduledSessions).find(s=>s.id===firstSession.id).revisionAt,firstSession.revisionAt);
assert.equal(next.scheduledSessions.find(s=>s.id==='custom:first:w2d0').revisions.length,2);
assert.equal(Schedule.list(next.scheduledSessions).find(s=>s.id==='custom:second:w2d0').prescription.plannedExercises[0].sets.length,3);
assert.equal(Lifecycle.programs(next).filter(p=>p.kind==='custom-program').length,1);
assert.equal(Lifecycle.programs(next).find(p=>p.kind==='custom-program').id,'second');
assert.throws(()=>Custom.replacementPreview(next,'second',{asOf:'2026-11-04'}),/unscheduled copy/);
assert.equal(Integrity.verifyBackupManifest(Integrity.addBackupManifest(next)).status,'verified');
assert.equal(Sync.project(next).collections.customPrograms.length,2);
assert.notEqual(JSON.stringify(next.scheduledSessions),originalCalendar);

const collision={...state,scheduledSessions:Schedule.create(state.scheduledSessions,{name:'Team practice',date:'2026-11-09',role:'mixed',goal:'Other program',prescription:require('../src/product/session-intent').createPrescription([{name:'Cycle',type:'cardio',duration:20}],{type:'manual'},'2026-11-03T18:00:00.000Z')},{id:'unrelated',now:'2026-11-03T18:00:00.000Z'})};
const blocked=Custom.replacementPreview(collision,'second',{asOf:'2026-11-04'});
assert.match(blocked.blockers.join(' '),/conflict/);
assert.throws(()=>Custom.replaceFuture(collision,blocked,{confirmed:true,asOf:'2026-11-04',now:'2026-11-04T15:00:00.000Z'}),/conflict/);
const linked={...state,workouts:[...state.workouts,{id:'future',date:'2026-11-09',sessionIntent:{schedule:{id:'custom:first:w2d0'}}}]};
assert.match(Custom.replacementPreview(linked,'second',{asOf:'2026-11-04'}).blockers.join(' '),/linked workouts/);
assert.throws(()=>Custom.replaceFuture({...state,scheduledSessions:Schedule.change(state.scheduledSessions,'custom:first:w2d0',{status:'skipped',reason:'Life change'},'2026-11-03T18:00:00.000Z')},preview,{confirmed:true,asOf:'2026-11-04',now:'2026-11-04T15:00:00.000Z'}),/changed/);

console.log('v3.65 future-only replacement, per-exercise reasons, stale/conflict guards and immutability passed');
