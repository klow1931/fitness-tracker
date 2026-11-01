'use strict';
const assert=require('node:assert/strict');
const M=require('../src/product/coach-memory');
const Recall=require('../src/product/coach-memory-recall');
const Coach=require('../src/product/coach-conversation');
const {fixture}=require('./fixtures/program-review');
const values=new Map();
let writes=0;
const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{writes++;values.set(key,value);},removeItem:key=>{writes++;values.delete(key);}};
const clock=()=> '2026-11-01T14:00:00.000Z';
const a=M.createStore(storage,'local-device',{visit:'visit-recall-0001',clock});
const athlete=fixture(),athleteBefore=JSON.stringify(athlete);
const ask=(text,view=a.read())=>Coach.answer(athlete,text,{asOf:'2026-09-24',unit:'lb',memory:view});
const candidates=[
 ['Remind me why I train','reason'],
 ['Why do I lift?','reason'],
 ['What did I tell you about my training goal?','reason'],
 ['What is my workout routine?','routine-cue'],
 ['Remind me of my habit.','routine-cue'],
 ['What name should you call me?','preferred-name'],
 ['Do you remember my name?','preferred-name'],
 ['What should you follow up with me about next time?','follow-up'],
 ['Where did we leave off?','continuity'],
 ['Can we pick up where we left off?','continuity'],
 ['What did we discuss last time?','continuity'],
 ['What do you know about me?','continuity']
];
for(const [prompt,kind] of candidates)assert.equal(Recall.intent(prompt),kind,prompt);
for(const prompt of ['How much did I bench?','Did I complete my workout?','Why is my knee painful?','Do you remember what I ate?','Remember my goal','Create a workout','Help with fatigue today'])assert.equal(Recall.intent(prompt),null,'No accidental memory intent: '+prompt);
let response=ask('Remind me why I train');
assert.match(response.text,/do not have an approved/i);
assert.equal(response.actions[0].kind,'coach-memory');
assert.equal(writes,0,'Recall never auto-saves a note');
response=ask('Where did we leave off?');
assert.match(response.text,/do not save previous conversations/);
assert.equal(writes,0);
let view=a.save({type:'reason',text:'Train consistently and enjoy lifting'},{expectedRevision:0,confirmed:true});
view=a.save({type:'routine-cue',text:'Put shoes by the door on Sunday'},{expectedRevision:view.revision,confirmed:true});
view=a.save({type:'preferred-name',text:'Sam'},{expectedRevision:view.revision,confirmed:true});
view=a.save({type:'follow-up',text:'Ask whether I followed my Sunday routine'},{expectedRevision:view.revision,confirmed:true});
const approvedWrites=writes;
for(const [prompt,saved] of [
 ['Remind me why I train','Train consistently and enjoy lifting'],
 ['What is my workout routine?','Put shoes by the door on Sunday'],
 ['What name should you call me?','Sam'],
 ['What should you follow up with me about next time?','Ask whether I followed my Sunday routine']
]){
 const answer=ask(prompt);
 assert.match(answer.text,new RegExp(saved.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.equal(answer.readOnly,true);
 assert.equal(answer.source,'Shared coaching · approved memories');
 assert.equal(answer.actions[0].kind,'coach-memory');
}
const catchup=ask('Where did we leave off?');
assert.match(catchup.text,/do not keep your previous chat transcript/);
assert.match(catchup.text,/Sunday routine/);
assert.match(catchup.text,/Train consistently/);
assert.match(catchup.text,/not proof that you completed anything/);
assert(!catchup.text.includes('Sam'),'The continuity prompt must only surface follow-ups, reasons and cues');
assert.equal(writes,approvedWrites,'Conversation recall never mutates the approved vault');
assert.equal(JSON.stringify(athlete),athleteBefore,'Approved recall must not mutate workouts');

const account=M.createStore(storage,'account:athlete-different',{visit:'visit-recall-0002',clock});
assert.equal(ask('Remind me why I train',account.read()).text.includes('Train consistently'),false,'Account isolation');
const corrupted={error:'Memory cannot be verified',records:[...a.read().records]};
assert.equal(ask('Remind me why I train',corrupted).text.includes('Train consistently'),false,'Unreadable vault must fail closed');
const notApproved={records:[{type:'reason',text:'Unreviewed text',approved:false,source:'manual-review'}]};
assert.equal(ask('Remind me why I train',notApproved).text.includes('Unreviewed text'),false);
const expired=M.createStore(storage,'local-device',{visit:'visit-recall-0003',clock:()=> '2026-12-01T14:00:00.000Z'});
const original=a.read(),id=original.records.find(r=>r.type==='routine-cue').id;
a.save({id,type:'routine-cue',text:'Read my notes before training',expiresAt:'2026-11-15T00:00:00.000Z'},{expectedRevision:original.revision,confirmed:true});
assert(!ask('Remind me of my routine',expired.read()).text.includes('Read my notes'),'Expired notes cannot be recalled');
assert.equal(ask('My knee hurts. Remind me why I train').intent.topic,'health','Safety response precedes all memory recall');
assert.equal(JSON.stringify(athlete),athleteBefore);
console.log('v5.9 approved-memory contextual recall, intent limits, isolation, expiry, safety and no training writes passed');
