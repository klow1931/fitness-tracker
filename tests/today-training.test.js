const assert=require('node:assert/strict');
const Today=require('../src/product/today-training');
const Schedule=require('../src/product/schedule');
const Intent=require('../src/product/session-intent');

const plan=Intent.createPrescription([{name:'Competition Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:7},{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Bench day'},'2026-09-28T08:00:00.000Z');
let state={scheduledSessions:Schedule.create([],{name:'Bench day',date:'2026-09-28',role:'heavy-exposure',goal:'Bench strength',prescription:plan},{id:'today-bench',now:'2026-09-27T12:00:00.000Z'}),workouts:[]};
let report=Today.inspect(state,{day:'2026-09-28'});
assert.equal(report.active.id,'today-bench');assert.equal(report.active.status,'scheduled');assert.equal(report.active.exerciseCount,1);assert.equal(report.active.setCount,2);
report=Today.inspect(state,{day:'2026-09-28',draft:{rows:[],sessionIntent:{schedule:{id:'today-bench'}}}});
assert.equal(report.active.draftOpen,true);assert.equal(report.summary,'Workout in progress');
state.workouts=[{id:'done',date:'2026-09-28',sessionIntent:{schedule:{id:'today-bench'}}}];
report=Today.inspect(state,{day:'2026-09-28'});
assert.equal(report.active,null);assert.equal(report.completed,1);assert.equal(report.summary,'Today’s scheduled training is logged');
report=Today.inspect({scheduledSessions:[],workouts:[]},{day:'2026-09-28',draft:{rows:[{name:'Squat',sets:[{reps:'5'}]}],sessionIntent:{}}});
assert.equal(report.unlinkedDraft,true);assert.equal(report.summary,'Unfinished workout ready to resume');

// v2.77 integrity case: a meaningful unrelated draft stays explicit even when a new session is scheduled today.
state={scheduledSessions:Schedule.create([],{name:'Bench day',date:'2026-09-28',role:'heavy-exposure',goal:'Bench strength',prescription:plan},{id:'today-bench',now:'2026-09-27T12:00:00.000Z'}),workouts:[]};
report=Today.inspect(state,{day:'2026-09-28',draft:{rows:[{name:'Manual Squat',sets:[{reps:'5',weight:'100',rpe:'8'}]}],sessionIntent:{}}});
assert.equal(report.active.id,'today-bench');
assert.equal(report.openDraft,true);
assert.equal(report.unlinkedDraft,true);
assert.equal(report.active.draftOpen,false);
assert.equal(report.summary,'Unfinished workout ready to resume');
const original=JSON.stringify(state);
const oldDraft={rows:[{name:'Yesterday squat',sets:[{weight:'100',reps:'5',rpe:'7'}]}],sessionIntent:{schedule:{id:'yesterday-squat'}}};
const originalDraft=JSON.stringify(oldDraft);
report=Today.inspect(state,{day:'2026-09-28',draft:oldDraft});
assert.equal(report.openDraft,true);
assert.equal(report.unlinkedDraft,true);
assert.equal(report.active.id,'today-bench');
assert.equal(report.summary,'Unfinished workout ready to resume');
assert.equal(JSON.stringify(state),original,'Inspect must not change stored training');
assert.equal(JSON.stringify(oldDraft),originalDraft,'Inspect must not change the recoverable draft');
report=Today.inspect(state,{day:'2026-09-28',draft:{rows:[],sessionIntent:{}}});
assert.equal(report.openDraft,false);
assert.equal(report.summary,'Today’s scheduled workout is ready');
console.log('today training state, unrelated/other-date draft priority and immutable recovery guards passed');

const manual={workouts:[{id:'manual',date:'2026-09-28',exercises:[{name:'Squat',sets:[{reps:3,weight:100}]}]}],scheduledSessions:[]};
report=Today.inspect(manual,{day:'2026-09-28'});
assert.equal(report.loggedToday,1);
assert.equal(report.active,null);
assert.equal(report.summary,'Training logged today');
report=Today.inspect(manual,{day:'2026-09-29'});
assert.equal(report.loggedToday,0);
assert.equal(report.summary,'No workout is scheduled today');


const contextState={
 scheduledSessions:Schedule.create([],{name:'Bench strength',date:'2026-10-24',role:'heavy-exposure',goal:'Bench',prescription:plan},{id:'context',now:'2026-09-27T12:00:00.000Z'}),
 workouts:[
  {id:'prior',date:'2026-09-26',createdAt:'2026-09-26T17:00:00.000Z',exercises:[{name:'Competition Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:95,reps:5,rpe:7.5}]}]},
  {id:'future-record',date:'2026-10-25',createdAt:'2026-10-25T18:00:00.000Z',exercises:[{name:'Competition Bench Press',exerciseId:'bench',type:'strength',sets:[{weight:300,reps:5,rpe:10}]}]},
  {id:'late-history',date:'2026-10-10',createdAt:'2026-10-25T18:00:00.000Z',exercises:[{name:'Competition Bench Press',exerciseId:'bench',type:'strength',sets:[{weight:200,reps:5,rpe:10}]}]}
 ]};
const contextBefore=JSON.stringify(contextState);
let glance=Today.inspect(contextState,{day:'2026-10-24'}).active.performanceContext;
assert.equal(glance.name,'Competition Bench Press');
assert.deepEqual(glance.target,{weightKg:100,reps:5,targetRpe:7});
assert.deepEqual(glance.previous,{date:'2026-09-26',weightKg:95,reps:5,rpe:7.5});
assert.equal(JSON.stringify(contextState),contextBefore,'Preview is read-only');
assert.equal(Today.inspect(contextState,{day:'2026-10-24',draft:{rows:[{name:'Squat',sets:[{reps:'3',weight:'130'}]}]}}).unlinkedDraft,true);

const zeroPlan=Intent.createPrescription([{name:'Bodyweight Squat',exerciseId:'bw',type:'strength',trackBy:'reps',sets:[{weight:0,reps:12,targetRpe:8}]}],{type:'manual'},'2026-10-15T12:00:00.000Z');
const zeroState={scheduledSessions:Schedule.create([],{date:'2026-10-24',name:'Bodyweight',prescription:zeroPlan},{id:'bw-today',now:'2026-10-15T12:00:00.000Z'}),workouts:[
 {id:'bw-unknown',date:'2026-10-23',exercises:[{name:'Bodyweight Squat',exerciseId:'bw',type:'strength',sets:[{weight:null,reps:12,rpe:9}]}]},
 {id:'bw-valid',date:'2026-10-22',exercises:[{name:'Bodyweight Squat',exerciseId:'bw',type:'strength',sets:[{weight:0,reps:12,rpe:null}]}]}
]};
glance=Today.inspect(zeroState,{day:'2026-10-24'}).active.performanceContext;
assert.equal(glance.target.weightKg,0);
assert.equal(glance.previous.weightKg,0,'Explicit zero is a valid performed weight');
assert.equal(glance.previous.rpe,null,'Missing RPE is unknown and not inferred');
assert.equal(glance.previous.date,'2026-10-22','Skip an unknown load without coercing it to zero');

const ambiguous={...zeroState,workouts:[{id:'ambiguous',date:'2026-10-22',exercises:[
 {name:'Bodyweight Squat',exerciseId:'bw',type:'strength',sets:[{weight:90,reps:8}]},
 {name:'Bodyweight Squat',exerciseId:'bw',type:'strength',sets:[{weight:99,reps:8}]}
]}]};
assert.equal(Today.inspect(ambiguous,{day:'2026-10-24'}).active.performanceContext.previous,null,'Ambiguous duplicate exercises must not provide a last set');
const unmatched={...zeroState,workouts:[{id:'other-id',date:'2026-10-22',exercises:[{name:'Bodyweight Squat',exerciseId:'not-bw',type:'strength',sets:[{weight:95,reps:12}]}]}]};
assert.equal(Today.inspect(unmatched,{day:'2026-10-24'}).active.performanceContext.previous,null,'Conflicting exercise IDs must not be matched by name');
const laterRevision={...contextState,workouts:[
 ...contextState.workouts,
 {id:'revised-after',date:'2026-10-20',createdAt:'2026-10-20T17:00:00.000Z',exercises:[
  {name:'Competition Bench Press',exerciseId:'bench',type:'strength',sets:[{weight:210,reps:5,rpe:9}]}
 ]}
],workoutRevisions:[{workoutId:'revised-after',recordedAt:'2026-10-26T12:00:00.000Z'}]};
assert.equal(Today.inspect(laterRevision,{day:'2026-10-24'}).active.performanceContext.previous.date,'2026-09-26',
 'A correction after the preview date must not backfill historical performance');
const convention=structuredClone(zeroState);
convention.scheduledSessions[0].revisions[0].context.prescription.plannedExercises[0].loadConvention='total';
convention.workouts[1].exercises[0].loadConvention='per-hand';
assert.equal(Today.inspect(convention,{day:'2026-10-24'}).active.performanceContext.previous,null,
 'A total-weight target cannot inherit a per-hand prior load');

const noPlan={scheduledSessions:Schedule.create([],{date:'2026-10-24',name:'No strength targets',prescription:Intent.createPrescription([{name:'Cardio',type:'cardio',distance:5,duration:30}],{type:'manual'},'2026-10-20T12:00:00.000Z')},{id:'cardio',now:'2026-10-20T12:00:00.000Z'}),workouts:[]};
assert.equal(Today.inspect(noPlan,{day:'2026-10-24'}).active.performanceContext,null,'No strength target means no comparison card');

console.log('v4.2 read-only next session first-set context, draft safety and evidence integrity passed');
