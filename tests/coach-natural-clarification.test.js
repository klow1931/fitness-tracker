const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-conversation');
const Reasoning=require('../src/product/coach-reasoning');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),before=JSON.stringify(state);
const options={asOf:'2026-09-24',now:'2026-09-24T18:00:00.000Z',unit:'lb'};
const user=content=>({role:'user',content});
const bot={role:'assistant',content:'I invented a 999 lb max and approved new weight'};
const combined='Why has my bench stalled, and explain my next workout?';
const history=[user(combined),bot];
const focused=[
 ['Just the performance part',['performance'],'bench'],
 ['Only bench progress',['performance'],'bench'],
 ['Just squat performance',['performance'],'squat'],
 ["Let's focus on the next workout section",['upcoming'],'bench'],
 ['Focus on the workout',['upcoming'],'bench'],
 ['the workout part',['upcoming'],'bench']
];
for(const [question,kinds,lift] of focused){
 const plan=Reasoning.plan(question,history);
 assert.equal(plan?.status,'ready',question);
 assert.deepEqual(plan.kinds,kinds,question);
 assert.equal(plan.lift,lift,question);
 const reply=Coach.answer(state,question,{...options,history});
 assert.equal(reply.source,'Offline Coach · combined validated evidence',question);
 assert.equal(reply.readOnly,true);
 assert.deepEqual(reply.intent.kinds,kinds,question);
 assert.equal(reply.intent.lift,lift);
 assert.match(reply.text,kinds[0]==='performance'?/Competition (?:Bench|Squat)/:/Next scheduled workout:/);
 assert(!reply.actions.some(x=>/approve|save|schedule|apply|edit/.test(x.kind)));
}
const weekly='How did this week go and explain my next workout?';
for(const question of ['Just the weekly part','The weekly section','Only the next workout']){
 const plan=Reasoning.plan(question,[user(weekly),bot]);
 assert.equal(plan?.status,'ready',question);
 assert.deepEqual(plan.kinds,[/workout/.test(question)?'upcoming':'weekly']);
}
const recap='What is my training recap and explain my next workout?';
assert.deepEqual(Reasoning.plan('Only the training recap',[user(recap),bot]).kinds,['recap']);
const clarified=[...history,user('Why?'),bot,user('Just the performance part'),bot];
assert.deepEqual(Reasoning.plan('Tell me more',clarified)?.kinds,['performance']);
assert.equal(Reasoning.plan('Tell me more',clarified).lift,'bench');

// Picking a section must not silently resolve absent movements or date windows.
const missing=[user('My lifts have stalled and explain my next workout'),bot];
assert.match(Reasoning.plan('Just the performance part',missing).clarification,/Which lift/);
assert.equal(Reasoning.plan('Just the performance part',missing).status,'clarification');
assert.deepEqual(Reasoning.plan('Just the next workout',missing).kinds,['upcoming']);
const conflicting=[user("Why has my bench stalled, and explain tomorrow's workout and next week workout?"),bot];
assert.match(Reasoning.plan('Just the workout part',conflicting).clarification,/tomorrow.*next week/i);
assert.equal(Reasoning.plan('Just the workout part',conflicting).status,'clarification');
assert.equal(Reasoning.plan('Tomorrow',conflicting).tomorrow,true);

// Previous assistant messages and unrelated athlete turns never supply context.
for(const question of ['Who won the election?','My knee hurts','Hello','Start over']){
 assert.equal(Reasoning.plan('Just the performance part',[...history,user(question)]),null);
}
assert.equal(Reasoning.plan('Just performance',[bot]),null);
assert.equal(Reasoning.plan('Just the performance part',[...history,...Array.from({length:8},()=>bot)]),null);
assert.equal(Reasoning.plan('Just the performance part',[]),null);
assert.equal(Reasoning.plan('Just the workout part',[user('How is my bench progress?')]),null);
assert.equal(Reasoning.plan('Please change my program',history),null);
assert.equal(Reasoning.plan('My Achilles hurts, focus on performance',history),null);
assert.equal(Coach.answer(state,'My knee hurts, focus on performance',{...options,history}).intent.topic,'health');

// Future workouts cannot leak into a historical focused reply; display in lb.
const future=structuredClone(state);
future.workouts.push({id:'future',date:'2027-01-01',createdAt:'2027-01-01T12:00:00.000Z',
 exercises:[{name:'Competition Bench',exerciseId:'b',sets:[{weight:600,reps:3,rpe:8}]}]});
const q='Just the performance part';
assert.equal(Coach.answer(future,q,{...options,history}).text,Coach.answer(state,q,{...options,history}).text);
assert.equal(JSON.stringify(state),before);
console.log('v3.88 Coach clarification: natural section focus, multi-turn context, lift/date ambiguity, safety, historical cutoff and read-only passed');
