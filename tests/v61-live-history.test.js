'use strict';
const assert=require('node:assert/strict');
const Bridge=require('../src/product/coach-live-history');
const Coach=require('../src/product/coach-conversation');
const Companion=require('../src/product/coach-companion');
const date='2026-11-01';
const state={
 exerciseCatalog:[{id:'bench',name:'Competition Bench',aliases:['Comp Bench']},{id:'row',name:'Chest-supported Row'}],
 exerciseRoles:[],workoutRevisions:[],workouts:[
  {id:'old',date:'2026-10-01',exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[{weight:95,reps:5,rpe:null,done:true}]}]},
  {id:'previous',date:'2026-10-24',exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[
   {weight:100,reps:5,rpe:8,done:true},{weight:100,reps:4,rpe:null},
   {weight:120,reps:1,rpe:10,done:false},{weight:40,reps:10,warmup:true}
  ]}]},
  {id:'today',date:'2026-11-01',exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[{weight:999,reps:5,rpe:10,done:true}]}]},
  {id:'future',date:'2026-11-05',exercises:[{exerciseId:'bench',name:'Competition Bench',sets:[{weight:1000,reps:5,rpe:10,done:true}]}]}
 ]
};
const original=JSON.stringify(state);
const workout={active:true,date,currentExercise:{name:'Competition Bench',index:0,count:1,set:{index:1,count:2}},exercises:[{name:'Competition Bench',completedSets:1,totalSets:2}],lastCheckedSet:{exerciseName:'Competition Bench',index:0,count:2,displayWeight:225,displayUnit:'lb',reps:5,rpe:8.5},checkedStrengthSets:1,missingRpeSets:0};
const live=Companion.buildContext({surface:'train',workout});
const reply=(q,st=state,ctx=live,extra={})=>Coach.answer(st,q,{asOf:date,unit:'lb',live:ctx,...extra});
for(const q of ['How did I do last time?','What did I lift last time?','Compare this exercise to last time','How did I do last time on this lift?','Show my last recorded sets for this exercise'])assert.equal(Bridge.wants(q),true,q);
for(const q of ['How did my competition bench change over my last workouts?','Review my last checked set','Any RPE missing?','Why did Decisions change the load?','How did my last set go?','Build a plan','I have pain'])assert.equal(Bridge.wants(q),false,q);
let r=reply('How did I do last time?');
assert.equal(r.readOnly,true);assert.equal(r.liveSavedHistoryBridge,true);assert.equal(r.source,'Shared coaching · last saved exercise session');
assert.match(r.text,/Competition Bench/);assert.match(r.text,/2026-10-24/);
assert.match(r.text,/5 reps × 220\.5 lb · RPE 8/);assert.match(r.text,/4 reps × 220\.5 lb · RPE unknown/);
assert.match(r.text,/1 explicitly marked, 1 not marked/);assert.match(r.text,/2 excluded/);
assert.match(r.text,/unsaved draft.*5 reps × 225 lb · RPE 8\.5/);
assert.match(r.text,/not establish progress/);assert.doesNotMatch(r.text,/999|1000|RPE 0|120 kg/);
assert.equal(r.evidence[0].date,'2026-10-24');assert.equal(r.evidence[0].cutoff,'2026-10-31');
assert(r.actions.some(x=>x.kind==='current-workout'));
r=reply('What did I lift last time?',state,live,{unit:'kg'});
assert.match(r.text,/100 kg/);assert.match(r.text,/225 lb/,'Unconverted entered draft weight retains explicit lb label');
const renamed=Companion.buildContext({surface:'train',workout:{...workout,currentExercise:{name:'Comp Bench',set:{index:0,count:2}},lastCheckedSet:null}});
r=reply('How did I do last time?',state,renamed);assert.match(r.text,/2026-10-24/);
const afterAll=Companion.buildContext({surface:'train',workout:{...workout,currentExercise:null}});
r=reply('How did I do last time?',state,afterAll);assert.match(r.text,/2026-10-24/);
const none={...state,workouts:[]};r=reply('How did I do last time?',none);assert.match(r.text,/No earlier saved working sets/);
const ambiguous={...state,exerciseCatalog:[...state.exerciseCatalog,{id:'other',name:'Comp Bench'}]};
r=reply('How did I do last time?',ambiguous,renamed);assert.match(r.text,/More than one saved exercise matches|aliases overlap/);
const unregistered=Companion.buildContext({surface:'train',workout:{...workout,currentExercise:{name:'Mystery Bench'},lastCheckedSet:null}});
r=reply('How did I do last time?',state,unregistered);assert.match(r.text,/could not match Mystery Bench/);
r=reply('How did I do last time?',state,live,{asOf:'2026-11-03'});assert.match(r.text,/date does not match/);
assert.equal(Bridge.answer(state,'How did I do last time?',{asOf:date,live:null}),null);
r=reply('How did I do last time? My shoulder hurts');assert.match(r.text,/cannot diagnose/);
assert.equal(JSON.stringify(state),original,'Saved history is never mutated by live comparison');
console.log('v6.1 live last-session context: exact identity, corrected history, cutoff, kg/lb, aliases, no writes and safety passed');
