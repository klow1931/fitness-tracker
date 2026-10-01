const assert=require('node:assert/strict');
const Story=require('../src/product/progress-story');
const Readiness=require('../src/product/decision-readiness');
const Phase=require('../src/product/phase-builder');
const {phaseFixture}=require('./fixtures/phase-builder');

const asOf='2026-09-28';
const workout=(id,date,weight,rpe=8)=>({id,date,createdAt:date+'T20:00:00.000Z',exercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight,reps:5,rpe}]}]});
const roles=Readiness.replace([],[{exerciseId:'s',role:'competition',competitionLift:'squat'}],{now:'2026-07-01T00:00:00.000Z',createId:()=> 'role-s'});
const beforePlan={version:1,capturedAt:'2026-09-14T10:00:00.000Z',source:{type:'program'},plannedExercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:110,reps:5,targetRpe:8}]}]};
const afterPlan={version:1,capturedAt:'2026-09-15T10:00:00.000Z',source:{type:'program'},plannedExercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets:[{weight:112.5,reps:5,targetRpe:8}]}]};
const phaseReview={
 id:'review-1',programId:'p1',phase:'accumulation',createdAt:'2026-09-15T10:00:00.000Z',
 choices:{squat:'progress',bench:'keep',deadlift:'keep'},exerciseLifts:{s:'squat'},
 findings:{squat:{name:'Competition Squat',reason:'All matched exposures stayed within the reviewed effort margin.',completedSessions:3,expectedSessions:3,comparedSets:9,overCapSessions:0,underCapSessions:3,averageRpe:7.5},bench:{name:'Bench'},deadlift:{name:'Deadlift'}},
 changes:[{id:'phase:p1:w10d1',before:{recordedAt:'2026-09-14T10:00:00.000Z',context:{prescription:beforePlan}},after:{recordedAt:'2026-09-15T10:00:00.000Z',context:{prescription:afterPlan}}}]
};
const state={
 exerciseCatalog:[{id:'s',name:'Competition Squat'}],exerciseRoles:roles,scheduledSessions:[],phasePrograms:[],meetCycles:[],phaseReviews:[phaseReview],
 workouts:[
  workout('b1','2026-07-10',100,8),workout('b2','2026-07-24',102.5,8),
  workout('middle','2026-08-20',106,8),
  workout('r1','2026-09-07',110,8),workout('r2','2026-09-21',112.5,8)
 ]
};

const report=Story.analyze(state,{asOf,weeks:12});
assert.equal(report.version,1);
assert.equal(report.movements.length,1);
const squat=report.movements[0];
assert.equal(squat.lift,'squat');
assert.equal(squat.baseline.capacityDays,2);
assert.equal(squat.recent.capacityDays,2);
assert.equal(squat.direction.status,'higher');
assert(squat.direction.deltaPct>0);
assert.equal(squat.reviews.length,1);
assert.equal(squat.reviews[0].action,'progress');
assert.equal(squat.reviews[0].changed,true);
assert.equal(report.decisions.rows.length,1);
assert.equal(report.decisions.rows[0].changedLifts,1);
assert.equal(report.program,null);

const sparse=Story.movementStory({...state,workouts:[workout('only-start','2026-07-10',100,8),workout('only-recent','2026-09-21',110,8)]},report.overview.markers[0],{asOf,weeks:12});
assert.equal(sparse.direction.status,'sparse');
assert.match(sparse.direction.reason,/At least two/);

const noRpe=Story.movementStory({...state,workouts:[
 workout('n1','2026-07-10',100,null),workout('n2','2026-07-24',102.5,null),
 workout('n3','2026-09-07',110,null),workout('n4','2026-09-21',112.5,null)
]},report.overview.markers[0],{asOf,weeks:12});
assert.equal(noRpe.direction.status,'insufficient');
assert.equal(noRpe.recent.bestCapacity,null);
assert(noRpe.recent.bestLoad);

const fixture=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let programState=Phase.save(fixture.state,Phase.prepare(fixture.state,fixture.config,args),{confirmed:true,notes:'Progress story program'},{...args,id:'story-phase'});
programState=Phase.schedule(programState,'story-phase',{...args,now:'2026-09-24T13:00:00.000Z'});
const program=programState.phasePrograms[0],first=program.sessions[0],scheduleId='phase:'+program.id+':'+first.key;
programState.workouts=[...(programState.workouts||[]),{id:'program-log',date:first.date,createdAt:first.date+'T20:00:00.000Z',exercises:[],sessionIntent:{schedule:{id:scheduleId}}}];
const programSummary=Story.selectedProgram(programState,first.date);
assert(programSummary);
assert.equal(programSummary.id,'story-phase');
assert.equal(programSummary.counts.completed,1);
assert.equal(programSummary.adherence,100);
assert.match(programSummary.definition,/explicitly skipped/);

console.log('v2.72 progress stories preserve sparse evidence guards, adaptation history and resolved-session adherence');