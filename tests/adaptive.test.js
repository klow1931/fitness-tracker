const assert = require('node:assert/strict');
const Adaptive = require('../src/training/adaptive');

let r = Adaptive.recommendSession({
  target: { weight: 315, sets: 3, reps: 5, targetRPE: 8 },
  actualSets: [{weight:315,reps:5,rpe:7},{weight:315,reps:5,rpe:7.5},{weight:315,reps:5,rpe:8}],
  unit: 'lb'
});
assert.equal(r.action, 'increase');
assert.equal(r.nextWeight, 320);

r = Adaptive.recommendSession({
  target: { weight: 315, sets: 3, reps: 5, targetRPE: 8 },
  actualSets: [{weight:315,reps:5,rpe:8},{weight:315,reps:5,rpe:9},{weight:315,reps:5,rpe:9.5}],
  unit: 'lb'
});
assert.equal(r.action, 'hold');

r = Adaptive.recommendSession({
  target: { weight: 315, sets: 3, reps: 5, targetRPE: 8 },
  actualSets: [{weight:315,reps:5,rpe:8.5},{weight:315,reps:4,rpe:9}],
  unit: 'lb'
});
assert.equal(r.action, 'hold');

r = Adaptive.recommendSession({
  target: { weight: 315, sets: 3, reps: 5, targetRPE: 8 },
  actualSets: [{weight:315,reps:5,rpe:8},{weight:315,reps:5,rpe:8}],
  unit: 'lb', fatigue: 'high'
});
assert.equal(r.action, 'reduce');
console.log('Loadnote v0.4 adaptive programming tests: PASS');
