const assert=require('node:assert/strict');
const Performance=require('../src/product/lift-performance'),Core=require('../src/core/loadnote-core');
const {phaseFixture}=require('./fixtures/phase-builder');
const {state,config}=phaseFixture(),baseline=JSON.stringify(state),original=JSON.stringify(config);
const dates=['2026-09-02','2026-09-09','2026-09-16','2026-09-23'];
function workouts(weights){return dates.map((date,i)=>({id:'performance-'+i,date,createdAt:date+'T12:00:00.000Z',exercises:[
 {exerciseId:config.lifts.squat.exerciseId,type:'strength',trackBy:'reps',sets:[{weight:weights[i],reps:5,rpe:8},{weight:weights[i],reps:1,rpe:8}]},
 {exerciseId:'ss',type:'strength',trackBy:'reps',sets:[{weight:999,reps:5,rpe:10}]},
 {exerciseId:config.lifts.bench.exerciseId,type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:7}]}
]}));}
const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const down=Performance.compare({...state,workouts:workouts([120,118,110,109]),workoutRevisions:[]},config,args);
assert.equal(down.lifts.squat.direction,'lower-estimate');
assert.equal(down.lifts.squat.evidenceDays,4);
assert.equal(down.lifts.squat.counts.eligibleSets,4);
assert.equal(down.lifts.squat.counts.excludedSets,4);
assert(down.lifts.squat.changePct<=-3);
assert(down.lifts.squat.baselineEstimateKg<Core.capacityEvidence(999,5,10).estimate);
assert.equal(down.lifts.bench.direction,'similar-estimate');
assert.equal(down.lifts.deadlift.direction,'insufficient-evidence');
const up=Performance.compare({...state,workouts:workouts([110,110,120,120]),workoutRevisions:[]},config,args);
assert.equal(up.lifts.squat.direction,'higher-estimate');
const sparse=Performance.compare({...state,workouts:workouts([120,118,110,109]).slice(0,3),workoutRevisions:[]},config,args);
assert.equal(sparse.lifts.squat.direction,'insufficient-evidence');
const future={id:'future',date:'2026-09-23',createdAt:'2026-09-25T00:00:00.000Z',exercises:[{exerciseId:config.lifts.squat.exerciseId,sets:[{weight:999,reps:5,rpe:10}]}]};
assert.deepEqual(Performance.compare({...state,workouts:[...workouts([120,118,110,109]),future],workoutRevisions:[]},config,args),down);
const edited=workouts([120,118,110,109]);const before=structuredClone(edited.at(-1));edited.at(-1).exercises[0].sets[0].weight=999;
const revised={...state,workouts:edited,workoutRevisions:[{workoutId:before.id,recordedAt:'2026-09-25T00:00:00.000Z',before,after:edited.at(-1)}]};
assert.deepEqual(Performance.compare(revised,config,args).lifts.squat,down.lifts.squat);
assert.throws(()=>Performance.compare(state,config,{asOf:'bad'}));
assert.equal(JSON.stringify(state),baseline);
assert.equal(JSON.stringify(config),original);
console.log('Lift-specific performance context tests passed');
