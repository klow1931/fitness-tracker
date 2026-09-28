const assert=require('node:assert/strict');
const GoalCycle=require('../src/product/goal-cycle');
const Goals=require('../src/product/athlete-goals');
const {phaseFixture}=require('./fixtures/phase-builder');

assert.deepEqual(GoalCycle.blockShape('long-range-development'),{accumulationWeeks:4,strengthWeeks:3,deloadWeeks:1,label:'Development block'});
assert.deepEqual(GoalCycle.blockShape('build-strength'),{accumulationWeeks:3,strengthWeeks:4,deloadWeeks:1,label:'Strength-development block'});
assert.deepEqual(GoalCycle.blockShape('specific-strength'),{accumulationWeeks:2,strengthWeeks:4,deloadWeeks:1,label:'Specific-strength block'});

const current={targetKg:200,reference:{kg:180},gapKg:20};
let h=GoalCycle.horizon(current,[{lifts:{bench:{comparable:true,changePct:2}}}], 'bench');
assert.equal(h.kind,'not-estimated');assert.equal(h.comparableBlocks,1);
h=GoalCycle.horizon(current,[{lifts:{bench:{comparable:true,changePct:-1}}},{lifts:{bench:{comparable:true,changePct:2}}}], 'bench');
assert.equal(h.kind,'not-estimated');assert.equal(h.positiveBlocks,1);
h=GoalCycle.horizon(current,[{lifts:{bench:{comparable:true,changePct:2}}},{lifts:{bench:{comparable:true,changePct:3}}},{lifts:{bench:{comparable:true,changePct:2.5}}}], 'bench');
assert.equal(h.kind,'block-range');assert(h.minBlocks>=1);assert(h.maxBlocks>=h.minBlocks);assert.equal(h.medianPositiveChangePct,2.5);

const {state,config}=phaseFixture();
state.athleteGoals=Goals.upsert([],{name:'SBD goals',sport:'Powerlifting',eventDate:null,targets:[
 {lift:'squat',kg:220},{lift:'bench',kg:160},{lift:'deadlift',kg:280}
]},{now:'2026-09-01T10:00:00.000Z'});
const cycle=GoalCycle.inspect(state,{asOf:'2026-09-24',knownAt:'2026-09-24T12:00:00.000Z',config});
assert.equal(cycle.status,'ready');assert(cycle.recommendation);assert.equal(cycle.recommendation.deloadWeeks,1);
assert.match(cycle.summary,/productive blocks/);
for(const lift of ['squat','bench','deadlift'])assert.equal(cycle.lifts[lift].horizon.kind,'not-estimated');

const applied=GoalCycle.applyToConfig(cycle,config);
assert.equal(applied.phases[0].weeks,cycle.recommendation.accumulationWeeks);
assert.equal(applied.phases[1].weeks,cycle.recommendation.strengthWeeks);
assert.equal(applied.phases[2].weeks,1);
assert.equal(applied.lifts.squat.trainingMaxKg,config.lifts.squat.trainingMaxKg);
assert.equal(applied.lifts.bench.sets,config.lifts.bench.sets);
assert.deepEqual(config.phases,[{type:'accumulation',weeks:3},{type:'strength',weeks:3},{type:'deload',weeks:1}],'source config remains unchanged');
console.log('v2.41 date-free goal cycles and evidence-bound block horizons passed');
