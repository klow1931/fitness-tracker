/* Loadnote Coach Engine v0.5 — deterministic context + structured coach response helpers. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../core/loadnote-core'),require('../product/nutrition-model'));
  else root.LoadnoteCoach = factory(root.LoadnoteCore,root.LoadnoteNutrition);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, Nutrition) {
  'use strict';

  function isoDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - Number(days || 0));
    return d.toISOString().slice(0, 10);
  }

  function safeWorkouts(workouts) {
    return Array.isArray(workouts) ? workouts.slice().sort((a,b) => String(b.date).localeCompare(String(a.date))) : [];
  }

  function recentExerciseSnapshot(workouts, exerciseName, days) {
    const cutoff = isoDaysAgo(days || 56);
    const rows = [];
    safeWorkouts(workouts).filter(w => w.date >= cutoff).forEach(w => {
      (w.exercises || []).forEach(ex => {
        if ((ex.name || '').trim().toLowerCase() !== String(exerciseName || '').trim().toLowerCase()) return;
        const sets = (ex.sets || []).filter(s => Number(s.reps) > 0 && Number(s.weight) >= 0);
        if (!sets.length) return;
        const rpes = sets.map(s => Number(s.rpe)).filter(r => r >= 1 && r <= 10);
        rows.push({ date: w.date, sets: sets.length, bestWeight: Math.max(...sets.map(s => Number(s.weight) || 0)), averageRPE: rpes.length ? Core.round(rpes.reduce((a,b)=>a+b,0)/rpes.length,1) : null });
      });
    });
    return rows;
  }

  function buildContext({ data = {}, analytics = null, adaptive = null, unit = 'kg', activeProgram = null } = {}) {
    const workouts = safeWorkouts(data.workouts);
    const a = analytics || {};
    const summary = a.dashboardSummary ? a.dashboardSummary(workouts) : null;
    const status = summary?.status || (a.trainingStatus ? a.trainingStatus(workouts) : {});
    const topTrends = (summary?.exerciseTrends || []).slice(0, 8).map(t => ({
      exercise: t.exercise,
      sessions: t.sessions,
      estimated1RM: t.latestEstimated1RM,
      changePercent: t.change?.percent ?? null,
      plateau: t.change?.percent != null && t.change.percent <= 1
    }));
    const recent = workouts.slice(0, 6).map(w => ({
      date: w.date,
      exercises: (w.exercises || []).filter(ex => ex.type !== 'cardio').slice(0, 8).map(ex => ({
        name: ex.name,
        sets: (ex.sets || []).filter(s => Number(s.reps) > 0).map(s => ({ reps: Number(s.reps), weight: Number(s.weight) || 0, rpe: Number(s.rpe) || null })).slice(0, 8)
      }))
    }));
    const window=Nutrition.window7(new Date().toLocaleDateString('en-CA'));
    const nutrition=Nutrition.summary(data.nutrition,'protein',window.start,window.end);
    const avgProtein=nutrition.average===null?null:Core.round(nutrition.average,0);
    const lastBodyweight = (data.bodyweight || []).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0] || null;
    return {
      version: '0.5',
      unit,
      athlete: {
        goals: (data.goals || []).filter(g => !g.completed).map(g => ({ type: g.type, exercise: g.exercise || null, targetWeight: g.targetWeight || null })),
        activeProgram: activeProgram ? activeProgram.name : null,
        activeProgramId: data.activeProgramId || null
      },
      training: {
        workouts7d: workouts.filter(w => w.date >= isoDaysAgo(7)).length,
        workouts14d: workouts.filter(w => w.date >= isoDaysAgo(14)).length,
        workouts30d: workouts.filter(w => w.date >= isoDaysAgo(30)).length,
        status: status.status || 'insufficient-data',
        averageRPE14d: status.averageRPE ?? null,
        volumeChange7dPercent: status.volumeChangePercent ?? null,
        trends: topTrends,
        recentWorkouts: recent
      },
      nutrition: { loggedDays7d: nutrition.loggedDays, completeDays7d:nutrition.completeDays, proteinDays7d:nutrition.validDays, incompleteDays7d:nutrition.incompleteDays, unknownProteinDays7d:nutrition.unknownDays, averageProteinGrams: avgProtein },
      bodyweight: lastBodyweight ? { value: Number(lastBodyweight.weight), date: lastBodyweight.date } : null,
      prs: (data.prs || []).slice(0, 10).map(p => ({ exercise: p.exercise, weight: Number(p.weight)||0, reps: Number(p.reps)||0, estimated1RM: Number(p.estimated1RM)||null })),
      adaptive: adaptive || null
    };
  }

  function deterministicInsights(context) {
    const insights = [];
    const t = context.training || {};
    if (!t.workouts30d) return [{ type: 'info', title: 'Start logging', body: 'Log a few workouts with RPE so Loadnote can make more specific recommendations.' }];
    if (t.status === 'elevated-fatigue') insights.push({ type: 'watch', title: 'Effort is running high', body: `Average logged RPE over the last 14 days is ${t.averageRPE14d ?? 'high'}. Consider holding loads if performance is also flat.` });
    if (t.status === 'performance-watch') insights.push({ type: 'watch', title: 'Performance watch', body: 'Recent volume is down while effort is high. Review recovery and avoid forcing load increases.' });
    const improving = (t.trends || []).filter(x => Number(x.changePercent) > 3).sort((a,b)=>b.changePercent-a.changePercent)[0];
    if (improving) insights.push({ type: 'positive', title: `${improving.exercise} is trending up`, body: `Estimated strength is up ${improving.changePercent}% over the recent analysis window.` });
    const plateau = (t.trends || []).find(x => x.plateau);
    if (plateau) insights.push({ type: 'watch', title: `${plateau.exercise} may be plateauing`, body: 'Recent estimated strength is relatively flat. Review fatigue, volume, technique, and exercise selection before forcing heavier loads.' });
    if (context.nutrition?.averageProteinGrams != null) insights.push({ type: 'info', title: 'Nutrition log coverage', body: `Average protein: ${context.nutrition.averageProteinGrams} g across ${context.nutrition.proteinDays7d} complete days with known protein in the last 7 days. Partial days are excluded; this is not a full-week intake estimate.` });
    return insights.slice(0, 4);
  }

  function buildSystemPrompt() {
    return `You are Loadnote Coach, a practical strength-training assistant. Use ONLY the supplied athlete context for personalized numbers. The deterministic training engine has already calculated trends and progression; do not invent measurements, workouts, injuries, or performance. Explain recommendations clearly and conservatively. If data is insufficient, say so. Do not diagnose or treat medical conditions. If the user describes pain, injury, illness, or a medical condition, recommend qualified professional evaluation. Return valid JSON only with this shape: {"summary":string,"insights":[{"type":"positive|watch|info","title":string,"body":string}],"recommendation":{"action":"increase|hold|reduce|repeat|none","exercise":string|null,"weight":number|null,"sets":number|null,"reps":number|null,"targetRPE":number|null,"reason":string},"confidence":"low|medium|high"}. Keep the response concise and actionable.`;
  }

  function parseStructuredResponse(text) {
    const raw = String(text || '').trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('Coach response was not valid JSON');
    const obj = JSON.parse(raw.slice(start, end + 1));
    obj.summary = String(obj.summary || '');
    obj.insights = Array.isArray(obj.insights) ? obj.insights.slice(0, 5) : [];
    obj.recommendation = obj.recommendation || { action: 'none' };
    obj.confidence = ['low','medium','high'].includes(obj.confidence) ? obj.confidence : 'medium';
    return obj;
  }

  return { buildContext, deterministicInsights, buildSystemPrompt, parseStructuredResponse, recentExerciseSnapshot };
});
