const assert=require('node:assert/strict');
const Intent=require('../src/product/session-intent');
const Schedule=require('../src/product/schedule');
const C=require('../src/product/training-continuity');

const plan=(name,id,sets,at)=>Intent.createPrescription([{name,exerciseId:id,type:'strength',trackBy:'reps',sets}],{type:'program',label:name},at);
const squatPlan=plan('Competition Squat','s',[{weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8}],'2026-09-29T08:00:00.000Z');
const benchPlan=plan('Competition Bench','b',[{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}],'2026-09-29T09:00:00.000Z');
let sessions=[];
sessions=Schedule.create(sessions,{name:'Unresolved squat',date:'2026-09-30',role:'volume',goal:'Squat volume',prescription:squatPlan},{id:'old',now:'2026-09-29T07:00:00.000Z'});
sessions=Schedule.create(sessions,{name:'Today squat',date:'2026-10-01',role:'heavy-exposure',goal:'Squat',prescription:squatPlan},{id:'today',now:'2026-09-29T07:01:00.000Z'});
sessions=Schedule.create(sessions,{name:'Next bench',date:'2026-10-03',role:'volume',goal:'Bench',prescription:benchPlan},{id:'next',now:'2026-09-29T07:02:00.000Z'});
sessions=Schedule.change(sessions,'next',{date:'2026-10-02',reason:'Moved one day earlier'},'2026-09-30T07:02:00.000Z');
sessions=Schedule.create(sessions,{name:'Skipped deadlift',date:'2026-09-29',role:'volume',goal:'Deadlift',prescription:squatPlan},{id:'skip',now:'2026-09-28T07:00:00.000Z'});
sessions=Schedule.change(sessions,'skip',{status:'skipped',reason:'Travel'},'2026-09-29T20:00:00.000Z');

const workout={
 id:'w1',date:'2026-10-01',
 exercises:[{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[
  {weight:150,reps:5,rpe:8},{weight:150,reps:5}
 ]}],
 sessionIntent:{version:1,role:'heavy-exposure',goal:'Squat',prescription:squatPlan,deviationReason:'time',deviationNotes:'Had to leave early',schedule:{id:'today',revisionAt:'2026-09-29T07:01:00.000Z'}}
};
const state={scheduledSessions:sessions,workouts:[workout]};
const report=C.inspect(state,{asOf:'2026-10-01',workoutId:'w1'});
assert.equal(report.workoutEvidence.linked,true);
assert.equal(report.workoutEvidence.partial,true);
assert.equal(report.workoutEvidence.comparison.completedSets,2);
assert.equal(report.workoutEvidence.comparison.plannedSets,3);
assert.equal(report.workoutEvidence.rpeSets,1);
assert.equal(report.workoutEvidence.rpeCoverage,50);
assert.equal(report.workoutEvidence.deviationLabel,'Time constraint');
assert.equal(report.unresolvedOverdue.length,1);
assert.equal(report.unresolvedOverdue[0].id,'old');
assert.equal(report.next.id,'next');
assert.equal(report.next.date,'2026-10-02');
assert.equal(report.next.rescheduled,true);
assert.equal(report.next.originalDate,'2026-10-03');
assert.equal(report.next.setCount,2);

const free={id:'free',date:'2026-10-01',exercises:[{name:'Rows',type:'strength',trackBy:'reps',sets:[{weight:80,reps:8,rpe:8}]}]};
const freeEvidence=C.evidence(free);
assert.equal(freeEvidence.linked,false);
assert.equal(freeEvidence.evidenceReady,false);
assert.equal(freeEvidence.rpeCoverage,100);

const full={...workout,id:'full',exercises:[{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[
 {weight:150,reps:5,rpe:8},{weight:150,reps:5,rpe:8},{weight:150,reps:5,rpe:8}
]}]};
assert.equal(C.evidence(full).partial,false);
assert.equal(C.evidence(full).comparison.exactSets,3);
console.log('v2.51 training continuity tests passed');
