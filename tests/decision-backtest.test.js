const assert=require('node:assert/strict');
const Blocks=require('../src/product/training-blocks');
const Ready=require('../src/product/decision-readiness');
const Intent=require('../src/product/session-intent');
const Backtest=require('../src/product/decision-backtest');

const catalog=[{id:'s',name:'Competition Squat',aliases:[]},{id:'b',name:'Competition Bench',aliases:[]},{id:'d',name:'Competition Deadlift',aliases:[]}];
let n=0;
const roles=Ready.replace([],[
 {exerciseId:'s',role:'competition',competitionLift:'squat'},
 {exerciseId:'b',role:'competition',competitionLift:'bench'},
 {exerciseId:'d',role:'competition',competitionLift:'deadlift'}
],{now:'2026-01-01T00:00:00.000Z',createId:()=>String(++n)});
const blocks=Blocks.upsert([],{name:'Return',startDate:'2026-01-01',endDate:'2026-03-31',blockType:'return-reentry',loadStrategy:'conservative',progressionIntent:'return-ramp',dataCompleteness:'complete'},{now:'2026-01-01T00:00:00.000Z'});

function w(id,date,exerciseId,weight,rpe){
 const ex={exerciseId,name:catalog.find(x=>x.id===exerciseId).name,sets:[{weight,reps:5,rpe}]};
 return {id,date,createdAt:date+'T18:00:00.000Z',updatedAt:date+'T18:00:00.000Z',sessionIntent:Intent.context({role:'heavy-exposure',prescription:Intent.createPrescription([ex],{type:'manual'},date+'T17:00:00.000Z')}),exercises:[ex]};
}
const workouts=[
 w('s1','2026-01-05','s',100,8),w('s2','2026-01-12','s',105,8),w('s3','2026-01-19','s',110,8),w('s4','2026-01-26','s',115,8),w('s5','2026-02-02','s',120,8),
 w('b1','2026-01-06','b',80,8),w('b2','2026-01-13','b',80,8),w('b3','2026-01-20','b',80,8),w('b4','2026-01-27','b',80,8),w('b5','2026-02-03','b',82,8),
 w('d1','2026-01-07','d',150,8),w('d2','2026-01-14','d',145,8.5),w('d3','2026-01-21','d',140,9),w('d4','2026-01-28','d',135,8),w('d5','2026-02-04','d',140,8)
];
const state={exerciseCatalog:catalog,exerciseRoles:roles,trainingBlocks:blocks,workouts,workoutRevisions:[]};

const report=Backtest.run(state,{from:'2026-01-19',to:'2026-01-28',horizonDays:14});
assert.equal(report.readOnly,true);
assert.equal(report.mode,'as-recorded');
assert.equal(report.horizonDays,14);
assert.equal(report.rows.length,6);
const squat=report.rows.find(r=>r.lift==='squat'&&r.asOf==='2026-01-19');
const bench=report.rows.find(r=>r.lift==='bench'&&r.asOf==='2026-01-20');
const dead=report.rows.find(r=>r.lift==='deadlift'&&r.asOf==='2026-01-21');
assert.equal(squat.decision,'increase');
assert.equal(squat.outcome.date,'2026-01-26');
assert.ok(squat.outcome.capacityChangePct>0);
assert.equal(squat.outcomeClass,'improved');
assert.equal(bench.decision,'hold');
assert.equal(dead.decision,'reduce');
assert.equal(dead.outcome.date,'2026-01-28');
assert.ok(report.summary.counts.increase>=1);
assert.ok(report.summary.counts.hold>=1);
assert.ok(report.summary.counts.reduce>=1);
assert.equal(report.summary.outcomeCoverage,100);
assert.ok(report.summary.increaseStableOrImproved.total>=1);
assert.ok(report.summary.reduceStabilizedOrRebounded.total>=1);

// Future outcome data may change evaluation, but must never change the historical decision itself.
const changed={...state,workouts:state.workouts.map(row=>row.id==='s4'?w('s4','2026-01-26','s',200,10):row)};
const changedRow=Backtest.row(changed,'squat','2026-01-19',{horizonDays:14});
assert.equal(changedRow.decision,squat.decision);
assert.equal(changedRow.reason,squat.reason);
assert.notEqual(changedRow.outcome.capacityChangePct,squat.outcome.capacityChangePct);

// Policy variants are reported side-by-side without mutating the default engine.
const sensitivity=Backtest.sensitivity(state,[
 {name:'default',policy:{}},
 {name:'very-conservative-return',policy:{conservativeIncreaseTrendPct:20}}
],{from:'2026-01-19',to:'2026-01-21',horizonDays:14});
assert.equal(sensitivity.length,2);
assert.ok(sensitivity[0].summary.counts.increase>sensitivity[1].summary.counts.increase);
assert.ok(sensitivity[1].summary.counts.hold>sensitivity[0].summary.counts.hold);

console.log('v2.3 walk-forward backtesting, outcomes and sensitivity metrics passed');
