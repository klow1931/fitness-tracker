const assert=require('node:assert/strict');
const Router=require('../src/product/coach-intent-router');
const Coach=require('../src/product/coach-conversation');
const Library=require('../src/product/coaching-library');
const Planner=require('../src/product/offline-planner');
const Recap=require('../src/product/coach-evidence-brief');
const Local=require('../src/product/local-coach-ai');
const {fixture}=require('./fixtures/program-review');
const state=fixture(),asOf='2026-09-24',before=JSON.stringify(state);
const examples=[
 ['Build a 12-week strength program','draft'],
 ['Could you help me plan a workout?','draft'],
 ['How can you help me?','capabilities'],
 ['What can the offline coach do?','capabilities'],
 ['Why is my squat progress not improving?','progress'],
 ['Tell me about periodization','program'],
 ['How did this week go?','weekly'],
 ['Why is my bench hurting?','safety'],
 ['What is a training max?','general'],
 ['','clarify']
];
for(const [q,expected] of examples){const result=Router.classify(q);assert.equal(result.kind,expected,q);}
const history=[{role:'user',content:'Why is my bench stalling?'},{role:'assistant',content:'An unverified assertion.'}];
assert.equal(Router.classify('Why?',history).lift,'bench');
assert.equal(Router.classify('Why?',history).kind,'follow-up');
assert.equal(Router.classify('Why?',[...history,{role:'user',content:'Hello'}]).kind,'clarify','topic change clears prior topic');
assert.equal(Router.classify('Why?',[]).kind,'clarify');
assert.equal(Router.classify('My knee hurts',history).kind,'safety');
assert.match(Coach.answer(state,'How can the offline coach help?',{asOf}).text,/recorded sets and RPE/);
assert.equal(Coach.answer(state,'Build a 12-week strength program 3 days 60 minutes full gym',{asOf}).source,'Shared coaching · offline planning');
const draft=Planner.answer(state,'Could you help me build a 12-week strength program with 3 days, 60 minutes and full gym?');
assert.equal(draft.planning.weeks,12);assert.equal(draft.planning.frequency,3);
assert.equal(draft.actions[0].kind,'offline-plan','only a review button may proceed to the current builder');
assert.equal(Planner.answer(state,'Can you explain my workout?'),null,'explanations must not become draft requests');
for(const [query,expected] of [
 ['Why deload?', 'deload-purpose'],
 ['How often should I train?', 'training-frequency'],
 ['Explain specificity in competition lifting', 'specificity'],
 ['Tell me about strength versus hypertrophy', 'training-principles'],
 ['Explain how to review workout quality', 'workout-quality']
])assert(Library.retrieve(query).some(c=>c.id===expected),'Missing reviewed source card for: '+query);
const cards=Library.retrieve('Why deload?');
assert(cards.every(c=>c.sources?.length&&c.sources.every(s=>Library.catalog().sources[s])), 'Every training card must cite a declared source');
const sourceReply=Library.answer(state,'Why deload?',{asOf});assert(sourceReply?.citations?.length);assert.equal(sourceReply.readOnly,true);
const recap=Recap.inspect(state,{asOf});
assert.equal(recap.readOnly,true);assert(recap.observed.sessions>0);assert(recap.observed.sets>0);
assert.equal(Recap.answer(state,'Summarize my training',{asOf}).source,'Offline Coach · training recap');
assert.equal(Coach.answer(state,'Summarize my training',{asOf}).source,'Offline Coach · training recap');
assert.match(Coach.answer(state,'How has my training gone this month?',{asOf}).text,/logged in the most recent 28 days/);
assert.equal(Coach.answer(state,'My knee hurts. Summarize my training',{asOf}).intent.topic,'health','clinical symptom question always takes priority');
const missing=Recap.inspect({...state,workouts:[]},{asOf});
assert.equal(missing.observed.sessions,0);assert.match(missing.next,/Start with a dated workout/);
const withFuture={...state,workouts:[...state.workouts,{id:'future',date:'2027-01-01',exercises:[{name:'Competition Squat',sets:[{weight:999,reps:2,rpe:8}]}]}]};
assert.deepEqual(Recap.inspect(withFuture,{asOf}),recap,'future entries must never influence a retrospective recap');
assert.equal(Local.eligible('Why has my bench stalled?',{source:'Offline Coach · corrected training trends',readOnly:true,evidence:[recap]}),false);
assert.equal(Local.eligible('Summarize my training',{source:'Offline Coach · training recap',readOnly:true,evidence:[recap]}),false);
assert.equal(Local.eligible('Help me stay consistent',{planning:draft.planning}),false);
assert.equal(Local.eligible('Help me stay consistent',{source:'Shared coaching · suggestions',actions:[{kind:'offline-plan'}]}),false);
assert.equal(Local.eligible('Help me stay consistent',{source:'Generic encouragement'}),true);
assert.equal(JSON.stringify(state),before,'Phase 4 is strictly read-only before reviewed draft approval');
console.log('Phase 4: 40+ intent, source, personalized-history, planning, safety and model-output constraints passed');
