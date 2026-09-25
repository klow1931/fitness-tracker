const assert=require('node:assert/strict'),Guidance=require('../src/product/phase-guidance'),Cycle=require('../src/product/meet-cycle'),Phase=require('../src/product/phase-builder'),Schedule=require('../src/product/schedule');
const {phaseFixture}=require('./fixtures/phase-builder');
const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const proposal=Phase.prepare(state,config,args),basis=Phase.save(state,proposal,{confirmed:true,notes:'Reviewed lift setup'},{...args,id:'lift-setup'});
function make(weeks){
 const d=new Date(config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(weeks-1)*7+5);
 const p=Cycle.prepare(basis,basis.phasePrograms[0],{version:1,weeks,peakWeeks:2,taperWeeks:1,meetDate:d.toISOString().slice(0,10)},args);
 const saved=Cycle.save(basis,p,{confirmed:true},{...args,id:'meet'+weeks});
 return Cycle.schedule(saved,'meet'+weeks,{...args,now:'2026-09-24T13:00:00.000Z'});
}
for(const weeks of [8,12,16,20,52]){
 const s=make(weeks),cycle=s.meetCycles[0],timestamp=date=>date+'T12:00:00.000Z';
 for(const w of [cycle.weekly[0],cycle.weekly.find(w=>w.phase==='strength'),cycle.weekly.find(w=>w.phase==='peaking'),cycle.weekly.find(w=>w.phase==='taper'),cycle.weekly.at(-1)]){
  const r=Guidance.inspect(s,{asOf:w.startDate,now:timestamp(w.startDate)});
  assert.equal(r.week,w.week);assert.equal(r.phase,w.phase);assert.equal(r.totalWeeks,weeks);
  assert.equal(r.nextReview,w.endDate);assert.equal(r.phaseReviewDate,cycle.weekly.filter(e=>e.phase===w.phase).at(-1).endDate);
  assert.equal(r.summary.planned,w.sessionCount);
  assert.equal(r.summary.completed,0);
  assert(r.warnings.some(x=>x.includes('unconfirmed')));
  assert.equal(Object.keys(r.lifts).length,3);
  if(w.phase==='mock-meet'){assert.equal(r.next,null);assert.equal(r.summary.planned,0);}
 }
 assert.equal(Guidance.inspect(s,{asOf:'2026-09-24',now:args.now}).status,'upcoming');
 assert.equal(Guidance.inspect(s,{asOf:cycle.config.meetDate,now:timestamp(cycle.config.meetDate)}).phase,'mock-meet');
 const after=new Date(cycle.config.meetDate+'T12:00:00Z');after.setUTCDate(after.getUTCDate()+1);
 assert.equal(Guidance.inspect(s,{asOf:after.toISOString().slice(0,10),now:after.toISOString()}).status,'completed');
}
const scheduled=make(12),before=JSON.stringify(scheduled),asOf='2026-09-30',now='2026-09-30T12:00:00.000Z';
const baseline=Guidance.inspect(scheduled,{asOf,now});assert.equal(baseline.week,1);assert.equal(baseline.summary.unconfirmed,1);assert.equal(baseline.summary.upcoming,2);
const item=scheduled.scheduledSessions[0],id=item.id,plan=item.revisions[0].context.prescription,exercise=plan.plannedExercises[0];
const performed={id:'linked',date:'2026-09-28',createdAt:'2026-09-28T17:00:00.000Z',exercises:[{exerciseId:exercise.exerciseId,name:exercise.name,type:'strength',trackBy:'reps',sets:exercise.sets.map((s,i)=>({weight:s.weight,reps:s.reps,rpe:i?null:Math.min(10,(s.targetRpe||7)+1)}))}],sessionIntent:{schedule:{id,revisionAt:item.revisions[0].recordedAt},prescription:plan}};
const withLog={...scheduled,workouts:[...scheduled.workouts,performed]},report=Guidance.inspect(withLog,{asOf,now});
assert.equal(report.summary.completed,1);assert.equal(report.summary.unconfirmed,0);assert.equal(report.lifts.squat.loggedExposures,1);assert.equal(report.lifts.squat.comparableRpeSets,1);assert.equal(report.lifts.squat.aboveCap,1);
assert.equal(Guidance.inspect({...withLog,workouts:[...withLog.workouts,{...performed,id:'future',createdAt:'2026-10-01T00:00:00.000Z'}]},{asOf,now}).summary.completed,1,'Future import ignored');
const late={...withLog,workoutRevisions:[...(withLog.workoutRevisions||[]),{workoutId:'linked',recordedAt:'2026-10-01T10:00:00.000Z',before:performed,after:{...performed,exercises:[]}}]};
assert.deepEqual(Guidance.inspect(late,{asOf,now}),report,'Later edits are rolled back');
const failedLink={...withLog,workouts:[...scheduled.workouts,{...performed,sessionIntent:{...performed.sessionIntent,schedule:{id,revisionAt:'2026-09-29T12:00:00.000Z'}}}]};
assert.equal(Guidance.inspect(failedLink,{asOf,now}).summary.unknown,1,'Unverified link cannot count as completed');
const skipped={...scheduled,scheduledSessions:Schedule.change(scheduled.scheduledSessions,id,{status:'skipped',reason:'Did not attend'},'2026-09-29T12:00:00.000Z')};
assert.equal(Guidance.inspect(skipped,{asOf,now}).summary.skipped,1);
assert.equal(Guidance.inspect(skipped,{asOf:'2026-09-28',now:'2026-09-28T18:00:00.000Z'}).summary.skipped,0,'Future skip does not leak');
assert.equal(Guidance.inspect(scheduled,{asOf,now}).summary.unconfirmed,1,'Unlogged past work is not an explicit skip');
assert.equal(JSON.stringify(scheduled),before,'Read-only inspection');
assert.equal(Guidance.inspect({...scheduled,meetCycles:[]},{asOf,now}),null);
assert.throws(()=>Guidance.inspect(scheduled,{asOf:'bad',now}),/valid/);
assert.throws(()=>Guidance.inspect(scheduled,{asOf:'2026-10-01',now}),/valid/);
console.log('Flexible cycle phase priorities, dated week/phase boundaries, linked RPE evidence, missing logs, cutoff, revisions and immutable history passed');
