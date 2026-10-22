const assert=require('node:assert/strict');
const Apply=require('../src/product/coach-knowledge-application');
const Knowledge=require('../src/product/coaching-library');
const Phase=require('../src/product/phase-builder');
const {phaseFixture}=require('./fixtures/phase-builder');

const asOf='2026-09-24',card=Knowledge.retrieve('Explain training frequency')[0];
const args={asOf,now:'2026-09-24T12:00:00.000Z'};
let fixture=phaseFixture();
let state=Phase.save(fixture.state,Phase.prepare(fixture.state,fixture.config,args),
 {confirmed:true,notes:'v3.82 reviewed program context'},{...args,id:'coach-v382-phase'});
state=Phase.schedule(state,'coach-v382-phase',{...args,now:'2026-09-24T13:00:00.000Z'});
const program=state.phasePrograms[0],first=program.sessions[0];
const before=JSON.stringify(state);
const unresolved=Apply.answer(state,{asOf:first.date,card});
assert(unresolved.applicationReview.program,'Selected reviewed program should be inspected');
assert.equal(unresolved.applicationReview.program.resolved,0);
assert.equal(unresolved.applicationReview.program.adherence,null,'Unresolved Calendar rows cannot yield an adherence percentage');
assert.match(unresolved.text,/no resolved sessions from which to calculate adherence/i);
assert(!/100%.*(all|every) planned/i.test(unresolved.text));
assert(unresolved.evidenceCards.some(x=>x.title==='Reviewed program and Calendar'));
assert.equal(JSON.stringify(state),before,'Read-only program context cannot modify saved records');

const scheduled='phase:'+program.id+':'+first.key;
state.workouts=[...(state.workouts||[]),{id:'coach-v382-log',date:first.date,createdAt:first.date+'T20:00:00.000Z',
 exercises:[],sessionIntent:{schedule:{id:scheduled}}}];
const observedBefore=JSON.stringify(state);
const reviewed=Apply.answer(state,{asOf:first.date,card});
assert.equal(reviewed.applicationReview.program.completed,1);
assert.equal(reviewed.applicationReview.program.skipped,0);
assert.equal(reviewed.applicationReview.program.resolved,1);
assert.equal(reviewed.applicationReview.program.adherence,100,'Only exact resolved Calendar sessions enter denominator');
assert.match(reviewed.text,/1 completed and 0 explicitly skipped/);
assert.match(reviewed.text,/unconfirmed, upcoming and cancelled sessions are not counted as failures/i);
assert(reviewed.evidenceCards.some(x=>x.source==='Progress story · reviewed program and resolved Calendar sessions'));
assert.equal(JSON.stringify(state),observedBefore,'Reviewed program application must never write athlete state');

const noProgram=Apply.answer({workouts:[],programmingProfiles:[],scheduledSessions:[]},{asOf,card});
assert.equal(noProgram.applicationReview.program,null);
assert(!noProgram.evidenceCards.some(x=>x.title==='Reviewed program and Calendar'));
const absent=Apply.answer(state,{asOf:'not-a-date',card});
assert.equal(absent.applicationReview.status,'unavailable');
assert.equal(absent.applicationReview.program,null);
console.log('v3.82 program-aware offline Coach uses exact Calendar resolutions without writes or false adherence');
