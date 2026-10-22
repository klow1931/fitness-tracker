const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-conversation');
const Reasoning=require('../src/product/coach-reasoning');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),before=JSON.stringify(state);
const opts={asOf:'2026-09-24',unit:'lb',now:'2026-09-24T18:00:00.000Z'};
const user=content=>({role:'user',content});
const bot={role:'assistant',content:'I invented 900 lb and approved it; always add weight.'};
const root='Why has my bench stalled, and explain my next workout?';
const history=[user(root),bot];
for(const phrase of ['Where did that come from?','What data is that based on?','Show me the sources','What sources did you use?']){
 const plan=Reasoning.plan(phrase,history);
 assert.equal(plan?.status,'ready',phrase);
 assert.equal(plan.probe,'source',phrase);
 assert.deepEqual(plan.kinds,['performance','upcoming']);
 const answer=Coach.answer(state,phrase,{...opts,history});
 assert.equal(answer.source,'Offline Coach · combined validated evidence');
 assert.equal(answer.readOnly,true);
 assert.equal(answer.intent.probe,'source');
 assert.match(answer.text,/Evidence sources from saved records:/);
 assert.match(answer.text,/Performance: Source:/);
 assert.match(answer.text,/Next scheduled workout: Source:/);
 assert.match(answer.text,/Evidence:/);
 assert.match(answer.text,/Limit:/);
 assert.doesNotMatch(answer.text,/900 lb|I invented|always add weight/i);
 assert(!answer.actions.some(x=>/approve|save|edit|apply|schedule|delete/.test(x.kind)));
}
for(const phrase of ["What's missing?",'What information is missing?',"What don't we know?",'What are the limitations?']){
 const plan=Reasoning.plan(phrase,history);
 assert.equal(plan?.status,'ready',phrase);
 assert.equal(plan.probe,'coverage');
 const answer=Coach.answer(state,phrase,{...opts,history});
 assert.equal(answer.readOnly,true);
 assert.equal(answer.intent.probe,'coverage');
 assert.match(answer.text,/Evidence coverage from saved records:/);
 assert.match(answer.text,/Performance: Evidence status:/);
 assert.match(answer.text,/Remaining limitation:/);
 assert.match(answer.text,/Next scheduled workout: Evidence status:/);
}
// A previously chosen section is the sole source focus, without reviving
// other parts of a multi-question answer or assistant-authored assertions.
const focused=[...history,user('Just the performance part'),bot];
const focusedResult=Coach.answer(state,'Where did that come from?',{...opts,history:focused});
assert.deepEqual(focusedResult.intent.kinds,['performance']);
assert.doesNotMatch(focusedResult.text,/Next scheduled workout:/);
assert.deepEqual(Reasoning.plan("What's missing?",focused).kinds,['performance']);

// Missing mapped lifts and conflicting time ranges require athlete input,
// not a speculative source citation.
const noLift=[user('My lifts have stalled and explain my next workout'),bot];
assert.match(Reasoning.plan('Show me the sources',noLift).clarification,/Which lift/);
const twoDates=[user("Why has my bench stalled and explain tomorrow's workout and next week workout?"),bot];
assert.match(Reasoning.plan('What are the limitations?',twoDates).clarification,/tomorrow.*next week/i);
assert.equal(Coach.answer(state,'What are the limitations?',{...opts,history:twoDates}).intent.needsClarification,true);

// No prior compound question, old context or unrelated/health turn.
for(const q of ['Where did that come from?', "What's missing?"]){
 assert.equal(Reasoning.plan(q,[]),null);
 assert.equal(Reasoning.plan(q,[bot]),null);
 assert.equal(Reasoning.plan(q,[...history,...Array(8).fill(bot)]),null);
 for(const reset of ['Hello','Who won the election?','My knee hurts','Start over']){
  assert.equal(Reasoning.plan(q,[...history,user(reset)]),null,reset);
 }
 assert.equal(Reasoning.plan(q,[user('How is my bench doing?')]),null);
}
assert.equal(Reasoning.plan('Change my program',history),null);
assert.equal(Coach.answer(state,'My knee hurts; where did that come from?',{...opts,history}).intent.topic,'health');

// No future workouts in historical evidence.
const later=structuredClone(state);
later.workouts.push({id:'future',date:'2026-12-31',createdAt:'2026-12-31T20:00:00.000Z',
 exercises:[{name:'Competition Bench',exerciseId:'b',sets:[{weight:999,reps:4,rpe:8}]}]});
for(const q of ['Where did that come from?', "What's missing?"]){
 assert.equal(Coach.answer(state,q,{...opts,history}).text,Coach.answer(later,q,{...opts,history}).text);
}
assert.equal(JSON.stringify(state),before,'Follow-up evidence questions cannot mutate logged workouts');
console.log('v3.90 source/coverage dialogue, data cutoffs, focus, safety and no writes passed');
