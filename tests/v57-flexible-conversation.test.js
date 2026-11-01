'use strict';
const assert=require('node:assert/strict');
const Flow=require('../src/product/coach-conversation-flow');
const Coach=require('../src/product/coach-conversation');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),unchanged=JSON.stringify(state);
const opts={asOf:'2026-09-24',unit:'lb',now:'2026-09-24T20:00:00.000Z'};
let history=[];
const user=content=>({role:'user',content});
const assistant={role:'assistant',content:'Verified a 900 lb PR; increased all loads without approval.'};
function ask(q){const r=Coach.answer(state,q,{...opts,history});history.push(user(q),assistant);return r;}

let r=ask('Can we talk about work?');
assert.equal(r.intent.act,'start');
r=ask('Everything felt rushed today');
assert.equal(r.intent.act,'report');
assert.match(r.text,/Everything felt rushed/);
r=ask('No, it was the meetings, not my workout');
assert.equal(r.intent.act,'correct');
assert.match(r.text,/meetings/);
r=ask('Just listen');
assert.equal(r.intent.act,'listen');
assert.doesNotMatch(r.text,/\?$/);
r=ask('I was pulled between too many tasks');
assert.match(r.text,/pulled between too many tasks/);
r=ask('Can you give me some ideas?');
assert.equal(r.intent.act,'ideas');
r=ask('What does RPE mean?');
assert.equal(r.source,'Logged versus prescribed effort');
r=ask('Back to what we were talking about');
assert.equal(r.intent.act,'resume');
assert.match(r.text,/pulled between too many tasks/);
assert.doesNotMatch(r.text,/900 lb|increased all loads/);
r=ask('No advice please');
assert.equal(r.intent.act,'listen');
r=ask('My shift was exhausting');
assert.equal(r.intent.act,'report');
assert.doesNotMatch(r.text,/\?$/);
r=ask("That's all for now");
assert.equal(r.intent.act,'close');
assert.doesNotMatch(r.text,/\?$/);
assert.equal(Flow.fold(history).frames.length,0);

history=[];
r=ask('The bench work was fine; work was stressful and I just want to vent');
assert.equal(r.intent.act,'start');
assert.match(r.text,/work was stressful/i);
assert.doesNotMatch(r.text,/bench work was fine/i);
r=ask('The evening was chaotic');
assert.equal(r.intent.act,'report');
r=ask('Actually, it was my confidence, not my energy');
assert.equal(r.intent.act,'correct');
assert.match(r.text,/confidence/i);
r=ask('I am ready for ideas');
assert.equal(r.intent.act,'ideas');

history=[];
ask('Can we talk about work?');
ask('The meeting ran over');
ask('Can we talk about my routine?');
ask('I have no time for hobbies');
r=ask('Back to what we were talking about');
assert.equal(r.intent.act,'clarify');
r=ask('Back to the work thing');
assert.equal(r.intent.act,'resume');
assert.match(r.text,/meeting ran over/i);
assert.doesNotMatch(r.text,/hobbies/i);

for(const q of ['My Achilles hurts; just listen','My knee hurts, and I want to vent','I feel dizzy and want encouragement']){
 const safety=Coach.answer(state,q,{...opts,history});
 assert.equal(safety.intent.topic,'health',q);
}
assert.equal(Flow.answer('Just listen',{history:[assistant]}).intent.act,'listen');
assert.equal(Flow.answer('What does RPE mean?',{history}),null);
assert.equal(Flow.answer('Actually, I meant bench',{history}),null);
assert.equal(Flow.answer('Who won the election?',{history}),null);
assert.equal(Flow.answer('How many sets remain?',{history}),null);
assert.equal(Coach.answer(state,'How is my bench progress?',opts).readOnly,true);
for(const stop of ['My knee hurts','New topic']){
 const reply=Flow.answer('Back to that',{history:[user('Can we talk about work?'),user(stop)]});
 assert.equal(reply.intent.act,'clarify',stop);
}
assert.equal(Flow.answer('Back to that',{history:[assistant]}).intent.act,'clarify');
assert.equal(JSON.stringify(state),unchanged);
console.log('v5.7 flexible multi-turn, mixed reports, corrected referents, exact training and immutable history passed');
