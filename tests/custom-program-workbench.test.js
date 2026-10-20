const assert=require('node:assert/strict');
const Custom=require('../src/product/custom-program');

const source=[
 {week:'1',day:'Monday',exercise:'Competition Bench',type:'strength',sets:'3',reps:'5',weight:'225',unit:'lb',rpe:'8',rest:'180'},
 {week:'1',day:'Wednesday',exercise:'Chest Supported Row',type:'strength',sets:'3',reps:'10',weight:'70',unit:'lb',rpe:'7'},
 {week:'3',day:'Monday',exercise:'Competition Bench',type:'strength',sets:'3',reps:'4',weight:'240',unit:'lb',rpe:'9'}
];
const untouched=JSON.stringify(source);
const copied=Custom.copyDraftWeek(source,1,2);
assert.equal(copied.length,5);
assert.deepEqual(copied.slice(-2).map(r=>r.week),['2','2']);
assert.equal(JSON.stringify(source),untouched,'Bulk copy must not mutate the source');
assert.throws(()=>Custom.copyDraftWeek(source,1,3),/already contains exercises/);
assert.throws(()=>Custom.copyDraftWeek(source,4,2),/no exercise rows/);
assert.throws(()=>Custom.copyDraftWeek(source,1,1),/different valid/);
assert.throws(()=>Custom.copyDraftWeek(source,1,53),/different valid/);

const swapped=Custom.swapDraftMovement(copied,{from:'competition bench',to:'Paused Bench',firstWeek:2,lastWeek:2});
assert.equal(swapped.changed,1);
assert.equal(swapped.clearedTargets,1);
assert.equal(swapped.rows.at(-2).exercise,'Paused Bench');
assert.equal(swapped.rows.at(-2).sets,'3');
assert.equal(swapped.rows.at(-2).reps,'5');
assert.equal(swapped.rows.at(-2).weight,'');
assert.equal(swapped.rows.at(-2).rpe,'');
assert.equal(swapped.rows[0].weight,'225','Week 1 must remain untouched');
assert.equal(swapped.rows[2].weight,'240','Week 3 must remain untouched');
assert.equal(copied.at(-2).weight,'225','The copied draft still retains its original targets');
assert.throws(()=>Custom.swapDraftMovement(source,{from:'Bench',to:'Squat'}),/No matching/);
assert.throws(()=>Custom.swapDraftMovement(source,{from:'Bench',to:'Bench'}),/different/);
assert.throws(()=>Custom.swapDraftMovement(source,{from:'Bench',to:'Squat',firstWeek:4,lastWeek:2}),/valid week range/);

const proposal=Custom.build({exerciseCatalog:[],scheduledSessions:[]},{name:'My training plan',weeks:4,startDate:'2026-11-02',unit:'lb',rows:[
 {...source[0],sets:3},
 {...source[0],week:2,sets:8},
 {...source[1],week:2,sets:6},
 {...source[2],week:4,sets:4}
]});
const report=Custom.weeklyOverview(proposal);
assert.deepEqual(report.weeks.map(w=>w.strengthSets),[3,14,0,4]);
assert.deepEqual(report.emptyWeeks,[3]);
assert.deepEqual(report.largeSetIncreases,[{week:2,from:3,to:14}]);
assert.equal(JSON.stringify(source),untouched);
console.log('v3.68–v3.70 week copy, deliberate exercise swaps, omitted targets, program overview and immutable draft operations passed');
