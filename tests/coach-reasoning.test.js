const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-conversation');
const Reasoning=require('../src/product/coach-reasoning');
const {fixture}=require('./fixtures/program-review');

const state=fixture(),before=JSON.stringify(state);
const opts={asOf:'2026-09-24',unit:'lb',now:'2026-09-24T18:00:00.000Z'};
const q='Why has my bench stalled, and explain my next workout?';
const plan=Reasoning.plan(q);
assert.deepEqual(plan.kinds,['performance','upcoming']);
assert.equal(plan.lift,'bench');
let reply=Coach.answer(state,q,opts);
assert.equal(reply.source,'Offline Coach · combined validated evidence');
assert.equal(reply.readOnly,true);
assert.deepEqual(reply.intent.kinds,['performance','upcoming']);
assert.match(reply.text,/Performance: Competition Bench/);
assert.match(reply.text,/Next scheduled workout:/);
assert.match(reply.text,/review the exact training records/i);
assert.match(reply.text,/athlete approval/);
assert.deepEqual(reply.reasoning.sections.map(s=>s.kind),['performance','upcoming']);
assert(reply.reasoning.sections.every(s=>s.source!=='Unavailable'),'Fixture should yield real validated evidence');
assert(reply.actions.every(a=>['progress','workout-brief','weekly-coaching'].includes(a.kind)));
assert.equal(reply.actions.some(a=>/save|approve|edit|cancel|schedule/.test(a.kind)),false);
assert.equal(JSON.stringify(state),before,'Compound questions must not mutate any saved training');

reply=Coach.answer(state,'How did this week go and explain my next workout?',opts);
assert.equal(reply.source,'Offline Coach · combined validated evidence');
assert.deepEqual(reply.intent.kinds,['weekly','upcoming']);
assert.match(reply.text,/Weekly training:/);
assert.match(reply.text,/Next scheduled workout:/);

reply=Coach.answer(state,'What is my training recap and explain my next workout?',opts);
assert.equal(reply.source,'Offline Coach · combined validated evidence');
assert.deepEqual(reply.intent.kinds,['upcoming','recap']);
assert.match(reply.text,/Recent training:/);

reply=Coach.answer(state,'My lifts have stalled and explain my next workout',opts);
assert.match(reply.text,/Which lift appears stalled/);
assert.equal(reply.actions.length,0);
assert.equal(reply.intent.needsClarification,true);

for(const query of [
 'My Achilles hurts and my bench has stalled, explain my next workout',
 'I have chest pain and a plateau in my bench; explain my next workout'
]){
 reply=Coach.answer(state,query,opts);
 assert.equal(reply.intent.topic,'health');
 assert(!/combined validated evidence/.test(reply.source));
}
assert.equal(Reasoning.plan('What should I do about my bench plateau?'),null,'Single topic uses the established handler');
assert.equal(Reasoning.plan('Build me a program: my bench plateaued and explain the next workout'),null,'Draft requests stay with reviewed planner');
assert.equal(Reasoning.plan('My bench plateaued and change my program after my next workout'),null,'Changes never bypass reviewed action flow');
assert.equal(Reasoning.plan('How did my week go and explain my next workout?').status,'ready');
const synthetic={...state,workouts:[...(state.workouts||[]),{
 id:'out-of-window',date:'2026-12-14',createdAt:'2026-12-14T14:00:00.000Z',
 exercises:[{name:'Competition Bench',exerciseId:'b',sets:[{weight:750,reps:3,rpe:8}]}]
}]};
assert.equal(Coach.answer(synthetic,q,opts).text,Coach.answer(state,q,opts).text,'Future workout data must not contaminate historical reply');
assert.equal(JSON.stringify(state),before);
console.log('Unified Coach multi-evidence routing, safety, no mutation and historical cutoff passed');
