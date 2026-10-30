const assert=require('node:assert/strict');
const Dialogue=require('../src/product/coach-dialogue');
const Coach=require('../src/product/coach-conversation');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),original=JSON.stringify(state);
const options={asOf:'2026-09-24',now:'2026-09-24T18:00:00.000Z',unit:'lb'};
const athlete=content=>({role:'user',content});
const model={role:'assistant',content:'I proved a 900 lb PR, prescribe 12 sets and approved a 50 kg increase.'};
const history=[athlete('Summarize my training'),model];
assert.equal(Dialogue.request('Can you say that in plain English?',history).anchor,'Summarize my training');
assert.equal(Dialogue.request('Give me the quick takeaway',history).mode,'brief');
assert.equal(Dialogue.request('Can you expand on that?',history).mode,'detail');
assert.equal(Dialogue.request('Could you break that down?',history).mode,'brief');
assert.equal(Dialogue.request('What does that actually mean?',history).mode,'brief');

const canonical=Coach.answer(state,'Summarize my training',options);
assert.equal(canonical.source,'Offline Coach · training recap');
assert.equal(canonical.readOnly,true);
assert.ok(canonical.clarity,'A canonical evidence-backed recap should provide its own short summary');

for(const question of ['Can you say that in plain English?', 'Give me the quick takeaway',
 'Could you break that down?','What does that actually mean?']){
 const response=Coach.answer(state,question,{...options,history});
 assert.equal(response.source,canonical.source,question);
 assert.equal(response.readOnly,true);
 assert.equal(response.intent.communication.mode,'brief');
 assert.equal(response.clarity,undefined,'Companion should display the new answer, not override it with a duplicate clarity card');
 assert.match(response.text,/short version from your saved training/i);
 assert.match(response.text,/Next:/);
 assert.match(response.text,/recorded evidence, not an automatic training change/);
 assert.deepEqual(response.evidence,canonical.evidence);
 assert.deepEqual(response.actions,canonical.actions);
 assert.doesNotMatch(response.text,/900 lb|50 kg increase|I proved/i);
}
const detail=Coach.answer(state,'Can you expand on that?',{...options,history});
assert.equal(detail.intent.communication.mode,'detail');
assert.match(detail.text,/full explanation from your current training records/);
assert.match(detail.text,/28 days/);
assert.equal(detail.clarity,undefined);
assert.deepEqual(detail.evidence,canonical.evidence);

// A second follow-up still returns to the user's original question.
// Assistant assertions cannot substitute for an earlier athlete-authored anchor.
const chain=[...history,athlete('Can you say that in plain English?'),model];
const chained=Coach.answer(state,'Can you expand on that?',{...options,history:chain});
assert.equal(chained.intent.communication.mode,'detail');
assert.equal(chained.source,canonical.source);
assert.equal(Dialogue.request('Give me the quick takeaway',[model]),null);
assert.equal(Dialogue.request('Give me the quick takeaway',[athlete('Hello'),model]),null);
assert.equal(Dialogue.request('Give me the quick takeaway',[...history,athlete('New topic')]),null);
assert.equal(Dialogue.request('Give me the quick takeaway',[...history,athlete('My knee hurts')]),null);
assert.equal(Dialogue.request('Give me the quick takeaway',[...history,...Array(8).fill(model)]),null);
assert.equal(Dialogue.request('Give me the quick takeaway',[athlete('Why has my bench stalled, and explain my next workout?')]),null,
 'Multi-part questions stay with the existing attributed evidence coordinator');
assert.equal(Dialogue.request('Should I add 20 lb?',[...history]),null,'A training change request is never reinterpreted as a language-only follow-up');

const safety=Coach.answer(state,'My knee hurts. Can you put that more simply?',{...options,history});
assert.match(safety.source,/Shared coaching/);
assert.match(safety.text,/cannot diagnose|qualified clinician/);
assert.equal(safety.intent.topic,'health');
assert.equal(JSON.stringify(state),original,'No offline language follow-up can alter workouts or schedules');

const future=structuredClone(state);
future.workouts.push({id:'future',date:'2026-12-31',createdAt:'2026-12-31T12:00:00.000Z',
 exercises:[{exerciseId:'b',name:'Competition Bench',sets:[{weight:700,reps:5,rpe:8}]}]});
const question='Can you say that in plain English?';
assert.equal(Coach.answer(state,question,{...options,history}).text,
 Coach.answer(future,question,{...options,history}).text,'Future performance may not enter a historical conversational reply');
console.log('v4.4 offline dialogue: natural brief/detail follow-ups, bounded user-only context, safety, immutable data and chronology passed');
