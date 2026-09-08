/* Loadnote Adaptive Programming v0.4 — deterministic, session-level progression. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./progression'));
  else root.LoadnoteAdaptive = factory(root.LoadnoteProgression);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Progression) {
  'use strict';

  function validSet(s) {
    return Number(s?.reps) > 0 && Number(s?.weight) >= 0;
  }

  function summarizeSets(sets) {
    const completed = (sets || []).filter(validSet);
    const rpes = completed.map(s => Number(s.rpe)).filter(r => r >= 1 && r <= 10);
    const failed = completed.some(s => Number(s.reps) <= 0);
    return {
      count: completed.length,
      reps: completed.reduce((n, s) => n + Number(s.reps || 0), 0),
      averageRPE: rpes.length ? Math.round((rpes.reduce((a,b) => a+b,0) / rpes.length) * 10) / 10 : null,
      maxRPE: rpes.length ? Math.max(...rpes) : null,
      minRPE: rpes.length ? Math.min(...rpes) : null,
      weight: completed.length ? Math.max(...completed.map(s => Number(s.weight) || 0)) : 0,
      failed
    };
  }

  function recommendSession({ target, actualSets, unit = 'kg', increment, recentTrend = 0, fatigue = 'normal' } = {}) {
    const t = target || {};
    const sets = (actualSets || []).filter(validSet);
    if (!sets.length) return { action: 'repeat', confidence: 'low', reason: 'No completed sets were logged; repeat the planned exposure.' };

    const summary = summarizeSets(sets);
    const targetRPE = Number(t.targetRPE || t.rpe || 8);
    const targetReps = Number(t.reps || 0);
    const targetSets = Number(t.sets || sets.length);
    const avg = summary.averageRPE;
    const max = summary.maxRPE;
    const step = Number(increment) || (unit === 'lb' ? 5 : 2.5);
    const load = Number(t.weight ?? summary.weight) || 0;

    if (fatigue === 'high' && (avg == null || avg >= targetRPE - 0.25)) {
      return { action: 'reduce', nextWeight: Math.max(0, load - step), confidence: 'medium', reason: 'Recent training status suggests elevated fatigue and the target effort was not comfortably exceeded.' , summary };
    }
    if (max >= 9.5 || avg >= targetRPE + 1) {
      return { action: 'hold', nextWeight: load, confidence: 'high', reason: 'The session was substantially harder than intended. Hold the load and reassess.', summary };
    }
    if (summary.count < targetSets || (targetReps > 0 && sets.some(s => Number(s.reps) < targetReps))) {
      return { action: 'hold', nextWeight: load, confidence: 'high', reason: 'The prescribed work was not fully completed. Repeat the load before progressing.', summary };
    }
    if (avg != null && avg <= targetRPE - 1) {
      return { action: 'increase', nextWeight: load + step, confidence: 'high', reason: 'The full session was completed at least one RPE point below target. A small increase is appropriate.', summary };
    }
    if (avg != null && avg <= targetRPE - 0.5) {
      return { action: 'increase', nextWeight: load + step, confidence: 'medium', reason: 'The full session was completed below target effort. A small increase is reasonable.', summary };
    }
    if (recentTrend < -3 && avg != null && avg >= targetRPE - 0.5) {
      return { action: 'hold', nextWeight: load, confidence: 'medium', reason: 'Strength trend is declining, so holding the current exposure is preferable to forcing an increase.', summary };
    }
    return { action: 'repeat', nextWeight: load, confidence: 'medium', reason: 'The session landed near the intended effort. Repeat the exposure and reassess.', summary };
  }

  function recommendExercise(exercise, { targetRPE = 8, sets = 3, reps = 5, unit = 'kg', fatigue = 'normal', recentTrend = 0 } = {}) {
    const actual = (exercise?.sets || []).filter(validSet);
    const last = actual[actual.length - 1];
    const target = { weight: Number(last?.weight || 0), sets, reps, targetRPE };
    return recommendSession({ target, actualSets: actual, unit, fatigue, recentTrend });
  }

  return { summarizeSets, recommendSession, recommendExercise };
});
