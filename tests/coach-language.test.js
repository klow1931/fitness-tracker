const assert=require('node:assert/strict');
const L=require('../src/product/coach-language');
const C=require('../src/product/coach-conversation');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),original=JSON.stringify(state);
const opts={asOf:'2026-09-24',now:'2026-09-24T22:00:00.000Z',unit:'lb'};
for(const [q,want] of [
 ['How am I doing on my bech?','How is my bench progress?'],
 ["How's my squats doing?",'How is my squat progress?'],
 ['Is my deadifts improving?','How is my deadlift progress?'],
 ['How is my sqaunt progressing?','How is my squat progress?'],
 ['How is my bnech progress?','How is my bench progress?']
])assert.equal(L.normalize(q),want,q);
assert.equal(L.normalize('What does RPE mean?'),'What does RPE mean?');
assert.equal(L.normalize('Bench 225 lb for 3 reps at RPE 9'),'Bench 225 lb for 3 reps at RPE 9');
assert.equal(L.normalize('My knee hurts after squats'),'My knee hurts after squats');
assert.equal(L.onlyLift('My squat and bench'),null);
assert.equal(L.onlyLift('My bench'),'bench');
const squat=C.answer(state,"How's my squats doing?",opts);
assert.equal(squat.source,'Current corrected lift evidence');
assert.match(squat.text,/Competition Squat/);
assert.match(squat.text,/lb/);
const bench=C.answer(state,'How am I doing on my bech?',opts);
assert.equal(bench.source,'Current corrected lift evidence');
assert.match(bench.text,/Competition Bench/);
assert.equal(bench.readOnly,true);
const previous=[{role:'user',content:'How is my squat progress?'},{role:'assistant',content:'Falsely claimed that squat improved 99%'}];
const alternate=L.interpret('And my bench?',previous);
assert.equal(alternate.question,'How is my bench progress?');
assert.equal(alternate.reason,'explicit-lift-follow-up');
const reply=C.answer(state,'And my bench?',{...opts,history:previous});
assert.equal(reply.source,'Current corrected lift evidence');
assert.match(reply.text,/Competition Bench/);
assert.equal(reply.intent.question,'And my bench?','Echo original user question');
assert.equal(L.interpret('And deadlift?', [...previous,{role:'user',content:'And my bench?'}]).question,'How is my deadlift progress?');
assert.equal(L.interpret('And deadlift?', [{role:'assistant',content:'How is my squat progress?'}]).question,'And deadlift?');
assert.equal(L.interpret('And deadlift?', [...previous,{role:'user',content:'Hello'}]).question,'And deadlift?');
assert.equal(L.interpret('And deadlift?', [...previous,{role:'user',content:'Who won the election?'}]).question,'And deadlift?');
assert.equal(L.interpret('And bench?', [...previous,...Array(8).fill({role:'assistant',content:'No earlier context'})]).question,'And bench?');
assert.equal(L.interpret('What about that one?',previous).question,'What about that one?');
const rationale=[{role:'user',content:'Why did Loadnote change my squat?'}];
assert.equal(L.interpret('And bench?',rationale).question,'Why did Loadnote change my bench?');
assert.equal(L.interpret('Did that help?',rationale).question,'What happened after my last squat change?');
assert.equal(L.interpret('Did that help?',[]).question,'Did that help?');
assert.equal(L.interpret('Did that help?', [{role:'user',content:'My knee hurts after squats'}]).question,'Did that help?');
assert.equal(L.interpret('And my bench?', [{role:'user',content:'How did my squat training change across my last three workouts?'}]).question,'How did my bench training change across my last three workouts?');
assert.equal(L.interpret('And bench?', [{role:'user',content:'What is my squat training max?'}]).question,'What is my bench training max?');
assert.equal(C.answer(state,'My knee hurts, is my bech improving?',opts).intent.topic,'health');
assert.equal(C.answer(state,'Who won the election?',opts),null);
assert.equal(JSON.stringify(state),original,'Interpreting language cannot mutate saved training');
console.log('v3.86 terminology, natural progress, athlete-only referents, resets, safety, units and immutability passed');
