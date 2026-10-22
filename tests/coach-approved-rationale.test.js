const assert=require('node:assert/strict');
const Review=require('../src/product/coach-outcome-review');
const Coach=require('../src/product/coach-conversation');
const PhaseReview=require('../src/product/phase-review');
const CycleReview=require('../src/product/cycle-review');
const Controller=require('../src/product/cycle-adaptive-controller');
const Observability=require('../src/product/cycle-observability');
const Cycle=require('../src/product/meet-cycle');
const Phase=require('../src/product/phase-builder');
const {fixture:phaseFixture,args:phaseArgs}=require('./fixtures/phase-review');
const {phaseFixture:baseFixture}=require('./fixtures/phase-builder');

const question='Why did Loadnote change my squat?';
assert.equal(Review.intent(question).kind,'rationale');
assert.equal(Review.intent('Why was my approved bench load reduced?').kind,'rationale');
assert.equal(Review.intent('Explain why my approved deadlift adjustment was made.').kind,'rationale');
assert.equal(Review.intent('Why are my approved squat adjustments missing comparable evidence?').kind,'coverage');
assert.equal(Review.intent('What happened after my last bench change?').kind,'latest');
assert.equal(Review.intent('Why did my squat training change after three workouts?'),null);
assert.equal(Review.intent('Why is my squat recommended load changing?'),null);
assert.equal(Review.intent('My knee hurts: why did Loadnote change my squat?'),null);

let state=phaseFixture();
const before=PhaseReview.analyze(state,phaseArgs);
state=PhaseReview.apply(state,before,{squat:'reduce-load',bench:'keep',deadlift:'keep'},
 {confirmed:true,asOf:phaseArgs.asOf,now:phaseArgs.now,id:'rationale-phase'});
const orig=JSON.stringify(state),asOf='2026-10-18',now='2026-10-18T23:00:00.000Z';
const review=Review.rationale(state,{asOf,now,lift:'squat'});
assert.equal(review.status,'verified');
assert.equal(review.action,'reduce-load');
assert.equal(review.policy,state.phaseReviews[0].policy);
assert.equal(review.reason,state.phaseReviews[0].findings.squat.reason);
assert.equal(review.approvedAt,phaseArgs.now);
assert.equal(review.followup.status,'unobserved');
const answer=Coach.answer(state,question,{asOf,now});
assert.equal(answer.readOnly,true);
assert.equal(answer.intent.topic,'approved-rationale');
assert.equal(answer.source,'Offline Coach · approved training outcomes');
assert.match(answer.text,/athlete-approved squat change was reduce-load/);
assert.match(answer.text,/saved review stated:/i);
assert.match(answer.text,/not proof/i);
assert.equal(answer.evidenceCards[0].status,'observed');
assert.equal(JSON.stringify(state),orig,'Rationale review is read only');
const beforeApproval=Review.rationale(state,{asOf:'2026-10-17',now:'2026-10-17T23:00:00.000Z',lift:'squat'});
assert.equal(beforeApproval.status,'none','No later approval in historical review');
assert.equal(Review.rationale(state,{asOf,now,lift:'bench'}).status,'none','Keep is not an approved adjustment');
assert.equal(Review.answer(state,'Why did Loadnote change my squat and bench?',{asOf,now}).intent.needsClarification,true);
assert.equal(Review.intent('What have we learned from my program changes?'),null);

const {state:base,config}=baseFixture(),setupArgs={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let cycle=Phase.save(base,Phase.prepare(base,config,setupArgs),{confirmed:true},{...setupArgs,id:'setup'});
const proposal=Cycle.prepare(cycle,cycle.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},setupArgs);
cycle=Cycle.save(cycle,proposal,{confirmed:true},{...setupArgs,id:'c12'});
cycle=Cycle.schedule(cycle,'c12',{...setupArgs,now:'2026-09-24T13:00:00.000Z'});
for(const row of cycle.meetCycles[0].sessions.filter(s=>s.week===1)){
 const rec=cycle.scheduledSessions.find(s=>s.id==='meet:c12:'+row.key),plan=rec.revisions[0].context.prescription;
 cycle.workouts.push({id:'base-'+row.key,date:row.date,createdAt:row.date+'T17:00:00.000Z',
  sessionIntent:{schedule:{id:rec.id,revisionAt:rec.revisions[0].recordedAt},prescription:structuredClone(plan)},
  exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map((s,i)=>({...s,rpe:e.exerciseId===config.lifts.squat.exerciseId&&i<2?Math.min(10,s.targetRpe+1):s.targetRpe}))}))});
}
const weekArgs={cycleId:'c12',week:1,asOf:'2026-10-04',now:'2026-10-04T19:00:00.000Z'};
const weekly=CycleReview.analyze(cycle,weekArgs);
const recommendation=Controller.recommendFromReports(weekly,null,null);
const snapshot=Observability.captureController({report:weekly,controller:recommendation,response:null,learningSummary:null,generatedAt:'2026-10-04T19:00:30.000Z'});
cycle=CycleReview.apply(cycle,weekly,{squat:'reduce-load',bench:'keep',deadlift:'keep'},
 {confirmed:true,asOf:weekArgs.asOf,now:'2026-10-04T19:01:00.000Z',id:'rationale-cycle',controllerSnapshot:snapshot});
const frozen=cycle.meetCycles[0].weeklyReviews[0],beforeCycle=JSON.stringify(cycle);
const cycleReason=Review.rationale(cycle,{asOf:'2026-10-06',now:'2026-10-06T21:00:00.000Z',lift:'squat'});
assert.equal(cycleReason.status,'verified');
assert.equal(cycleReason.reviewId,'rationale-cycle');
assert.equal(cycleReason.reason,frozen.report.findings.squat.loadReason);
assert.equal(cycleReason.policy,frozen.policy);
assert.match(Review.explainRationale(cycleReason),/week 1 meet-cycle/i);
assert.equal(JSON.stringify(cycle),beforeCycle);
assert.equal(Review.rationale(cycle,{asOf:'2026-10-04',now:'2026-10-04T19:00:30.000Z',lift:'squat'}).status,'none','Same-day future approval must not leak');
const empty={phasePrograms:[],phaseReviews:[],meetCycles:[],scheduledSessions:[],workouts:[]};
assert.equal(Review.rationale(empty,{asOf,now,lift:'squat'}).status,'none');
assert.match(Review.answer(empty,question,{asOf,now}).text,/No eligible saved athlete-approved squat adjustment/);
console.log('v3.85 frozen phase/meet rationale, cutoff, unrelated intent, approved-vs-unobserved, read-only and safety passed');
