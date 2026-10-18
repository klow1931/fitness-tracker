const assert=require('node:assert/strict');
const Phase=require('../src/product/phase-builder');
const Profile=require('../src/product/programming-profile');
const Long=require('../src/product/coach-longitudinal');
const Coach=require('../src/product/coach-conversation');
const Learning=require('../src/product/adaptive-outcome-learning');
const UI=require('../src/product/coach-longitudinal-ui');
const {phaseFixture}=require('./fixtures/phase-builder');
const {state:initial,config}=phaseFixture();
const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let state=Phase.save(initial,Phase.prepare(initial,config,args),{confirmed:true},{...args,id:'phase5'});
state=Phase.schedule(state,'phase5',{...args,now:'2026-09-24T13:00:00.000Z'});
const date='2026-09-28',now='2026-09-28T18:00:00.000Z',before=JSON.stringify(state);
const report=Long.inspect(state,{asOf:date,now});
assert.equal(report.program.id,'phase5');
assert.equal(report.program.name,'Phased strength');
assert.equal(report.program.week,1);
assert.equal(report.program.phase,'Accumulation');
assert.equal(report.setup.status,'confirmed');
assert.equal(report.setup.experience,'intermediate');
assert(report.setup.preferredMovements.includes('Safety Bar Squat'));
assert.equal(report.nextAction.kind,'start-workout');
assert.equal(report.nextSession.date,date);
assert.equal(report.readOnly,true);
assert.equal(report.learning.recorded,0);
assert.deepEqual(report.unavailable,[]);
assert.match(Long.explain(report,'journey'),/week 1 of 7/i);
assert.match(Long.explain(report,'next'),/saved session alone does not authorize a new dose/i);
assert.match(Long.explain(report,'memory'),/confirmed saved preferences, not memories inferred from chat/i);
assert.match(Long.explain(report,'memory'),/Monday, Tuesday, Wednesday/);
assert.doesNotMatch(Long.explain(report,'memory'),/Mon=0|0, 2, 4/);
assert.match(Long.explain(report,'outcomes'),/No eligible approved adaptation/i);
for(const [q,kind] of [
 ['Where am I in my program?','journey'],
 ['What phase am I in?','journey'],
 ['How far am I in my training cycle?','journey'],
 ['What comes after this phase?','journey'],
 ['Where is my training heading?','journey'],
 ['What have we learned from my program changes?','outcomes'],
 ['How did my training changes work?','outcomes'],
 ['Have my past adjustments helped?','outcomes'],
 ['What do you remember about my training?','memory'],
 ['What has Loadnote saved about my training preferences?','memory'],
 ['What are my saved coaching preferences?','memory'],
 ['Should my next workout adapt?','next'],
 ['What changes are proposed for my next workout?','next'],
 ['What does my last workout mean for the next?','next'],
 ['What is the next reviewed coaching action?','next']
]){assert.equal(Long.intent(q),kind,q);const response=Long.answer(state,q,{asOf:date,now});assert.equal(response.intent.kind,kind,q);assert.equal(response.readOnly,true);assert.equal(response.evidence[0].knownAt,now);}
for(const q of ['My knee hurts','What is my bench training max?','Change my training automatically','Build a program','Why did my deadlift stall?','Hello','Use my injury history','Adjust 120 kg to 140 kg','Cancel the workout'])assert.equal(Long.intent(q),null,'No guessing or interception: '+q);
const result=Coach.answer(state,'Should my next workout adapt?',{asOf:date,now});
assert.equal(result.clarity.next,report.nextAction.label);
assert.equal(result.source,'Offline Coach · longitudinal training');
assert.equal(result.actions[0].kind,'lifecycle');
assert.match(result.text,/existing review and athlete approval/i);
const futureProfile=Profile.save(state.programmingProfiles,{...state.programmingProfiles[0].context,experience:'advanced',availableDays:[1,3,5],notes:'Private'},{now:'2026-10-01T12:00:00.000Z',id:'future-profile'});
const later={...state,programmingProfiles:futureProfile,workouts:[...state.workouts,{id:'future-only',date:'2026-11-20',createdAt:'2026-11-20T20:00:00.000Z',exercises:[]}]};
const oldReport=Long.inspect(later,{asOf:date,now});
assert.deepEqual(oldReport,report,'Future workout and later saved preferences cannot change a retrospective coach answer');
assert.equal(JSON.stringify(state),before,'All Phase 5 queries must be read only');
const expired=Long.inspect(initial,{asOf:'2026-09-22',now:'2026-09-22T23:00:00.000Z'});
assert.equal(expired.setup.status,'unconfirmed','No saved preference memory before its recorded date');
assert.equal(expired.program,null,'No phantom program');
assert.match(Long.explain(expired,'memory'),/no confirmed saved/i);
const conflict={...report,conflicts:[{id:'p1'},{id:'p2'}],program:null};
assert.match(Long.explain(conflict,'next'),/Multiple programs overlap/);
const observed=Learning.summarize([
 {lift:'squat',action:'reduce-load',status:'observed',capacityChangePct:2,outcomeClass:'improved'},
 {lift:'squat',action:'reduce-load',status:'observed',capacityChangePct:2,outcomeClass:'improved'},
 {lift:'squat',action:'reduce-load',status:'observed',capacityChangePct:-1.5,outcomeClass:'declined'},
 {lift:'squat',action:'reduce-load',status:'unobserved',capacityChangePct:null,outcomeClass:'unobserved'},
 {lift:'bench',action:'progress',status:'observed',capacityChangePct:4,outcomeClass:'improved'}
]);
assert.equal(observed.patterns.find(p=>p.lift==='squat').evidence,'early-pattern');
const explain=Long.explain({...report,learning:observed},'outcomes');
assert.match(explain,/2 improved \/ 0 stable \/ 1 declined/);
assert.match(explain,/not proof/i);
assert.doesNotMatch(explain,/increase (?:the|your) load/i);
const markup=UI.markup({...report,program:{...report.program,name:'<img src=x onerror=alert(1)>'}});
assert(markup.includes('&lt;img src=x onerror=alert(1)&gt;'),'UI must escape source labels');
assert(!markup.includes('<img src=x'));
assert.equal(UI.markup(null),'');
assert.throws(()=>Long.inspect(state,{asOf:'invalid',now}),/valid dated/i);
assert.throws(()=>Long.inspect(state,{asOf:date,now:'invalid'}),/valid dated/i);
console.log('Phase 5: 30+ longitudinal context, observed learning, confirmed preferences, review routing, historic cutoffs, XSS and nonmutation assertions passed');
