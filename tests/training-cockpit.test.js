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

const prior=[{weight:'102.5',reps:'5',rpe:'8',done:true},{weight:'',reps:'',rpe:'',done:false}];
assert.deepEqual(Cockpit.repeatCompletedSet(prior,1),{weight:'102.5',measure:'5',fromSet:1});
assert.equal(Cockpit.repeatCompletedSet(prior,0),null);
assert.equal(Cockpit.repeatCompletedSet([{...prior[0],done:false},prior[1]],1),null);
assert.equal(Cockpit.repeatCompletedSet([prior[0],{...prior[1],weight:'0'}],1),null,'Explicit zero must not be overwritten');
assert.equal(Cockpit.repeatCompletedSet([prior[0],{...prior[1],rpe:'7.5'}],1),null,'Typed actual effort must not be overwritten');
assert.equal(Cockpit.repeatCompletedSet([{weight:'',reps:'5',done:true},prior[1]],1),null,'Unknown source load is not zero');
assert.equal(Cockpit.repeatCompletedSet([{weight:'105',reps:'3.5',done:true},prior[1]],1),null,'Fractional strength reps cannot be repeated');
assert.deepEqual(Cockpit.repeatCompletedSet([{weight:'0',duration:'30',done:true},{weight:'',duration:'',rpe:'',done:false}],1,'duration'),{weight:'0',measure:'30',fromSet:1});
assert.deepEqual(Cockpit.repeatCompletedSet([{weight:'85',reps:'4',done:true},{weight:'',reps:'',done:false},{weight:'90',reps:'5',done:true},{weight:'',reps:'',done:false}],3),{weight:'90',measure:'5',fromSet:3});

console.log('v2.74 training cockpit preserves display-unit load steps, planned targets and exercise transitions');