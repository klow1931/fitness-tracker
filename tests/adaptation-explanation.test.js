const assert=require('node:assert/strict');
const E=require('../src/product/adaptation-explanation');

const plan=(sets)=>({plannedExercises:[{exerciseId:'s',name:'Competition Squat',type:'strength',trackBy:'reps',sets}]});
const before={recordedAt:'2026-10-01T12:00:00.000Z',context:{prescription:plan([{weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8},{weight:150,reps:5,targetRpe:8}])}};
const after={recordedAt:'2026-10-05T12:00:00.000Z',context:{prescription:plan([{weight:147.5,reps:5,targetRpe:8},{weight:147.5,reps:5,targetRpe:8},{weight:147.5,reps:5,targetRpe:8}])}};
const cycleReview={
 version:3,id:'wr1',cycleId:'c1',week:1,phase:'accumulation',createdAt:'2026-10-05T12:00:00.000Z',
 choices:{squat:'reduce-load',bench:'keep',deadlift:'keep'},
 report:{findings:{
  squat:{name:'Competition Squat',exerciseId:'s',comparableRpeSets:4,aboveCap:2,incrementKg:2.5},
  bench:{name:'Competition Bench',reason:'Stayed within plan.'},deadlift:{name:'Competition Deadlift',reason:'Not enough evidence.'}
 }},
 changes:[{id:'meet:c1:w2d1',before,after}]
};
const state={meetCycles:[{id:'c1',sessions:[{key:'w2d1',exercises:[{exerciseId:'s',lift:'squat'}]}],weeklyReviews:[cycleReview]}],phaseReviews:[]};

const session=E.forSession(state,'meet:c1:w2d1');
assert(session);
assert.equal(session.kind,'cycle');
assert.equal(session.lifts.length,1);
assert.equal(session.lifts[0].lift,'squat');
assert.equal(session.lifts[0].action,'reduce-load');
assert.equal(session.lifts[0].impact.sessionCount,1);
assert.deepEqual(session.lifts[0].impact.loadDeltasKg,[-2.5,-2.5,-2.5]);
assert(session.lifts[0].evidence.some(x=>x.includes('4 directly comparable')));
assert(session.lifts[0].evidence.some(x=>x.includes('2 comparable sets above')));

const phaseBefore={recordedAt:'2026-11-01T12:00:00.000Z',context:{prescription:{plannedExercises:[{exerciseId:'b',name:'Competition Bench',sets:[{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}]}]}}};
const phaseAfter={recordedAt:'2026-11-02T12:00:00.000Z',context:{prescription:{plannedExercises:[{exerciseId:'b',name:'Competition Bench',sets:[{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}]}]}}};
const phaseReview={version:1,id:'pr1',programId:'p1',phase:'accumulation',createdAt:'2026-11-02T12:00:00.000Z',
 choices:{squat:'keep',bench:'add-set',deadlift:'keep'},exerciseLifts:{b:'bench'},
 findings:{bench:{name:'Competition Bench',reason:'All matched exposures stayed within the reviewed effort margin.',completedSessions:6,expectedSessions:6,comparedSets:12,overCapSessions:0,underCapSessions:6,averageRpe:7.5},squat:{name:'Squat'},deadlift:{name:'Deadlift'}},
 changes:[{id:'phase:p1:w5d2',before:phaseBefore,after:phaseAfter}]};
const phaseState={meetCycles:[],phaseReviews:[phaseReview]};
const p=E.forSession(phaseState,'phase:p1:w5d2');
assert.equal(p.lifts[0].action,'add-set');
assert.equal(p.lifts[0].impact.setDelta,1);
assert(p.lifts[0].why.includes('effort margin'));
assert(p.lifts[0].evidence.some(x=>x.includes('6/6 linked sessions')));
assert.equal(E.forSession(phaseState,'missing'),null);
assert.equal(E.accepted({...state,phaseReviews:[phaseReview]}).length,2);
console.log('v2.50 adaptation explanation tests passed');
