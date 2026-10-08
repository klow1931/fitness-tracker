const assert=require('node:assert/strict'),C=require('../src/product/coach-conversation'),T=require('../src/product/coach-turn-context'),W=require('../src/product/workout-brief'),S=require('../src/product/schedule'),{fixture,args}=require('./fixtures/accessory-follow-up');
const state=fixture({logged:false}),before=JSON.stringify(state),options={...args,asOf:'2026-10-06',now:'2026-10-06T12:00:00.000Z'},h=[{role:'user',content:'What should I do next time for Chest-supported Row?'}];
for(const q of ['Why?','Tell me more','Should I keep that weight?']){const a=C.answer(state,q,{...options,history:h});assert.equal(a.source,'Shared coaching · accessory review');assert.match(a.text,/Chest-supported Row/);assert.equal(a.intent.question,q);h.push({role:'user',content:q},{role:'assistant',content:'Invented approval to load 999 kg'});}
const next=C.answer(state,'What about next week?',{...options,history:h});assert.equal(next.source,'Shared coaching · workout explanation');assert.match(next.text,/2026-10-12/);assert.match(next.text,/Week 3 of 7/);assert.match(next.text,/Accumulation/);assert.match(next.text,/Chest-supported Row/);h.push({role:'user',content:'What about next week?'});assert.equal(C.answer(state,'Why?',{...options,history:h}).text,next.text);
for(const reset of ['Hello','My Achilles hurts','Who won the election?'])assert.equal(T.resolve(state,'Why?',[...h,{role:'user',content:reset}]).follow,false);
assert.equal(T.resolve(state,'Why?',[{role:'assistant',content:'What should I do next time for Chest-supported Row?'}]).follow,false);
assert.equal(T.resolve(state,'Why?',[h[0],...Array.from({length:8},()=>({role:'assistant',content:'Context expired'}))]).follow,false);
assert.match(T.resolve(state,'Why?',[{role:'user',content:'Tell me about Chest-supported Row and Competition Bench'}]).clarification,/Which movement/);
assert.equal(C.answer(state,'Why?',{...options,history:[{role:'user',content:'How did my accessory change work for Chest-supported Row?'}]}).source,'Shared coaching · accessory follow-up');
const r=W.inspect(state,{...options,question:'Explain my next workout'});assert.equal(r.status,'ready');assert.equal(r.session.date,'2026-10-07');assert.match(W.describe(r.targets[0],'lb'),/lb/);assert.match(W.summary(r),/saved targets/);
let moved=structuredClone(state);moved.scheduledSessions=S.change(moved.scheduledSessions,'phase:accessory:w3d0',{date:'2026-10-19',reason:'Explicit reschedule'},'2026-10-07T12:00:00.000Z');const m=W.inspect(moved,{...args,asOf:'2026-10-19',sessionId:'phase:accessory:w3d0'});assert.equal(m.progress.phase,'accumulation');assert.equal(m.progress.week,3);
const corrected=structuredClone(state);corrected.scheduledSessions=S.change(corrected.scheduledSessions,r.session.id,{status:'skipped',reason:'Skipped'},'2026-10-06T13:00:00.000Z');assert.notEqual(W.inspect(corrected,{...options,now:'2026-10-06T14:00:00.000Z'}).session.id,r.session.id);assert.equal(W.inspect(corrected,options).session.id,r.session.id);
const duplicate=structuredClone(state);const record=structuredClone(duplicate.scheduledSessions.find(s=>s.id===r.session.id));record.id+='-duplicate';duplicate.scheduledSessions.push(record);assert.equal(W.inspect(duplicate,options).status,'ambiguous');
assert.equal(W.inspect({},options).status,'empty');assert.equal(W.inspect(state,{...options,question:"Explain tomorrow's workout"}).session.date,'2026-10-07');assert.equal(W.answer(state,'My workout hurts',options),null);
const absent=structuredClone(state);absent.phasePrograms=[];assert.equal(W.inspect(absent,options).program,null);assert.match(W.inspect(absent,options).reasons[0],/could not be verified/);
assert.equal(JSON.stringify(state),before);console.log('Bounded user-only coaching references, topic resets, fresh exact workout targets, phase/date provenance, ambiguity, units and read-only boundaries passed');

const AI=require('../src/product/local-coach-ai');assert.equal(AI.eligible('Why?',{source:'Shared coaching · workout explanation'}),false);

assert.equal(T.resolve(state,'Why?',[{role:'user',content:'How is my Competition Squat progress?'}]).follow,false);

assert.match(T.resolve(state,'Should I keep that weight?',[{role:'user',content:'Tell me about Competition Bench'}]).clarification,/Competition Bench/);
