const assert=require('node:assert/strict');
const Viewer=require('../src/product/program-workout-viewer');
const Phase=require('../src/product/phase-builder');
const Meet=require('../src/product/meet-cycle');
const {phaseFixture}=require('./fixtures/phase-builder');

const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let phase=Phase.save(state,Phase.prepare(state,config,args),{confirmed:true,notes:'viewer source'},{...args,id:'viewer-phase'});
phase=Phase.schedule(phase,'viewer-phase',{...args,now:'2026-09-24T13:00:00.000Z'});
let view=Viewer.view(phase,{asOf:'2026-09-24',programId:'viewer-phase'});
assert.equal(view.program.kind,'phase-program');
assert.equal(view.weeks.length,view.program.totalWeeks);
assert(view.sessions.length>0);
assert(view.sessions[0].exercises[0].trainingMaxKg>0,'viewer should enrich current Calendar prescription with reviewed TM metadata');
assert(view.sessions[0].exercises[0].purpose,'viewer should preserve the reviewed exercise purpose');
assert.equal(Viewer.day(phase,view.sessions[0].date,{asOf:'2026-09-24'}).length,1,'future Calendar days should expose planned workouts before completion');
assert.equal(Viewer.calendarDates(phase,{asOf:'2026-09-24'})[view.sessions[0].date].scheduled,1);

const currentId=view.sessions[0].id,record=phase.scheduledSessions.find(x=>x.id===currentId);
record.revisions.at(-1).context.prescription.plannedExercises[0].sets[0].weight+=2.5;
view=Viewer.view(phase,{asOf:'2026-09-24',programId:'viewer-phase'});
assert.equal(view.sessions[0].exercises[0].sets[0].weight,record.revisions.at(-1).context.prescription.plannedExercises[0].sets[0].weight,'viewer must use the current scheduled prescription, not a stale source copy');

const meetBase=Phase.save(state,Phase.prepare(state,config,args),{confirmed:true,notes:'viewer meet source'},{...args,id:'viewer-meet-source'});
const source=meetBase.phasePrograms[0],meetDate=(()=>{const d=new Date(source.config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+11*7+5);return d.toISOString().slice(0,10);})();
const proposal=Meet.prepare(meetBase,source,{version:1,meetDate,eventType:'mock'},args);
let meet=Meet.save(meetBase,proposal,{confirmed:true,notes:'viewer meet'},{...args,id:'viewer-meet'});
meet=Meet.schedule(meet,'viewer-meet',{...args,now:'2026-09-24T14:00:00.000Z'});
view=Viewer.view(meet,{asOf:'2026-09-24',programId:'viewer-meet'});
assert.equal(view.program.kind,'meet-cycle');
assert.equal(view.weeks.length,12);
assert.equal(view.weeks.at(-1).phase,'mock-meet');
assert.equal(view.weeks.at(-1).sessions.length,0,'event week remains visible even though it is not a scheduled workout');
assert(view.phases.some(p=>p.phase==='peaking'));
assert(view.phases.some(p=>p.phase==='taper'));

console.log('v2.69.2 current-program workout viewer resolves scheduled prescriptions, source context and event weeks');
