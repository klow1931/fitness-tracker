const assert=require('node:assert/strict');
const Reasoning=require('../src/product/coach-reasoning');
const Coach=require('../src/product/coach-conversation');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),original=JSON.stringify(state);
const opts={asOf:'2026-09-24',unit:'lb',now:'2026-09-24T18:00:00.000Z'};
const athlete=content=>({role:'user',content});
const fabricated={role:'assistant',content:'I authorize 900 lb and your bench improved by 99 percent'};
const question='Why has my bench stalled, and explain my next workout?';
const history=[athlete(question),fabricated];
for(const q of ['Give me the short version',"What's the takeaway?",'Can you put that more simply?','Summarize that','In plain English','TL;DR']){
 const p=Reasoning.plan(q,history);
 assert.equal(p?.status,'ready',q);
 assert.equal(p.brief,true,q);
 assert.deepEqual(p.kinds,['performance','upcoming']);
 assert.equal(p.lift,'bench');
 const answer=Coach.answer(state,q,{...opts,history});
 assert.equal(answer.source,'Offline Coach · combined validated evidence');
 assert.equal(answer.readOnly,true);
 assert.equal(answer.intent.brief,true);
 assert.equal(answer.intent.follow,true);
 assert.match(answer.text,/Short version from saved records:/);
 assert.match(answer.text,/Performance:/);
 assert.match(answer.text,/Next scheduled workout:/);
 assert.match(answer.text,/Source:/);
 assert.match(answer.text,/not a tested maximum|not a newly|not a new prescription|not equivalent/i);
 assert.doesNotMatch(answer.text,/900 lb|99 percent|I authorize/i);
 assert.deepEqual(answer.reasoning.sections.map(x=>x.kind),['performance','upcoming']);
 assert.equal(answer.actions.every(a=>['progress','weekly-coaching','workout-brief'].includes(a.kind)),true);
 assert.equal(JSON.stringify(state),original);
}
// A focused section stays focused when an athlete asks for a brief recap.
const focused=[...history,athlete('Just the performance part'),fabricated];
const focus=Reasoning.plan('Can you put that more simply?',focused);
assert.deepEqual(focus.kinds,['performance']);
assert.equal(focus.lift,'bench');
assert.equal(focus.brief,true);
const focusedReply=Coach.answer(state,"What's the takeaway?",{...opts,history:focused});
assert.deepEqual(focusedReply.intent.kinds,['performance']);
assert.doesNotMatch(focusedReply.text,/Next scheduled workout:/);

// A vague request cannot pick missing measurements or conflicting dates.
const missing=[athlete('My lifts have stalled and explain my next workout'),fabricated];
assert.match(Reasoning.plan('Give me the short version',missing).clarification,/Which lift/);
assert.equal(Coach.answer(state,'Give me the short version',{...opts,history:missing}).intent.needsClarification,true);
const date=[athlete("Why has my bench stalled, and explain tomorrow's workout and next week workout?"),fabricated];
assert.match(Reasoning.plan('In plain English',date).clarification,/tomorrow.*next week/i);
assert.equal(Reasoning.plan('What does that mean?',history).status,'clarification','Existing ambiguous explanation guard stays intact');

// No follow-up may borrow assistant output, cross unrelated health/off-topic
// questions, or reach past the eight-message memory window.
assert.equal(Reasoning.plan('Give me the short version',[]),null);
assert.equal(Reasoning.plan('Give me the short version',[fabricated]),null);
assert.equal(Reasoning.plan('Give me the short version',[...history,...Array.from({length:8},()=>fabricated)]),null);
for(const q of ['Hello','Who won the election?','My Achilles hurts','Start over'])
 assert.equal(Reasoning.plan('Give me the short version',[...history,athlete(q)]),null);
assert.equal(Reasoning.plan('Short version',[athlete('How is my bench progress?')]),null);
assert.equal(Reasoning.plan('Build a new program',[...history]),null);
assert.equal(Coach.answer(state,'My chest hurts; give me the short version',{...opts,history}).intent.topic,'health');

// Recompute each turn from historical evidence, not future edits or a prior answer.
const future=structuredClone(state);
future.workouts.push({id:'future-load',date:'2026-12-31',createdAt:'2026-12-31T12:00:00.000Z',
 exercises:[{name:'Competition Bench',exerciseId:'b',sets:[{weight:999,reps:4,rpe:8}]}]});
assert.equal(Coach.answer(future,'Give me the short version',{...opts,history}).text,
 Coach.answer(state,'Give me the short version',{...opts,history}).text);
assert.equal(JSON.stringify(state),original);
console.log('v3.89 brief follow-ups: fresh attributed evidence, user context, ambiguity, safety, historical cutoff and immutability passed');
