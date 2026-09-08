const assert = require('assert');
const fatigue = require('../src/training/fatigue');
const core = require('../src/core/loadnote-core');

function workout(date, weight, rpe=8) {
  return { date, exercises: [{ name:'Bench Press', sets:[1,2,3].map(() => ({weight,reps:5,rpe})) }] };
}
const ws = [
  workout('2026-08-10', 275, 7), workout('2026-08-12', 280, 7.5), workout('2026-08-15', 285, 8),
  workout('2026-08-17', 290, 8), workout('2026-08-19', 295, 8.5), workout('2026-08-22', 300, 8.5),
  workout('2026-08-24', 305, 9), workout('2026-08-26', 305, 9), workout('2026-08-29', 305, 9.2)
];
assert(fatigue.loadRatio(ws).chronic >= 0);
assert(fatigue.rpeSignal(ws).averageRPE > 8);
const result = fatigue.analyze(ws, {plannedDaysPerWeek: 3});
assert(result.score >= 0 && result.score <= 100);
assert(['strong','normal','elevated-fatigue','high-fatigue'].includes(result.status));
assert(Array.isArray(result.flags));
assert(result.recommendation.length > 0);
assert.strictEqual(core.SCHEMA_VERSION, 10);
console.log('Fatigue tests passed');
