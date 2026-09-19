const assert=require('node:assert/strict');
const Feedback=require('../src/product/decision-feedback');
const Performance=require('../src/product/decision-performance');
const Core=require('../src/core/loadnote-core');
const evidence=(id,day)=>[
 {workoutId:'base-'+id,date:day,exerciseId:id,weight:100,reps:5,rpe:8,estimatedCapacity:Core.capacityEvidence(100,5,8).estimate}
];
const decision=(lift,asOf,id,direction='hold')=>({
 version:4,lift,label:lift,asOf,decision:direction,decisionAllowed:true,reason:'Synthetic',nextExposure:'Next',watchNext:'Watch',
 evidence:evidence(id,asOf)
});
let events=[];
function add(id,lift,day,exercise,response,choice,direction='hold'){
 events=Feedback.record(events,decision(lift,day,exercise,direction),{response,chosenDirection:choice??null},{now:day+'T12:00:00.000Z',id});
}
add('e1','squat','2026-09-01','s','accept',null,'hold');
add('e2','squat','2026-09-03','s','modify','increase','hold');
add('e3','bench','2026-09-02','b','ignore',null,'reduce');
add('e4','squat','2026-09-16','s','accept',null,'hold');
add('e5','deadlift','2026-08-01','d','accept',null,'reduce');
const work=(id,day,ex,weight,rpe=8)=>({id,date:day,exercises:[{exerciseId:ex,sets:[{weight,reps:5,rpe}]}]});
const state={decisionEvents:events,workouts:[
 work('sq-next','2026-09-08','s',110),work('bench-next','2026-09-09','b',95),
 work('sq-future','2026-09-25','s',115)
]};
const report=Performance.analyze(state,{asOf:'2026-09-19'});
assert.equal(report.readOnly,true);
assert.equal(report.summary.count,5);
assert.equal(report.summary.responses.accept,3);
assert.equal(report.summary.responses.modify,1);
assert.equal(report.summary.responses.ignore,1);
assert.equal(report.summary.uniqueObserved,2,'one squat + one bench follow-up');
assert.equal(report.summary.overlapping,1,'old squat response cannot reuse same exposure');
assert.equal(report.summary.pending,1);
assert.equal(report.summary.expired,1);
assert.equal(report.summary.outcomeCoverage,40);
assert.equal(report.lifts.squat.uniqueObserved,1);
assert.equal(report.lifts.squat.overlapping,1);
assert.equal(report.lifts.squat.pending,1);
assert.equal(report.lifts.bench.uniqueObserved,1);
assert.equal(report.lifts.deadlift.expired,1);
assert.equal(report.summary.byResponse.modify.observed,1);
assert.equal(report.summary.byResponse.accept.observed,0,'overlap is not counted for accepted response');
assert.equal(report.summary.overridePatterns['hold → increase'].count,1);
assert.equal(report.rows.find(r=>r.id==='e1').attribution,'overlapping');
assert.equal(report.rows.find(r=>r.id==='e2').attribution,'attributed');
assert.equal(report.rows.find(r=>r.id==='e3').chosenDirection,null);
assert.equal(report.rows.find(r=>r.id==='e3').outcomeClass,'declined');
assert.equal(report.summary.evidenceStatus,'collecting');
const stateUnobserved={...state,workouts:[]};
assert.equal(Performance.analyze(stateUnobserved,{asOf:'2026-09-19'}).summary.outcomeCoverage,0);
assert.equal(Performance.analyze({decisionEvents:[],workouts:[]},{asOf:'2026-09-19'}).summary.acceptanceRate,null);
assert.throws(()=>Performance.analyze(state,{horizonDays:0}),/horizon/);
assert.equal(Performance.analyze(state,{asOf:'2026-09-19',horizonDays:3}).summary.uniqueObserved,0);
console.log('v2.5 outcome deduplication, lift patterns, coverage and insufficiency guards passed');
