const assert=require('node:assert/strict');
const Guard=require('../src/product/adaptive-history-guardrail');

const summary={patterns:[
 {lift:'bench',action:'increase-load',observed:4,recorded:4,counts:{improved:1,stable:0,declined:3},medianCapacityChangePct:-1.6,evidence:'early-pattern'},
 {lift:'squat',action:'reduce-load',observed:4,recorded:4,counts:{improved:1,stable:1,declined:2},medianCapacityChangePct:-1.2,evidence:'early-pattern'},
 {lift:'deadlift',action:'increase-load',observed:4,recorded:4,counts:{improved:3,stable:1,declined:0},medianCapacityChangePct:1.8,evidence:'early-pattern'},
 {lift:'bench',action:'reduce-one',observed:2,recorded:2,counts:{improved:1,stable:1,declined:0},medianCapacityChangePct:.8,evidence:'collecting'}
]};
let r=Guard.apply({lift:'bench',action:'increase-load',confidence:'high',signal:'ready',why:'Live evidence supports progression.'},summary);
assert.equal(r.action,'keep');assert.equal(r.signal,'history-caution');assert.equal(r.history.state,'negative');assert.equal(r.history.changed,true);
r=Guard.apply({lift:'squat',action:'reduce-load',confidence:'high',signal:'risk',why:'Live evidence supports reduction.'},summary);
assert.equal(r.action,'reduce-load');assert.equal(r.confidence,'medium');assert.equal(r.history.state,'negative');assert.equal(r.history.changed,false);
r=Guard.apply({lift:'deadlift',action:'increase-load',confidence:'high',signal:'ready',why:'Live evidence supports progression.'},summary);
assert.equal(r.action,'increase-load');assert.equal(r.confidence,'high');assert.equal(r.history.state,'supportive');assert.match(r.why,/did not create or expand/);
r=Guard.apply({lift:'bench',action:'reduce-one',confidence:'medium',signal:'watch',why:'Live evidence supports a set reduction.'},summary);
assert.equal(r.action,'reduce-one');assert.equal(r.history.state,'collecting');
r=Guard.apply({lift:'bench',action:'keep',confidence:'medium',signal:'watch',why:'Keep.'},summary);
assert.equal(r.action,'keep');assert.equal(r.history.state,'not-applicable');
console.log('v2.45 learned-history guardrail tests passed');
