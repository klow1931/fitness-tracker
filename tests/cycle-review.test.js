const assert=require('node:assert/strict');
const Review=require('../src/product/cycle-review'),Cycle=require('../src/product/meet-cycle'),Phase=require('../src/product/phase-builder'),Schedule=require('../src/product/schedule'),Controller=require('../src/product/cycle-adaptive-controller'),Observability=require('../src/product/cycle-observability');
const reviewOpts=(report,opts)=>({...opts,controllerSnapshot:Observability.captureController({report,controller:Controller.recommendFromReports(report,null,null),response:null,learningSummary:null,generatedAt:opts.now})});
const {phaseFixture}=require('./fixtures/phase-builder');
const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const source=Phase.save(state,Phase.prepare(state,config,args),{confirmed:true},{...args,id:'setup'});
const cycle=Cycle.prepare(source,source.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},args);
const approved=Cycle.save(source,cycle,{confirmed:true},{...args,id:'c12'});
const scheduled=Cycle.schedule(approved,'c12',{...args,now:'2026-09-24T13:00:00.000Z'}),snapshot=JSON.stringify(scheduled);
const asOf='2026-10-04',now='2026-10-04T19:00:00.000Z';
const incomplete=Review.analyze(scheduled,{cycleId:'c12',week:1,asOf,now});
assert.equal(incomplete.kind,'weekly');assert.equal(incomplete.guidance.summary.unconfirmed,3);
assert.equal(incomplete.findings.squat.canReduceOne,false);assert.equal(incomplete.findings.squat.canReduceLoad,false);assert.equal(incomplete.findings.squat.canIncreaseLoad,false);
assert.throws(()=>Review.preview(incomplete,{squat:'reduce-one',bench:'keep',deadlift:'keep'}),/not supported/);
const keep={squat:'keep',bench:'keep',deadlift:'keep'};
assert.throws(()=>Review.apply(scheduled,incomplete,keep,{confirmed:false,asOf,now}),/Approve/);
const kept=Review.apply(scheduled,incomplete,keep,reviewOpts(incomplete,{confirmed:true,asOf,now,id:'week-one'}));
assert.equal(kept.meetCycles[0].weeklyReviews.length,1);assert.equal(kept.meetCycles[0].weeklyReviews[0].changes.length,0);
assert.equal(JSON.stringify(kept.scheduledSessions),JSON.stringify(scheduled.scheduledSessions));
assert.throws(()=>Review.analyze(kept,{cycleId:'c12',week:1,asOf,now}),/already has/);
assert.deepEqual(Review.validate(kept),kept.meetCycles);
const active={...scheduled,workouts:[...scheduled.workouts]};
for(const row of cycle.sessions.filter(s=>s.week===1)){
 const record=scheduled.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),plan=record.revisions[0].context.prescription;
 active.workouts.push({id:'completed-'+row.key,date:row.date,createdAt:row.date+'T17:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map((s,i)=>({weight:s.weight,reps:s.reps,rpe:e.exerciseId===config.lifts.squat.exerciseId&&i<2?Math.min(10,s.targetRpe+1):s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id:record.id,revisionAt:record.revisions[0].recordedAt}}});
}
const report=Review.analyze(active,{cycleId:'c12',week:1,asOf,now});
assert.equal(report.guidance.summary.completed,3);assert.equal(report.findings.squat.canReduceOne,true);assert.equal(report.findings.squat.canReduceLoad,true);assert.equal(report.findings.squat.incrementKg,config.incrementKg);
assert.equal(report.findings.bench.canReduceOne,false);assert.equal(report.findings.deadlift.canReduceOne,false);
const strong={...scheduled,workouts:[...scheduled.workouts]};
for(const row of cycle.sessions.filter(s=>s.week===1)){
 const record=scheduled.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),plan=record.revisions[0].context.prescription;
 strong.workouts.push({id:'strong-'+row.key,date:row.date,createdAt:row.date+'T17:30:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:e.exerciseId===config.lifts.bench.exerciseId?Math.max(1,s.targetRpe-.5):s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id:record.id,revisionAt:record.revisions[0].recordedAt}}});
}
const strongReport=Review.analyze(strong,{cycleId:'c12',week:1,asOf,now});
assert.equal(strongReport.findings.bench.canIncreaseLoad,true);assert.equal(strongReport.findings.bench.competitionAboveCap,0);assert(strongReport.findings.bench.competitionBelowCapHalf>=2);assert(strongReport.findings.bench.competitionComparableRpeSets>=4);assert.equal(strongReport.findings.squat.canIncreaseLoad,false,'Three competition squat sets plus variation work must not satisfy the four-set competition threshold');
const upChoices={...keep,bench:'increase-load'},up=Review.apply(strong,strongReport,upChoices,reviewOpts(strongReport,{confirmed:true,asOf,now:'2026-10-04T19:00:30.000Z',id:'approved-bench-up'}));
const upReview=up.meetCycles[0].weeklyReviews[0];assert.equal(upReview.version,5);assert.equal(upReview.controllerSnapshot.recommendation.policy,Controller.POLICY);assert.equal(upReview.policy,'cycle-week-adjust-v4');assert.equal(upReview.report.phasePolicy.label,'Accumulation: protect repeatable volume');assert(upReview.changes.length>=1);
for(const edit of upReview.changes){const original=edit.before.context.prescription,updated=edit.after.context.prescription;for(const e of original.plannedExercises){const after=updated.plannedExercises.find(x=>x.exerciseId===e.exerciseId);if(e.exerciseId===config.lifts.bench.exerciseId){assert.equal(after.sets.length,e.sets.length);for(let i=0;i<e.sets.length;i++){assert.equal(after.sets[i].reps,e.sets[i].reps);assert.equal(after.sets[i].weight,Math.round((e.sets[i].weight+config.incrementKg)*100)/100);}}else assert.deepEqual(after.sets,e.sets);}}
assert.deepEqual(up.meetCycles[0].sessions,strong.meetCycles[0].sessions,'Upward progression keeps original cycle immutable');
assert.deepEqual(up.workouts,strong.workouts,'Upward progression never rewrites completed workouts');

const choices={...keep,squat:'reduce-one'},baseline=JSON.stringify(active),changes=Review.apply(active,report,choices,reviewOpts(report,{confirmed:true,asOf,now:'2026-10-04T19:01:00.000Z',id:'approved-squat'}));
const review=changes.meetCycles[0].weeklyReviews[0];
assert.equal(review.changes.length,2,'Each squat exposure receives one set reduction');
assert.equal(review.kind,'weekly');assert.equal(review.report.findings.squat.aboveCap,2);
assert.deepEqual(changes.meetCycles[0].sessions,active.meetCycles[0].sessions,'Original cycle is immutable');
assert.deepEqual(changes.workouts,active.workouts,'Workout history not rewritten');
assert.deepEqual(changes.scheduledSessions.slice(0,3),active.scheduledSessions.slice(0,3),'Completed week not rewritten');
assert(review.changes.every(c=>c.after.context.date>asOf&&c.after.context.prescription.capturedAt==='2026-10-04T19:01:00.000Z'));
for(const edit of review.changes){const original=edit.before.context.prescription,updated=edit.after.context.prescription;for(const e of original.plannedExercises){const after=updated.plannedExercises.find(x=>x.exerciseId===e.exerciseId);if(e.exerciseId===config.lifts.squat.exerciseId||e.exerciseId==='ss')assert.equal(after.sets.length,e.sets.length-1);else assert.deepEqual(after.sets,e.sets);}}
const loadChoices={...keep,squat:'reduce-load'},loadChanges=Review.apply(active,report,loadChoices,reviewOpts(report,{confirmed:true,asOf,now:'2026-10-04T19:01:30.000Z',id:'approved-squat-load'}));
const loadReview=loadChanges.meetCycles[0].weeklyReviews[0];
assert.equal(loadReview.version,5);assert.equal(loadReview.policy,'cycle-week-adjust-v4');assert.equal(loadReview.changes.length,2);
for(const edit of loadReview.changes){const original=edit.before.context.prescription,updated=edit.after.context.prescription;for(const e of original.plannedExercises){const after=updated.plannedExercises.find(x=>x.exerciseId===e.exerciseId);if(e.exerciseId===config.lifts.squat.exerciseId||e.exerciseId==='ss'){assert.equal(after.sets.length,e.sets.length);for(let i=0;i<e.sets.length;i++)assert.equal(after.sets[i].weight,Math.round((e.sets[i].weight-config.incrementKg)*100)/100);}else assert.deepEqual(after.sets,e.sets);}}
assert.deepEqual(loadChanges.meetCycles[0].sessions,active.meetCycles[0].sessions,'Load adjustment keeps original cycle immutable');
const legacy=structuredClone(kept);legacy.meetCycles[0].weeklyReviews[0].version=1;legacy.meetCycles[0].weeklyReviews[0].policy='cycle-week-set-v1';assert.deepEqual(Review.validate(legacy),legacy.meetCycles,'Legacy weekly review policy remains valid');const previous=structuredClone(loadChanges);previous.meetCycles[0].weeklyReviews[0].version=2;previous.meetCycles[0].weeklyReviews[0].policy='cycle-week-adjust-v2';assert.deepEqual(Review.validate(previous),previous.meetCycles,'v2.38 weekly review policy remains valid');const upwardLegacy=structuredClone(loadChanges);upwardLegacy.meetCycles[0].weeklyReviews[0].version=3;upwardLegacy.meetCycles[0].weeklyReviews[0].policy='cycle-week-adjust-v3';delete upwardLegacy.meetCycles[0].weeklyReviews[0].report.phasePolicy;assert.deepEqual(Review.validate(upwardLegacy),upwardLegacy.meetCycles,'v2.39 upward-review policy remains valid');
assert.throws(()=>Review.analyze(changes,{cycleId:'c12',week:1,asOf,now:'2026-10-04T19:02:00.000Z'}),/already has/);
const stale=structuredClone(active);stale.scheduledSessions=Schedule.change(stale.scheduledSessions,'meet:c12:'+cycle.sessions.find(s=>s.week===2&&s.exercises.some(e=>e.lift==='squat')).key,{status:'skipped',reason:'Unavailable'},'2026-10-04T18:00:00.000Z');
assert.throws(()=>Review.apply(stale,report,choices,reviewOpts(report,{confirmed:true,asOf,now:'2026-10-04T19:01:00.000Z'})),/changed|regenerate/);
const lockedId='meet:c12:'+cycle.sessions.find(s=>s.week===2&&s.exercises.some(e=>e.lift==='squat')).key;
assert.throws(()=>Review.apply(active,report,choices,reviewOpts(report,{confirmed:true,asOf,now:'2026-10-04T19:01:00.000Z',lockedSessionIds:[lockedId]})),/open in a workout draft/);
const unknown=structuredClone(active);unknown.workouts[unknown.workouts.length-1].sessionIntent.schedule.revisionAt='2026-10-01T00:00:00.000Z';
assert.equal(Review.analyze(unknown,{cycleId:'c12',week:1,asOf,now}).findings.squat.canReduceOne,false);
const transitionWeek=cycle.weekly.find(w=>w.phase==='accumulation'&&cycle.weekly[w.week]?.phase==='strength');
assert(transitionWeek);const transition=Review.analyze(scheduled,{cycleId:'c12',week:transitionWeek.week,asOf:transitionWeek.endDate,now:transitionWeek.endDate+'T23:00:00.000Z'});
assert.equal(transition.kind,'phase-transition');assert.equal(transition.nextPhase,'strength');assert.equal(transition.phasePolicy.label,'Accumulation → strength: preserve the planned jump');assert(Object.values(transition.findings).every(f=>!f.canIncreaseLoad),'No extra upward increment may stack onto the planned strength transition');
const peak=cycle.weekly.find(w=>w.phase==='strength'&&cycle.weekly[w.week]?.phase==='peaking');
const peakReport=Review.analyze(scheduled,{cycleId:'c12',week:peak.week,asOf:peak.endDate,now:peak.endDate+'T23:00:00.000Z'});
assert.equal(peakReport.nextPhase,'peaking');assert.equal(peakReport.phasePolicy.label,'Strength → peak: protect the transition');assert(Object.values(peakReport.findings).every(f=>!f.canReduceOne&&!f.canReduceLoad&&!f.canIncreaseLoad));

const peakWeek=cycle.weekly.find(w=>w.phase==='peaking'&&cycle.weekly[w.week]?.phase==='peaking');
assert(peakWeek,'12-week fixture should contain an internal peaking week');
const peakActive={...scheduled,workouts:[...scheduled.workouts]};
for(const row of cycle.sessions.filter(s=>s.week===peakWeek.week)){
 const record=scheduled.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),plan=record.revisions[0].context.prescription;
 peakActive.workouts.push({id:'peak-'+row.key,date:row.date,createdAt:row.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:Math.min(10,s.targetRpe+1)}))})),sessionIntent:{prescription:plan,schedule:{id:record.id,revisionAt:record.revisions[0].recordedAt}}});
}
const peakWeekly=Review.analyze(peakActive,{cycleId:'c12',week:peakWeek.week,asOf:peakWeek.endDate,now:peakWeek.endDate+'T23:00:00.000Z'});
assert.equal(peakWeekly.phase,'peaking');assert.equal(peakWeekly.nextPhase,'peaking');assert.equal(peakWeekly.phasePolicy.label,'Peak: preserve specificity');
assert(Object.values(peakWeekly.findings).every(f=>f.canReduceLoad&&!f.canReduceOne&&!f.canIncreaseLoad),'Peak reviews may only offer the bounded downward load action when direct competition evidence supports it');
const peakChoices={...keep,squat:'reduce-load'},peakAdjusted=Review.apply(peakActive,peakWeekly,peakChoices,reviewOpts(peakWeekly,{confirmed:true,asOf:peakWeek.endDate,now:peakWeek.endDate+'T23:00:30.000Z',id:'peak-down'}));
const peakSaved=peakAdjusted.meetCycles[0].weeklyReviews.at(-1);assert.equal(peakSaved.report.phasePolicy.reductionEvidence,'competition-only');
for(const edit of peakSaved.changes){const beforePlan=edit.before.context.prescription,afterPlan=edit.after.context.prescription;for(const ex of beforePlan.plannedExercises){const afterEx=afterPlan.plannedExercises.find(x=>x.exerciseId===ex.exerciseId);if(ex.exerciseId===config.lifts.squat.exerciseId){assert.equal(afterEx.sets.length,ex.sets.length);for(let i=0;i<ex.sets.length;i++)assert.equal(afterEx.sets[i].weight,Math.round((ex.sets[i].weight-config.incrementKg)*100)/100);}}}

const after=JSON.stringify(active);assert.equal(after,baseline);assert.equal(JSON.stringify(scheduled),snapshot);
console.log('v2.65 weekly review supports phase-specific progression, peak protection, bounded reductions, legacy records and immutable plans');
