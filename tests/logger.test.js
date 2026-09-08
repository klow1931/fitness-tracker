const assert = require('assert');
const {validLoggerNumber: valid} = require('../src/product/workout-logger');
assert(valid('0',0)); // bodyweight
assert(!valid('-1',0));
assert(!valid('Infinity',0));
assert(!valid('',0));
assert(valid('9.5',1,10));
assert(!valid('10.5',1,10));
assert(!valid('2.5',1,Infinity,true));
assert(valid('3',1,Infinity,true));
console.log('logger validation tests passed');
