/* Loadnote Adaptive Programs v0.6 — turns an active program into an adaptive next session. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteAdaptivePrograms = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseLine(line) {
    const raw = String(line || '').trim();
    const m = raw.match(/^(.+?)\s+(\d+)\s*[×x]\s*(\d+)(s)?(?:\s*@\s*RPE\s*(\d+(?:\.\d+)?))?\s*$/i);
    if (!m) return { name: raw.replace(/\s*@\s*~?[^ ]+.*$/i, '').trim(), sets: null, reps: null, targetRPE: 8 };
    return { name: m[1].trim(), sets: Number(m[2]), reps: Number(m[3]), duration: !!m[4], targetRPE: Number(m[5] || 8) };
  }

  function normalizeName(name) { return String(name || '').trim().toLowerCase(); }

  function findLastExercise(workouts, name, beforeDate) {
    const target = normalizeName(name);
    const sorted = (workouts || []).slice().sort((a,b) => String(b.date).localeCompare(String(a.date)));
    for (const w of sorted) {
      if (beforeDate && String(w.date) >= String(beforeDate)) continue;
      for (const ex of (w.exercises || [])) {
        if (ex.type !== 'cardio' && normalizeName(ex.name) === target) {
          const sets = (ex.sets || []).filter(s => Number(s.reps) > 0 && Number(s.weight) >= 0);
          if (sets.length) return { workout: w, exercise: ex, sets };
        }
      }
    }
    return null;
  }

  function stepFor(unit, weight) {
    const w = Number(weight) || 0;
    if (unit === 'lb') return (w >= 136 ? 5 : 2.5) / 2.2046226218;
    return w >= 140 ? 2.5 : 1.25;
  }

  function recommendationForExercise(def, workouts, unit, adaptiveEngine) {
    if (!def.name || def.duration) return { ...def, action: 'repeat', confidence: 'low', reason: 'No strength-load recommendation available for this movement.' };
    const last = findLastExercise(workouts, def.name);
    if (!last) return { ...def, action: 'start', weight: null, confidence: 'low', reason: 'No previous load found. Start conservatively and log RPE.' };
    const lastWeight = Math.max(...last.sets.map(s => Number(s.weight) || 0));
    const target = { weight: lastWeight, sets: def.sets || last.sets.length, reps: def.reps || Number(last.sets[0]?.reps || 5), targetRPE: def.targetRPE || 8 };
    const avgRPE = last.sets.map(s => Number(s.rpe)).filter(r => r >= 1 && r <= 10);
    const actual = last.sets;
    let rec = adaptiveEngine?.recommendSession ? adaptiveEngine.recommendSession({ target, actualSets: actual, unit, increment: stepFor(unit, lastWeight), recentTrend: 0, fatigue: 'normal' }) : null;
    if (!rec) rec = { action: 'repeat', nextWeight: lastWeight, reason: 'Repeat the most recent logged load.' };
    return { ...def, ...rec, weight: rec.nextWeight ?? lastWeight, lastDate: last.workout.date, lastAverageRPE: avgRPE.length ? Math.round(avgRPE.reduce((a,b)=>a+b,0)/avgRPE.length*10)/10 : null };
  }

  function nextDayIndex(program, workouts) {
    if (!program?.days?.length) return 0;
    const completed = (workouts || []).filter(w => w.programId === program.id && Number.isInteger(w.programDayIndex));
    if (!completed.length) return 0;
    completed.sort((a,b) => String(b.date).localeCompare(String(a.date)));
    return (Number(completed[0].programDayIndex) + 1) % program.days.length;
  }

  function buildNextSession(program, workouts, unit, adaptiveEngine) {
    if (!program?.days?.length) return null;
    const dayIndex = nextDayIndex(program, workouts);
    const day = program.days[dayIndex];
    const exercises = (day.exercises || []).map(parseLine).filter(x => x.name).map(def => recommendationForExercise(def, workouts, unit, adaptiveEngine));
    return { programId: program.id, dayIndex, dayName: day.day, exercises };
  }

  return { parseLine, findLastExercise, nextDayIndex, buildNextSession };
});
