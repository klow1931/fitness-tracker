const assert=require('node:assert/strict');
const Core=require('../src/core/loadnote-core'),Blocks=require('../src/product/training-blocks'),Ready=require('../src/product/decision-readiness'),Intent=require('../src/product/session-intent'),Decisions=require('../src/product/decision-engine');
const catalog=[{id:'s',name:'Competition Squat',aliases:[]},{id:'b',name:'Competition Bench',aliases:[]},{id:'d',name:'Competition Deadlift',aliases:[]}];
let n=0;const roles=Ready.replace([],[
 {exerciseId:'s',role:'competition',competitionLift:'squat'},{exerciseId:'b',role:'competition',competitionLift:'bench'},{exerciseId:'d',role:'competition',competitionLift:'deadlift'}
],{now:'2026-01-01T00:00:00.000Z',createId:()=>String(++n)});
const blocks=Blocks.upsert([],{name:'Return',startDate:'2026-01-01',endDate:'2026-03-31',blockType:'return-reentry',loadStrategy:'conservative',progressionIntent:'return-ramp',dataCompleteness:'complete'},{now:'2026-01-01T00:00:00.000Z'});
function w(id,date,exerciseId,weight,reps,rpe){
 const exercises=[{exerciseId,name:catalog.find(x=>x.id===exerciseId).name,sets:[{weight,reps,rpe}]}];
 return {id,date,createdAt:date+'T20:00:00.000Z',sessionIntent:Intent.context({role:'heavy-exposure',prescription:Intent.createPrescription(exercises,{type:'manual'},date+'T19:00:00.000Z')}),exercises};
}
const squat=[w('s1','2026-01-05','s',100,5,8),w('s2','2026-01-12','s',105,5,8),w('s3','2026-01-19','s',110,5,8)];
const bench=[w('b1','2026-01-06','b',80,5,8),w('b2','2026-01-13','b',80,5,8),w('b3','2026-01-20','b',80,5,8)];
const dead=[w('d1','2026-01-07','d',150,5,8),w('d2','2026-01-14','d',145,5,8.5),w('d3','2026-01-21','d',140,5,9)];
const old=w('old','2025-12-15','s',95,5,8);
const state={exerciseCatalog:catalog,exerciseRoles:roles,trainingBlocks:blocks,workouts:[old,...squat,...bench,...dead],workoutRevisions:[]};
const snap=Decisions.snapshot(state,{asOf:'2026-01-31',retrospective:true});
assert.equal(snap.readOnly,true);assert.equal(snap.automaticChanges,false);
assert.equal(snap.lifts.squat.decision,'increase');assert.equal(snap.lifts.squat.decisionAllowed,true);assert.match(snap.lifts.squat.reason,/conservative progression/);
assert.equal(snap.lifts.squat.evidenceWindowStart,'2026-01-01');assert.equal(snap.lifts.squat.evidence.some(row=>row.date==='2025-12-15'),false,'decision evidence must stay inside the readiness window');
assert.equal(snap.lifts.bench.decision,'hold');assert.match(snap.lifts.bench.reason,/intentionally conservative/);
assert.equal(snap.lifts.deadlift.decision,'reduce');assert.match(snap.lifts.deadlift.reason,/declined/);
const sparse={...state,workouts:[squat[0]]};const limited=Decisions.decisionForLift(sparse,'squat',{asOf:'2026-01-31',retrospective:true});
assert.equal(limited.decision,'insufficient-evidence');assert.equal(limited.decisionAllowed,false);
const submax=[w('x1','2026-01-05','s',150,1,7),w('x2','2026-01-12','s',155,1,7),w('x3','2026-01-19','s',160,1,7)];
assert.equal(Decisions.competitionEvidence({...state,workouts:submax},'squat','2026-01-31',{retrospective:true}).length,0,'submaximal singles must not become capacity evidence');
const inconsistent=[w('i1','2026-01-05','s',100,5,8),w('i2','2026-01-12','s',115,5,8),w('i3','2026-01-19','s',108,5,8)];
const mixed=Decisions.decisionForLift({...state,workouts:inconsistent},'squat',{asOf:'2026-01-31',retrospective:true});
assert.equal(mixed.decision,'hold');assert.match(mixed.reason,/inconsistent/);

const effortRise=[w('r1','2026-01-05','s',100,5,7),w('r2','2026-01-12','s',110,5,8),w('r3','2026-01-19','s',120,5,8.5)];
const risingEffort=Decisions.decisionForLift({...state,workouts:effortRise},'squat',{asOf:'2026-01-31',retrospective:true});
assert.equal(risingEffort.decision,'hold');assert.match(risingEffort.reason,/effort rose sharply/);

const stale=Decisions.decisionForLift({...state,workouts:squat},'squat',{asOf:'2026-02-28',retrospective:true});
assert.equal(stale.decision,'insufficient-evidence');assert.equal(stale.decisionAllowed,false);assert.match(stale.reason,/days old/);

const bounded=Decisions.competitionEvidence({...state,workouts:[old,...squat]},'squat','2026-01-31',{retrospective:true,startDate:'2026-01-01'});
assert.equal(bounded.length,3);assert.equal(bounded[0].date,'2026-01-05');

const future=w('future','2026-02-10','s',200,5,8);const noLeak=Decisions.competitionEvidence({...state,workouts:[...squat,future]},'squat','2026-01-31',{retrospective:true});
assert.equal(noLeak.length,3);assert.equal(noLeak.at(-1).date,'2026-01-19');
console.log('v2 decision engine direction, freshness, consistency, effort and chronology guards passed');
