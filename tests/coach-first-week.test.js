const assert=require('node:assert/strict');
const Profile=require('../src/product/programming-profile');
const Coach=require('../src/product/coach-conversation');
const Trends=require('../src/product/coach-performance-insights');
const Recap=require('../src/product/coach-evidence-brief');
const {phaseFixture}=require('./fixtures/phase-builder');
const original=phaseFixture().state,state=structuredClone(original),before=JSON.stringify(state);
const dayChange=Coach.answer(state,'Use Monday, Wednesday, and Friday as my training days',{asOf:'2026-10-18'});
assert.equal(dayChange.actions[0].kind,'profile-review');
assert.deepEqual(dayChange.actions[0].proposal.availableDays,[0,2,4]);
assert.equal(dayChange.actions[0].proposal.baseRevisionId,Profile.current(state.programmingProfiles).id);
assert.match(dayChange.text,/Nothing has changed/);
for(const invalid of ['Use Monday, Monday as my training days','Use Monday and not Friday as my training days','Use Monday or Friday as my training days']){
 assert(!Coach.answer(state,invalid,{asOf:'2026-10-18'})?.actions?.some(a=>a.kind==='profile-review'),invalid);
}
assert.equal(JSON.stringify(state),before,'Chat suggestions cannot persist training preferences');
for(const [query,field,expected] of [
 ['Set my equipment to barbell, plates, rack and bench','equipment',['barbell','bench','plates','rack']],
 ['Set my equipment to dumbbells and bench','equipment',['bench']],
 ['Set my session time to 75 minutes','sessionMinutes',75],
 ['Set my training priority to bench technique','priorities','bench technique']
]){const reply=Coach.answer(state,query,{asOf:'2026-10-18'});assert.equal(reply.actions[0].kind,'profile-review',query);assert.deepEqual(reply.actions[0].proposal.changes[field],expected);assert.equal(reply.actions[0].proposal.baseRevisionId,Profile.current(state.programmingProfiles).id);}
const mixed=Coach.answer(state,'Set my equipment to dumbbells and bench',{asOf:'2026-10-18'});
assert.deepEqual(mixed.actions[0].proposal.changes.accessoryEquipment,['dumbbells']);assert.match(mixed.text,/Nothing has changed/);
assert(!/Bench Press explanation/.test(mixed.text),'Preference requests cannot fall through to exercise descriptions');
const ambiguous=Coach.answer(state,'Set my equipment to dumbbells or barbells',{asOf:'2026-10-18'});
assert.match(ambiguous.text,/could not safely interpret/);assert.equal(ambiguous.actions.length,0);
for(const query of ['Set my equipment to barbells or dumbbells','Set my session time to 900 minutes','Set my equipment to everything'])assert(!Coach.answer(state,query,{asOf:'2026-10-18'})?.actions?.some(a=>a.kind==='profile-review'),query);
const recap=Recap.answer(state,'Summarize my training',{asOf:'2026-10-18'});
assert(recap.clarity.happened&&recap.clarity.meaning&&recap.clarity.next);
assert.equal(recap.actions[0].kind,recap.evidence[0].observed.sessions?'progress':'log-workout');
const trend=Trends.answer(state,'Why has my bench stalled?',{asOf:'2026-10-18'});
assert(trend,'A named competition-lift trend should return a bounded response');
if(trend.clarity){assert.match(trend.clarity.next,/Progress|Decisions/);assert.match(trend.text,/recorded|working sets/i);assert.equal(trend.actions[0].kind,'progress');}
assert.equal(JSON.stringify(state),before,'Read-only coaching must not change logged workouts');
console.log('Coach first-week: explicit profile review, honest evidence, short action summaries and immutability passed');
