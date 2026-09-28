const assert=require('node:assert/strict');
const GoalProgramming=require('../src/product/goal-programming');
const Goals=require('../src/product/athlete-goals');
const {phaseFixture}=require('./fixtures/phase-builder');

const {state,config}=phaseFixture();
state.athleteGoals=Goals.upsert([],{name:'Long-term total goals',sport:'Powerlifting',eventDate:null,targets:[
 {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
],availableDays:[0,2,4],sessionMinutes:90},{now:'2026-09-01T10:00:00.000Z'});
const sparse=GoalProgramming.inspect(state,{asOf:'2026-09-24',knownAt:'2026-09-24T12:00:00.000Z',config});
assert.equal(sparse.status,'ready');
assert.equal(sparse.goal.eventDate,null);
assert.equal(sparse.lifts.squat.horizon.kind,'not-estimated');
assert.equal(sparse.lifts.squat.selectedProgramTrainingMaxKg,config.lifts.squat.trainingMaxKg);
assert.notEqual(sparse.lifts.squat.targetKg,sparse.lifts.squat.selectedProgramTrainingMaxKg);
assert.ok(['establish-baseline','build-strength','long-range-development','specific-strength','verify-target','consolidate-target'].includes(sparse.lifts.squat.objective.code));

const ids=Object.fromEntries(['squat','bench','deadlift'].map(l=>[l,config.lifts[l].exerciseId]));
state.workouts=[
 ['2026-09-03',0],['2026-09-10',2.5],['2026-09-17',5]
].map(([date,add],i)=>({id:'goal-evidence-'+i,date,createdAt:date+'T18:00:00.000Z',exercises:[
 {exerciseId:ids.squat,name:'Competition Squat',type:'strength',sets:[{weight:150+add,reps:5,rpe:8}]},
 {exerciseId:ids.bench,name:'Competition Bench',type:'strength',sets:[{weight:105+add,reps:5,rpe:8}]},
 {exerciseId:ids.deadlift,name:'Competition Deadlift',type:'strength',sets:[{weight:190+add,reps:5,rpe:8}]}
]}));
const contextual=GoalProgramming.inspect(state,{asOf:'2026-09-24',knownAt:'2026-09-24T12:00:00.000Z',config});
for(const lift of ['squat','bench','deadlift']){
 assert.ok(contextual.lifts[lift].reference);
 assert.equal(contextual.lifts[lift].reference.kind,'estimated-capacity');
 assert.equal(contextual.lifts[lift].horizon.kind,'not-estimated');
 assert.ok(Number.isFinite(contextual.lifts[lift].gapKg));
}
assert.match(contextual.summary,/No target date is required/);

const multiple=structuredClone(state);
multiple.athleteGoals=Goals.upsert(multiple.athleteGoals,{name:'Second goal',sport:'Powerlifting',targets:[{lift:'bench',kg:170}]},{now:'2026-09-02T10:00:00.000Z'});
assert.equal(GoalProgramming.inspect(multiple,{asOf:'2026-09-24',knownAt:'2026-09-24T12:00:00.000Z',config}).status,'ambiguous');

assert.equal(GoalProgramming.objective(200,{kg:190,estimated:false}).code,'build-strength');
assert.equal(GoalProgramming.objective(200,{kg:195,estimated:false}).code,'specific-strength');
assert.equal(GoalProgramming.objective(200,{kg:205,estimated:true}).code,'verify-target');
assert.equal(GoalProgramming.objective(200,null).code,'establish-baseline');
console.log('v2.40 goal programming bridge keeps targets separate from prescriptions and supports date-free strength goals');
