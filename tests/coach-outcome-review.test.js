const assert=require('node:assert/strict');
const Review=require('../src/product/coach-outcome-review');
const Coach=require('../src/product/coach-conversation');
const PhaseReview=require('../src/product/phase-review');
const {fixture, args}=require('./fixtures/phase-review');
const {fixture:basic}=require('./fixtures/program-review');
const asOf='2026-11-08',now='2026-11-08T23:00:00.000Z';

assert.equal(Review.intent('What happened after my last bench change?').lifts[0],'bench');
assert.equal(Review.intent('Have my past squat adjustments helped?').kind,'latest');
assert.equal(Review.intent('Do load increases usually work after my approved deadlift changes?').kind,'pattern');
assert.equal(Review.intent('What have we learned from my past squat adjustments?').kind,'pattern');
assert.equal(Review.intent('What have we learned from my program changes?'),null,'General history stays with longitudinal Coach');
assert.equal(Review.intent('Why did I change my imported bench program?'),null,'Personal edit reasons belong to custom program studio');
assert.equal(Review.intent('My knee hurts after the last bench adjustment'),null,'Safety queries precede outcome history');
assert.equal(Review.intent('Create a new bench program'),null,'Program drafting must remain separate');
assert.equal(Review.intent('How did my bench training change across my last three workouts?'),null,'Logged workout history must not be intercepted by approved-outcome reviews');
assert.equal(Review.intent('Compare my squat training changes between the previous three workouts'),null,'Across-session training changes are not approved Decisions adaptations');
assert.equal(Review.intent('How did my squat change from last session?'),null,'Single-workout comparisons remain in the recorded-history flow');
let empty=basic(),before=JSON.stringify(empty);
let reply=Coach.answer(empty,'What happened after my last bench change?',{asOf,now,unit:'lb'});
assert.equal(reply.source,'Offline Coach · approved training outcomes');
assert.equal(reply.readOnly,true);
assert.equal(reply.insight.recorded,0);
assert.match(reply.text,/No eligible athlete-approved bench programming changes/);
assert.equal(reply.evidenceCards.length,1);
assert.equal(JSON.stringify(empty),before);
let ambiguous=Coach.answer(empty,'What happened after my last approved training change?',{asOf,now});
assert.equal(ambiguous.intent.needsClarification,true);
assert.equal(ambiguous.actions.length,0);
ambiguous=Coach.answer(empty,'What happened after my last squat and bench change?',{asOf,now});
assert.equal(ambiguous.intent.needsClarification,true);

let state=fixture(),proposal=PhaseReview.analyze(state,args);
state=PhaseReview.apply(state,proposal,{squat:'reduce-load',bench:'keep',deadlift:'keep'},
 {confirmed:true,asOf:args.asOf,now:args.now,id:'phase-decision'});
const pending=Review.inspect(state,{asOf:'2026-10-18',now:'2026-10-18T23:00:00.000Z',lift:'squat'});
assert.equal(pending.recorded,1);
assert.equal(pending.observed,0,'Acceptance before linked follow-ups must not count as observed');
assert.equal(Review.inspect(state,{asOf:'2026-10-17',now:'2026-10-17T23:00:00.000Z',lift:'squat'}).recorded,0,'Approval after the cutoff must remain excluded');
for(const item of state.phasePrograms[0].sessions.filter(s=>s.phase==='strength')){
 const record=state.scheduledSessions.find(r=>r.id==='phase:ph:'+item.key),version=record.revisions.at(-1),plan=version.context.prescription;
 state.workouts.push({id:'verified-'+item.key,date:item.date,createdAt:item.date+'T20:00:00.000Z',
  sessionIntent:{schedule:{id:record.id,revisionAt:version.recordedAt},prescription:structuredClone(plan),deviationReason:'none'},
  exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({...s,rpe:s.targetRpe}))}))});
}
before=JSON.stringify(state);
const observed=Review.inspect(state,{asOf,now,lift:'squat'});
assert.equal(observed.recorded,1);
assert.equal(observed.observed,1);
assert.equal(observed.latest.status,'observed');
assert(Number.isFinite(observed.latest.capacityChangePct));
reply=Coach.answer(state,'What happened after my last squat adjustment?',{asOf,now,unit:'lb'});
assert.equal(reply.source,'Offline Coach · approved training outcomes');
assert.equal(reply.insight.lift,'squat');
assert.match(reply.text,/comparable RPE-aware capacity estimate changed/);
assert.match(reply.text,/not proof that the change caused them/);
assert(!/\b(?:increase|decrease) by \d+ (?:kg|lb)\b/i.test(reply.text),'No generated next-session load');
assert.equal(JSON.stringify(state),before,'Historical coaching cannot write to workout or program state');
assert.equal(Review.inspect(state,{asOf:'2026-10-18',now:'2026-10-18T23:00:00.000Z',lift:'squat'}).observed,0,
 'Later follow-ups cannot leak into an earlier date');
const pattern=Coach.answer(state,'Do my past squat adjustments usually work?',{asOf,now,unit:'kg'});
assert.equal(pattern.insight.scope,'pattern');
assert.match(pattern.text,/fewer than three observed follow-ups/);
assert(!/Repeated follow-ups have more improved than declined observations/.test(pattern.text));
const missing=structuredClone(state);
for(const w of missing.workouts.filter(w=>String(w.id).startsWith('verified-')))
 for(const e of w.exercises)for(const s of e.sets)delete s.rpe;
const unknown=Review.inspect(missing,{asOf,now,lift:'squat'});
assert.equal(unknown.observed,0,'Without actual RPE, matched capacity cannot be reported');
assert.match(Review.answer(missing,'What happened after my last squat change?',{asOf,now}).text,/No exact comparable follow-up/);
assert.equal(JSON.stringify(state),before);
console.log('v3.78 approved outcome cutoffs, observed versus missing RPE, multiple lifts, safety and immutability passed');
