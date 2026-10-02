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
console.log('v2.77 today training state and unrelated-draft guard passed');
