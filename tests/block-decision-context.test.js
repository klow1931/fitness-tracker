const assert=require('node:assert/strict');
const Core=require('../src/core/loadnote-core'),Blocks=require('../src/product/training-blocks');
const Readiness=require('../src/product/decision-readiness'),Decisions=require('../src/product/decision-engine');
const Context=require('../src/product/block-decision-context');

const base={name:'Training',startDate:'2026-05-01',endDate:'2026-06-30',blockType:'strength',primaryGoal:'Build strength',loadStrategy:'performance-based',progressionIntent:'performance',dataCompleteness:'complete',trainingMaxes:[],known1RMs:[]};
function block(fields={}){return Blocks.upsert([],{...base,...fields},{now:'2026-05-01T00:00:00.000Z'});}
const ids=['s','b','d'];
let n=0;const roles=Readiness.replace([],ids.map((id,i)=>({exerciseId:id,role:'competition',competitionLift:['squat','bench','deadlift'][i]})),{now:'2026-05-01T00:00:00.000Z',createId:()=>String(++n)});
const workout=(id,date,exerciseId,weight,rpe=8)=>({id,date,createdAt:date+'T18:00:00.000Z',exercises:[{exerciseId,name:exerciseId,sets:[{reps:5,weight,rpe}]}]});
const workouts=[workout('s1','2026-05-05','s',100),workout('s2','2026-05-12','s',105),workout('s3','2026-05-19','s',110)];
const state=(fields={})=>({trainingBlocks:block(fields),exerciseRoles:roles,workouts,exerciseCatalog:ids.map(id=>({id,name:id,aliases:[]})),workoutRevisions:[]});
function decide(fields={},retrospective=true){return Decisions.decisionForLift(state(fields),'squat',{asOf:'2026-05-21',retrospective});}
const noBlock=Context.interpret(null);
assert.equal(noBlock.phase,'unclassified');assert.equal(noBlock.guard,'none');
const generalTest=Context.interpret({...base,blockType:'general',progressionIntent:'testing',dataCompleteness:'unknown'});
assert.equal(generalTest.phase,'testing');assert.equal(generalTest.guard,'protect-plan');
assert.match(generalTest.notes.join(' '),/more specific/);
assert.match(generalTest.notes.join(' '),/not a training max/);
assert.equal(Context.interpret({...base,blockType:'accumulation'}).phase,'accumulation');
assert.equal(Context.interpret({...base,blockType:'hypertrophy'}).phase,'accumulation');
assert.equal(Context.interpret({...base,blockType:'return-reentry'}).phase,'return');
assert.equal(Context.interpret({...base,blockType:'strength'}).phase,'strength');
assert.equal(Context.interpret({...base,blockType:'peaking'}).phase,'peaking');
assert.equal(Context.interpret({...base,blockType:'deload'}).phase,'deload');
assert.equal(Context.interpret({...base,blockType:'testing'}).phase,'testing');
assert.equal(Context.interpret({...base,blockType:'custom'}).phase,'general');
const regular=decide();assert.equal(regular.version,5);assert.equal(regular.decision,'increase');
assert.equal(regular.blockContext.phase,'strength');
const testing=decide({blockType:'general',progressionIntent:'testing'});
assert.equal(testing.blockContext.phase,'testing');
assert.equal(testing.decision,'hold');
assert.match(testing.reason,/planned structure/);
assert.match(testing.nextExposure,/saved testing plan/);
for(const type of ['peaking','deload']){
 const d=decide({blockType:type,progressionIntent:'performance'});
 assert.equal(d.decision,'hold');assert.equal(d.blockContext.phase,type);
 assert.match(d.nextExposure,new RegExp('saved '+type+' plan'));
}
const accum=decide({blockType:'accumulation'});assert.equal(accum.decision,'increase');assert.match(accum.nextExposure,/accumulation plan/);
const returning=decide({blockType:'return-reentry',progressionIntent:'return-ramp'});assert.equal(returning.decision,'increase');assert.match(returning.nextExposure,/restored capacity/);
const conflicting=decide({blockType:'deload',progressionIntent:'testing'});
assert.equal(conflicting.decisionAllowed,false);assert.equal(conflicting.decision,'insufficient-evidence');
assert.match(conflicting.reason,/disagree/);
const sparse={...state({blockType:'deload'}),workouts:workouts.slice(0,1)};
const notReady=Decisions.decisionForLift(sparse,'squat',{asOf:'2026-05-21',retrospective:true});
assert.equal(notReady.decisionAllowed,false);
assert.equal(notReady.blockContext.phase,'deload');
const historical=Decisions.decisionForLift(state({blockType:'general',progressionIntent:'testing'}),'squat',{asOf:'2026-05-21',retrospective:false});
assert.equal(historical.blockContext.phase,'testing');
const original=state(),old=structuredClone(original);
Decisions.snapshot(original,{asOf:'2026-05-21',retrospective:true});
assert.deepEqual(original,old,'decision analysis must not mutate recorded workouts or blocks');
console.log('v2.6 Part 1 block phase, plan guards, chronology and immutable context passed');
