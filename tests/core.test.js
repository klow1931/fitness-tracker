const assert = require('node:assert/strict');
const Core = require('../src/core/loadnote-core');
const Analytics = require('../src/training/analytics');
const Exercises = require('../src/training/exercises');
const Progression = require('../src/training/progression');

const defaults = { workouts: [], nutrition: [], prs: [], goals: [], programs: [], templates: [], bodyweight: [], foodLibrary: [], restDays: [], progressPhotos: [], measurements: [], formReviews: [], exerciseNotes: {}, unit: 'kg', measureUnit: 'cm', api: {} };

const migrated = Core.normalizeState({ workouts: [{ date: '2026-09-01', exercises: [] }], schemaVersion: 1 }, defaults);
assert.equal(migrated.schemaVersion, 11);
assert.equal(migrated.trainingIntelligenceVersion, 1);
assert.equal(migrated.adaptiveProgrammingVersion, 2);
assert.equal(migrated.coachVersion, 2);
assert.equal(migrated.api.backendEnabled, false);
assert.ok(migrated.workouts[0].id);

assert.equal(Core.estimated1RM(100, 1), 100);
assert.equal(Core.estimated1RM(100, 5), 116.7);
assert.equal(Core.estimated1RM(100, 5, 8), 123.3);

const workout = { date: '2026-09-07', exercises: [{ name: 'Bench Press', type: 'strength', sets: [{ reps: 5, weight: 100, rpe: 8 }, { reps: 5, weight: 100, rpe: 9 }] }] };
assert.equal(Core.calcVolume(workout), 1000);
assert.equal(Core.averageRPE([workout]), 8.5);

const workouts = [
  { date: '2026-08-10', exercises: [{ name: 'Bench Press', sets: [{ reps: 5, weight: 90, rpe: 8 }] }] },
  { date: '2026-09-01', exercises: [{ name: 'Bench Press', sets: [{ reps: 5, weight: 100, rpe: 8 }] }] }
];
const trend = Analytics.exerciseTrend(workouts, 'Bench Press', 60);
assert.equal(trend.sessions, 2);
assert.ok(trend.change.percent > 0);
assert.equal(Analytics.plateauSignal(workouts, 'Bench Press').status, 'insufficient-data');

console.log('Loadnote v0.2 core tests: PASS');
