const assert=require('node:assert/strict');
const R=require('../src/product/decision-readiness');
for(const [lift,names] of Object.entries({squat:['Competition Squat','COMP. BACK-SQUAT','Meet Barbell Squat'],bench:['Competition Bench','competition bench press','Comp. Barbell Bench Press'],deadlift:['Competition Sumo Deadlift','Sumo Deadlift','Competition Conventional Deadlift','Meet Deadlift']})){
 for(const name of names)assert.deepEqual(R.suggestion(name),{role:'competition',competitionLift:lift},name);
}
for(const name of ['Competition Safety Bar Squat','Comp Front Squat','Competition Paused Bench','Competition Deficit Sumo Deadlift','Romanian Deadlift','Dumbbell Bench Press','Squat Jump','Bench Row','My Special Lift'])assert.notEqual(R.suggestion(name)?.role,'competition',name);
// Arbitrary names work through confirmed stable IDs, not substring matching.
const state={exerciseCatalog:[{id:'custom',name:'My Meet Pull',aliases:['Competition Sumo Deadlift']}],workouts:[{id:'w',date:'2026-09-20',exercises:[{exerciseId:'custom',name:'My Meet Pull',sets:[{weight:180,reps:5,rpe:8}]}]}]};
assert.equal(R.snapshot(state,{asOf:'2026-09-22',retrospective:true}).lifts.deadlift.metrics.sessions,0);
state.exerciseRoles=R.upsert([],{exerciseId:'custom',role:'competition',competitionLift:'deadlift'},{now:'2026-09-21T12:00:00.000Z',id:'map'});
assert.equal(R.snapshot(state,{asOf:'2026-09-22',retrospective:true}).lifts.deadlift.metrics.sessions,1);
assert.equal(R.snapshot(state,{asOf:'2026-09-20'}).lifts.deadlift.metrics.sessions,0,'future mapping must not leak into replay');
assert.equal(R.snapshot(state,{asOf:'2026-09-22',retrospective:true}).lifts.squat.metrics.sessions,0);
assert.equal(state.workouts[0].exercises[0].name,'My Meet Pull');
console.log('Lift-name suggestions, custom mappings, variation exclusions and chronology passed');
