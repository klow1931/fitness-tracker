const assert=require('node:assert/strict');
const Workload=require('../src/product/lift-workload'),Review=require('../src/product/workload-review'),Performance=require('../src/product/lift-performance');
const {phaseFixture}=require('./fixtures/phase-builder');
const {state,config}=phaseFixture(),original=JSON.stringify(config),stateBefore=JSON.stringify(state);
const ids={squat:config.lifts.squat.exerciseId,bench:config.lifts.bench.exerciseId,deadlift:config.lifts.deadlift.exerciseId};
const workouts=['2026-09-02','2026-09-09','2026-09-16','2026-09-23'].map((date,i)=>({id:'review-'+i,date,createdAt:date+'T12:00:00.000Z',exercises:[
 {exerciseId:ids.squat,type:'strength',trackBy:'reps',sets:[{weight:120,reps:5,rpe:8},{weight:115,reps:5,rpe:7}]},
 {exerciseId:'ss',type:'strength',trackBy:'reps',sets:[{weight:90,reps:5,rpe:7}]},
 {exerciseId:ids.bench,type:'strength',trackBy:'reps',sets:Array.from({length:8},()=>({weight:90,reps:5,rpe:7}))},
 {exerciseId:ids.deadlift,type:'strength',trackBy:'reps',sets:[{weight:160,reps:5,rpe:8},{weight:150,reps:5,rpe:8}]}
]}));
const synthetic={...state,workouts,workoutRevisions:[]};
const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const evidence=Workload.compare(synthetic,config,args),review=Review.assess(evidence,config);
assert.equal(review.findings.squat.action,'review-reduction');
assert.equal(review.findings.squat.optionalFirstWeekSets,4);
assert.equal(review.findings.bench.action,'keep-or-gather');
assert.equal(review.findings.deadlift.reductionAvailable,false);
const next=Review.apply(review,config,{squat:'reduce-one',bench:'keep',deadlift:'keep'});
assert.equal(next.config.lifts.squat.sets,2);
assert.equal(next.config.lifts.bench.sets,3);
assert.equal(next.config.lifts.deadlift.sets,2);
assert.equal(next.affectedWeeks,7);
assert.deepEqual(Object.keys(next.changes),['squat']);
assert.equal(JSON.stringify(config),original);
assert.equal(JSON.stringify(state),stateBefore);
assert.throws(()=>Review.apply(review,config,{squat:'reduce-one',bench:'reduce-one',deadlift:'keep'}),/no supported/);
assert.throws(()=>Review.apply(review,config,{squat:'reduce-one',bench:'keep'}),/Explicitly choose/);
assert.throws(()=>Review.apply(review,config,{squat:'reduce-one',bench:'keep',deadlift:'keep',other:'keep'}),/independent action/);
const missing=structuredClone(synthetic);missing.workouts=workouts.slice(0,3);
assert.equal(Review.assess(Workload.compare(missing,config,args),config).findings.squat.action,'keep-or-gather');
const lowRpe=structuredClone(synthetic);lowRpe.workouts.forEach(w=>w.exercises[0].sets.forEach(s=>delete s.rpe));
assert.equal(Review.assess(Workload.compare(lowRpe,config,args),config).findings.squat.reductionAvailable,false);
const altered=structuredClone(config);altered.lifts.squat.sets=4;
assert.throws(()=>Review.assess(evidence,altered),/no longer matches/);
assert.throws(()=>Review.apply(review,altered,{squat:'keep',bench:'keep',deadlift:'keep'}),/context changed/);
console.log('Lift-specific workload review tests passed');

const performance=Performance.compare(synthetic,config,args),withPerformance=Review.assess(evidence,config,performance);
assert.equal(withPerformance.findings.squat.performance.direction,'similar-estimate');
assert.equal(withPerformance.findings.squat.reductionAvailable,true);
assert.equal(withPerformance.findings.deadlift.performance.evidenceDays,4);
const declining=structuredClone(synthetic);
declining.workouts.forEach((w,i)=>{w.exercises[0].sets.forEach(set=>{set.weight=[125,122,112,110][i];});});
const lowered=Performance.compare(declining,config,args);
const reviewed=Review.assess(Workload.compare(declining,config,args),config,lowered);
assert.equal(reviewed.findings.squat.action,'review-reduction-and-performance');
assert(reviewed.findings.squat.reasons.some(reason=>reason.includes('does not prove')));
assert.equal(reviewed.findings.bench.performance.direction,'similar-estimate');
assert.throws(()=>Review.assess(evidence,config,{...performance,asOf:'2026-09-23'}),/date/);
const remapped=structuredClone(config);remapped.lifts.squat.exerciseId='different';
assert.throws(()=>Review.assess(evidence,config,{...performance,lifts:{...performance.lifts,squat:{...performance.lifts.squat,exerciseId:'different'}}}),/competition exercise/);
