const assert=require('node:assert/strict');
const Custom=require('../src/product/custom-program');
const Weekly=require('../src/product/custom-program-weekly-review');
const Schedule=require('../src/product/schedule');
const Core=require('../src/core/loadnote-core');
const Integrity=require('../src/product/data-integrity');
const Sync=require('../src/product/sync-model');
const Coach=require('../src/product/custom-program-coach');

const asOf='2026-10-13',now='2026-10-13T19:00:00.000Z';
let state=Core.normalizeState({workouts:[],customPrograms:[],customProgramWeeklyReviews:[],scheduledSessions:[],exerciseCatalog:[]});
const raw={name:'My 2-week strength block',weeks:2,startDate:'2026-10-05',unit:'kg',rows:[
 {week:1,day:'Monday',exercise:'Competition Bench',type:'strength',sets:2,reps:5,weight:100,rpe:8},
 {week:1,day:'Wednesday',exercise:'Easy Run',type:'cardio',minutes:20},
 {week:2,day:'Monday',exercise:'Competition Bench',type:'strength',sets:2,reps:5,weight:102.5,rpe:8}
]};
state=Custom.save(state,Custom.build(state,raw),{id:'program',confirmed:true,now:'2026-09-20T11:00:00.000Z'});
state=Custom.schedule(state,'program',{now:'2026-09-21T11:00:00.000Z'});
const baseline=Weekly.inspect(state,'program',{asOf,now});
assert.equal(baseline.week,1);
assert.equal(baseline.totals.planned,2);
assert.equal(baseline.totals.unconfirmed,2);
assert.equal(baseline.totals.skipped,0);
assert.equal(baseline.observations[0].kind,'gather');
assert.throws(()=>Weekly.inspect(state,'program',{week:2,asOf,now}),/completed/);
assert.equal(Weekly.inspect(state,'program',{asOf:'2026-10-06',now}).status,'waiting');
assert.equal(Weekly.inspect({...state,customPrograms:state.customPrograms.map(x=>({...x,scheduledAt:null}))},'program',{asOf,now}).status,'unscheduled');

const previous=Schedule.list(state.scheduledSessions)[0];
const w={id:'work1',date:'2026-10-05',createdAt:'2026-10-05T18:00:00.000Z',sessionIntent:{schedule:{id:previous.id,revisionAt:previous.revisionAt},prescription:previous.prescription},exercises:[{name:'Competition Bench',exerciseId:previous.prescription.plannedExercises[0].exerciseId,type:'strength',sets:[{reps:5,weight:100,rpe:9},{reps:5,weight:100,rpe:8}]}]};
state={...state,workouts:[w]};
const evidence=Weekly.inspect(state,'program',{asOf,now});
assert.equal(evidence.totals.completed,1);
assert.equal(evidence.totals.unconfirmed,1);
assert.equal(evidence.totals.matchedSets,2);
assert.equal(evidence.totals.effortCompared,2);
assert.equal(evidence.totals.aboveCap,1);
const originalWorkouts=JSON.stringify(state.workouts),originalSchedule=JSON.stringify(state.scheduledSessions);
const checkIn={sleep:'poor',fatigue:'elevated',soreness:'usual',sessionExperience:'modified',notes:'Took an extra rest day.'};
assert.throws(()=>Weekly.save(state,'program',1,checkIn,{asOf,now}),/Confirm/);
assert.throws(()=>Weekly.save(state,'program',1,{...checkIn,fatigue:'recovered'},{asOf,now,confirmed:true}),/fatigue/);
state=Weekly.save(state,'program',1,checkIn,{asOf,now,confirmed:true});
assert.equal(state.customProgramWeeklyReviews.length,1);
assert.equal(Weekly.inspect(state,'program',{asOf,now}).checkIn.checkIn.fatigue,'elevated');
assert.ok(Weekly.inspect(state,'program',{asOf,now}).observations.some(o=>o.label==='Discuss reported recovery'));
assert.equal(JSON.stringify(state.workouts),originalWorkouts);
assert.equal(JSON.stringify(state.scheduledSessions),originalSchedule);
assert.match(Weekly.explain(Weekly.inspect(state,'program',{asOf,now})),/unconfirmed/);
assert.equal(Coach.questionKind('How did I do in my uploaded program this week?'),'weekly');
assert.match(Coach.answer(state,'Review my custom program weekly review',{asOf}).text,/week 1/);
const correction=Weekly.save(state,'program',1,{...checkIn,sleep:'adequate',notes:'Correction'},{asOf,now:'2026-10-13T20:00:00.000Z',confirmed:true});
assert.equal(correction.customProgramWeeklyReviews.length,2);
assert.equal(Weekly.inspect(correction,'program',{asOf,now:'2026-10-13T21:00:00.000Z'}).checkIn.checkIn.notes,'Correction');
assert.equal(Weekly.inspect(correction,'program',{asOf,now}).checkInCount,1);
assert.throws(()=>Weekly.validate([{...correction.customProgramWeeklyReviews[0],checkIn:{...checkIn,sleep:'diagnosed'}}]),/sleep/);
assert.throws(()=>Weekly.validateState({...correction,customPrograms:[]}),/missing or mismatched program/);
assert.throws(()=>Weekly.validateState({...correction,customProgramWeeklyReviews:[{...correction.customProgramWeeklyReviews[0],from:'2026-09-28',through:'2026-10-04'}]}),/missing or mismatched program/);
assert.equal(Core.normalizeState({schemaVersion:33,customPrograms:[],workouts:[]}).schemaVersion,34);
assert.deepEqual(Core.normalizeState({schemaVersion:33,customPrograms:[],workouts:[]}).customProgramWeeklyReviews,[]);
const backup=Integrity.addBackupManifest(correction);
assert.equal(Integrity.verifyBackupManifest(backup).verified,true);
assert.equal(backup._loadnoteBackup.counts.customProgramWeeklyReviews,2);
assert.equal(Sync.project(correction).collections.customProgramWeeklyReviews.length,2);
const pkg=Sync.createPackage(correction,{clientId:'pilot'});
assert.equal(Sync.verifyPackage(pkg).verified,true);
assert.equal(Sync.projectState(pkg.data).customProgramWeeklyReviews.length,2);
const incompatible=JSON.parse(JSON.stringify(pkg));delete incompatible.data.collections.customProgramWeeklyReviews;
assert.equal(Sync.verifyPackage(incompatible).verified,false);
console.log('v3.71–v3.73 weekly athlete review, honest evidence, append-only self-reports, backup and sync passed');
