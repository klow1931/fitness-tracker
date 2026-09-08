/* Loadnote Adaptive Mesocycle Engine v0.8 — week-to-week programming decisions. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LoadnoteMesocycle = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT = { lengthWeeks: 4, currentWeek: 1, lastDecision: null, decisionReason: '', decisionAt: null, blockIndex: 1 };

  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function normalizeState(input, daysPerWeek) {
    const s = { ...DEFAULT, ...(input || {}) };
    s.lengthWeeks = Math.min(8, Math.max(2, Number(s.lengthWeeks) || 4));
    s.currentWeek = Math.min(s.lengthWeeks, Math.max(1, Number(s.currentWeek) || 1));
    s.blockIndex = Math.max(1, Number(s.blockIndex) || 1);
    return s;
  }

  function parseLine(line) {
    const raw = String(line || '').trim();
    const m = raw.match(/^(.+?)\s+(\d+)\s*[×x]\s*(\d+)(s)?(?:\s*@\s*(?:~)?\s*(\d+(?:\.\d+)?)%?)?\s*$/i);
    if (!m) return { name: raw, sets: 1, reps: 5, duration: false, basePercent: null, targetRPE: 8 };
    const trailing = Number(m[5]);
    return { name: m[1].trim(), sets: Number(m[2]), reps: Number(m[3]), duration: !!m[4], basePercent: trailing && trailing <= 100 ? trailing / 100 : null, targetRPE: trailing && trailing <= 10 ? trailing : 8 };
  }

  function liftKey(name) {
    const n = String(name || '').toLowerCase();
    if (/back squat|^squat$/.test(n)) return 'squat';
    if (/bench press|^bench$/.test(n)) return 'bench';
    if (/deadlift/.test(n)) return 'deadlift';
    if (/overhead press|military press|^ohp$/.test(n)) return 'overheadPress';
    return null;
  }

  function weekPlan(base, week, blockDecision) {
    const b = { ...base };
    const wave = [0, 0.03, 0.06, 0.09, 0.12, 0.14, 0.16, 0.18];
    const deload = blockDecision === 'deload';
    const pivot = blockDecision === 'pivot';
    if (deload) return { ...b, sets: Math.max(1, Math.ceil(b.sets * 0.6)), targetRPE: Math.min(7, b.targetRPE || 8), intensityDelta: -0.10, mode: 'deload' };
    if (pivot) return { ...b, reps: b.reps >= 8 ? Math.max(5, b.reps - 2) : b.reps + 1, targetRPE: Math.min(8, (b.targetRPE || 8) - 0.5), intensityDelta: 0, mode: 'pivot' };
    return { ...b, targetRPE: Math.min(9, (b.targetRPE || 8) + (week >= 3 ? 0.5 : 0)), intensityDelta: wave[Math.min(week - 1, wave.length - 1)], mode: 'progress' };
  }

  function recommendDecision(metrics) {
    const m = metrics || {};
    const completion = m.planned ? m.completed / m.planned : 1;
    const avgRPE = m.avgRPE == null ? null : Number(m.avgRPE);
    const strengthTrend = m.strengthTrendPercent == null ? null : Number(m.strengthTrendPercent);
    if (m.failedSessions >= 2 || (avgRPE != null && avgRPE >= 9.3 && strengthTrend != null && strengthTrend < 0)) return { action: 'deload', confidence: 'high', reason: 'Two or more failed sessions, or very high effort with declining strength, indicates accumulated fatigue.' };
    if (completion < 0.75) return { action: 'maintain', confidence: 'high', reason: 'Less than 75% of planned sessions were completed, so the next week should repeat the current training load.' };
    if (avgRPE != null && avgRPE >= 9.0) return { action: 'maintain', confidence: 'medium', reason: 'Average effort is already high. Hold training maxes before adding more load.' };
    if (strengthTrend != null && strengthTrend < -2) return { action: 'maintain', confidence: 'medium', reason: 'Estimated strength is trending down. Hold the block and reassess.' };
    if (avgRPE != null && avgRPE <= 7.5 && (strengthTrend == null || strengthTrend >= 0)) return { action: 'progress', confidence: 'high', reason: 'The week was completed comfortably and strength is stable or improving.' };
    return { action: 'progress', confidence: 'medium', reason: 'The week was completed adequately. A small planned increase is appropriate.' };
  }

  function programMetrics(program, workouts, daysPerWeek, currentWeek) {
    const tagged = (workouts || []).filter(w => w.programId === program?.id).sort((a,b) => String(a.date).localeCompare(String(b.date)));
    const weekStart = Math.max(0, (currentWeek - 1) * Math.max(1, daysPerWeek || program?.daysPerWeek || 4));
    const week = tagged.slice(weekStart, weekStart + Math.max(1, daysPerWeek || program?.daysPerWeek || 4));
    const rpes = week.flatMap(w => (w.exercises || []).flatMap(ex => (ex.sets || []).map(s => Number(s.rpe)).filter(r => r >= 1 && r <= 10)));
    const completed = week.length;
    const planned = Math.max(1, daysPerWeek || program?.daysPerWeek || 4);
    const failedSessions = week.filter(w => /failed|missed|couldn.?t complete|incomplete/i.test(String(w.notes || ''))).length;
    return { completed, planned, avgRPE: rpes.length ? rpes.reduce((a,b)=>a+b,0)/rpes.length : null, failedSessions, strengthTrendPercent: null };
  }

  function buildSession(program, workouts, profile, unit, week, decision, core, athleteEngine, requestedDayIndex) {
    if (!program?.days?.length) return null;
    const daysPerWeek = Math.max(1, Number(program.daysPerWeek) || program.days.length);
    const tagged = (workouts || []).filter(w => w.programId === program.id && Number.isInteger(w.programDayIndex));
    const dayIndex = Number.isInteger(requestedDayIndex) ? requestedDayIndex : (tagged.length ? (Number(tagged[tagged.length - 1].programDayIndex) + 1) % program.days.length : 0);
    const day = program.days[dayIndex];
    const tms = program.trainingMaxes || (athleteEngine?.calculateTrainingMaxes ? athleteEngine.calculateTrainingMaxes(profile || {}, workouts || [], core) : {});
    const exercises = (day.exercises || []).map(parseLine).filter(x => x.name).map(def => {
      const plan = weekPlan(def, week, decision);
      const key = liftKey(def.name);
      const tm = key && tms[key]?.trainingMax;
      let weight = null;
      if (tm && !plan.duration) {
        const base = def.basePercent || (plan.reps <= 3 ? 0.82 : plan.reps <= 5 ? 0.76 : plan.reps <= 8 ? 0.70 : 0.62);
        const pct = Math.max(0.45, Math.min(0.95, base + plan.intensityDelta));
        weight = tm * pct;
        if (athleteEngine?.roundLoad) weight = athleteEngine.roundLoad(weight, unit);
      }
      return { ...def, sets: plan.sets, reps: plan.reps, targetRPE: plan.targetRPE, weight, prescriptionPercent: tm && weight ? (weight / tm) : null, mode: plan.mode };
    });
    return { programId: program.id, dayIndex, dayName: day.day, week, daysPerWeek, blockIndex: Math.ceil(week / 4), decision, exercises };
  }

  function explain(decision, week, lengthWeeks) {
    const map = {
      progress: 'You completed the prior work at an acceptable effort, so the next week increases the planned stimulus slightly.',
      maintain: 'Your completion or effort data does not support adding load yet, so the next week repeats the current training target.',
      deload: 'Fatigue signals are high, so volume and intensity are reduced temporarily to improve recovery.',
      pivot: 'Performance has stalled, so the next block changes the stimulus instead of simply adding weight.'
    };
    return `${map[decision] || map.progress} Week ${week} of ${lengthWeeks}.`;
  }

  return { DEFAULT, normalizeState, parseLine, liftKey, recommendDecision, programMetrics, buildSession, explain };
});
