const assert=require('node:assert/strict'),H=require('../src/product/training-cockpit');
const workout={exercises:[{name:'Bench',sets:[{weight:100,reps:5,rpe:8},{weight:100,reps:5}]},{name:'Cycling',type:'cardio',duration:10}]};
const before=JSON.stringify(workout),r=H.workoutTakeaway(workout);
assert.equal(r.logged,'2 strength sets recorded.');assert.match(r.watch,/1 set has no recorded RPE/);
assert.equal(JSON.stringify(workout),before);
assert.match(H.workoutTakeaway({exercises:[{sets:[{rpe:''},{rpe:null},{rpe:11}]}]}).watch,/3 sets/);
assert.match(H.workoutTakeaway({exercises:[{sets:[{rpe:8}]}]}).watch,/recovery is still separate/);
assert.match(H.workoutTakeaway({exercises:[{type:'cardio'}]}).watch,/no strength-effort/);
console.log('Workout takeaway reports actual logged evidence without inventing recovery');
