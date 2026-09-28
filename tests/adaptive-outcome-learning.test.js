const assert=require('node:assert/strict');
const Learning=require('../src/product/adaptive-outcome-learning');
const PhaseReview=require('../src/product/phase-review');
const CycleReview=require('../src/product/cycle-review');
const Cycle=require('../src/product/meet-cycle');
const Phase=require('../src/product/phase-builder');
const {fixture:phaseFixture,args:phaseArgs}=require('./fixtures/phase-review');
const {phaseFixture:baseFixture}=require('./fixtures/phase-builder');

let phase=phaseFixture();
const phaseReport=PhaseReview.analyze(phase,phaseArgs);
phase=PhaseReview.apply(phase,phaseReport,{squat:'reduce-load',bench:'keep',deadlift:'keep'},{confirmed:true,asOf:phaseArgs.asOf,now:phaseArgs.now,id:'phase-decision'});
for(const s of phase.phasePrograms[0].sessions.filter(x=>x.phase==='strength')){
 const rec=phase.scheduledSessions.find(r=>r.id==='phase:ph:'+s.key),rev=rec.revisions.at(-1),plan=rev.context.prescription;
 phase.workouts.push({id:'follow-'+s.key,date:s.date,createdAt:s.date+'T20:00:00.000Z',sessionIntent:{schedule:{id:rec.id,revisionAt:rev.recordedAt},prescription:structuredClone(plan),deviationReason:'none'},exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(set=>({...set,rpe:set.targetRpe}))}))});
}
const phaseLearning=Learning.analyze(phase,{asOf:'2026-11-08',now:'2026-11-08T23:00:00.000Z'});
const phaseRow=phaseLearning.rows.find(r=>r.scope==='phase'&&r.lift==='squat');
assert(phaseRow);assert.equal(phaseRow.action,'reduce-load');assert.equal(phaseRow.status,'observed');assert(Number.isFinite(phaseRow.capacityChangePct));

const {state,config}=baseFixture(),setupArgs={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let cycleState=Phase.save(state,Phase.prepare(state,config,setupArgs),{confirmed:true},{...setupArgs,id:'setup'});
const proposal=Cycle.prepare(cycleState,cycleState.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},setupArgs);
cycleState=Cycle.save(cycleState,proposal,{confirmed:true},{...setupArgs,id:'c12'});
cycleState=Cycle.schedule(cycleState,'c12',{...setupArgs,now:'2026-09-24T13:00:00.000Z'});
const cycle=cycleState.meetCycles[0];
for(const row of cycle.sessions.filter(s=>s.week===1)){
 const rec=cycleState.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),plan=rec.revisions[0].context.prescription;
 cycleState.workouts.push({id:'base-'+row.key,date:row.date,createdAt:row.date+'T17:00:00.000Z',sessionIntent:{schedule:{id:rec.id,revisionAt:rec.revisions[0].recordedAt},prescription:structuredClone(plan)},exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map((s,i)=>({...s,rpe:e.exerciseId===config.lifts.squat.exerciseId&&i<2?Math.min(10,s.targetRpe+1):s.targetRpe}))}))});
}
const weekArgs={cycleId:'c12',week:1,asOf:'2026-10-04',now:'2026-10-04T19:00:00.000Z'};
const week=CycleReview.analyze(cycleState,weekArgs);
cycleState=CycleReview.apply(cycleState,week,{squat:'reduce-load',bench:'keep',deadlift:'keep'},{confirmed:true,asOf:weekArgs.asOf,now:'2026-10-04T19:01:00.000Z',id:'cycle-decision'});
for(const row of cycle.sessions.filter(s=>s.week===2)){
 const rec=cycleState.scheduledSessions.find(x=>x.id==='meet:c12:'+row.key),rev=rec.revisions.at(-1),plan=rev.context.prescription;
 cycleState.workouts.push({id:'next-'+row.key,date:row.date,createdAt:row.date+'T18:00:00.000Z',sessionIntent:{schedule:{id:rec.id,revisionAt:rev.recordedAt},prescription:structuredClone(plan)},exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({...s,rpe:s.targetRpe}))}))});
}
const end=cycle.weekly.find(w=>w.week===2).endDate;
const learned=Learning.analyze(cycleState,{asOf:end,now:end+'T23:00:00.000Z'});
const cycleRow=learned.rows.find(r=>r.scope==='cycle'&&r.lift==='squat');
assert(cycleRow);assert.equal(cycleRow.action,'reduce-load');assert.equal(cycleRow.status,'observed',JSON.stringify(cycleRow));assert(Number.isFinite(cycleRow.capacityChangePct));

const patterns=Learning.summarize([
 {lift:'bench',action:'increase-load',status:'observed',capacityChangePct:2,outcomeClass:'improved'},
 {lift:'bench',action:'increase-load',status:'observed',capacityChangePct:1.5,outcomeClass:'improved'},
 {lift:'bench',action:'increase-load',status:'observed',capacityChangePct:.2,outcomeClass:'stable'},
 {lift:'bench',action:'increase-load',status:'unobserved',capacityChangePct:null,outcomeClass:'unobserved'}
]).patterns[0];
assert.equal(patterns.evidence,'early-pattern');assert.equal(patterns.observed,3);assert.equal(patterns.counts.improved,2);assert.match(patterns.pattern,/more improved/);

const revised=structuredClone(cycleState),target=revised.meetCycles[0].sessions.find(s=>s.week===2&&s.exercises.some(e=>e.exerciseId===config.lifts.squat.exerciseId)),sid='meet:c12:'+target.key,record=revised.scheduledSessions.find(s=>s.id===sid);
record.revisions.push({recordedAt:'2026-10-05T10:00:00.000Z',context:{...structuredClone(record.revisions.at(-1).context),reason:'Manual later change'}});
const excluded=Learning.analyze(revised,{asOf:end,now:end+'T23:00:00.000Z'}).rows.find(r=>r.scope==='cycle'&&r.lift==='squat');
assert.equal(excluded.status,'unobserved');
console.log('v2.44 adaptive decision outcome learning passed');
