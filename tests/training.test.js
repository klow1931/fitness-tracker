const assert = require('node:assert/strict');
const Exercises = require('../src/training/exercises');
const Progression = require('../src/training/progression');

assert.equal(Exercises.resolve('Bench').id, 'bench_press');
assert.ok(Exercises.related('Bench Press').some(e => e.id === 'close_grip_bench'));
assert.equal(Progression.recommend({weight: 315, reps: 5, rpe: 10, unit: 'lb'}).action, 'hold');
assert.equal(Progression.recommend({weight: 315, reps: 5, rpe: 7, unit: 'lb'}).nextWeight, 320);
assert.equal(Progression.recommend({weight: 100, reps: 5, unit: 'kg'}).action, 'repeat');
console.log('Loadnote v0.3 training intelligence tests: PASS');
