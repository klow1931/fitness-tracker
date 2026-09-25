const assert=require('node:assert/strict');
const Feedback=require('../src/product/phase-feedback'),Outcomes=require('../src/product/phase-outcomes'),Review=require('../src/product/phase-review');
const {fixture,args}=require('./fixtures/phase-review');
const start=fixture(),basis=Review.analyze(start,args);
const state=Review.apply(start,basis,{squat:'reduce-load',bench:'keep',deadlift:'keep'},{confirmed:true,asOf:args.asOf,now:args.now});
const original=JSON.stringify(state);
function report(value,asOf){return Feedback.assess(value,{programId:'ph',phase:'strength',asOf});}
const early=Outcomes.analyze(state,{asOf:'2026-10-19',now:'2026-10-19T22:00:00.000Z'});
assert.equal(report(early,'2026-10-19').findings.squat.status,'await-completion');
const late=Outcomes.analyze(state,{asOf:'2026-11-08',now:'2026-11-08T23:00:00.000Z'});
assert.equal(report(late,'2026-11-08').findings.squat.status,'gather-comparable-evidence');
assert.equal(report(late,'2026-11-08').findings.bench.previousChoice,'keep');
assert.equal(report(late,'2026-11-08').findings.squat.previousChoice,'reduce-load');
assert.equal(Feedback.assess(late,{programId:'unrelated',phase:'strength',asOf:'2026-11-08'}).findings.squat.status,'no-prior-review');
const filled=structuredClone(state);
for(const session of filled.phasePrograms[0].sessions.filter(s=>s.phase==='strength')){
 const record=filled.scheduledSessions.find(r=>r.id==='phase:ph:'+session.key),revision=record.revisions.at(-1),plan=revision.context.prescription;
 filled.workouts.push({id:'feedback-'+session.key,date:session.date,createdAt:session.date+'T20:00:00.000Z',sessionIntent:{schedule:{id:record.id,revisionAt:revision.recordedAt},prescription:structuredClone(plan)},exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({...s,rpe:s.targetRpe}))}))});
}
const outcomes=Outcomes.analyze(filled,{asOf:'2026-11-08',now:'2026-11-08T23:00:00.000Z'}),feedback=report(outcomes,'2026-11-08');
assert.equal(feedback.findings.squat.status,'review-current-phase');
assert.equal(feedback.findings.squat.followupMatched,6);
const current={programId:'ph',phase:'strength',asOf:'2026-11-08',policy:'phase-effort-v3',findings:{squat:{name:'Competition Squat',exerciseId:'s',decision:'keep',reason:'Current effort supports continued review'},bench:{name:'Competition Bench',exerciseId:'b',decision:'gather',reason:'Some evidence missing'},deadlift:{name:'Competition Deadlift',exerciseId:'d',decision:'keep',reason:'Keep program'}}};
const linked=Feedback.assess(outcomes,{programId:'ph',phase:'strength',asOf:'2026-11-08',currentReview:current});
assert.equal(linked.findings.squat.currentRule,'keep');
assert(linked.findings.squat.notes.some(note=>note.includes('Only the current phase-review preview')));
const high=structuredClone(outcomes);high.reviews[0].findings.squat.aboveCap=1;
assert.equal(report(high,'2026-11-08').findings.squat.status,'review-effort');
const low=structuredClone(outcomes);low.reviews[0].findings.squat.observedChangePct=-5;
assert.equal(report(low,'2026-11-08').findings.squat.status,'review-performance');
const incomplete=structuredClone(outcomes);incomplete.reviews[0].findings.squat.status='gather-follow-up';
assert.equal(report(incomplete,'2026-11-08').findings.squat.status,'gather-comparable-evidence');
assert.throws(()=>Feedback.assess(outcomes,{programId:'ph',phase:'strength',asOf:'2026-11-07'}),/fresh/);
assert.throws(()=>Feedback.assess(outcomes,{programId:'ph',phase:'strength',asOf:'2026-11-08',currentReview:{...current,phase:'accumulation'}}),/match/);
assert.equal(JSON.stringify(state),original);
console.log('Phase feedback loop evidence and independent next-phase review tests passed');
