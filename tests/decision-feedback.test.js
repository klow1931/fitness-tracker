const assert=require('node:assert/strict');
const Feedback=require('../src/product/decision-feedback');

const decision={
  version:4,asOf:'2026-09-18',lift:'squat',label:'Squat',mode:'current-corrected',readiness:'ready',
  decision:'increase',decisionAllowed:true,reason:'Capacity improved.',nextExposure:'Progress modestly.',watchNext:'Keep effort controlled.',
  evidence:[
    {workoutId:'a',date:'2026-09-04',exerciseId:'squat-id',weight:180,reps:5,rpe:8,estimatedCapacity:228},
    {workoutId:'b',date:'2026-09-11',exerciseId:'squat-id',weight:185,reps:5,rpe:8,estimatedCapacity:234.3},
    {workoutId:'c',date:'2026-09-18',exerciseId:'squat-id',weight:190,reps:5,rpe:8,estimatedCapacity:240.7}
  ]
};

let events=Feedback.record([],decision,{response:'accept'},{now:'2026-09-18T21:00:00.000Z',id:'event-1'});
assert.equal(events.length,1);
assert.equal(events[0].response,'accept');
assert.equal(events[0].chosenDirection,null);
assert.equal(events[0].snapshot.decision,'increase');
assert.equal(Feedback.find(events,decision).id,'event-1');

events=Feedback.record(events,decision,{response:'modify',chosenDirection:'hold',note:'Meet week is close.'},{now:'2026-09-18T21:05:00.000Z'});
assert.equal(events.length,1,'changing a response must not duplicate the same decision event');
assert.equal(events[0].id,'event-1');
assert.equal(events[0].response,'modify');
assert.equal(events[0].chosenDirection,'hold');
assert.equal(events[0].note,'Meet week is close.');

assert.throws(()=>Feedback.record(events,decision,{response:'modify'},{now:'2026-09-18T21:10:00.000Z'}),/Increase, Hold, or Reduce/);

const state={decisionEvents:events,workouts:[
  {id:'future',date:'2026-09-25',exercises:[{exerciseId:'squat-id',name:'Back Squat',sets:[{weight:195,reps:5,rpe:8}]}]},
  {id:'other',date:'2026-09-20',exercises:[{exerciseId:'bench-id',name:'Bench Press',sets:[{weight:100,reps:5,rpe:8}]}]}
]};
const history=Feedback.history(state);
assert.equal(history.length,1);
assert.equal(history[0].outcome.date,'2026-09-25');
assert.ok(history[0].outcome.capacityChangePct>0);
assert.equal(history[0].outcome.exerciseId,'squat-id');

const renamed={...state,workouts:[{id:'future',date:'2026-09-25',exercises:[{exerciseId:'different-id',name:'Back Squat',sets:[{weight:250,reps:5,rpe:8}]}]}]};
assert.equal(Feedback.history(renamed)[0].outcome,null,'outcomes must follow saved exercise identity, not a later matching label');

console.log('v2.4 decision feedback recording and outcome linkage passed');
