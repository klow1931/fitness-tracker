const assert=require('node:assert/strict');
const Objectives=require('../src/product/block-objectives');
const Goals=require('../src/product/athlete-goals');
const {phaseFixture}=require('./fixtures/phase-builder');

const baseGoal={targetKg:200,objective:{code:'build-strength',label:'Build competition-lift strength',reason:'Goal gap remains.'}};
const full={expected:20,completed:20,skipped:0,cancelled:0,unconfirmed:0,upcoming:0,adherence:100};
const productive={changePct:3,recent28d:{averageRpe:8}};
let o=Objectives.responseObjective(baseGoal,productive,full,0,{sameExercise:true});
assert.equal(o.code,'continue-productive');
o=Objectives.responseObjective(baseGoal,{changePct:-2.1,recent28d:{averageRpe:8.5}},full,0,{sameExercise:true});
assert.equal(o.code,'rebuild-tolerance');
o=Objectives.responseObjective(baseGoal,{changePct:3,recent28d:{averageRpe:8}}, {...full,completed:12},0,{sameExercise:true});
assert.equal(o.code,'restore-consistency');
o=Objectives.responseObjective(baseGoal,{changePct:.4,recent28d:{averageRpe:8.2}},full,0,{sameExercise:true});
assert.equal(o.code,'consolidate-response');
o=Objectives.responseObjective(baseGoal,productive,full,0,{sameExercise:false});
assert.equal(o.code,'build-strength');

assert.equal(Objectives.shape({
 squat:{targetKg:220,nextObjective:{code:'continue-productive'}},
 bench:{targetKg:160,nextObjective:{code:'continue-cautious'}},
 deadlift:{targetKg:280,nextObjective:{code:'rebuild-tolerance'}}
}).label,'Rebuild-development block');
assert.equal(Objectives.shape({
 squat:{targetKg:220,nextObjective:{code:'continue-productive'}},
 bench:{targetKg:160,nextObjective:{code:'continue-cautious'}},
 deadlift:{targetKg:280,nextObjective:{code:'continue-productive'}}
}).label,'Strength-focused block');

const {state,config}=phaseFixture();
state.athleteGoals=Goals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
 {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
]},{now:'2026-09-01T10:00:00.000Z'});
const goal=Goals.list(state.athleteGoals)[0];
state.transitionSnapshots=[{
 version:1,id:'transition-latest',programId:'prior-block',programName:'Prior block',programCreatedAt:'2026-07-01T10:00:00.000Z',programStart:'2026-07-06',programEnd:'2026-08-28',asOf:'2026-08-28',knowledgeCutoff:'2026-08-28T23:00:00.000Z',createdAt:'2026-08-28T23:01:00.000Z',
 goalAtStart:{status:'ready',goal:{id:goal.id,name:goal.name,eventDate:null},lifts:{}},
 goalAtTransition:{status:'ready'},schedule:{expected:24,completed:24,skipped:0,cancelled:0,unconfirmed:0,upcoming:0,adherence:100},
 lifts:{
  squat:{lift:'squat',exerciseId:config.lifts.squat.exerciseId,changePct:3,recent28d:{averageRpe:8}},
  bench:{lift:'bench',exerciseId:config.lifts.bench.exerciseId,changePct:.3,recent28d:{averageRpe:8.2}},
  deadlift:{lift:'deadlift',exerciseId:config.lifts.deadlift.exerciseId,changePct:-2.5,recent28d:{averageRpe:8.7}}
 },
 decisionHistory:{phaseReviews:[{id:'r1',phase:'strength',createdAt:'2026-08-20T18:00:00.000Z',choices:{squat:'keep',bench:'keep',deadlift:'reduce-one'},policy:'phase-review-v1'}],count:1},
 review:{confirmed:true,recordedAt:'2026-08-28T23:01:00.000Z',notes:'done'}
}];
const report=Objectives.inspect(state,{asOf:'2026-09-24',knownAt:'2026-09-24T12:00:00.000Z',config});
assert.equal(report.status,'ready');
assert.equal(report.transition.id,'transition-latest');
assert.equal(report.lifts.squat.nextObjective.code,'continue-productive');
assert.equal(report.lifts.bench.nextObjective.code,'consolidate-response');
assert.equal(report.lifts.deadlift.nextObjective.code,'rebuild-tolerance');
assert.equal(report.lifts.deadlift.transition.adjustments,1);
assert.equal(report.recommendation.label,'Rebuild-development block');
assert.equal(report.recommendation.accumulationWeeks,4);
assert.equal(report.recommendation.strengthWeeks,2);

const mismatch=structuredClone(state);mismatch.transitionSnapshots[0].lifts.squat.exerciseId='old-squat';
const mismatched=Objectives.inspect(mismatch,{asOf:'2026-09-24',knownAt:'2026-09-24T12:00:00.000Z',config});
assert.equal(mismatched.lifts.squat.nextObjective.code,mismatched.lifts.squat.objective.code);
assert.match(mismatched.lifts.squat.nextObjective.reason,/identity changed/);

const lowCoverage=structuredClone(state);lowCoverage.transitionSnapshots[0].schedule.completed=12;
const low=Objectives.inspect(lowCoverage,{asOf:'2026-09-24',knownAt:'2026-09-24T12:00:00.000Z',config});
assert.equal(low.lifts.squat.nextObjective.code,'restore-consistency');
assert.equal(low.recommendation.label,'Rebuild-development block');
console.log('v2.43 transition-derived per-lift objectives and conservative whole-block shaping passed');
