const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-training-profile');
const Planner=require('../src/product/offline-planner');
const Profile=require('../src/product/programming-profile');
const Custom=require('../src/product/custom-program');
const Import=require('../src/product/custom-program-import');
const Intent=require('../src/product/session-intent');
const Core=require('../src/core/loadnote-core');

const saved=Profile.save([],{goal:'strength',experience:'intermediate',consistency:'consistent',availableDays:[0,2,4],sessionMinutes:60,equipment:['barbell','plates','rack','bench'],priorities:'',notes:''},{now:'2026-10-20T11:00:00.000Z',id:'profile'});
let state=Core.normalizeState({...Core.normalizeState({}),programmingProfiles:saved});
const before=JSON.stringify(state);
let reply=Coach.answer(state,'I only have 45 minutes',{asOf:'2026-10-20'});
assert.equal(reply.actions[0].kind,'profile-review');assert.equal(reply.actions[0].proposal.changes.sessionMinutes,45);
reply=Coach.answer(state,'I train Monday, Wednesday, and Friday',{asOf:'2026-10-20'});
assert.deepEqual(reply.actions[0].proposal.availableDays,[0,2,4]);assert.match(reply.text,/Nothing has changed/);
assert.equal(JSON.stringify(state),before,'Coach proposal must never mutate saved athlete data');
let request=Planner.parse('Create a 12-week strength program. I train Monday, Wednesday, and Friday, 45 minutes, full gym');
assert.deepEqual(request.days,[0,2,4]);assert.equal(request.frequency,3);assert.equal(request.minutes,45);
request=Planner.parse('Actually, make it four days',request);
assert.equal(request.frequency,4);assert.equal(request.days,undefined,'changing frequency invalidates prior named-day selection');
const source=[
 {week:'1',day:'Monday',exercise:'Bench',type:'strength',sets:'3',reps:'5',weight:'100',unit:'kg',rpe:'8'},
 {week:'1',day:'Wednesday',exercise:'Bike',type:'cardio',minutes:'20'},
 {week:'2',day:'Monday',exercise:'Squat',type:'strength',sets:'3',reps:'5',weight:'100',unit:'kg'}
];
const frozen=JSON.stringify(source);
const edited=Custom.bulkEditDraftRows(source,[0,2],{sets:4});
assert.equal(edited.changed,2);assert.equal(edited.rows[0].sets,'4');assert.equal(edited.rows[2].sets,'4');
assert.equal(JSON.stringify(source),frozen);
assert.throws(()=>Custom.bulkEditDraftRows(source,[0,1],{reps:8}),/compatible/);
assert.throws(()=>Custom.bulkEditDraftRows(source,[0,0],{sets:3}),/Invalid exercise selection/);

const range=Import.plainText('Week 1\nMonday\nCompetition Squat 3x8–12 @ 100 kg RPE 8').rows[0];
assert.equal(range.reps,'8-12');
const rawPercent=Import.plainText('Week 1\nMonday\nCompetition Bench 5x3 @ 75% RPE 8').rows[0];
assert.equal(rawPercent.percent,'75');
assert.throws(()=>Custom.build(state,{name:'Unconfirmed max',weeks:1,startDate:'2026-11-02',unit:'lb',rows:[rawPercent]}),/percentage basis/);
const approved={...rawPercent,percentBasis:'training-max',reference:'400',referenceUnit:'lb',roundTo:'5'};
const plan=Custom.build(state,{name:'Percent and range',weeks:1,startDate:'2026-11-02',unit:'lb',rows:[range,approved]});
assert.equal(plan.entries[0].minReps,8);assert.equal(plan.entries[0].maxReps,12);
assert.equal(plan.entries[1].weightKg,136.08,'75% of 400 lb rounded to 5 lb = 300 lb = 136.08 kg');
assert.equal(plan.entries[1].percentBasis,'training-max');
assert.equal(plan.sessions[0].exercises[0].sets[0].maxReps,12);
assert.equal(plan.sessions[0].exercises[1].sets[0].percent,75);
state=Custom.save(state,plan,{confirmed:true,id:'v374',now:'2026-10-20T11:02:00.000Z'});
assert.equal(state.customPrograms[0].entries[0].maxReps,12);
assert.equal(state.customPrograms[0].entries[1].reference,400);
state=Custom.schedule(state,'v374',{now:'2026-10-20T11:03:00.000Z'});
const prescribed=state.scheduledSessions[0].revisions.at(-1).context.prescription;
assert.equal(prescribed.plannedExercises[0].sets[0].maxReps,12);
assert.equal(prescribed.plannedExercises[1].sets[0].percentBasis,'training-max');
assert.deepEqual(Intent.prescription(prescribed),prescribed);
const restored=Core.normalizeState(JSON.parse(JSON.stringify(state)));
assert.equal(restored.customPrograms[0].entries[0].maxReps,12);
assert.equal(restored.scheduledSessions[0].revisions.at(-1).context.prescription.plannedExercises[1].sets[0].roundTo,5);
assert.throws(()=>Custom.build(state,{name:'Missing reference',weeks:1,startDate:'2026-11-02',unit:'lb',rows:[{...approved,reference:''}]}),/reference load/i);
assert.throws(()=>Custom.build(state,{name:'Conflicting load',weeks:1,startDate:'2026-11-02',unit:'lb',rows:[{...approved,weight:150}]}),/either a fixed load or a percentage/i);
console.log('v3.74 coach natural language, bulk editor, ranges, percent basis, kg fidelity and backup roundtrip passed');