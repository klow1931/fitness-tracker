const assert=require('node:assert/strict'),Phase=require('../src/product/phase-builder'),Meet=require('../src/product/meet-cycle'),Core=require('../src/core/loadnote-core'),{phaseFixture}=require('./fixtures/phase-builder');
const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const original=Phase.build(config);
assert.deepEqual(Phase.build({...config,periodization:'linear'}),original);
for(const style of ['linear','wave','undulating']){
 const proposal=Phase.prepare(state,{...config,periodization:style},args);
 const saved=Phase.save(state,proposal,{confirmed:true},{...args,id:'source-'+style}),source=saved.phasePrograms[0];
 assert.deepEqual(Phase.validate(JSON.parse(JSON.stringify(saved.phasePrograms))),saved.phasePrograms);
 if(style==='undulating'){
  assert.equal(source.decisionEnvironment.policies.undulatingLoading,'phase-undulating-v1');
  const bench=proposal.sessions.filter(s=>s.week===1).flatMap(s=>s.exercises).filter(e=>e.lift==='bench');
  assert.equal(bench.find(e=>e.role==='primary').sets[0].reps,5);
  assert.equal(bench.find(e=>e.role==='light').sets[0].reps,8);
  assert.equal(bench.find(e=>e.role==='primary').percentOfTrainingMax-bench.find(e=>e.role==='light').percentOfTrainingMax,7.5);
  assert.deepEqual(proposal.sessions.filter(s=>s.phase==='deload'),original.sessions.filter(s=>s.phase==='deload'));
  const broken=structuredClone(saved.phasePrograms);broken[0].decisionEnvironment.policies.undulatingLoading='wrong';assert.throws(()=>Phase.validate(broken),/policy identity/);
 }
 const cycle=Meet.prepare(saved,source,{version:1,eventType:'mock',meetDate:'2026-12-19'},args);
 assert(cycle.sessions.every(s=>s.date<cycle.config.meetDate));
 assert(!cycle.sessions.some(s=>s.phase==='mock-meet'));
 const fixed=cycle.sessions.filter(s=>['peaking','taper'].includes(s.phase));
 const baseline=Meet.prepare(Phase.save(state,Phase.prepare(state,config,args),{confirmed:true},{...args,id:'base'}),Phase.save(state,Phase.prepare(state,config,args),{confirmed:true},{...args,id:'base'}).phasePrograms[0],{version:1,eventType:'mock',meetDate:'2026-12-19'},args);
 assert.deepEqual(fixed,baseline.sessions.filter(s=>['peaking','taper'].includes(s.phase)));
 const cycleSaved=Meet.save(saved,cycle,{confirmed:true},{...args,id:'cycle-'+style});
 assert.deepEqual(Meet.validate(JSON.parse(JSON.stringify(cycleSaved.meetCycles))),cycleSaved.meetCycles);
 const normalized=Core.normalizeState({...cycleSaved,schemaVersion:32});assert.deepEqual(normalized.meetCycles,cycleSaved.meetCycles);
 const scheduled=Meet.schedule(cycleSaved,'cycle-'+style,args);assert.equal(scheduled.scheduledSessions.length,cycle.sessions.length);assert.deepEqual(scheduled.workouts,state.workouts);
}
const single=structuredClone(config);for(const l of Phase.LIFTS)single.lifts[l].exposures=single.lifts[l].exposures.filter(e=>e.role==='primary');
single.lifts.bench.exposures[0].day=2;
assert.throws(()=>Phase.build({...single,periodization:'undulating'}),/two different days/);
console.log('Meet prep loading styles, genuine rep variation, protected peak/taper, legacy replay and approved scheduling passed');
