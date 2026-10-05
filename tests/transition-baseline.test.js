const assert=require('node:assert/strict');
const Phase=require('../src/product/phase-builder');
const Transition=require('../src/product/transition-baseline');
const Goals=require('../src/product/athlete-goals');
const Core=require('../src/core/loadnote-core');
const {phaseFixture}=require('./fixtures/phase-builder');

const {state:base,config}=phaseFixture();
base.athleteGoals=Goals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
 {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
]},{now:'2026-09-23T09:00:00.000Z'});
const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const proposal=Phase.prepare(base,config,args);
let state=Phase.save(base,proposal,{confirmed:true,notes:'Reviewed goal-aware block'},{...args,id:'phase-transition'});
state=Phase.schedule(state,'phase-transition',{...args,now:'2026-09-24T13:00:00.000Z'});
const program=state.phasePrograms[0],end=Transition.endDate(program);
assert.equal(end,'2026-11-13');

for(const session of program.sessions){
 const id='phase:'+program.id+':'+session.key,scheduled=state.scheduledSessions.find(x=>x.id===id),revision=scheduled.revisions[0],plan=revision.context.prescription;
 state.workouts.push({id:'done-'+session.key,date:session.date,createdAt:session.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map((s,i)=>({weight:s.weight,reps:s.reps,rpe:Math.min(10,s.targetRpe+(i===0?0:-.5))}))})),sessionIntent:{prescription:plan,schedule:{id,revisionAt:revision.recordedAt},timing:'planned-before-training'}});
}
const originalPrograms=JSON.stringify(state.phasePrograms),originalWorkouts=JSON.stringify(state.workouts);
const report=Transition.preview(state,{programId:'phase-transition',asOf:end,now:end+'T21:00:00.000Z'});
assert.equal(report.schedule.expected,21);assert.equal(report.schedule.completed,21);assert.equal(report.schedule.unconfirmed,0);assert.equal(report.schedule.adherence,100);
assert.equal(report.goalAtStart.status,'ready');assert.equal(report.goalAtStart.goal.eventDate,null);
for(const lift of ['squat','bench','deadlift']){
 const row=report.lifts[lift];
 assert.equal(row.exerciseId,config.lifts[lift].exerciseId);
 assert.equal(row.selectedTrainingMaxKg,config.lifts[lift].trainingMaxKg);
 assert(row.recent28d.sessions>0);assert(row.recent28d.sets>0);assert(row.recent28d.averageRpe!==null);
 assert(row.targetKg>0);
}
assert.equal(report.decisionHistory.count,0);
assert.throws(()=>Transition.preview(state,{programId:'phase-transition',asOf:'2026-11-12',now:'2026-11-12T21:00:00.000Z'}),/final scheduled date/);
assert.throws(()=>Transition.save(state,report,{}, {now:end+'T21:01:00.000Z'}),/Review the transition evidence/);
const saved=Transition.save(state,report,{confirmed:true,notes:'Handoff reviewed'},{now:end+'T21:01:00.000Z',id:'transition-1'});
assert.equal(saved.transitionSnapshots.length,1);assert.equal(saved.transitionSnapshots[0].programId,'phase-transition');assert.equal(saved.transitionSnapshots[0].review.notes,'Handoff reviewed');
assert.equal(JSON.stringify(saved.phasePrograms),originalPrograms);assert.equal(JSON.stringify(saved.workouts),originalWorkouts);
assert.deepEqual(Transition.validate(JSON.parse(JSON.stringify(saved.transitionSnapshots))),saved.transitionSnapshots);
assert.throws(()=>Transition.preview(saved,{programId:'phase-transition',asOf:end,now:end+'T21:02:00.000Z'}),/already exists/);

const incomplete=structuredClone(state);incomplete.workouts.pop();
const incompleteReport=Transition.preview(incomplete,{programId:'phase-transition',asOf:end,now:end+'T21:00:00.000Z'});
assert.equal(incompleteReport.schedule.expected,21);assert.equal(incompleteReport.schedule.completed,20);assert.equal(incompleteReport.schedule.unconfirmed,0);assert.equal(incompleteReport.schedule.upcoming,1);
assert.match(incompleteReport.notes.join(' '),/Missing, skipped, cancelled, pending or unconfirmed/);

const migrated=Core.normalizeState({schemaVersion:24,workouts:base.workouts,phasePrograms:[]});
assert.equal(migrated.schemaVersion,32);assert.deepEqual(migrated.transitionSnapshots,[]);assert.deepEqual(migrated.workouts,base.workouts);
console.log('v2.42 immutable transition baseline, coverage evidence and schema migration passed');
