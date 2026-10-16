const assert=require('node:assert/strict');
const Core=require('../src/core/loadnote-core'),Blocks=require('../src/product/training-blocks'),Ready=require('../src/product/decision-readiness'),Intent=require('../src/product/session-intent');
const Engine=require('../src/product/decision-engine'),Explanation=require('../src/product/decision-explanation'),Conversation=require('../src/product/coach-conversation');
const catalog=[{id:'s',name:'Competition Squat',aliases:[]},{id:'b',name:'Competition Bench',aliases:[]},{id:'d',name:'Competition Deadlift',aliases:[]}];
let n=0;const roles=Ready.replace([],[
 {exerciseId:'s',role:'competition',competitionLift:'squat'},
 {exerciseId:'b',role:'competition',competitionLift:'bench'},
 {exerciseId:'d',role:'competition',competitionLift:'deadlift'}
],{now:'2026-01-01T00:00:00.000Z',createId:()=>String(++n)});
const blocks=Blocks.upsert([],{name:'Return',startDate:'2026-01-01',endDate:'2026-03-31',blockType:'return-reentry',loadStrategy:'conservative',progressionIntent:'return-ramp',dataCompleteness:'complete'},{now:'2026-01-01T00:00:00.000Z'});
function work(id,date,exerciseId,weight,reps,rpe){
 const exercises=[{exerciseId,name:catalog.find(x=>x.id===exerciseId).name,sets:[{weight,reps,rpe}]}];
 return {id,date,createdAt:date+'T20:00:00.000Z',sessionIntent:Intent.context({role:'heavy-exposure',prescription:Intent.createPrescription(exercises,{type:'manual'},date+'T19:00:00.000Z')}),exercises};
}
const workouts=[
 work('s1','2026-01-05','s',100,5,8),work('s2','2026-01-12','s',105,5,8),work('s3','2026-01-19','s',110,5,8),
 work('b1','2026-01-06','b',80,5,8),work('b2','2026-01-13','b',80,5,8),work('b3','2026-01-20','b',80,5,8),
 work('d1','2026-01-07','d',150,5,8),work('d2','2026-01-14','d',145,5,8.5),work('d3','2026-01-21','d',140,5,9)];
const state={exerciseCatalog:catalog,exerciseRoles:roles,trainingBlocks:blocks,workouts,workoutRevisions:[]},before=JSON.stringify(state),asOf='2026-01-31';
const decisions=Engine.snapshot(state,{asOf,retrospective:true});
const cases={squat:'increase',bench:'hold',deadlift:'reduce'};
for(const [lift,direction] of Object.entries(cases)){
 const explanation=Explanation.build(decisions.lifts[lift],decisions.policy,{unit:'lb'});
 assert.equal(explanation.decision,direction);assert.equal(explanation.readOnly,true);
 assert.equal(explanation.observations.length,3);assert.equal(explanation.measurements.length,4);assert.equal(explanation.gates.length,3);
 assert.match(explanation.summary,new RegExp(direction,'i'));assert.match(explanation.observations[0].text,/lb × 5 reps @ RPE/);
 assert(explanation.gates.some(x=>x.includes('RPE')));assert.match(explanation.limitations,/not a tested 1RM/);
 assert.match(explanation.limitations,/has not changed the next workout/);
}
const empty=Engine.decisionForLift({...state,workouts:workouts.slice(0,1)},'squat',{asOf});
const noEvidence=Explanation.build(empty,decisions.policy,{unit:'kg'});
assert.equal(noEvidence.decision,'insufficient-evidence');assert.equal(noEvidence.observations.length,1);assert.deepEqual(noEvidence.gates,[]);
assert.match(noEvidence.limitations,/Not enough valid/);
assert.equal(Explanation.wants('Why is my bench on hold?'),'bench');
assert.equal(Explanation.wants('Why did Loadnote recommend increasing my squat?'),'squat');
for(const q of ['How to bench','What is my training max?','Why did squat and deadlift change?','My knee hurts while squatting'])assert.equal(Explanation.wants(q),null,q);
let answer=Explanation.answer(state,'Why did Loadnote recommend increasing my squat?',{asOf,unit:'lb'});
assert.equal(answer.source,'Current corrected lift evidence · decision explanation');
assert.equal(answer.readOnly,true);assert.match(answer.text,/Increase/);assert.match(answer.text,/lb × 5 reps/);
assert.doesNotMatch(answer.text,/recommended [0-9]+ sets/);
answer=Conversation.answer(state,'Why is my bench on hold?',{asOf,unit:'kg'});
assert.equal(answer.source,'Current corrected lift evidence · decision explanation');
assert.equal(answer.intent.lift,'bench');assert.match(answer.text,/Hold/);
assert.equal(Explanation.answer(state,'My Achilles hurts and I need a load change on squat',{asOf}),null);
const historical=Explanation.answer(state,'Why did Loadnote recommend increasing my squat?',{asOf});
const future={...state,workouts:[...workouts,work('future','2026-02-05','s',400,5,10)]};
assert.deepEqual(Explanation.answer(future,'Why did Loadnote recommend increasing my squat?',{asOf}),historical,'Future logs must not leak into historical explanation');
assert.equal(JSON.stringify(state),before,'Explaining guidance cannot write training data');
console.log('v3.33 lift decision explanations: increase/hold/reduce, evidence, thresholds, kg/lb, privacy, medical precedence, as-of and no writes passed');
