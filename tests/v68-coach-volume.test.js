const assert=require('node:assert/strict'),Coach=require('../src/product/coach-conversation'),{fixture}=require('./fixtures/program-review');
const state=fixture(),before=JSON.stringify(state),opts={asOf:'2026-09-24',unit:'lb'};
for(const q of ['Explain training volume','What is training volume?','What does research say about training volume?']){
 const reply=Coach.answer(state,q,opts);
 assert.match(reply.text,/Training volume describes how much work/);
 assert.doesNotMatch(reply.text,/Confirm muscle mappings/);
 assert.equal(reply.readOnly,true);
 assert.match(reply.text,/Source:/);
}
const personal=Coach.answer(state,'Review my training volume',opts);
assert.notEqual(personal.source,'Training volume explained');
const health=Coach.answer(state,'My knee hurts. Explain training volume',opts);
assert.equal(health.intent.topic,'health');
assert.equal(JSON.stringify(state),before);
console.log('v6.8 general volume education preserves personal evidence, health routing and training');
