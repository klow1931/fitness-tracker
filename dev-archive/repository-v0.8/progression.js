/* Loadnote Next Workout Engine v0.3 — deterministic progression rules. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteProgression = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function recommend({ weight, reps, rpe, unit = 'kg', increment } = {}) {
    const w = Number(weight) || 0, r = Number(reps) || 0, effort = Number(rpe) || 0;
    const step = Number(increment) || (unit === 'lb' ? 5 : 2.5);
    if (w <= 0 || r <= 0) return { action: 'insufficient-data', nextWeight: null, reason: 'Log a completed set with weight and reps.' };
    if (!effort) return { action: 'repeat', nextWeight: w, reason: 'RPE was not logged, so hold the load until more data is available.' };
    if (effort >= 9.5) return { action: 'hold', nextWeight: w, reason: 'The set was very hard; repeat the load rather than adding weight.' };
    if (effort >= 8.5) return { action: 'hold', nextWeight: w, reason: 'The set landed near the top of the target effort range; hold the load.' };
    if (effort <= 7) return { action: 'increase', nextWeight: w + step, reason: 'The set was below the intended effort; a small load increase is reasonable.' };
    return { action: 'repeat', nextWeight: w, reason: 'The set was in a productive effort range; repeat and reassess.' };
  }
  return { recommend };
});
