const assert=require('assert');
const Controller=require('../src/product/cycle-adaptive-controller');

function baseReview({phase='strength',nextPhase='strength'}={}){
 return {cycleId:'c1',week:3,phase,nextPhase,nextWeek:4,asOf:'2026-09-27',
  eligibility:{squat:true,bench:false,deadlift:true},
  findings:{
   squat:{name:'Competition Squat',canReduceOne:true,canReduceLoad:true,canIncreaseLoad:false,belowCapHalf:0,competitionComparableRpeSets:4,competitionAboveCap:3,competitionBelowCapHalf:0,incrementKg:2.5,comparableRpeSets:4,aboveCap:3,reason:''},
   bench:{name:'Competition Bench',canReduceOne:false,canReduceLoad:false,canIncreaseLoad:false,belowCapHalf:0,competitionComparableRpeSets:3,competitionAboveCap:1,competitionBelowCapHalf:0,incrementKg:2.5,comparableRpeSets:3,aboveCap:1,reason:'At least two above-cap sets required.'},
   deadlift:{name:'Competition Deadlift',canReduceOne:true,canReduceLoad:true,canIncreaseLoad:true,belowCapHalf:3,competitionComparableRpeSets:4,competitionAboveCap:0,competitionBelowCapHalf:3,incrementKg:2.5,comparableRpeSets:4,aboveCap:0,reason:''}
  }};
}
const responseFor=(phase,values={squat:-3.5,bench:1.2,deadlift:2.4})=>({phases:[{phase,lifts:Object.fromEntries(Object.entries(values).map(([lift,observedChangePct])=>[lift,{observedChangePct}]))}]});

const strength=baseReview(),strengthResponse=responseFor('strength');
const r=Controller.recommendFromReports(strength,strengthResponse);
assert.strictEqual(r.choices.squat,'reduce-load');
assert.strictEqual(r.lifts.squat.signal,'effort-and-capacity-down');
assert.ok(r.lifts.squat.why.includes('one program load increment'));
assert.strictEqual(r.lifts.squat.incrementKg,2.5);
assert.strictEqual(r.choices.bench,'keep');
assert.strictEqual(r.lifts.bench.signal,'watch');
assert.strictEqual(r.choices.deadlift,'increase-load');
assert.strictEqual(r.lifts.deadlift.signal,'completed-below-cap-and-improving');
assert.strictEqual(r.lifts.deadlift.eligibleForLoadIncrease,true);
assert.strictEqual(r.phasePolicy.label,'Strength: protect specific loading');

const negativeIncrease={patterns:[{lift:'deadlift',action:'increase-load',observed:4,recorded:4,counts:{improved:1,stable:0,declined:3},medianCapacityChangePct:-1.4,evidence:'early-pattern'}]};
const guarded=Controller.recommendFromReports(strength,strengthResponse,negativeIncrease);
assert.strictEqual(guarded.choices.deadlift,'keep');
assert.strictEqual(guarded.lifts.deadlift.signal,'history-caution');
assert.strictEqual(guarded.lifts.deadlift.history.state,'negative');
assert.strictEqual(guarded.lifts.deadlift.history.changed,true);

const negativeReduction={patterns:[{lift:'squat',action:'reduce-load',observed:4,recorded:4,counts:{improved:1,stable:1,declined:2},medianCapacityChangePct:-1.3,evidence:'early-pattern'}]};
const reduced=Controller.recommendFromReports(strength,strengthResponse,negativeReduction);
assert.strictEqual(reduced.choices.squat,'reduce-load');
assert.strictEqual(reduced.lifts.squat.history.state,'negative');
assert.strictEqual(reduced.lifts.squat.confidence,'medium');

const supportive={patterns:[{lift:'deadlift',action:'increase-load',observed:4,recorded:4,counts:{improved:3,stable:1,declined:0},medianCapacityChangePct:1.7,evidence:'early-pattern'}]};
const supported=Controller.recommendFromReports(strength,strengthResponse,supportive);
assert.strictEqual(supported.choices.deadlift,'increase-load');
assert.strictEqual(supported.lifts.deadlift.history.state,'supportive');
assert.strictEqual(supported.version,3);
assert.strictEqual(Controller.POLICY,'cycle-adaptive-v5');

const noTrend=baseReview();
const n=Controller.recommendFromReports(noTrend,responseFor('strength',{squat:null,bench:null,deadlift:0}));
assert.strictEqual(n.choices.squat,'reduce-one');
assert.strictEqual(n.choices.deadlift,'keep');

// Accumulation uses a higher bar for optional upward loading than strength.
const accumulation=baseReview({phase:'accumulation',nextPhase:'accumulation'});
const acc=Controller.recommendFromReports(accumulation,responseFor('accumulation'));
assert.strictEqual(acc.choices.deadlift,'keep','Four comparable competition sets must not satisfy accumulation upward progression');
assert.strictEqual(acc.phasePolicy.thresholds.increaseCompetitionComparable,6);
accumulation.findings.deadlift.competitionComparableRpeSets=6;
accumulation.findings.deadlift.competitionBelowCapHalf=3;
const accStrong=Controller.recommendFromReports(accumulation,responseFor('accumulation'));
assert.strictEqual(accStrong.choices.deadlift,'increase-load');

// The planned accumulation → strength jump cannot receive an extra upward increment.
const transition=baseReview({phase:'accumulation',nextPhase:'strength'});
transition.findings.deadlift.competitionComparableRpeSets=8;
transition.findings.deadlift.competitionBelowCapHalf=5;
const transitionResult=Controller.recommendFromReports(transition,responseFor('accumulation',{squat:0,bench:0,deadlift:4}));
assert.strictEqual(transitionResult.choices.deadlift,'keep');
assert.equal(transitionResult.phasePolicy.allowedActions.includes('increase-load'),false);

// Strength → peak may review only a downward competition-load correction with stronger response evidence.
const intoPeak=baseReview({phase:'strength',nextPhase:'peaking'});
intoPeak.findings.squat.competitionComparableRpeSets=4;
intoPeak.findings.squat.competitionAboveCap=2;
intoPeak.findings.squat.reductionComparableRpeSets=4;
intoPeak.findings.squat.reductionAboveCap=2;
intoPeak.findings.squat.canReduceOne=false;
intoPeak.findings.squat.canIncreaseLoad=false;
intoPeak.findings.deadlift.canIncreaseLoad=false;
const peakTransition=Controller.recommendFromReports(intoPeak,responseFor('strength',{squat:-3.5,bench:0,deadlift:3}));
assert.strictEqual(peakTransition.choices.squat,'reduce-load');
assert.strictEqual(peakTransition.lifts.squat.signal,'strength-to-peak-caution');
assert.strictEqual(peakTransition.choices.deadlift,'keep');
assert.deepEqual(peakTransition.phasePolicy.allowedActions,['keep','reduce-load']);

// Inside the peak, repeated above-cap competition work can support one increment lower without inventing a trend.
const peak=baseReview({phase:'peaking',nextPhase:'peaking'});
peak.eligibility={squat:true,bench:false,deadlift:false};
peak.findings.squat={...peak.findings.squat,canReduceOne:false,canIncreaseLoad:false,canReduceLoad:true,competitionComparableRpeSets:2,competitionAboveCap:2,reductionComparableRpeSets:2,reductionAboveCap:2,comparableRpeSets:2,aboveCap:2};
const peakResult=Controller.recommendFromReports(peak,responseFor('peaking',{squat:null,bench:null,deadlift:null}),negativeReduction);
assert.strictEqual(peakResult.choices.squat,'reduce-load');
assert.strictEqual(peakResult.lifts.squat.signal,'peak-effort-above-plan');
assert.strictEqual(peakResult.lifts.squat.history.state,'not-applicable','Cross-phase learned action history must not steer peak corrections');

// Taper is protected rather than re-optimized from sparse taper evidence.
const taper=baseReview({phase:'peaking',nextPhase:'taper'});
const taperResult=Controller.recommendFromReports(taper,responseFor('peaking'));
assert(Object.values(taperResult.choices).every(x=>x==='keep'));
assert(Object.values(taperResult.lifts).every(x=>x.signal==='phase-guard'));
assert.match(taperResult.phasePolicy.label,/taper/i);

assert.ok(r.notes.some(x=>x.includes('Athlete approval')));
console.log('v2.65 phase-specific cycle adaptive controller tests passed');
