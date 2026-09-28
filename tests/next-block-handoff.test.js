const assert=require('node:assert/strict');
const Handoff=require('../src/product/next-block-handoff');
const Transition=require('../src/product/transition-baseline');
const Phase=require('../src/product/phase-builder');
const Goals=require('../src/product/athlete-goals');
const Schedule=require('../src/product/schedule');
const {phaseFixture}=require('./fixtures/phase-builder');

const {state:base,config}=phaseFixture();
base.athleteGoals=Goals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
 {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
]},{now:'2026-09-23T09:00:00.000Z'});
const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let state=Phase.save(base,Phase.prepare(base,config,args),{confirmed:true,notes:'Reviewed'}, {...args,id:'handoff-source'});
state=Phase.schedule(state,'handoff-source',{...args,now:'2026-09-24T13:00:00.000Z'});
const program=state.phasePrograms[0],end=Transition.endDate(program);
for(const session of program.sessions){
 const id='phase:'+program.id+':'+session.key,rec=state.scheduledSessions.find(x=>x.id===id),rev=rec.revisions[0],plan=rev.context.prescription;
 state.workouts.push({id:'done-'+session.key,date:session.date,createdAt:session.date+'T18:00:00.000Z',exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({weight:s.weight,reps:s.reps,rpe:s.targetRpe}))})),sessionIntent:{prescription:plan,schedule:{id,revisionAt:rev.recordedAt},timing:'planned-before-training'}});
}
const transition=Transition.preview(state,{programId:'handoff-source',asOf:end,now:end+'T21:00:00.000Z'});
state=Transition.save(state,transition,{confirmed:true,notes:'Ready for next block'},{now:end+'T21:01:00.000Z',id:'handoff-transition'});

const report=Handoff.inspect(state,{asOf:'2026-11-14'});
assert.equal(report.ready,true);
assert.equal(report.status,'ready');
assert.equal(report.transition.id,'handoff-transition');
assert(report.prefill);
assert.equal(report.prefill.startDate,'2026-11-16');
assert.equal(report.prefill.days.length,3);
for(const lift of ['squat','bench','deadlift'])assert.equal(report.prefill.trainingMaxKg[lift],config.lifts[lift].trainingMaxKg);
assert(report.checks.every(c=>c.ok));
assert.match(report.summary,/ready for athlete review/);

const draft=Handoff.inspect(state,{asOf:'2026-11-14',draftOpen:true});
assert.equal(draft.ready,false);assert(draft.blockers.some(x=>/unfinished workout draft/.test(x)));

const brokenRoles=structuredClone(state),benchId=state.transitionSnapshots[0].lifts.bench.exerciseId;brokenRoles.exerciseCatalog=brokenRoles.exerciseCatalog.filter(e=>e.id!==benchId);
const broken=Handoff.inspect(brokenRoles,{asOf:'2026-11-14'});
assert.equal(broken.ready,false);assert(broken.blockers.some(x=>/competition bench exercise mapping/.test(x)));

const first=Schedule.list(state.scheduledSessions)[0],conflictContext={...first,date:report.prefill.startDate,name:'Conflicting session'};
const conflictState={...state,scheduledSessions:Schedule.create(state.scheduledSessions,conflictContext,{id:'handoff-conflict',now:'2026-11-14T12:00:00.000Z'})};
const conflict=Handoff.inspect(conflictState,{asOf:'2026-11-14'});
assert.equal(conflict.ready,false);assert(conflict.blockers.some(x=>/overlap/.test(x)));

const unresolved=structuredClone(state);unresolved.transitionSnapshots[0].schedule.completed--;unresolved.transitionSnapshots[0].schedule.unconfirmed=1;
const pending=Handoff.inspect(unresolved,{asOf:'2026-11-14'});
assert.equal(pending.ready,false);assert(pending.blockers.some(x=>/pending or unconfirmed/.test(x)));

assert.equal(Handoff.mondayOnOrAfter('2026-11-14'),'2026-11-16');
assert.equal(Handoff.mondayOnOrAfter('2026-11-16'),'2026-11-16');
console.log('v2.46 next-program handoff readiness, conflicts, draft guard and prefill passed');
