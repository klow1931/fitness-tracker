const assert=require('node:assert/strict'),S=require('../src/product/coach-support'),C=require('../src/product/coach-conversation');
const state={},before=JSON.stringify(state),options={asOf:'2026-10-05'};
for(const [q,kind] of [['I am training alone','alone'],['I had a rough workout','setback'],['I am nervous','confidence'],['Give me encouragement','motivation'],['I completed my workout','celebrate'],['Strength vs hypertrophy','strength-knowledge'],['Is failure required?','failure-knowledge'],['How long should I rest between sets?','rest-knowledge'],['Strength vs power','power-knowledge'],['Hi','greeting']]){
 const a=C.answer(state,q,options);assert.equal(a.intent.topic,kind);assert.equal(a.readOnly,true);assert.match(a.source,/Shared coaching/);assert.ok(a.followUps.length<=2);
}
assert.match(C.answer(state,'Motivate me through Achilles pain',options).text,/cannot diagnose/);
assert.match(C.answer(state,'I feel dizzy but encourage me',options).text,/cannot diagnose/);
assert.match(C.answer(state,'I want to kill myself',options).text,/988/);
assert.match(S.answer('I have no spotter').text,/can.t spot/);
assert.match(S.answer('PR today').text,/not verifying a PR/);
assert.match(S.answer('Give me encouragement').text,/choosing rest/);
assert.ok(!S.answer('Give me encouragement').text.includes('logger'));
assert.match(S.answer('Give me encouragement',{live:{liveWorkout:{active:true,currentExercise:{name:'Bench Press'}}}}).text,/logger currently shows Bench Press/);
assert.equal(S.answer('What should I do?',{history:[{role:'user',content:'I am training alone'}]}).intent.topic,'alone');
assert.equal(S.answer('What should I do?',{history:[{role:'assistant',content:'I am training alone'}]}),null);
assert.equal(S.answer('What should I do?',{history:[{role:'user',content:'I am training alone'},{role:'user',content:'Explain bench evidence'}]}),null);
assert.equal(S.answer('Who won the election?'),null);
assert.equal(S.answer('Time',{history:[{role:'user',content:'Give me encouragement'}]}).intent.topic,'barrier');
assert.equal(S.answer('Time',{history:[{role:'user',content:'Explain power'}]}),null);
assert.equal(JSON.stringify(state),before);
console.log('Supportive Coach: bounded empathy, research links, safety precedence, honest praise, topic reset and immutability passed');
