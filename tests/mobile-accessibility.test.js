const assert=require('node:assert/strict'),A=require('../src/product/mobile-accessibility');
assert.equal(A.fieldName('Competition Bench',2,'weight','lb'),'Competition Bench · Set 2 · Load in pounds');
assert.equal(A.fieldName('',1,'duration','kg'),'Unnamed exercise · Set 1 · Hold duration in seconds');
assert(A.fieldName('Squat',3,'rpe','kg').includes('1 to 10'));
console.log('Contextual workout accessible names distinguish exercises, sets, measures and units');
