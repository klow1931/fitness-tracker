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

console.log('v2.62 gym-floor input, previous-set and next-set helpers passed');
