const assert=require('node:assert/strict');
const Analytics=require('../src/product/progress-analytics');
const Readiness=require('../src/product/decision-readiness');
const Schedule=require('../src/product/schedule');
const Intent=require('../src/product/session-intent');

const plan=Intent.createPrescription([{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:8}]}],{type:'program',label:'Squat'},'2026-08-01T08:00:00.000Z');
let roles=Readiness.replace([],[{exerciseId:'s',role:'competition',competitionLift:'squat'}],{now:'2026-08-01T00:00:00.000Z',createId:()=> 'role-s'});
const workout=(id,date,weight,rpe=8,scheduleId=null)=>({id,date,createdAt:date+'T20:00:00.000Z',exercises:[{name:'Competition Squat',exerciseId:'s',type:'strength',trackBy:'reps',sets:[{weight,reps:5,rpe}]}],
 sessionIntent:scheduleId?{version:1,role:'volume',goal:'Squat',prescription:plan,deviationReason:'none',deviationNotes:'',schedule:{id:scheduleId,revisionAt:'2026-08-01T08:00:00.000Z'}}:undefined});
const workouts=[
 workout('p1','2026-08-10',100,8),workout('p2','2026-08-24',102.5,8),
 workout('r1','2026-09-07',105,8,'sched-complete'),workout('r2','2026-09-21',107.5,8)
];
let scheduledSessions=[];
scheduledSessions=Schedule.create(scheduledSessions,{name:'Completed squat',date:'2026-09-07',role:'volume',goal:'Squat',prescription:plan},{id:'sched-complete',now:'2026-08-01T08:00:00.000Z'});
scheduledSessions=Schedule.create(scheduledSessions,{name:'Skipped squat',date:'2026-09-14',role:'volume',goal:'Squat',prescription:plan},{id:'sched-skip',now:'2026-08-01T08:01:00.000Z'});
scheduledSessions=Schedule.change(scheduledSessions,'sched-skip',{status:'skipped',reason:'Travel'},'2026-09-14T07:00:00.000Z');
scheduledSessions=Schedule.create(scheduledSessions,{name:'Unresolved squat',date:'2026-09-20',role:'volume',goal:'Squat',prescription:plan},{id:'sched-unresolved',now:'2026-08-01T08:02:00.000Z'});
const state={exerciseCatalog:[{id:'s',name:'Competition Squat'}],exerciseRoles:roles,workouts,scheduledSessions};

const report=Analytics.analyze(state,{asOf:'2026-09-28'});
assert.deepEqual(report.recentRange,{from:'2026-09-01',to:'2026-09-28'});
assert.deepEqual(report.priorRange,{from:'2026-08-04',to:'2026-08-31'});
assert.equal(report.recent.sessions,2);
assert.equal(report.prior.sessions,2);
assert.equal(report.recent.strengthSets,2);
assert.equal(report.recent.rpeCoverage,100);
assert.equal(report.schedule.counts.completed,1);
assert.equal(report.schedule.counts.skipped,1);
assert.equal(report.schedule.counts.unconfirmed,1);
assert.equal(report.schedule.adherence,50);
assert.equal(report.markerMode,'confirmed competition lifts');
assert.equal(report.markers.length,1);
assert.equal(report.markers[0].lift,'squat');
assert.equal(report.markers[0].recent.capacityDays,2);
assert.equal(report.markers[0].prior.capacityDays,2);
assert.equal(report.markers[0].comparison.status,'comparable');
assert(report.markers[0].comparison.deltaKg>0);

const sparse=Analytics.analyze({...state,workouts:[workouts[0],workouts[2]]},{asOf:'2026-09-28'});
assert.equal(sparse.markers[0].comparison.status,'sparse');
assert.match(sparse.markers[0].comparison.reason,/at least two/);

const fallback=Analytics.analyze({
 exerciseCatalog:[],exerciseRoles:[],scheduledSessions:[],workouts:[
  {id:'a',date:'2026-09-01',exercises:[{name:'Pull-up',type:'strength',trackBy:'reps',sets:[{weight:10,reps:5,rpe:8}]}]},
  {id:'b',date:'2026-09-08',exercises:[{name:'Pull-up',type:'strength',trackBy:'reps',sets:[{weight:12.5,reps:5,rpe:8}]}]},
  {id:'c',date:'2026-09-15',exercises:[{name:'Row',type:'strength',trackBy:'reps',sets:[{weight:60,reps:8,rpe:8}]}]}
 ]},{asOf:'2026-09-28'});
assert.equal(fallback.markerMode,'most-trained strength exercises');
assert.equal(fallback.markers[0].name,'Pull-up');
assert.equal(fallback.markers[0].source,'frequent');
console.log('v2.53 progress analytics windows, schedule execution, lift evidence, sparse guards and fallback markers passed');
