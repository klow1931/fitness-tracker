const assert=require('node:assert/strict');
const Quick=require('../src/product/logger-quick-entry');
assert.deepEqual(Quick.RPE_VALUES,[6,6.5,7,7.5,8,8.5,9,9.5,10]);
assert.equal(Quick.normalizeRpe(8.4),8.5);assert.equal(Quick.normalizeRpe(11),null);assert.equal(Quick.normalizeRpe(''),null);
const sets=[{reps:5,done:true},{reps:5,done:false},{reps:'',done:false},{duration:30,done:false}];
assert.equal(Quick.nextIncompleteIndex(sets,-1),1);assert.equal(Quick.nextIncompleteIndex(sets,1),3);assert.equal(Quick.nextIncompleteIndex([{reps:5,done:true}],0),-1);
assert.equal(Quick.entered({reps:5}),true);assert.equal(Quick.entered({}),false);assert.equal(Quick.done({reps:5,done:true}),true);
console.log('v2.49 quick-entry helper tests passed');
