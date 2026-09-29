const assert=require('node:assert/strict');
const Gate=require('../src/product/program-quality-gate');
const Meet=require('../src/product/meet-cycle');
const Phase=require('../src/product/phase-builder');
const {phaseFixture}=require('./fixtures/phase-builder');

const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const base=Phase.prepare(state,config,args),reviewed=Phase.save(state,base,{confirmed:true,notes:'quality source'},{...args,id:'quality-source'}),source=reviewed.phasePrograms[0];
const eventDate=weeks=>{const d=new Date(config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(weeks-1)*7+5);return d.toISOString().slice(0,10);};
for(const weeks of [8,12,16,20]){
  const proposal=Meet.prepare(reviewed,source,{version:1,weeks,peakWeeks:2,taperWeeks:1,meetDate:eventDate(weeks)},args);
  const gate=proposal.qualityGate;
  assert(gate,'meet-cycle prepare must attach quality gate');
  assert.notEqual(gate.status,'blocking',weeks+' week generated cycle must have no blocking quality defect');
  assert.equal(gate.weekly.length,weeks);
  assert.equal(gate.cycle.eventDate,eventDate(weeks));
  assert.equal(gate.weekly.at(-1).sessionCount,0);
  assert(gate.weekly.filter(w=>w.phase==='peaking'||w.phase==='taper').every(w=>Object.values(w.lifts).every(l=>l.variationSets===0&&l.competitionExposures>=1)));
  assert.deepEqual(Gate.validate(structuredClone(gate),proposal),gate);
  if(weeks===20)assert(gate.findings.some(f=>f.code==='extended-accumulation-hold'||f.code==='extended-strength-hold'));
}
const p=Meet.prepare(reviewed,source,{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:eventDate(12)},args),before=JSON.stringify(p);
assert.equal(Gate.inspect(p).status,'pass');
assert.equal(JSON.stringify(p),before,'quality inspection must be read-only');

const time=structuredClone(p);time.sessions[0].estimatedMinutes=time.sourceProgram.config.sessionMinutes+1;
let gate=Gate.inspect(time);assert.equal(gate.status,'blocking');assert(gate.findings.some(f=>f.code==='session-time-block'));
time.qualityGate=gate;assert.throws(()=>Meet.save(reviewed,time,{confirmed:true,notes:'must not save'},{...args,id:'blocked-cycle'}),/blocking program quality-gate/);

const lateVariation=structuredClone(p),peakSession=lateVariation.sessions.find(s=>s.phase==='peaking'),squat=peakSession.exercises.find(e=>e.lift==='squat');
squat.exerciseId=source.config.lifts.squat.variation.exerciseId;squat.name=source.config.lifts.squat.variation.name;squat.trainingMaxKg=source.config.lifts.squat.variation.trainingMaxKg;
gate=Gate.inspect(lateVariation);assert.equal(gate.status,'blocking');assert(gate.findings.some(f=>f.code==='late-variation'&&f.lift==='squat'));

const eventTraining=structuredClone(p);eventTraining.sessions.push({...structuredClone(p.sessions.at(-1)),key:'event-bug',week:12,date:eventDate(12),phase:'mock-meet',phaseWeek:1});
gate=Gate.inspect(eventTraining);assert.equal(gate.status,'blocking');assert(gate.findings.some(f=>f.code==='event-week-training'));assert(gate.findings.some(f=>f.code==='session-after-event'));

const transition=structuredClone(p),firstStrength=transition.weekly.find(w=>w.phase==='strength'),targetSessions=transition.sessions.filter(s=>s.week===firstStrength.week);
for(const session of targetSessions)for(const ex of session.exercises)for(let i=0;i<2;i++)ex.sets.push({...ex.sets.at(-1),weight:Math.min(ex.trainingMaxKg*.85,ex.sets.at(-1).weight*1.1)});
gate=Gate.inspect(transition);assert.notEqual(gate.status,'pass');assert(gate.findings.some(f=>f.code==='transition-double-jump'||f.code==='within-phase-set-jump'));

const tampered=structuredClone(p.qualityGate);tampered.inputFingerprint='bad';assert.throws(()=>Gate.validate(tampered,p),/does not match/);
console.log('v2.67 whole-cycle program quality gate tests passed');