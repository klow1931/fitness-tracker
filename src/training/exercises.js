/* Loadnote Exercise Intelligence v0.3 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteExercises = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const exercises = [
    ['back_squat','Back Squat','squat',['quads','glutes','adductors'],true],
    ['front_squat','Front Squat','squat',['quads','glutes'],false],
    ['bench_press','Bench Press','horizontal_push',['chest','triceps','front_delts'],true],
    ['paused_bench','Paused Bench Press','horizontal_push',['chest','triceps','front_delts'],true,'bench_press'],
    ['close_grip_bench','Close-Grip Bench Press','horizontal_push',['triceps','chest'],false,'bench_press'],
    ['incline_bench','Incline Bench Press','horizontal_push',['chest','front_delts','triceps'],false,'bench_press'],
    ['spoto_press','Spoto Press','horizontal_push',['chest','triceps'],false,'bench_press'],
    ['deadlift','Deadlift','hinge',['hamstrings','glutes','back'],true],
    ['paused_deadlift','Paused Deadlift','hinge',['hamstrings','glutes','back'],false,'deadlift'],
    ['deficit_deadlift','Deficit Deadlift','hinge',['hamstrings','glutes','back'],false,'deadlift'],
    ['romanian_deadlift','Romanian Deadlift','hinge',['hamstrings','glutes','back'],false,'deadlift'],
    ['overhead_press','Overhead Press','vertical_push',['shoulders','triceps'],false],
    ['barbell_row','Barbell Row','horizontal_pull',['back','biceps'],false],
    ['pull_up','Pull-Up','vertical_pull',['back','biceps'],false],
    ['lat_pulldown','Lat Pulldown','vertical_pull',['back','biceps'],false],
    ['leg_press','Leg Press','squat',['quads','glutes'],false],
    ['leg_curl','Leg Curl','knee_flexion',['hamstrings'],false],
    ['bulgarian_split_squat','Bulgarian Split Squat','unilateral_squat',['quads','glutes'],false],
    ['barbell_curl','Barbell Curl','elbow_flexion',['biceps'],false]
  ].map(([id,name,movement,primaryMuscles,competitionLift,parentLift]) => ({ id,name,movement,primaryMuscles,competitionLift,parentLift: parentLift || null }));

  const aliases = {
    'squat':'back_squat','back squat':'back_squat','barbell squat':'back_squat',
    'bench':'bench_press','bench press':'bench_press','barbell bench':'bench_press',
    'deadlift':'deadlift','barbell deadlift':'deadlift','ohp':'overhead_press','overhead press':'overhead_press',
    'row':'barbell_row','barbell row':'barbell_row','rdl':'romanian_deadlift','romanian deadlift':'romanian_deadlift'
  };
  const byId = Object.fromEntries(exercises.map(e => [e.id, e]));
  function normalizeName(name) { return String(name || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function resolve(name) { const n = normalizeName(name); return byId[n] || byId[aliases[n]] || exercises.find(e => normalizeName(e.name) === n) || null; }
  function related(name) { const e = resolve(name); if (!e) return []; return exercises.filter(x => x.id === e.id || x.parentLift === e.id || e.parentLift === x.id || (e.parentLift && x.parentLift === e.parentLift)); }
  return { exercises, resolve, related, normalizeName };
});
