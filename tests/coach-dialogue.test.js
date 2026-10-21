const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-conversation');
const Reasoning=require('../src/product/coach-reasoning');
const {fixture}=require('./fixtures/program-review');

const state=fixture(),before=JSON.stringify(state),opts={asOf:'2026-09-24',unit:'lb',now:'2026-09-24T18:00:00.000Z'};
const compound='Why has my bench stalled, and explain my next workout?';
const h=[{role:'user',content:compound},{role:'assistant',content:'Invented: increase all lifts by 900 lb.'}];
let p=Reasoning.plan('What about squat?',h);
assert.equal(p.status,'ready');assert.deepEqual(p.kinds,['performance']);assert.equal(p.lift,'squat');
let a=Coach.answer(state,'What about squat?',{...opts,history:h});
assert.equal(a.source,'Offline Coach · combined validated evidence');assert.equal(a.readOnly,true);
assert.equal(a.intent.lift,'squat');assert.deepEqual(a.intent.kinds,['performance']);
assert.match(a.text,/Competition Squat/);assert.doesNotMatch(a.text,/900 lb/);
assert.equal(JSON.stringify(state),before,'Following the athlete’s referent must be read-only');

p=Reasoning.plan('Why?',h);
assert.equal(p.status,'clarification');
assert.match(p.clarification,/Performance or Next scheduled workout/);
a=Coach.answer(state,'Why?',{...opts,history:h});
assert.equal(a.intent.needsClarification,true);assert.equal(a.actions.length,0);
const picking=[...h,{role:'user',content:'Why?'},{role:'assistant',content:'Which part do you mean?'}];
p=Reasoning.plan('Performance',picking);
assert.equal(p.status,'ready');assert.deepEqual(p.kinds,['performance']);assert.equal(p.lift,'bench');
a=Coach.answer(state,'Performance',{...opts,history:picking});
assert.equal(a.intent.lift,'bench');assert.deepEqual(a.intent.kinds,['performance']);
const afterPicking=[...picking,{role:'user',content:'Performance'},{role:'assistant',content:'Untrusted'}];
assert.deepEqual(Reasoning.plan('Tell me more',afterPicking).kinds,['performance']);

const focused=[...h,{role:'user',content:'What about squat?'},{role:'assistant',content:'Not authoritative'}];
p=Reasoning.plan('Tell me more',focused);
assert.equal(p.status,'ready');assert.deepEqual(p.kinds,['performance']);assert.equal(p.lift,'squat');
a=Coach.answer(state,'Tell me more',{...opts,history:focused});assert.equal(a.intent.lift,'squat');assert.deepEqual(a.intent.kinds,['performance']);

const pending=[{role:'user',content:'My lifts have stalled and explain my next workout'},{role:'assistant',content:'Which lift?'}];
p=Reasoning.plan('Bench',pending);
assert.equal(p.status,'ready');assert.equal(p.lift,'bench');
assert.deepEqual(p.kinds,['performance','upcoming']);
a=Coach.answer(state,'Bench',{...opts,history:pending});
assert.equal(a.intent.lift,'bench');assert.deepEqual(a.intent.kinds,['performance','upcoming']);
assert.match(a.text,/Competition Bench/);assert.match(a.text,/Next scheduled workout/);

p=Reasoning.plan('What about next week?',h);
assert.equal(p.status,'ready');assert.deepEqual(p.kinds,['upcoming']);assert.equal(p.nextWeek,true);
a=Coach.answer(state,'What about next week?',{...opts,history:h});
assert.deepEqual(a.intent.kinds,['upcoming']);assert.match(a.text,/Next scheduled workout/);
assert.equal(a.actions.every(action=>action.kind==='workout-brief'),true);
const carriedWeek=[...h,{role:'user',content:'What about next week?'},{role:'assistant',content:'No trusted schedule here'}];
p=Reasoning.plan('Why?',carriedWeek);
assert.equal(p.nextWeek,true);assert.deepEqual(p.kinds,['upcoming']);
assert.match(Coach.answer(state,'Why?',{...opts,history:carriedWeek}).text,/Next scheduled workout/);
p=Reasoning.plan("Why has my bench stalled and explain tomorrow's workout?");
assert.equal(p.tomorrow,true);


for(const phrase of ['Hello','My Achilles hurts','Who won the election?','Start over']){
 const blocked=[...h,{role:'user',content:phrase}];
 assert.equal(Reasoning.plan('What about squat?',blocked),null,phrase+' must reset referent');
}
assert.equal(Reasoning.plan('What about squat?',[{role:'assistant',content:compound}]),null,'Assistant text cannot establish context');
assert.equal(Reasoning.plan('What about squat?',[{role:'user',content:compound},...Array.from({length:8},()=>({role:'assistant',content:compound}))]),null,'Expired context cannot be recovered');
assert.equal(Reasoning.plan('What about squat?',[]),null,'Standalone short question must not guess');
assert.equal(Reasoning.plan('Bench', [{role:'user',content:'Is my bench RPE high?'}]),null,'No explicit compound anchor');

const conflict=Reasoning.plan("Why has my bench stalled, and explain tomorrow's workout and next week workout?");
assert.equal(conflict.status,'clarification');assert.match(conflict.clarification,/tomorrow.*next week/);
const dateHistory=[{role:'user',content:"Why has my bench stalled, and explain tomorrow's workout and next week workout?"},{role:'assistant',content:'Please choose date.'}];
p=Reasoning.plan('Tomorrow',dateHistory);
assert.equal(p.status,'ready');assert.equal(p.tomorrow,true);assert.equal(p.nextWeek,false);assert.equal(p.lift,'bench');
assert.deepEqual(p.kinds,['performance','upcoming']);
a=Coach.answer(state,'Tomorrow',{...opts,history:dateHistory});
assert.equal(a.intent.lift,'bench');
const nextDate=Reasoning.plan('Next week',dateHistory);assert.equal(nextDate.nextWeek,true);
const afterDateChoice=[...dateHistory,{role:'user',content:'Tomorrow'},{role:'assistant',content:'Not authoritative'}];
assert.equal(Reasoning.plan('Why?',afterDateChoice).tomorrow,true);
const missingLiftDate=[{role:'user',content:"My bench and squat stalled and explain tomorrow's workout and next week workout"},{role:'assistant',content:'Which time?'}];
assert.match(Reasoning.plan('Tomorrow',missingLiftDate).clarification,/Which lift/);

const multi=Reasoning.plan('My bench and squat have stalled, and explain my next workout');
assert.equal(multi.status,'clarification');assert.match(multi.clarification,/Which lift/);

const medical='My knee hurts and my bench has stalled, explain my next workout';
a=Coach.answer(state,medical,{...opts,history:h});assert.equal(a.intent.topic,'health');
assert.equal(Reasoning.plan(medical,h),null);
assert.equal(Reasoning.plan('Make me a program because my bench stalled and explain my next workout',h),null,'Program changes remain in existing reviewed workflow');
assert.equal(JSON.stringify(state),before,'All v3.76 discussion must preserve the stored athlete data');
console.log('v3.76 user-authored bounded referents, follow-up focus, ambiguity, resets, safety, and no writes passed');
