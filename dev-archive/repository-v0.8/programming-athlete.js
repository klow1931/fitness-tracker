/* Loadnote Athlete Profile + Personalized Programming v0.7.
 * Deterministic athlete profiling and training-max logic. AI should explain, not calculate these values.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteAthlete = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LIFT_ALIASES = {
    squat: ['back squat', 'squat'],
    bench: ['bench press', 'barbell bench press', 'bench'],
    deadlift: ['deadlift', 'barbell deadlift'],
    overheadPress: ['overhead press', 'barbell overhead press', 'military press', 'ohp']
  };

  const DEFAULT_PROFILE = {
    version: 1,
    goal: 'strength',
    experience: 'intermediate',
    daysPerWeek: 4,
    programStyle: 'auto',
    squat: null,
    bench: null,
    deadlift: null,
    overheadPress: null,
    trainingMaxPercent: 0.90,
    targetDate: null,
    notes: ''
  };

  function normalizeProfile(profile) {
    const p = { ...DEFAULT_PROFILE, ...(profile || {}) };
    p.version = 1;
    p.daysPerWeek = Math.min(6, Math.max(2, Number(p.daysPerWeek) || 4));
    p.trainingMaxPercent = Math.min(1, Math.max(0.75, Number(p.trainingMaxPercent) || 0.90));
    ['squat','bench','deadlift','overheadPress'].forEach(k => {
      const v = Number(p[k]);
      p[k] = Number.isFinite(v) && v > 0 ? v : null;
    });
    return p;
  }

  function normalizeName(name) { return String(name || '').trim().toLowerCase(); }

  function findHistoryMax(workouts, aliases, core) {
    const names = new Set(aliases.map(normalizeName));
    let best = null;
    (workouts || []).forEach(w => (w.exercises || []).forEach(ex => {
      if (ex.type === 'cardio' || !names.has(normalizeName(ex.name))) return;
      (ex.sets || []).forEach(s => {
        const reps = Number(s.reps), weight = Number(s.weight);
        if (!(reps > 0) || !(weight > 0)) return;
        const e1rm = core?.estimated1RM ? core.estimated1RM(weight, reps, s.rpe) : weight * (1 + reps / 30);
        if (!best || e1rm > best.estimated1RM) best = { weight, reps, rpe: Number(s.rpe) || null, estimated1RM: e1rm, date: w.date };
      });
    }));
    return best;
  }

  function calculateTrainingMaxes(profile, workouts, core) {
    const p = normalizeProfile(profile);
    const result = {};
    Object.entries(LIFT_ALIASES).forEach(([lift, aliases]) => {
      const manual = p[lift];
      const history = findHistoryMax(workouts, aliases, core);
      const estimated1RM = manual || history?.estimated1RM || null;
      result[lift] = {
        estimated1RM,
        trainingMax: estimated1RM ? Math.round(estimated1RM * p.trainingMaxPercent * 10) / 10 : null,
        source: manual ? 'profile' : history ? 'training history' : 'missing',
        bestSet: history || null
      };
    });
    return result;
  }

  function inferProfileFromData(data, core) {
    const p = normalizeProfile(data?.athleteProfile);
    const tms = calculateTrainingMaxes(p, data?.workouts || [], core);
    ['squat','bench','deadlift','overheadPress'].forEach(lift => {
      if (!p[lift] && tms[lift].estimated1RM) p[lift] = tms[lift].estimated1RM;
    });
    return p;
  }

  function weeklyProgressionAction({ currentWeek = 1, completedSessions = 0, plannedSessions = 0, avgRPE = null, volumeChangePercent = null, strengthTrendPercent = null, failedSessions = 0 } = {}) {
    const completion = plannedSessions > 0 ? completedSessions / plannedSessions : 1;
    if (failedSessions >= 2 || (avgRPE != null && avgRPE >= 9.3 && strengthTrendPercent != null && strengthTrendPercent < 0)) {
      return { action: 'deload', confidence: 'high', reason: 'Repeated missed work or high effort with declining performance suggests the next block should reduce fatigue.' };
    }
    if (completion < 0.75) {
      return { action: 'maintain', confidence: 'high', reason: 'A large portion of planned sessions was missed, so progress the block only after restoring consistency.' };
    }
    if (avgRPE != null && avgRPE >= 9.0) {
      return { action: 'maintain', confidence: 'medium', reason: 'Average effort is high. Maintain the current training max rather than forcing another increase.' };
    }
    if (strengthTrendPercent != null && strengthTrendPercent < -2) {
      return { action: 'maintain', confidence: 'medium', reason: 'Recent strength trend is declining. Hold the block and reassess before increasing training maxes.' };
    }
    if (avgRPE != null && avgRPE <= 7.5 && (strengthTrendPercent == null || strengthTrendPercent >= 0)) {
      return { action: 'progress', confidence: 'high', reason: 'Training is being completed below the intended effort while strength is stable or improving.' };
    }
    return { action: 'progress', confidence: 'medium', reason: 'The current block is being completed adequately. A small planned progression is reasonable.' };
  }

  function roundLoad(kg, unit) {
    const step = unit === 'lb' ? 2.5 / 2.2046226218 : 1.25;
    return Math.round(kg / step) * step;
  }

  function buildPersonalizedSummary(profile, tms, unit) {
    const p = normalizeProfile(profile);
    const labels = { squat:'Squat', bench:'Bench', deadlift:'Deadlift', overheadPress:'Overhead Press' };
    return Object.keys(labels).map(k => {
      const row = tms[k];
      if (!row?.estimated1RM) return { lift: labels[k], available: false };
      return { lift: labels[k], available: true, estimated1RM: row.estimated1RM, trainingMax: row.trainingMax, source: row.source };
    });
  }

  return { DEFAULT_PROFILE, normalizeProfile, calculateTrainingMaxes, inferProfileFromData, weeklyProgressionAction, roundLoad, buildPersonalizedSummary };
});
