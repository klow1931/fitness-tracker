const assert=require('node:assert/strict');
const Long=require('../src/product/coach-longitudinal');
const Coach=require('../src/product/coach-conversation');
const Edits=require('../src/product/program-edit');
const Schedule=require('../src/product/schedule');
const Intent=require('../src/product/session-intent');
const Profile=require('../src/product/programming-profile');
const date='2026-10-06',known='2026-10-06T15:00:00.000Z',created='2026-10-05T10:00:00.000Z';
const raw={goal:'strength',experience:'intermediate',consistency:'consistent',
 availableDays:[0,2,4],sessionMinutes:75,equipment:['barbell','rack','plates','bench'],
 preferredExerciseIds:[],avoidedExerciseIds:[],priorities:'',notes:''};
const prescription=Intent.createPrescription([{name:'Squat',exerciseId:'s',type:'strength',sets:[{weight:100,reps:5,targetRpe:7}]},
 {name:'Cable row',exerciseId:'r',type:'strength',sets:[{weight:40,reps:10,targetRpe:7}]}],{type:'program'},created);
const target={name:'Dumbbell row',exerciseId:'d',type:'strength',loadConvention:'per-hand',restSeconds:120,sets:[{weight:15,reps:10,targetRpe:7}]};
const change={action:'replace',sourceId:'r',primaryAcknowledged:true,reason:'preference',notes:'Athlete prefers dumbbells',target};
let state={workouts:[],exerciseCatalog:[{id:'s',name:'Squat'},{id:'r',name:'Cable row'},{id:'d',name:'Dumbbell row'}],
 scheduledSessions:[],programmingProfiles:Profile.save([],raw,{id:'p',now:created})};
for(let i=1;i<=2;i++)state.scheduledSessions=Schedule.create(state.scheduledSessions,
 {date:'2026-10-0'+(6+i),name:'Session '+i,prescription},{id:'s'+i,now:created});
const original=JSON.stringify(state);
for(let i=1;i<=2;i++){
 const p=Edits.preview(state,'s'+i,change,{asOf:'2026-10-05'});
 state=Edits.approve(state,p,{asOf:'2026-10-05',confirmed:true,now:'2026-10-05T1'+i+':00:00.000Z'});
}
const before=JSON.stringify(state);
const query='What exercise swaps have I repeated?';
assert.equal(Long.intent(query),'choices');
assert.equal(Long.intent('What have I changed about my exercise edits?'),'choices');
assert.equal(Long.intent('What have I swapped repeatedly?'),'choices');
const report=Long.inspect(state,{asOf:date,now:known});
assert.equal(report.choices.edits,2);
assert.equal(report.choices.reasons.preference,2);
assert.equal(report.choices.pending.length,1);
assert.equal(report.choices.pending[0].name,'Cable row');
assert.equal(report.choices.pending[0].count,2);
assert.equal(report.choices.excluded,0);
assert.match(Long.explain(report,'choices'),/2 distinct edited sessions/);
assert.match(Long.explain(report,'choices'),/never a saved exclusion until you explicitly confirm/i);
const answer=Coach.answer(state,query,{asOf:date,now:known});
assert.equal(answer.intent.kind,'choices');
assert.equal(answer.readOnly,true);
assert.match(answer.text,/Cable row/);
assert.equal(JSON.stringify(state),before,'Coach cannot modify saved athlete data');
const early=Long.inspect(state,{asOf:'2026-10-05',now:'2026-10-05T11:30:00.000Z'});
assert.equal(early.choices.edits,1);
assert.equal(early.choices.pending.length,0,'Future same-day edit must not establish a repeated preference');
const later=Edits.acceptAvoided(state,'r',{asOf:date,confirmed:true,now:'2026-10-07T10:00:00.000Z'});
assert.equal(Long.inspect(later,{asOf:date,now:known}).choices.excluded,0,'Future profile acceptance cannot leak into historical answer');
const confirmed=Long.inspect(later,{asOf:'2026-10-08',now:'2026-10-08T12:00:00.000Z'});
assert.equal(confirmed.choices.excluded,1);
assert.equal(confirmed.choices.pending.length,0,'Confirmed exclusion is no longer pending');
assert.match(Long.explain(confirmed,'choices'),/1 excluded exercise/);
const none=Long.answer({scheduledSessions:[],workouts:[],programmingProfiles:[],exerciseCatalog:[]},query,{asOf:date,now:known});
assert.match(none.text,/0 athlete-authored exercise edit/);
assert.match(none.text,/no confirmed training setup/i);
for(const q of ['My shoulder hurts','Set new training loads','Create a program','Why did my bench stall?'])assert.equal(Long.intent(q),null,'Do not intercept other domains: '+q);
assert.equal(JSON.stringify(state),before);
assert.notEqual(JSON.stringify(state),original);
console.log('v3.83 exact edits, confirmed-vs-suggested, temporal cutoffs and read-only routing passed');
