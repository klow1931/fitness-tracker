const assert=require('node:assert/strict');
const Core=require('../src/core/loadnote-core');
const Obs=require('../src/product/cycle-observability');
const Controller=require('../src/product/cycle-adaptive-controller');

const report={version:4,policy:'cycle-week-adjust-v4',cycleId:'c1',week:3,phase:'strength',nextPhase:'strength',nextWeek:4,asOf:'2026-10-25',cutoff:'2026-10-25T20:00:00.000Z',
 phasePolicy:{id:'cycle-phase-policy-v1'},eligibility:{squat:true,bench:true,deadlift:true},findings:{
 squat:{name:'Squat',canReduceOne:true,canReduceLoad:true,canIncreaseLoad:false,comparableRpeSets:4,aboveCap:3,competitionComparableRpeSets:4,competitionAboveCap:3,competitionBelowCapHalf:0,reductionComparableRpeSets:4,reductionAboveCap:3,incrementKg:2.5},
 bench:{name:'Bench',canReduceOne:true,canReduceLoad:true,canIncreaseLoad:true,comparableRpeSets:4,aboveCap:0,competitionComparableRpeSets:4,competitionAboveCap:0,competitionBelowCapHalf:3,reductionComparableRpeSets:4,reductionAboveCap:0,incrementKg:2.5},
 deadlift:{name:'Deadlift',canReduceOne:true,canReduceLoad:true,canIncreaseLoad:true,comparableRpeSets:4,aboveCap:0,competitionComparableRpeSets:4,competitionAboveCap:0,competitionBelowCapHalf:3,reductionComparableRpeSets:4,reductionAboveCap:0,incrementKg:2.5}
 }};
const response={version:1,asOf:report.asOf,cutoff:report.cutoff,phases:[{phase:'strength',lifts:{squat:{observedChangePct:-3.5},bench:{observedChangePct:2},deadlift:{observedChangePct:null}}}]};
const learning={recorded:3,observed:3,unobserved:0,patterns:[{lift:'bench',action:'increase-load',recorded:3,observed:3,counts:{improved:2,stable:1,declined:0},medianCapacityChangePct:1.5,evidence:'early-pattern'}]};
const controller=Controller.recommendFromReports(report,response,learning);
const generatedAt='2026-10-25T20:01:00.000Z';
const snap=Obs.captureController({report,controller,response,learningSummary:learning,generatedAt});
assert.equal(snap.environment.releaseVersion,Core.RELEASE_VERSION);
assert.equal(snap.environment.schemaVersion,Core.SCHEMA_VERSION);
assert.equal(Obs.validateControllerSnapshot(snap,report,{savedAt:'2026-10-25T20:02:00.000Z'}).recommendation.policy,Controller.POLICY);
const replay=Obs.verifyReplay(snap,report,Controller);assert.equal(replay.status,'match');
const tampered=structuredClone(snap);tampered.inputs.response.phase.lifts.bench.observedChangePct=9;
assert.throws(()=>Obs.validateControllerSnapshot(tampered,report),/Invalid or stale/);
const staleReport=structuredClone(report);staleReport.findings.bench.competitionBelowCapHalf=2;
assert.throws(()=>Obs.validateControllerSnapshot(snap,staleReport),/Invalid or stale/);

const env=Obs.programEnvironment({capturedAt:'2026-09-30T12:00:00.000Z',purpose:'phase-program-review'});
assert.equal(Obs.validateEnvironment(env,{capturedAt:'2026-09-30T12:00:00.000Z',purpose:'phase-program-review'}).releaseVersion,Core.RELEASE_VERSION);

const cycle={id:'c1',createdAt:'2026-09-30T13:00:00.000Z',decisionEnvironment:Obs.programEnvironment({capturedAt:'2026-09-30T13:00:00.000Z',purpose:'meet-cycle-review'}),config:{startDate:'2026-10-05',meetDate:'2026-12-20',eventType:'mock',weeks:12},sourceProgram:{id:'p1',createdAt:'2026-09-30T12:00:00.000Z',decisionEnvironment:env,config:{name:'Observed cycle',startDate:'2026-10-05'},startingPrescriptionSnapshot:{status:'reviewed-comparison'}},sessions:[{key:'w4d1',week:4,date:'2026-10-26',exercises:[{exerciseId:'b',lift:'bench'}]}],weeklyReviews:[{version:5,id:'r1',cycleId:'c1',week:3,asOf:report.asOf,createdAt:'2026-10-25T20:02:00.000Z',choices:{squat:'keep',bench:'keep',deadlift:'keep'},report:{...report,findings:{...report.findings,bench:{...report.findings.bench,exerciseId:'b'},squat:{...report.findings.squat,exerciseId:'s'},deadlift:{...report.findings.deadlift,exerciseId:'d'}}},changes:[],notes:'Athlete kept plan'}]};
const controller2=Controller.recommendFromReports(cycle.weeklyReviews[0].report,response,learning);
cycle.weeklyReviews[0].controllerSnapshot=Obs.captureController({report:cycle.weeklyReviews[0].report,controller:controller2,response,learningSummary:learning,generatedAt});
const state={meetCycles:[cycle],phasePrograms:[cycle.sourceProgram],workouts:[{id:'w1',date:'2026-10-26',createdAt:'2026-10-26T20:00:00.000Z',sessionIntent:{schedule:{id:'meet:c1:w4d1',revisionAt:'2026-09-30T13:30:00.000Z'}},exercises:[{exerciseId:'b',type:'strength',trackBy:'reps',sets:[{weight:100,reps:3,rpe:8}]}]}],transitionSnapshots:[]};
const journal=Obs.timeline(state,{cycleId:'c1',asOf:'2026-10-27'});
const review=journal.events.find(e=>e.kind==='weekly-review');
assert.equal(review.lifts.bench.athleteDecision,controller2.choices.bench==='keep'?'accepted':'overridden');
assert.equal(review.lifts.bench.outcome.status,'observed');
assert.equal(review.lifts.bench.outcome.capacityStatus,'usable');
assert(journal.summary.controllerSnapshots===1);
const before=JSON.stringify(state);
const earlier=Obs.timeline(state,{cycleId:'c1',asOf:'2026-10-25',knownAt:'2026-10-25T23:59:59.999Z'});
assert.notEqual(earlier.events.find(e=>e.kind==='weekly-review').lifts.bench.outcome.status,'observed','future-created workout must not rewrite earlier journal view');
assert.equal(JSON.stringify(state),before,'journal is read-only');

const audited=Obs.audit(state,{cycleId:'c1',asOf:'2026-10-27'});assert.equal(audited.blocking,0);
const bad=structuredClone(state);bad.meetCycles[0].weeklyReviews[0].controllerSnapshot.recommendation.lifts.deadlift.observedChangePct=0;bad.meetCycles[0].weeklyReviews[0].controllerSnapshot.recommendationFingerprint=Obs.fingerprint(bad.meetCycles[0].weeklyReviews[0].controllerSnapshot.recommendation);
const badAudit=Obs.audit(bad,{cycleId:'c1',asOf:'2026-10-27'});assert(badAudit.issues.some(i=>i.code==='unknown-capacity-coerced-zero'));
console.log('v2.66 cycle observability, replay, journal and audit tests passed');