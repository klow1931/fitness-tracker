const assert=require('assert');
const Controller=require('../src/product/cycle-adaptive-controller');

function baseReview(){
 return {cycleId:'c1',week:3,phase:'strength',nextPhase:'strength',nextWeek:4,asOf:'2026-09-27',
  eligibility:{squat:true,bench:false,deadlift:true},
  findings:{
   squat:{name:'Competition Squat',canReduceOne:true,canReduceLoad:true,incrementKg:2.5,comparableRpeSets:4,aboveCap:3,reason:''},
   bench:{name:'Competition Bench',canReduceOne:false,canReduceLoad:false,incrementKg:2.5,comparableRpeSets:3,aboveCap:1,reason:'At least two above-cap sets required.'},
   deadlift:{name:'Competition Deadlift',canReduceOne:true,canReduceLoad:true,incrementKg:2.5,comparableRpeSets:4,aboveCap:0,reason:''}
  }};
}
const response={phases:[{phase:'strength',lifts:{
 squat:{observedChangePct:-3.5},bench:{observedChangePct:1.2},deadlift:{observedChangePct:2.4}
}}]};
const r=Controller.recommendFromReports(baseReview(),response);
assert.strictEqual(r.choices.squat,'reduce-load');
assert.strictEqual(r.lifts.squat.signal,'effort-and-capacity-down');
assert.ok(r.lifts.squat.why.includes('one program load increment'));
assert.strictEqual(r.lifts.squat.incrementKg,2.5);
assert.strictEqual(r.choices.bench,'keep');
assert.strictEqual(r.lifts.bench.signal,'watch');
assert.strictEqual(r.choices.deadlift,'keep');
assert.strictEqual(r.lifts.deadlift.signal,'within-plan');

const noTrend=baseReview();const n=Controller.recommendFromReports(noTrend,{phases:[{phase:'strength',lifts:{squat:{observedChangePct:null},bench:{},deadlift:{}}}]});assert.strictEqual(n.choices.squat,'reduce-one');

const peak=baseReview();peak.nextPhase='peak';peak.eligibility.squat=false;peak.findings.squat.canReduceOne=false;peak.findings.squat.canReduceLoad=false;peak.findings.squat.reason='Peak stays unchanged.';
const p=Controller.recommendFromReports(peak,response);
assert.strictEqual(p.choices.squat,'keep');
assert.strictEqual(p.lifts.squat.signal,'phase-guard');
assert.ok(p.notes.some(x=>x.includes('Athlete approval')));
console.log('cycle adaptive controller tests passed');
