const assert=require('node:assert/strict'),P=require('../src/product/plate-calculator');
assert.deepEqual(P.calculate(225,45,'lb').plates,[{plate:45,count:2}]);assert.equal(P.calculate(225,45,'lb').remainder,0);
assert.deepEqual(P.calculate(100,20).plates,[{plate:25,count:1},{plate:15,count:1}]);
assert.equal(P.calculate(226,45,'lb').remainder,0.5);assert.equal(P.calculate(226,45,'lb').loaded,225);
assert.deepEqual(P.calculate(45,45,'lb').plates,[]);for(const args of [[40,45,'lb'],[100,0],[Infinity,20],[100,20,'oz']])assert.throws(()=>P.calculate(...args));
console.log('Standard pound/metric inventories and invalid loads passed');
