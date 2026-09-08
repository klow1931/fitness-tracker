const assert = require('node:assert/strict');
const Coach = require('../src/coach/coach-engine');
const currentDate=new Date().toLocaleDateString('en-CA');
const context = Coach.buildContext({
  data: {
    workouts: [{date:currentDate, exercises:[{name:'Bench Press', sets:[{weight:315,reps:5,rpe:8}]}]}],
    nutrition: [{date:currentDate, protein:140,complete:true}],
    goals: [{type:'strength', exercise:'Bench Press', targetWeight:365}],
    prs: [{exercise:'Bench Press', weight:315, reps:5, estimated1RM:368}]
  },
  unit:'lb'
});
assert.equal(context.unit, 'lb');
assert.equal(context.training.workouts7d, 1);
assert.equal(context.nutrition.averageProteinGrams, 140);
assert.equal(context.nutrition.proteinDays7d,1);
assert.equal(Coach.buildContext({data:{nutrition:[{date:currentDate,protein:10}]}}).nutrition.averageProteinGrams,null);
const insights = Coach.deterministicInsights(context);
assert.ok(Array.isArray(insights));
const parsed = Coach.parseStructuredResponse('{"summary":"Good.","insights":[],"recommendation":{"action":"hold"},"confidence":"high"}');
assert.equal(parsed.recommendation.action, 'hold');
assert.equal(parsed.confidence, 'high');
console.log('Loadnote v0.5 coach engine tests: PASS');
