/* Loadnote Training Analytics v0.2 — deterministic; safe to use without an AI model. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core/loadnote-core'));
  else root.LoadnoteAnalytics = factory(root.LoadnoteCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  if (!Core) throw new Error('LoadnoteCore is required');

  function dateDaysAgo(days, from) {
    const d = new Date(from || Date.now());
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  function recentWorkouts(workouts, days) {
    const cutoff = dateDaysAgo(days);
    return (workouts || []).filter(w => w.date >= cutoff);
  }

  function exerciseTrend(workouts, exerciseName, days) {
    const history = Core.exerciseHistory(recentWorkouts(workouts, days || 56), exerciseName);
    if (!history.length) return null;
    const first = history[0].estimated1RM;
    const last = history[history.length - 1].estimated1RM;
    return {
      exercise: exerciseName,
      sessions: new Set(history.map(x => x.date)).size,
      firstEstimated1RM: first,
      latestEstimated1RM: last,
      change: Core.clone({ absolute: Core.round(last - first, 1), percent: first ? Core.round(((last - first) / first) * 100, 1) : null })
    };
  }

  function volumeTrend(workouts, days) {
    const currentDays = Math.max(7, Math.floor(days || 28));
    const currentStart = dateDaysAgo(currentDays);
    const previousStart = dateDaysAgo(currentDays * 2);
    const current = (workouts || []).filter(w => w.date >= currentStart);
    const previous = (workouts || []).filter(w => w.date >= previousStart && w.date < currentStart);
    const currentVolume = current.reduce((s, w) => s + Core.calcVolume(w), 0);
    const previousVolume = previous.reduce((s, w) => s + Core.calcVolume(w), 0);
    return {
      currentVolume,
      previousVolume,
      changePercent: previousVolume ? Core.round(((currentVolume - previousVolume) / previousVolume) * 100, 1) : null
    };
  }

  function plateauSignal(workouts, exerciseName) {
    const trend = exerciseTrend(workouts, exerciseName, 42);
    if (!trend || trend.sessions < 3 || trend.firstEstimated1RM <= 0) return { status: 'insufficient-data', trend };
    if (trend.change.percent != null && trend.change.percent <= 1) return { status: 'possible-plateau', trend };
    return { status: 'progressing', trend };
  }

  function muscleGroupVolume(workouts, days) {
    const recent = recentWorkouts(workouts, days || 28);
    const groups = {};
    const db = typeof globalThis !== 'undefined' ? globalThis.LoadnoteExercises : null;
    recent.forEach(w => (w.exercises || []).forEach(ex => {
      if (ex.type === 'cardio') return;
      const meta = db?.resolve?.(ex.name);
      const volume = Core.volumeForExercise(ex);
      (meta?.primaryMuscles || ['unclassified']).forEach(m => { groups[m] = (groups[m] || 0) + volume; });
    }));
    return Object.fromEntries(Object.entries(groups).sort((a,b) => b[1]-a[1]));
  }

  function exerciseInsights(workouts, exerciseName) {
    const history = Core.exerciseHistory(recentWorkouts(workouts, 56), exerciseName);
    if (!history.length) return null;
    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;
    const rpeValues = history.map(x => x.rpe).filter(x => x >= 1 && x <= 10);
    return {
      exercise: exerciseName,
      latest,
      previous,
      averageRPE: rpeValues.length ? Core.round(rpeValues.reduce((a,b)=>a+b,0)/rpeValues.length,1) : null,
      plateau: plateauSignal(workouts, exerciseName),
      related: (typeof globalThis !== 'undefined' && globalThis.LoadnoteExercises?.related) ? globalThis.LoadnoteExercises.related(exerciseName).map(x=>x.name) : [exerciseName]
    };
  }

  function trainingStatus(workouts) {
    const recent = recentWorkouts(workouts, 14);
    const avgRPE = Core.averageRPE(recent);
    const volume = volumeTrend(workouts, 7);
    let status = 'normal';
    if (avgRPE != null && avgRPE >= 9) status = 'elevated-fatigue';
    if (volume.changePercent != null && volume.changePercent <= -25 && avgRPE != null && avgRPE >= 8.5) status = 'performance-watch';
    return { status, averageRPE: avgRPE, volumeChangePercent: volume.changePercent, workouts14d: recent.length };
  }

  function dashboardSummary(workouts) {
    const names = new Set();
    (workouts || []).forEach(w => (w.exercises || []).forEach(ex => { if (ex.type !== 'cardio' && ex.name) names.add(ex.name); }));
    const trends = Array.from(names).map(name => exerciseTrend(workouts, name, 42)).filter(Boolean).sort((a, b) => (b.latestEstimated1RM || 0) - (a.latestEstimated1RM || 0));
    return {
      status: trainingStatus(workouts),
      volume: volumeTrend(workouts, 7),
      exerciseTrends: trends,
      muscleGroupVolume: muscleGroupVolume(workouts, 28),
      insights: trends.slice(0, 6).map(t => exerciseInsights(workouts, t.exercise)).filter(Boolean)
    };
  }

  return { recentWorkouts, exerciseTrend, volumeTrend, plateauSignal, trainingStatus, dashboardSummary, muscleGroupVolume, exerciseInsights };
});
