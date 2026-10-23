const assert=require('node:assert/strict');
const Compare=require('../src/product/coach-lift-comparison');
const Coach=require('../src/product/coach-conversation');
const Trends=require('../src/product/coach-performance-insights');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),unchanged=JSON.stringify(state);
const opts={asOf:'2026-09-24',now:'2026-09-24T18:00:00.000Z',unit:'lb'};
const user=content=>({role:'user',content});
const bot={role:'assistant',content:'Invented bench 1200 lb maximum; add 900 lb.'};
const root='Compare my squat and bench progress',hist=[user(root),bot];
for(const q of [root,'Compare my bench vs deadlift trends','Which is improving, squat or deadlift?']){
 const plan=Compare.intent(q);
 assert.equal(plan.lifts.length,2,q);
 const r=Coach.answer(state,q,opts);
 assert.equal(r?.source,'Offline Coach · verified two-lift trends',q);
 assert.equal(r.readOnly,true);assert.equal(r.evidence.length,2);
 assert.deepEqual(r.intent.lifts,plan.lifts);
 assert.match(r.text,/Earlier window:/);
 assert.match(r.text,/recent window:/);
 assert.match(r.text,/not comparable/);
 assert.doesNotMatch(r.text,/Invented|add 900 lb/i);
 assert(r.actions.every(a=>a.kind==='progress'));
 for(let i=0;i<2;i++)assert.deepEqual(r.evidence[i],Trends.inspect(state,{asOf:opts.asOf,lift:plan.lifts[i],weeks:12,unit:'lb'}));
}
const three=Coach.answer(state,'Compare squat bench and deadlift progress',opts);
assert.equal(three.intent.needsClarification,true);assert.match(three.text,/Choose two lifts/);
const one=Coach.answer(state,'Compare bench progress',opts);
assert.equal(one.intent.needsClarification,true);
const follow=Coach.answer(state,'What about bench and deadlift?',{...opts,history:hist});
assert.deepEqual(follow.intent.lifts,['bench','deadlift']);
const after=[...hist,user("What's missing for those two lifts?"),bot];
assert.deepEqual(Coach.answer(state,'What about bench and deadlift?',{...opts,history:after}).intent.lifts,['bench','deadlift']);
for(const [q,mode] of [["What's missing for those two lifts?",'coverage'],['Where did that comparison come from?','source']]){
 const r=Coach.answer(state,q,{...opts,history:hist});
 assert.equal(r.intent.mode,mode);assert.deepEqual(r.intent.lifts,['squat','bench']);
 assert.match(r.text,mode==='coverage'?/Available data for the two lifts:/i:/Sources:/);
 assert.equal(r.readOnly,true);
}
assert.equal(Compare.intent("What's missing for those two lifts?"),null);
for(const reset of ['Hello','What is 2+2?','My knee hurts','Start over'])
 assert.equal(Compare.intent("What's missing for those two lifts?",[...hist,user(reset)]),null);
assert.equal(Compare.intent('What about squat and deadlift?',[]),null);
assert.equal(Compare.intent('What about squat and deadlift?',[bot]),null);
assert.equal(Compare.intent('What about squat and deadlift?',[...hist,...Array(8).fill(bot)]),null);
assert.equal(Compare.intent('Can you add 10 lb to squat and bench?',hist),null);
assert.equal(Compare.intent('Compare squat and bench program options',hist),null);
assert.equal(Coach.answer(state,'My knee hurts, compare squat and bench progress',opts).intent.topic,'health');
const future=structuredClone(state);
future.workouts.push({id:'future',date:'2026-12-31',createdAt:'2026-12-31T21:00:00.000Z',
 exercises:[{exerciseId:'b',name:'Competition Bench',sets:[{weight:999,reps:4,rpe:8}]}]});
assert.equal(Coach.answer(future,root,opts).text,Coach.answer(state,root,opts).text);
assert.equal(JSON.stringify(state),unchanged,'No edits to saved training');
console.log('v3.91 comparison and follow-ups, cutoff, RPE, safety, units and immutability passed');
