'use strict';
const assert=require('node:assert/strict');
const Coach=require('../src/product/coach-conversation');
const Companion=require('../src/product/coach-companion');
const Review=require('../src/product/coach-set-review');
const {fixture}=require('./fixtures/program-review');
const date='2026-11-01';
const athlete=fixture(),snapshot=JSON.stringify(athlete);
const live=Companion.buildContext({
 surface:'train',
 workout:{
  active:true,date,name:'Bench session',
  currentExercise:{name:'Competition Bench',index:0,count:1,set:{index:1,count:2,weightKg:100,displayWeight:220.46,displayUnit:'lb',reps:5,rpe:null}},
  exercises:[{name:'Competition Bench',completedSets:1,totalSets:2}],
  checkedStrengthSets:1,missingRpeSets:1,
  lastCheckedSet:{exerciseName:'Competition Bench',index:0,count:2,displayWeight:225,displayUnit:'lb',reps:5,rpe:null}
 }
});
const ask=(question,ctx=live,asOf=date)=>Coach.answer(athlete,question,{asOf,unit:'lb',live:ctx});
for(const q of ['Review my last checked set','What did I log for my last set?','How did my last set go?'])assert.equal(Review.intent(q),'last',q);
for(const q of ['Any RPE missing?','Which checked sets need RPE?','Did I log my RPE?'])assert.equal(Review.intent(q),'rpe',q);
for(const q of ['What was my last workout?','What was my previous bench session?','How many sets are left?','Why did the plan change?','Increase my next set'])assert.equal(Review.intent(q),null,'Must not steal an existing Coach route');
let r=ask('Review my last checked set');
assert.equal(r.readOnly,true);assert.equal(r.liveDraftReview,true);
assert.match(r.text,/Competition Bench, set 1 of 2/);
assert.match(r.text,/225 lb/);assert.match(r.text,/5 reps/);
assert.match(r.text,/RPE not entered/);
assert.match(r.text,/not saved history/);
assert.doesNotMatch(r.text,/220\.46|100 kg/,'Never mix storage and display units');
assert(r.actions.some(a=>a.kind==='current-workout'));
r=ask('Any RPE missing?');assert.match(r.text,/1 of 1 checked strength set is missing/);
const recorded=Companion.buildContext({...{surface:'train'},workout:{...live.liveWorkout,lastCheckedSet:{...live.liveWorkout.lastCheckedSet,rpe:8.5},missingRpeSets:0}});
r=ask('Review my last checked set',recorded);assert.match(r.text,/RPE 8\.5/);
r=ask('Did I log my RPE?',recorded);assert.match(r.text,/All 1 checked strength set has an entered RPE/);
const blank=Companion.buildContext({surface:'train',workout:{...live.liveWorkout,lastCheckedSet:null,checkedStrengthSets:0,missingRpeSets:0}});
assert.match(ask('Review my last checked set',blank).text,/No strength set is checked/);
assert.match(ask('Any RPE missing?',blank).text,/No strength sets are checked/);
assert.match(ask('Any RPE missing?',null).text,/no open strength workout draft/i);
assert.match(ask('Review my last checked set',live,'2026-11-02').text,/not the date being reviewed/);
const incomplete=Companion.buildContext({surface:'train',workout:{...live.liveWorkout,lastCheckedSet:{...live.liveWorkout.lastCheckedSet,reps:null,displayWeight:null}}});
assert.match(ask('Review my last checked set',incomplete).text,/Load or reps\/duration may be missing/);
const inconsistent=Companion.buildContext({surface:'train',workout:{...live.liveWorkout,missingRpeSets:10}});
assert.match(ask('Any RPE missing?',inconsistent).text,/not verifiable/);
assert.match(ask('My knee hurts and I missed RPE').text,/cannot diagnose/i,'Safety still outranks set recap');
assert.equal(JSON.stringify(athlete),snapshot,'Read-only draft coaching must not change saved training state');
// The WebKit workflow command is insufficient if the Playwright project
// silently excludes this spec through its own testMatch allowlist.
const fs=require('node:fs'),path=require('node:path');
const config=fs.readFileSync(path.join(__dirname,'../playwright.config.js'),'utf8');
const webkitMatch=config.match(/name:'mobile-webkit',testMatch:\[([^\]]+)\]/);
assert(webkitMatch&&webkitMatch[1].includes("'v60-live-set-review.spec.js'"),'The iPhone WebKit project must actually match the v6.0 Coach acceptance spec');
const ci=fs.readFileSync(path.join(__dirname,'../.github/workflows/test.yml'),'utf8');
assert(/npx playwright test [^\n]*tests\\/browser\\/v60-live-set-review\\.spec\\.js/.test(ci),'CI must execute the v6.0 Coach acceptance spec on WebKit');
console.log('v6.0 live checked-set recap, RPE coverage, stale date, safe units, safety and immutable history passed');
