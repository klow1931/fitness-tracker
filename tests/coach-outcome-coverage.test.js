const assert=require('node:assert/strict');
const Review=require('../src/product/coach-outcome-review');
const Coach=require('../src/product/coach-conversation');
const PhaseReview=require('../src/product/phase-review');
const {fixture,args}=require('./fixtures/phase-review');
const {fixture:emptyFixture}=require('./fixtures/program-review');

const sample={lift:'squat',status:'unobserved',capacityChangePct:null,baseline:{capacityKg:120},followup:{capacityKg:125}};
const examples=[
 [{status:'observed',capacityChangePct:3,baseline:{},followup:{}},'observed'],
 [{...sample,baseline:{expected:3,matched:1,capacityKg:120}},'baseline-incomplete'],
 [{...sample,followup:{expected:3,matched:2,capacityKg:120}},'followup-incomplete'],
 [{...sample,baseline:{capacityKg:null}},'baseline-estimate-missing'],
 [{...sample,followup:{capacityKg:null}},'followup-estimate-missing'],
 [sample,'comparison-unavailable']
];
for(const [row,expected] of examples)assert.equal(Review.classifyEvidence(row),expected,expected);
const overview=Review.coverageOf(examples.map(([row])=>row));
assert.equal(overview.recorded,6);
assert.equal(overview.observed,1);
assert.equal(overview.unobserved,5);
assert.equal(overview.missing.length,5);
assert.equal(overview.latest.reason,'observed');

const q='Why are my approved squat adjustments missing comparable evidence?';
assert.deepEqual(Review.intent(q),{kind:'coverage',lifts:['squat'],action:null});
assert.equal(Review.intent('Why are my approved bench changes unobserved?').kind,'coverage');
assert.equal(Review.intent('How did my bench training change across my last three workouts?'),null);
assert.equal(Review.intent('My shoulder hurts after an approved squat adjustment with missing RPE'),null);
assert.equal(Review.intent('Why is my imported squat plan missing exercises?'),null);
assert.equal(Review.intent('Should I change my squat load today?'),null);

let state=fixture(),analysis=PhaseReview.analyze(state,args);
state=PhaseReview.apply(state,analysis,{squat:'reduce-load',bench:'keep',deadlift:'keep'},
 {confirmed:true,asOf:args.asOf,now:args.now,id:'v384-approved'});
const asOf='2026-10-18',now='2026-10-18T23:00:00.000Z';
const original=JSON.stringify(state);
const report=Review.inspect(state,{asOf,now,lift:'squat'});
assert.equal(report.recorded,1);
assert.equal(report.observed,0);
assert.equal(report.coverage.recorded,1);
assert.equal(report.coverage.unobserved,1);
const response=Coach.answer(state,q,{asOf,now});
assert.equal(response.intent.scope,'coverage');
assert.equal(response.readOnly,true);
assert.equal(response.insight.coverage.unobserved,1);
assert.match(response.text,/Evidence gaps:/);
assert.match(response.text,/cannot attribute it to a particular missed workout or absent RPE/);
assert.match(response.text,/not proof that the change caused them/);
assert.doesNotMatch(response.text,/increase (?:your|the) (?:load|weight) by \d+/i);
assert.equal(JSON.stringify(state),original,'Coach cannot mutate any saved workout or prescription');

const earliest=Review.inspect(state,{asOf:'2026-10-17',now:'2026-10-17T23:00:00.000Z',lift:'squat'});
assert.equal(earliest.recorded,0,'Later approved changes do not leak backwards');
// Start with a genuinely empty athlete history; deleting only program records
// from a state that still has reviewed decision events is not an empty fixture.
const empty=Coach.answer(emptyFixture(),q,{asOf,now});
assert.match(empty.text,/No eligible athlete-approved squat programming changes/);
assert.equal(empty.insight.coverage.unobserved,0);
const ambiguous=Coach.answer(state,'Why are my approved changes missing comparable evidence?',{asOf,now});
assert.equal(ambiguous.intent.needsClarification,true);
assert.equal(JSON.stringify(state),original);
console.log('v3.84 approved outcomes: missing comparison classification, cutoffs, no causality or doses, read-only and safe routing passed');
