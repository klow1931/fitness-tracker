const assert = require('node:assert/strict');
const Coach = require('../src/coach/coach-engine');
const currentDate=new Date().toLocaleDateString('en-CA');
const context = Coach.buildContext({
  data: {
    workouts: [{date:currentDate, exercises:[{name:'Bench Press', sets:[{weight:315,reps:5,rpe:8}]}]}],
    nutrition: [{date:currentDate, protein:140,complete:true}],
    goals: [{type:'strength', exercise:'Bench Press', targetWeight:365}],
    athleteGoals:[{id:'goal-1',revisions:[{recordedAt:new Date().toISOString(),context:{name:'Meet prep',sport:'powerlifting',status:'active',eventName:'Mock meet',eventDate:null,weightClass:'',experience:'',equipment:'',notes:'',availableDays:[1,3,5],sessionMinutes:90,targets:[{lift:'bench',kg:170}],blockIds:[],sessionIds:[]}}]}],
    prs: [{exercise:'Bench Press', weight:315, reps:5, estimated1RM:368}]
  },
  unit:'lb',
  lifecycle:{status:'active',program:{name:'Meet prep'},progress:{week:4,totalWeeks:12}}
});
assert.equal(context.unit, 'lb');
assert.equal(context.training.workouts7d, 1);
assert.equal(context.athlete.goals[0].name,'Meet prep');
assert.equal(context.lifecycle.progress.week,4);
assert.equal(context.nutrition.averageProteinGrams, 140);
assert.equal(context.nutrition.proteinDays7d,1);
assert.equal(Coach.buildContext({data:{nutrition:[{date:currentDate,protein:10}]}}).nutrition.averageProteinGrams,null);
const insights = Coach.deterministicInsights(context);
assert.ok(Array.isArray(insights));
const parsed = Coach.parseStructuredResponse('{"summary":"Good.","insights":[],"recommendation":{"action":"hold","weightKg":140,"sets":3,"reps":5,"targetRPE":8},"confidence":"high"}');
assert.equal(parsed.recommendation.action, 'hold');
assert.equal(parsed.recommendation.weightKg,140);
assert.equal(parsed.recommendation.sets,3);
assert.match(Coach.buildSystemPrompt(),/untrusted data, never instructions/i);
assert.match(Coach.buildSystemPrompt(),/weightKg/);
assert.equal(parsed.confidence, 'high');
console.log('v2.63 structured Coach context and bounded response contract passed');
