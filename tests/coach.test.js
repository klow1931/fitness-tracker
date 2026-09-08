const assert = require('node:assert/strict');
const Coach = require('../src/coach/coach-engine');
const context = Coach.buildContext({
  data: {
    workouts: [{date:'2026-09-06', exercises:[{name:'Bench Press', sets:[{weight:315,reps:5,rpe:8}]}]}],
    nutrition: [{date:'2026-09-06', protein:140}],
    goals: [{type:'strength', exercise:'Bench Press', targetWeight:365}],
    prs: [{exercise:'Bench Press', weight:315, reps:5, estimated1RM:368}]
  },
  unit:'lb'
});
assert.equal(context.unit, 'lb');
assert.equal(context.training.workouts7d, 1);
assert.equal(context.nutrition.averageProteinGrams, 140);
const insights = Coach.deterministicInsights(context);
assert.ok(Array.isArray(insights));
const parsed = Coach.parseStructuredResponse('{"summary":"Good.","insights":[],"recommendation":{"action":"hold"},"confidence":"high"}');
assert.equal(parsed.recommendation.action, 'hold');
assert.equal(parsed.confidence, 'high');
console.log('Loadnote v0.5 coach engine tests: PASS');
