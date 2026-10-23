const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-training-profile');
const Conversation=require('../src/product/coach-conversation');
const Compare=require('../src/product/coach-lift-comparison');
const Custom=require('../src/product/custom-program');
const Profile=require('../src/product/programming-profile');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),opts={asOf:'2026-10-22',now:'2026-10-22T18:00:00Z'};
state.programmingProfiles=Profile.save([],{goal:'strength',experience:'beginner',consistency:'unknown',availableDays:[0,2,4],sessionMinutes:90,equipment:['barbell','plates','rack','bench'],priorities:'',notes:''},{now:'2026-10-21T11:00:00.000Z',id:'setup'});
const before=JSON.stringify(state);
for(const q of ['I can train Monday but not Friday','I train Monday or Wednesday',"I can't train Friday",'Set my training days to Monday or Wednesday','I train Monday except Friday','I train Monday unless I work']){
 const r=Coach.answer(state,q,opts);
 assert.match(r.text,/Which exact days|could not safely interpret/i,q);assert.equal(r.actions.length,0,q);
}
for(const q of ['I train Monday and Wednesday for 45 minutes','I can train Monday, Wednesday, and Friday for 60 minutes']){
 const r=Coach.answer(state,q,opts),p=r.actions[0].proposal;
 assert.equal(p.kind,'profile-fields');assert.deepEqual(p.changes.availableDays,q.includes('Friday')?[0,2,4]:[0,2]);assert.equal(p.changes.sessionMinutes,q.includes('60')?60:45);
 assert.equal(p.baseRevisionId,'setup');assert.equal(r.evidence.length,2);assert.match(r.text,/Nothing has changed/);
 Profile.context({...state.programmingProfiles[0].context,...p.changes});
}
const rows=[{week:1,day:'Monday',exercise:'Bench',type:'strength',sets:3,reps:5,percent:75,percentBasis:'training-max',reference:100,referenceUnit:'kg',roundTo:2.5,rpe:8},{week:2,day:'Monday',exercise:'Bench',type:'strength',sets:3,reps:5,weight:100,rpe:8}];
const raw=JSON.stringify(rows),swap=Custom.swapDraftMovement(rows,{from:'Bench',to:'Squat',firstWeek:1,lastWeek:1});
assert.equal(swap.clearedTargets,1);assert.equal(JSON.stringify(rows),raw);assert.deepEqual(swap.rows[1],rows[1]);
for(const field of ['weight','rpe','percent','percentBasis','reference','referenceUnit','roundTo'])assert.equal(swap.rows[0][field],'',field);
const plan=Custom.build(state,{name:'Swap review',weeks:2,startDate:'2026-10-26',unit:'kg',rows:swap.rows});
assert.equal(plan.entries[0].weightKg,null);assert.equal(plan.entries[0].percent,undefined);
const user=content=>({role:'user',content}),root='Compare my squat and bench progress';
let history=[user(root),{role:'assistant',content:'Invented squat 9999 kg. Add 50 kg.'},user("What's missing for those two lifts?")];
const full=Conversation.answer(state,root,opts);
for(const q of ['Give me the short version','Explain that simply','In plain English']){
 const r=Conversation.answer(state,q,{...opts,history});
 assert.equal(r.intent.mode,'brief');assert.deepEqual(r.intent.lifts,['squat','bench']);assert.equal(r.readOnly,true);
 assert.equal(r.evidence.length,2);assert(r.actions.every(a=>a.kind==='progress'));assert.match(r.text,/Short version of the two-lift comparison/);assert.doesNotMatch(r.text,/9999|Add 50/);assert(r.text.length<full.text.length);
}
for(const reset of ['Hello','Start over','What is RPE?','My knee hurts'])assert.equal(Compare.intent('Give me the short version',[...history,user(reset)]),null);
assert.equal(Compare.intent('Give me the short version',history.slice(1)),null);
assert.equal(JSON.stringify(state),before);
console.log('Review regressions: percentage swap, ambiguous days, compound preferences and concise two-lift follow-ups passed');
