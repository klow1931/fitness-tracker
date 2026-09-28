const assert=require('assert');
const Controller=require('../src/product/cycle-adaptive-controller');

function baseReview(){
 return {cycleId:'c1',week:3,phase:'strength',nextPhase:'strength',nextWeek:4,asOf:'2026-09-27',
  eligibility:{squat:true,bench:false,deadlift:true},
  findings:{
   squat:{name:'Competition Squat',canReduceOne:true,canReduceLoad:true,canIncreaseLoad:false,belowCapHalf:0,competitionComparableRpeSets:4,competitionAboveCap:3,competitionBelowCapHalf:0,incrementKg:2.5,comparableRpeSets:4,aboveCap:3,reason:''},
   bench:{name:'Competition Bench',canReduceOne:false,canReduceLoad:false,canIncreaseLoad:false,belowCapHalf:0,competitionComparableRpeSets:3,competitionAboveCap:1,competitionBelowCapHalf:0,incrementKg:2.5,comparableRpeSets:3,aboveCap:1,reason:'At least two above-cap sets required.'},
   deadlift:{name:'Competition Deadlift',canReduceOne:true,canReduceLoad:true,canIncreaseLoad:true,belowCapHalf:3,competitionComparableRpeSets:4,competitionAboveCap:0,competitionBelowCapHalf:3,incrementKg:2.5,comparableRpeSets:4,aboveCap:0,reason:''}
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
assert.strictEqual(r.choices.deadlift,'increase-load');
assert.strictEqual(r.lifts.deadlift.signal,'completed-below-cap-and-improving');
assert.strictEqual(r.lifts.deadlift.eligibleForLoadIncrease,true);


const negativeIncrease={patterns:[{lift:'deadlift',action:'increase-load',observed:4,recorded:4,counts:{improved:1,stable:0,declined:3},medianCapacityChangePct:-1.4,evidence:'early-pattern'}]};
const guarded=Controller.recommendFromReports(baseReview(),response,negativeIncrease);
assert.strictEqual(guarded.choices.deadlift,'keep');
assert.strictEqual(guarded.lifts.deadlift.signal,'history-caution');
assert.strictEqual(guarded.lifts.deadlift.history.state,'negative');
assert.strictEqual(guarded.lifts.deadlift.history.changed,true);

const negativeReduction={patterns:[{lift:'squat',action:'reduce-load',observed:4,recorded:4,counts:{improved:1,stable:1,declined:2},medianCapacityChangePct:-1.3,evidence:'early-pattern'}]};
const reduced=Controller.recommendFromReports(baseReview(),response,negativeReduction);
assert.strictEqual(reduced.choices.squat,'reduce-load');
assert.strictEqual(reduced.lifts.squat.history.state,'negative');
assert.strictEqual(reduced.lifts.squat.confidence,'medium');

const supportive={patterns:[{lift:'deadlift',action:'increase-load',observed:4,recorded:4,counts:{improved:3,stable:1,declined:0},medianCapacityChangePct:1.7,evidence:'early-pattern'}]};
const supported=Controller.recommendFromReports(baseReview(),response,supportive);
assert.strictEqual(supported.choices.deadlift,'increase-load');
assert.strictEqual(supported.lifts.deadlift.history.state,'supportive');
assert.strictEqual(supported.version,2);
assert.strictEqual(Controller.POLICY,'cycle-adaptive-v4');

const noTrend=baseReview();const n=Controller.recommendFromReports(noTrend,{phases:[{phase:'strength',lifts:{squat:{observedChangePct:null},bench:{},deadlift:{observedChangePct:0}}}]});assert.strictEqual(n.choices.squat,'reduce-one');assert.strictEqual(n.choices.deadlift,'keep');

const peak=baseReview();peak.nextPhase='peak';peak.eligibility.squat=false;peak.findings.squat.canReduceOne=false;peak.findings.squat.canReduceLoad=false;peak.findings.squat.canIncreaseLoad=false;peak.findings.squat.reason='Peak stays unchanged.';
const p=Controller.recommendFromReports(peak,response);
assert.strictEqual(p.choices.squat,'keep');
assert.strictEqual(p.lifts.squat.signal,'phase-guard');
assert.ok(p.notes.some(x=>x.includes('Athlete approval')));
console.log('cycle adaptive controller tests passed');
