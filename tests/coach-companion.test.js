const assert=require('node:assert/strict');
const Companion=require('../src/product/coach-companion');
const Gateway=require('../backend/coach-gateway');

const live=Companion.buildContext({
 surface:'train',
 workout:{
  active:true,date:'2026-10-02',name:'Lower 1',position:'Exercise 1 of 4 · Set 2 of 4',
  currentExercise:{name:'Competition Squat',index:0,count:4,set:{index:1,count:4,reps:4,weightKg:183.7,displayWeight:405,displayUnit:'lb',rpe:9,target:'405 lb × 4 @8',previous:'395 lb × 4 @7.5'}},
  exercises:[{name:'Competition Squat',completedSets:1,totalSets:4}]
 },
 rest:{active:true,paused:false,remainingMs:125000,label:'125s'}
});

assert.equal(live.surface,'train');
assert.equal(live.liveWorkout.currentExercise.name,'Competition Squat');
assert.equal(live.liveWorkout.currentExercise.set.weightKg,183.7);
assert.equal(live.liveWorkout.currentExercise.set.displayWeight,405);
assert.equal(live.liveWorkout.currentExercise.set.displayUnit,'lb');
assert.equal(live.restTimer.remainingSeconds,125);
assert.equal(live.capabilities.workoutMutation,false);
assert.equal(live.capabilities.programmingMutation,false);
assert.match(Companion.currentSetSummary(live),/Competition Squat/);
assert.match(Companion.currentSetSummary(live),/set 2 of 4/i);
assert.match(Companion.offlineReply(live,"What's next?"),/405 lb × 4 @8/);
assert.match(Companion.offlineReply(live,'What’s next?'),/405 lb × 4 @8/);
assert.match(Companion.offlineReply(live,'How much rest is left?'),/125 seconds/);

assert.deepEqual(Companion.classifyCommand('Start a 3 minute rest'),{kind:'rest_start',risk:'reversible',args:{seconds:180}});
assert.deepEqual(Companion.classifyCommand('set rest timer for 90 seconds'),{kind:'rest_start',risk:'reversible',args:{seconds:90}});
assert.equal(Companion.classifyCommand('increase my squat 10 pounds'),null,'programming changes must not be classified as local actions');
assert.equal(Companion.classifyCommand('log 405 for 4 at 8.5'),null,'workout mutations are not enabled in the v2.79 foundation');
assert.equal(Companion.classifyCommand('pause rest').kind,'rest_pause');
assert.equal(Companion.classifyCommand('resume rest').kind,'rest_resume');
assert.equal(Companion.classifyCommand('add 30 seconds').kind,'rest_add_30');
assert.equal(Companion.classifyCommand('stop rest').kind,'rest_stop');

const normalized=Gateway.normalizeContext({version:'0.6',unit:'lb',companion:live});
assert.equal(normalized.companion.surface,'train');
assert.equal(normalized.companion.liveWorkout.currentExercise.set.weightKg,183.7);
assert.equal(normalized.companion.liveWorkout.currentExercise.set.displayUnit,'lb');
assert.match(Gateway.SYSTEM_PROMPT,/liveWorkout/);
assert.match(Gateway.SYSTEM_PROMPT,/never claim you changed a workout/i);

console.log('v2.79 Coach Companion context, unit labeling, offline guidance and reversible command boundary passed');
