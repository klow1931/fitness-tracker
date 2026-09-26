const assert=require('node:assert/strict'),Meet=require('../src/product/mock-meet'),Cycle=require('../src/product/meet-cycle'),Phase=require('../src/product/phase-builder'),Core=require('../src/core/loadnote-core');
const {phaseFixture}=require('./fixtures/phase-builder');
const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
const reviewed=Phase.save(state,Phase.prepare(state,config,args),{confirmed:true},{...args,id:'setup'});
const date=weeks=>{const d=new Date(config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(weeks-1)*7+5);return d.toISOString().slice(0,10)};
for(const weeks of [8,12,16,20]){
 const p=Cycle.prepare(reviewed,reviewed.phasePrograms[0],{version:1,weeks,peakWeeks:2,taperWeeks:1,meetDate:date(weeks)},args);
 const saved=Cycle.save(reviewed,p,{confirmed:true},{...args,id:'cycle'+weeks});
 const scheduled=Cycle.schedule(saved,'cycle'+weeks,{...args,now:'2026-09-24T13:00:00.000Z'}),prior=JSON.stringify(scheduled);
 const meet=Meet.empty(),stamp=date(weeks)+'T18:00:00.000Z';
 assert.equal(Meet.inspect(scheduled,{cycleId:'cycle'+weeks,asOf:date(weeks),now:stamp}).totalKg,null);
 assert.throws(()=>Meet.save(scheduled,'cycle'+weeks,{date:date(weeks),attempts:meet,notes:''},{confirmed:true,now:stamp}),/at least one/);
 assert.throws(()=>Meet.save(scheduled,'cycle'+weeks,{date:date(weeks),attempts:meet,notes:''},{confirmed:true,now:date(weeks-1)+'T18:00:00.000Z'}),/on or after/);
 meet.squat[0]={status:'made',weightKg:150};
 meet.squat[1]={status:'missed',weightKg:165};
 meet.squat[2]={status:'made',weightKg:160};
 meet.bench[0]={status:'made',weightKg:90};
 meet.bench[1]={status:'missed',weightKg:97.5};
 meet.bench[2]={status:'passed',weightKg:null};
 meet.deadlift[0]={status:'made',weightKg:190};
 meet.deadlift[1]={status:'made',weightKg:200};
 meet.deadlift[2]={status:'unrecorded',weightKg:null};
 const raw={date:date(weeks),attempts:meet,notes:'Mock meet'};
 assert.throws(()=>Meet.save(scheduled,'cycle'+weeks,raw,{confirmed:false,now:stamp}),/confirm/);
 const result=Meet.save(scheduled,'cycle'+weeks,raw,{confirmed:true,now:stamp}),report=Meet.inspect(result,{cycleId:'cycle'+weeks,asOf:date(weeks),now:stamp});
 assert.equal(report.totalKg,450);assert.equal(report.lifts.squat.bestKg,160);
 assert.equal(report.lifts.bench.bestKg,90);assert.equal(report.lifts.deadlift.bestKg,200);
 assert.equal(report.lifts.bench.missed,1);assert.equal(report.lifts.bench.passed,1);
 assert.equal(report.phaseContext.totalWeeks,weeks);
 assert(report.phaseContext.phases.length>=3);
 assert.equal(JSON.stringify(scheduled),prior);assert.deepEqual(result.workouts,scheduled.workouts);
 assert.deepEqual(result.scheduledSessions,scheduled.scheduledSessions);
 assert.deepEqual(result.meetCycles[0].sessions,scheduled.meetCycles[0].sessions);
 assert.deepEqual(Meet.validate(result),result.meetCycles);
 const before=Meet.inspect(result,{cycleId:'cycle'+weeks,asOf:date(weeks),now:date(weeks)+'T17:00:00.000Z'});
 assert.equal(before.resultRecorded,false,'Future revisions excluded from historical reports');
 const revised=structuredClone(meet);revised.deadlift[2]={status:'made',weightKg:210};
 const changed=Meet.save(result,'cycle'+weeks,{...raw,attempts:revised},{confirmed:true,expectedRevision:stamp,now:date(weeks)+'T19:00:00.000Z'});
 assert.equal(changed.meetCycles[0].mockMeet.revisions.length,2);
 assert.equal(Meet.inspect(changed,{cycleId:'cycle'+weeks,asOf:date(weeks),now:stamp}).totalKg,450);
 assert.equal(Meet.inspect(changed,{cycleId:'cycle'+weeks,asOf:date(weeks),now:date(weeks)+'T19:00:00.000Z'}).totalKg,460);
 assert.throws(()=>Meet.save(changed,'cycle'+weeks,raw,{confirmed:true,expectedRevision:stamp,now:date(weeks)+'T20:00:00.000Z'}),/changed/);
 assert.deepEqual(Meet.validate(changed),changed.meetCycles);
}
const p=Cycle.prepare(reviewed,reviewed.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:date(12)},args);
const cycle=Cycle.schedule(Cycle.save(reviewed,p,{confirmed:true},{...args,id:'c12'}),'c12',{...args,now:'2026-09-24T13:00:00.000Z'});
const base=Meet.empty();base.squat[0]={status:'made',weightKg:150};
const raw={date:date(12),attempts:base,notes:''},stamp=date(12)+'T18:00:00.000Z';
let partial=Meet.save(cycle,'c12',raw,{confirmed:true,now:stamp});
assert.equal(Meet.inspect(partial,{cycleId:'c12',asOf:date(12),now:stamp}).totalKg,null,'Never sum missing lifts as zero');
assert.equal(Meet.inspect(partial,{cycleId:'c12',asOf:date(12),now:stamp}).lifts.squat.bestKg,150);
for(const bad of [
 {...raw,date:'2026-12-18'}, {...raw,attempts:{...base,squat:[{status:'made',weightKg:0},...base.squat.slice(1)]}},
 {...raw,attempts:{...base,squat:[{status:'made',weightKg:150.123},...base.squat.slice(1)]}},
 {...raw,attempts:{...base,squat:[{status:'passed',weightKg:150},...base.squat.slice(1)]}},
 {...raw,attempts:{...base,squat:[{status:'done',weightKg:150},...base.squat.slice(1)]}},
 {...raw,attempts:{...base,squat:base.squat.slice(0,2)}}, {...raw,notes:'x'.repeat(1001)}
])assert.throws(()=>Meet.save(cycle,'c12',bad,{confirmed:true,now:stamp}));
const tampered=structuredClone(partial);tampered.meetCycles[0].mockMeet.revisions[0].context.attempts.bench[0].weightKg=100;
assert.throws(()=>Meet.validate(tampered),/Only made|Invalid/);
const legacy=structuredClone(cycle);assert.deepEqual(Meet.validate(legacy),legacy.meetCycles,'Older cycles without results stay readable');
const migrated=Core.normalizeState({...legacy,schemaVersion:22});assert.equal(migrated.schemaVersion,23);assert.deepEqual(migrated.meetCycles,legacy.meetCycles);
console.log('v2.34 all cycle durations, real nine-attempt meet results, partial totals, corrections, cutoff, no historical rewrites and legacy records passed');
