/* Loadnote Performance & Fatigue Engine v0.9 — deterministic training-status signals. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core/loadnote-core'), require('./analytics'));
  else root.LoadnoteFatigue = factory(root.LoadnoteCore, root.LoadnoteAnalytics);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, Analytics) {
  'use strict';
  if (!Core || !Analytics) throw new Error('LoadnoteCore and LoadnoteAnalytics are required');

  function clamp(n, min, max) { return Math.min(max, Math.max(min, Number(n) || 0)); }
  function recent(workouts, days) { return Analytics.recentWorkouts(workouts || [], days); }

  function weeklyVolume(workouts, weeks) {
    const out = [];
    const all = (workouts || []).slice().sort((a,b) => String(a.date).localeCompare(String(b.date)));
    const end = all.length ? new Date(String(all[all.length - 1].date) + 'T00:00:00') : new Date();
    for (let i = 0; i < weeks; i++) {
      const endDate = new Date(end); endDate.setDate(end.getDate() - i * 7);
      const startDate = new Date(endDate); startDate.setDate(endDate.getDate() - 6);
      const s = startDate.toISOString().slice(0,10), e = endDate.toISOString().slice(0,10);
      const rows = all.filter(w => w.date >= s && w.date <= e);
      out.push({ week: weeks - i, start: s, end: e, volume: rows.reduce((sum,w) => sum + Core.calcVolume(w), 0), workouts: rows.length, averageRPE: Core.averageRPE(rows) });
    }
    return out.reverse();
  }

  function loadRatio(workouts) {
    const acute = recent(workouts, 7).reduce((s,w) => s + Core.calcVolume(w), 0);
    const chronic = recent(workouts, 28).reduce((s,w) => s + Core.calcVolume(w), 0) / 4;
    return { acute, chronic, ratio: chronic > 0 ? Core.round(acute / chronic, 2) : null };
  }

  function adherence(workouts, plannedPerWeek) {
    const target = Math.max(1, Number(plannedPerWeek) || 4);
    const actual = recent(workouts, 28).length;
    return { actual, target: target * 4, percent: clamp((actual / (target * 4)) * 100, 0, 100) };
  }

  function performanceSignal(workouts) {
    const summary = Analytics.dashboardSummary(workouts || {}.workouts || workouts || []);
    const trends = (summary.exerciseTrends || []).filter(t => t.sessions >= 2 && t.change?.percent != null);
    if (!trends.length) return { score: 50, trendPercent: null, direction: 'unknown', lifts: [] };
    const avg = trends.reduce((s,t) => s + Number(t.change.percent || 0), 0) / trends.length;
    const score = clamp(50 + avg * 8, 0, 100);
    return { score: Core.round(score, 1), trendPercent: Core.round(avg, 1), direction: avg > 1 ? 'improving' : avg < -1 ? 'declining' : 'stable', lifts: trends.slice(0, 8) };
  }

  function rpeSignal(workouts) {
    const avg = Core.averageRPE(recent(workouts, 14));
    if (avg == null) return { score: 50, averageRPE: null, status: 'unknown' };
    const score = clamp(100 - Math.max(0, avg - 6) * 22, 0, 100);
    return { score: Core.round(score, 1), averageRPE: avg, status: avg >= 9 ? 'high' : avg >= 8.5 ? 'elevated' : 'manageable' };
  }

  function statusFromScore(score, flags) {
    if (flags.some(f => f.severity === 'high') || score < 35) return 'high-fatigue';
    if (flags.some(f => f.severity === 'medium') || score < 55) return 'elevated-fatigue';
    if (score >= 75) return 'strong';
    return 'normal';
  }

  function analyze(workouts, options) {
    const ws = workouts || [];
    const load = loadRatio(ws);
    const rpe = rpeSignal(ws);
    const performance = performanceSignal(ws);
    const adherenceData = adherence(ws, options?.plannedDaysPerWeek);
    const flags = [];

    if (load.ratio != null && load.ratio >= 1.35) flags.push({ type: 'load-spike', severity: load.ratio >= 1.55 ? 'high' : 'medium', message: `7-day volume is ${load.ratio}× the recent 28-day weekly average.` });
    if (rpe.averageRPE != null && rpe.averageRPE >= 9.2) flags.push({ type: 'high-rpe', severity: 'high', message: `Average logged RPE over 14 days is ${rpe.averageRPE}.` });
    else if (rpe.averageRPE != null && rpe.averageRPE >= 8.8) flags.push({ type: 'elevated-rpe', severity: 'medium', message: `Average logged RPE over 14 days is ${rpe.averageRPE}.` });
    if (performance.direction === 'declining' && performance.trendPercent <= -2) flags.push({ type: 'performance-decline', severity: 'high', message: `Average exercise strength trend is ${performance.trendPercent}%.` });
    if (performance.direction === 'declining') flags.push({ type: 'performance-watch', severity: 'medium', message: 'Recent exercise trends are moving downward.' });
    if (adherenceData.percent < 60 && ws.length) flags.push({ type: 'low-adherence', severity: 'medium', message: `Logged ${adherenceData.actual} of about ${adherenceData.target} planned sessions in 28 days.` });

    const score = Core.round(clamp((rpe.score * 0.35) + (performance.score * 0.35) + (clamp(100 - Math.max(0, (load.ratio || 1) - 1) * 120, 0, 100) * 0.20) + (adherenceData.percent * 0.10), 0, 100), 0);
    const status = statusFromScore(score, flags);
    const recommendation = status === 'high-fatigue' ? 'Reduce training stress temporarily and reassess performance.' : status === 'elevated-fatigue' ? 'Hold progression and consider reducing volume if performance remains flat or declines.' : status === 'strong' ? 'Progress conservatively while keeping effort controlled.' : 'Continue the current plan and monitor RPE and performance.';
    return { score, status, load, rpe, performance, adherence: adherenceData, flags, recommendation, weekly: weeklyVolume(ws, 4), generatedAt: new Date().toISOString() };
  }

  return { weeklyVolume, loadRatio, adherence, performanceSignal, rpeSignal, analyze };
});
