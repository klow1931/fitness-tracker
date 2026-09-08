const assert = require('assert');
const mod = require('../src/programming-adaptive');
const adaptive = require('../src/training/adaptive');

const program = { id: 'p1', days: [
  { day: 'Upper', exercises: ['Bench Press 3×5', 'Barbell Row 4×8'] },
  { day: 'Lower', exercises: ['Back Squat 3×5'] }
]};

let session = mod.buildNextSession(program, [], 'lb', adaptive);
assert.equal(session.dayIndex, 0);
assert.equal(session.exercises[0].name, 'Bench Press');
assert.equal(session.exercises[0].action, 'start');

const workouts = [{ id:'w1', date:'2026-09-06', programId:'p1', programDayIndex:0, programDayName:'Upper', exercises:[
  { name:'Bench Press', type:'strength', sets:[{reps:5,weight:315,rpe:7},{reps:5,weight:315,rpe:7.5},{reps:5,weight:315,rpe:8}] },
  { name:'Barbell Row', type:'strength', sets:[{reps:8,weight:185,rpe:8},{reps:8,weight:185,rpe:8}] }
]}];
session = mod.buildNextSession(program, workouts, 'lb', adaptive);
assert.equal(session.dayIndex, 1);
assert.equal(session.exercises[0].name, 'Back Squat');

const workouts2 = workouts.concat([{ id:'w2', date:'2026-09-07', programId:'p1', programDayIndex:1, programDayName:'Lower', exercises:[
  { name:'Back Squat', type:'strength', sets:[{reps:5,weight:400,rpe:7},{reps:5,weight:400,rpe:7.5},{reps:5,weight:400,rpe:8}] }
]}]);
session = mod.buildNextSession(program, workouts2, 'lb', adaptive);
assert.equal(session.dayIndex, 0);
assert(Math.abs(session.exercises[0].weight - (315 + 5 / 2.2046226218)) < 1e-9);
assert.equal(session.exercises[0].action, 'increase');
console.log('adaptive-program.test.js passed');
