const assert=require('node:assert/strict');
const Gym=require('../src/product/gym-floor');

assert.equal(Gym.inputMode('reps'),'numeric');
assert.equal(Gym.inputMode('weight'),'decimal');
assert.equal(Gym.inputMode('rpe'),'decimal');
assert.equal(Gym.inputMode('other'),'text');

assert.deepEqual(Gym.previousPayload({weight:100,reps:5,rpe:9},'reps'),{weight:100,reps:5});
assert.deepEqual(Gym.previousPayload({weight:0,duration:30,rpe:8},'duration'),{weight:0,duration:30});
assert.equal(Gym.previousPayload({weight:100,reps:0},'reps'),null);
assert.equal(Gym.previousPayload(null,'reps'),null);

assert.equal(Gym.nextUnfinishedIndex([{done:true},{done:false},{done:false}],0),1);
assert.equal(Gym.nextUnfinishedIndex([{done:true},{done:true},{done:false}],1),2);
assert.equal(Gym.nextUnfinishedIndex([{done:true},{done:true}],0),-1);

assert.equal(Gym.keyboardLikelyOpen(844,620),true);
assert.equal(Gym.keyboardLikelyOpen(844,760),false);
assert.equal(Gym.keyboardLikelyOpen(0,620),false);
assert.equal(Gym.shouldHideNavigation(844,500),false);
assert.equal(Gym.shouldHideNavigation(844,500,{editing:true}),true);
assert.equal(Gym.shouldHideNavigation(844,760,{editing:true}),false);
assert.equal(Gym.shouldHideNavigation(844,500,{editing:true,scale:1.5}),false);
assert.equal(Gym.shouldHideNavigation(844,500,{editing:false}),false);

const progress=Gym.sessionProgress([
 {type:'strength',sets:[{entered:true,done:true},{entered:true,done:false}]},
 {type:'strength',sets:[{entered:true,done:false}]},
 {type:'cardio',entered:false,done:false}
]);
assert.deepEqual(progress,{totalSets:3,doneSets:1,remainingSets:2,totalExercises:2,doneExercises:0,currentExerciseIndex:0,currentSetIndex:1,complete:false});
assert.equal(Gym.sessionProgress([{type:'strength',sets:[{entered:true,done:true}]}]).complete,true);
assert.equal(Gym.sessionProgress([{type:'strength',sets:[{entered:false,done:false}]}]).totalSets,0);

console.log('v2.70 gym-floor input, quick-fill, progress and next-set helpers passed');
