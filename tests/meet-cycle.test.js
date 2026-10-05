const assert=require('node:assert/strict'),Meet=require('../src/product/meet-cycle'),Phase=require('../src/product/phase-builder'),Profile=require('../src/product/programming-profile'),Core=require('../src/core/loadnote-core'),Schedule=require('../src/product/schedule'),Observability=require('../src/product/cycle-observability');
const packageVersion=require('../package.json').version;
const {phaseFixture}=require('./fixtures/phase-builder');
const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const base=Phase.prepare(state,config,args),reviewed=Phase.save(state,base,{confirmed:true,notes:'Reviewed lift setup'},{...args,id:'base'}),source=reviewed.phasePrograms[0];
const before=JSON.stringify(reviewed);
const date=(weeks)=>{const d=new Date(config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(weeks-1)*7+5);return d.toISOString().slice(0,10)};
for(const weeks of [8,12,16,20,26,52]){
 const p=Meet.prepare(reviewed,source,{version:1,weeks,peakWeeks:2,taperWeeks:1,meetDate:date(weeks)},args);
 assert.equal(p.weekly.length,weeks);assert.equal(p.weekly.at(-1).phase,'mock-meet');assert.equal(p.weekly.at(-1).meetDate,date(weeks));
 assert.equal(p.sessions.length,p.weekly.slice(0,-1).reduce((n,w)=>n+w.sessionCount,0));
 assert.equal(new Set(p.sessions.map(s=>s.key)).size,p.sessions.length);
 assert(p.sessions.every(s=>s.date<date(weeks)&&s.week<weeks));
 assert.deepEqual(p.sessions.filter(s=>s.phase==='taper').flatMap(s=>s.exercises).flatMap(e=>e.sets).map(s=>s.targetRpe),[6,6,6]);
 assert.equal(p.config.accumulationWeeks+p.config.strengthWeeks+p.config.peakWeeks+p.config.taperWeeks+1,weeks);
 assert(p.qualityGate);assert.notEqual(p.qualityGate.status,'blocking');assert.equal(p.qualityGate.weekly.length,weeks);
 assert(p.sessions.every(s=>s.exercises.every(e=>e.sets.every(set=>set.weight>0&&set.weight<=e.trainingMaxKg*.85+.001))));
 if(weeks>16)assert(p.warnings.some(w=>w.includes('six progressive weeks')));
}
const p=Meet.prepare(reviewed,source,{version:1,meetDate:date(12),eventType:'mock'},args);
assert.equal(p.planningDecision.totalWeeks,12);assert.equal(p.planningDecision.config.weeks,12);assert.equal(p.config.accumulationWeeks+p.config.strengthWeeks+p.config.peakWeeks+p.config.taperWeeks+1,12);
assert.equal(p.weekly.filter(w=>w.phase==='peaking').length,2);assert.equal(p.weekly.filter(w=>w.phase==='taper').length,1);
const profileContext=Profile.current(reviewed.programmingProfiles).context,mismatchedProfile={...reviewed,programmingProfiles:Profile.save([],{...profileContext,eventDate:'2026-12-27'},{id:'profile-date-override',now:'2026-09-23T11:00:00.000Z'})},mismatchProposal=Meet.prepare(mismatchedProfile,source,p.config,args);assert(mismatchProposal.warnings.some(w=>w.includes('reviewed cycle date is allowed to override')),'Explicit cycle event dates should not have to equal the profile default');
assert.equal(JSON.stringify(reviewed),before);
assert.throws(()=>Meet.save(reviewed,p,{},args),/Review and approve/);
const saved=Meet.save(reviewed,p,{confirmed:true,notes:'Mock meet test'},{...args,id:'meet12'});
assert.equal(saved.meetCycles.length,1);assert.equal(saved.meetCycles[0].scheduledAt,null);assert.equal(saved.meetCycles[0].decisionEnvironment.releaseVersion,packageVersion);assert.equal(saved.meetCycles[0].decisionEnvironment.policies.meetCycle,'meet-cycle-v1');assert.equal(saved.meetCycles[0].decisionEnvironment.policies.programQualityGate,'program-quality-gate-v1');assert.equal(saved.meetCycles[0].decisionEnvironment.policies.programPlanning,'program-planning-decision-v1');assert.equal(saved.meetCycles[0].planningDecision.mode,'decisions');assert.equal(saved.meetCycles[0].qualityGate.status,'pass');assert(saved.meetCycles[0].planningDecision.cutoff<=saved.meetCycles[0].createdAt);assert.equal(Observability.audit(saved,{cycleId:'meet12',asOf:'2026-09-24'}).blocking,0);
assert.equal(JSON.stringify(saved.workouts),JSON.stringify(reviewed.workouts));
assert.deepEqual(Meet.validate(structuredClone(saved.meetCycles)),saved.meetCycles);
const softProfile={...saved,programmingProfiles:Profile.save(saved.programmingProfiles,{...profileContext,notes:'Updated planning note after cycle review'},{id:'soft-profile',now:'2026-09-24T12:30:00.000Z'})},softScheduled=Meet.schedule(softProfile,'meet12',{...args,now:'2026-09-24T13:00:00.000Z'});assert.equal(softScheduled.meetCycles[0].scheduledAt,'2026-09-24T13:00:00.000Z','Soft profile changes should not invalidate a compatible reviewed cycle');const hardProfile={...saved,programmingProfiles:Profile.save(saved.programmingProfiles,{...profileContext,availableDays:[0,2]},{id:'hard-profile',now:'2026-09-24T12:30:00.000Z'})};assert.throws(()=>Meet.schedule(hardProfile,'meet12',{...args,now:'2026-09-24T13:00:00.000Z'}),/available days/);
const scheduled=Meet.schedule(saved,'meet12',{...args,now:'2026-09-24T13:00:00.000Z'});
assert.equal(scheduled.scheduledSessions.length,p.sessions.length);
assert.equal(scheduled.meetCycles[0].scheduledAt,'2026-09-24T13:00:00.000Z');
assert(scheduled.scheduledSessions.every(s=>s.revisions[0].context.prescription.source.referenceId==='meet12'));
assert(scheduled.scheduledSessions.every(s=>s.revisions[0].context.date!==date(12)),'No inferred competition attempts');
assert.deepEqual(scheduled.meetCycles[0].sessions,p.sessions,'Immutable original');
assert.throws(()=>Meet.schedule(scheduled,'meet12',{...args,now:'2026-09-24T14:00:00.000Z'}));
const conflict={...saved,scheduledSessions:Schedule.create([],{date:p.sessions[0].date,name:'Existing',role:'mixed',goal:'Other',prescription:scheduled.scheduledSessions[0].revisions[0].context.prescription},{id:'occupied',now:args.now})};
assert.throws(()=>Meet.schedule(conflict,'meet12',{...args,now:'2026-09-24T14:00:00.000Z'}),/Calendar conflict/);
const altered=structuredClone(saved.meetCycles);altered[0].sessions[0].exercises[0].sets[0].weight=999;
assert.throws(()=>Meet.validate(altered),/differs/);
const invalid=overrides=>({...p.config,...overrides});
for(const bad of [invalid({weeks:6}),invalid({weeks:53}),invalid({peakWeeks:5}),invalid({taperWeeks:3}),invalid({weeks:7,peakWeeks:4}),invalid({meetDate:'2026-12-26'}),invalid({meetDate:'2026-12-15'})])assert.throws(()=>Meet.config(bad,source));
const tomorrow={...reviewed,programmingProfiles:[...reviewed.programmingProfiles,{...reviewed.programmingProfiles[0],id:'later',recordedAt:'2026-09-25T12:00:00.000Z',context:{...reviewed.programmingProfiles[0].context,notes:'Later'}}]};
assert.deepEqual(Meet.prepare(tomorrow,source,{planningInput:p.planningDecision.input},args),p,'As-known profile cutoff');
const old=Core.normalizeState({schemaVersion:22,workouts:reviewed.workouts,phasePrograms:reviewed.phasePrograms});
assert.equal(old.schemaVersion,30);assert.deepEqual(old.meetCycles,[]);assert.deepEqual(old.workouts,reviewed.workouts);
assert.deepEqual(Core.normalizeState({...scheduled}).meetCycles,scheduled.meetCycles);
const legacyCycles=structuredClone(saved.meetCycles);delete legacyCycles[0].qualityGate;delete legacyCycles[0].planningDecision;delete legacyCycles[0].decisionEnvironment.policies.programQualityGate;delete legacyCycles[0].decisionEnvironment.policies.programPlanning;assert.deepEqual(Meet.validate(legacyCycles),legacyCycles,'older meet cycles without planning/quality snapshots remain valid');

const competitionDate=(()=>{const d=new Date(config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(12-1)*7+2);return d.toISOString().slice(0,10);})();
const competition=Meet.prepare(reviewed,source,{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:competitionDate,eventType:'competition',eventName:'State Championships'},args);
assert.equal(competition.config.eventType,'competition');assert.equal(competition.config.eventName,'State Championships');
assert.equal(competition.weekly.at(-1).phase,'meet');assert.equal(competition.weekly.at(-1).meetDate,competitionDate);
assert.equal(competition.weekly.at(-1).sessionCount,0);assert(competition.warnings.some(w=>w.includes('Competition meet day')));
assert.throws(()=>Meet.prepare(reviewed,source,{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:competitionDate,eventType:'competition',eventName:''},args),/meet name/);
assert.throws(()=>Meet.prepare(reviewed,source,{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:competitionDate,eventType:'mock'},args),/Saturday or Sunday/);
assert.throws(()=>Meet.config({...competition.config,eventType:'unknown'},source),/mock meet or competition meet/);


const auto11Date=date(11),auto11=Meet.prepare(reviewed,source,{version:1,meetDate:auto11Date,eventType:'mock'},args);
assert.equal(auto11.config.weeks,11,'Meet date should determine total prep length without a separate week input');
assert.equal(auto11.planningDecision.mode,'decisions');
const custom11=Meet.prepare(reviewed,source,{version:1,meetDate:auto11Date,eventType:'mock',phaseOverride:{accumulationWeeks:3,strengthWeeks:4,peakWeeks:2,taperWeeks:1}},args);
assert.equal(custom11.planningDecision.mode,'athlete-customized');assert.deepEqual([custom11.config.accumulationWeeks,custom11.config.strengthWeeks,custom11.config.peakWeeks,custom11.config.taperWeeks],[3,4,2,1]);
assert.throws(()=>Meet.prepare(reviewed,source,{version:1,meetDate:auto11Date,eventType:'mock',phaseOverride:{accumulationWeeks:4,strengthWeeks:4,peakWeeks:2,taperWeeks:1}},args),/add up/);


const driftProposal=Meet.prepare(reviewed,source,{version:1,meetDate:date(8),eventType:'mock'},{asOf:'2026-09-24',now:'2026-09-24T12:10:00.000Z'});
const driftSaved=Meet.save(reviewed,driftProposal,{confirmed:true,notes:'clock drift save'},{asOf:'2026-09-24',now:'2026-09-24T12:15:00.000Z',id:'clock-drift'});
assert.equal(driftSaved.meetCycles.find(x=>x.id==='clock-drift').planningDecision.cutoff,'2026-09-24T12:15:00.000Z','accepted snapshot should use save-time cutoff when substantive planning context is unchanged');

console.log('Flexible mock/competition meet cycles, date-derived duration, event dates, caps, conflicts, kg and legacy migration passed');
