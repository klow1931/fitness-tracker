const assert = require('assert');
const Athlete = require('../src/programming-athlete');
const Core = require('../src/core/loadnote-core');

const p = Athlete.normalizeProfile({ goal:'powerlifting', experience:'advanced', daysPerWeek:5, bench:150, trainingMaxPercent:.9 });
assert.strictEqual(p.daysPerWeek, 5);
assert.strictEqual(p.bench, 150);

const workouts = [{ date:'2026-09-01', exercises:[{ name:'Bench Press', sets:[{weight:140,reps:5,rpe:8}]}] }];
const tms = Athlete.calculateTrainingMaxes(Athlete.normalizeProfile({}), workouts, Core);
assert.ok(tms.bench.estimated1RM > 0);
assert.ok(tms.bench.trainingMax < tms.bench.estimated1RM);
assert.strictEqual(tms.bench.source, 'training history');

assert.strictEqual(Athlete.weeklyProgressionAction({completedSessions:4,plannedSessions:4,avgRPE:7.2,strengthTrendPercent:2}).action, 'progress');
assert.strictEqual(Athlete.weeklyProgressionAction({completedSessions:4,plannedSessions:4,avgRPE:9.5,strengthTrendPercent:-3,failedSessions:2}).action, 'deload');
assert.strictEqual(Athlete.weeklyProgressionAction({completedSessions:2,plannedSessions:4,avgRPE:8}).action, 'maintain');

console.log('athlete.test.js: all assertions passed');
