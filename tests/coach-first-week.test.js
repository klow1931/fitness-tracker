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
const recap=Recap.answer(state,'Summarize my training',{asOf:'2026-10-18'});
assert(recap.clarity.happened&&recap.clarity.meaning&&recap.clarity.next);
const trend=Trends.answer(state,'Why has my bench stalled?',{asOf:'2026-10-18'});
assert(trend,'A named competition-lift trend should return a bounded response');
if(trend.clarity){assert.match(trend.clarity.next,/Progress|Decisions/);assert.match(trend.text,/recorded|working sets/i);}
assert.equal(JSON.stringify(state),before,'Read-only coaching must not change logged workouts');
console.log('Coach first-week: explicit profile review, honest evidence, short action summaries and immutability passed');
