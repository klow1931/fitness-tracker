const assert = require('assert');
const fatigue = require('../src/training/fatigue');
const core = require('../src/core/loadnote-core');

function workout(date, weight, rpe=8) {
  return { date, exercises: [{ name:'Bench Press', sets:[1,2,3].map(() => ({weight,reps:5,rpe})) }] };
}
const day = ago => { const d = new Date(); d.setUTCDate(d.getUTCDate() - ago); return d.toISOString().slice(0,10); };
const ws = [workout(day(28), 275, 7), workout(day(14), 280, 8), workout(day(7), 285, 9), workout(day(2), 305, 9.2), workout(day(0), 305, 9)];
assert(fatigue.loadRatio(ws).chronic >= 0);
assert(fatigue.rpeSignal(ws).averageRPE > 8);
const result = fatigue.analyze(ws, {plannedDaysPerWeek: 3});
assert(result.score >= 0 && result.score <= 100);
assert(['strong','normal','elevated-fatigue','high-fatigue'].includes(result.status));
assert(Array.isArray(result.flags));
assert(result.recommendation.length > 0);
for (const early of [[], [workout(day(0),80)], [workout(day(0),80,10)],
  [workout(day(0),80),workout(day(0),80),workout(day(0),80)],
  [workout(day(2),80),workout(day(1),80),workout(day(0),80)],
  [workout(day(40),80),workout(day(0),80)], [workout(day(-1),80)]]) {
  const baseline = fatigue.analyze(early);
  assert.equal(baseline.status, 'insufficient-data');
  assert.equal(baseline.score, null);
  assert.equal(baseline.load.ratio, null);
  assert.deepEqual(baseline.flags, []);
}
assert.equal(fatigue.analyze([workout(day(27),80),workout(day(14),80),workout(day(0),800)]).status,'high-fatigue');
assert.strictEqual(core.SCHEMA_VERSION, 10);
console.log('Fatigue tests passed');
