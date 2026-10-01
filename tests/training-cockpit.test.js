const assert=require('node:assert/strict');
const Cockpit=require('../src/product/training-cockpit');

assert.deepEqual(Cockpit.loadSteps('lb'),{small:2.5,large:5});
assert.deepEqual(Cockpit.loadSteps('kg'),{small:1.25,large:2.5});
assert.equal(Cockpit.adjustDisplayWeight(100,5),105);
assert.equal(Cockpit.adjustDisplayWeight(2.5,-5),0);
assert.equal(Cockpit.adjustDisplayWeight('',2.5),2.5);
assert.equal(Cockpit.adjustDisplayWeight(100,Number.NaN),null);

const plan={plannedExercises:[
 {exerciseId:'bench',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
  {weight:100,reps:5,targetRpe:7},{weight:102.5,reps:5,targetRpe:8}
 ]},
 {name:'Plank',type:'strength',trackBy:'duration',sets:[{weight:0,duration:30,targetRpe:6}]}
]};
assert.deepEqual(Cockpit.targetSet(plan,{exerciseId:'bench',name:'Bench',trackBy:'reps'},1),{
 exercise:'id:bench',weight:102.5,reps:5,duration:null,targetRpe:8
});
assert.deepEqual(Cockpit.targetSet(plan,{name:'Competition Bench',trackBy:'reps'},0),{
 exercise:'id:bench',weight:100,reps:5,duration:null,targetRpe:7
});
assert.deepEqual(Cockpit.targetSet(plan,{name:'Plank',trackBy:'duration'},0),{
 exercise:'name:plank',weight:0,reps:null,duration:30,targetRpe:6
});
assert.equal(Cockpit.targetSet(plan,{exerciseId:'bench',trackBy:'duration'},0),null);

assert.equal(Cockpit.transition(0,1),true);
assert.equal(Cockpit.transition(1,1),false);
assert.equal(Cockpit.transition(1,3),false);
assert.equal(Cockpit.elapsedMinutes('2026-10-01T12:00:00.000Z','2026-10-01T12:37:59.000Z'),37);
assert.equal(Cockpit.elapsedMinutes('bad','2026-10-01T12:37:59.000Z'),null);

console.log('v2.74 training cockpit preserves display-unit load steps, planned targets and exercise transitions');