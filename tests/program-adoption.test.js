const assert=require('assert');
const Adoption=require('../src/product/program-adoption');
const Schedule=require('../src/product/schedule');

const source={id:7,name:'My 2-Day Program',days:[
 {day:'Day A',exercises:['Competition Bench 3×5']},
 {day:'Day B',exercises:['Barbell Row 3×8 @ RPE 7']}
]};
let state={
 programs:[source],adoptedPrograms:[],scheduledSessions:[],
 exerciseCatalog:[
  {id:'bench',name:'Competition Bench',aliases:[]},
  {id:'row',name:'Barbell Row',aliases:[]}
 ],
 workouts:[{id:'prior',date:'2026-09-01',createdAt:'2026-09-01T18:00:00.000Z',exercises:[{name:'Competition Bench',exerciseId:'bench',type:'strength',sets:[{reps:5,weight:100,rpe:8}]}]}]
};
const preview=Adoption.prepare(state,7,{startDate:'2026-09-07',weeks:2,weekdays:[1,4],defaultTargetRpe:8,inferLoads:true});
assert.equal(preview.sessions.length,4);
const bench=preview.sessions[0].exercises[0];
assert.equal(bench.exerciseId,'bench');
assert.equal(bench.sets[0].weight,100);
assert.equal(bench.loadSource,'recent-log');
assert.equal(bench.rpeSource,'adoption-default');
const row=preview.sessions[1].exercises[0];
assert.equal(row.rpeSource,'user-authored');
assert.equal(row.sets[0].targetRpe,7);
assert.ok(!Object.hasOwn(row.sets[0],'weight'));

state=Adoption.save(state,preview,{confirmed:true,notes:'Use my existing program.',now:'2026-09-02T12:00:00.000Z',id:'adopt1'});
assert.equal(state.adoptedPrograms.length,1);
assert.deepEqual(state.adoptedPrograms[0].sourceSnapshot,source);
state=Adoption.schedule(state,'adopt1',{now:'2026-09-03T12:00:00.000Z'});
assert.equal(Schedule.list(state.scheduledSessions).length,4);
const first=Schedule.list(state.scheduledSessions).find(s=>s.id==='adopted:adopt1:w1d0');
assert.ok(first);
assert.equal(first.prescription.plannedExercises[0].sets[0].weight,100);
const second=Schedule.list(state.scheduledSessions).find(s=>s.id==='adopted:adopt1:w1d1');
assert.ok(!Object.hasOwn(second.prescription.plannedExercises[0].sets[0],'weight'));

state.workouts.push({
 id:'w1a',date:'2026-09-07',createdAt:'2026-09-07T20:00:00.000Z',
 sessionIntent:{version:1,role:'mixed',goal:'Follow adopted program baseline',prescription:first.prescription,deviationReason:'none',deviationNotes:'',schedule:{id:first.id,revisionAt:first.revisionAt}},
 exercises:[{name:'Competition Bench',exerciseId:'bench',type:'strength',sets:[
  {reps:5,weight:100,rpe:9},{reps:5,weight:100,rpe:9},{reps:5,weight:100,rpe:8}
 ]}]
});
state.workouts.push({
 id:'w1b',date:'2026-09-10',createdAt:'2026-09-10T20:00:00.000Z',
 sessionIntent:{version:1,role:'mixed',goal:'Follow adopted program baseline',prescription:second.prescription,deviationReason:'none',deviationNotes:'',schedule:{id:second.id,revisionAt:second.revisionAt}},
 exercises:[{name:'Barbell Row',exerciseId:'row',type:'strength',sets:[
  {reps:8,weight:70,rpe:7},{reps:8,weight:70,rpe:7},{reps:8,weight:70,rpe:7}
 ]}]
});
const report=Adoption.analyzeWeek(state,{programId:'adopt1',week:1,asOf:'2026-09-13',now:'2026-09-13T20:00:00.000Z'});
assert.equal(report.findings.bench.aboveCap,2);
assert.equal(report.findings.bench.canReduceOne,true);
assert.equal(report.findings.row.canReduceOne,false);
state=Adoption.applyWeekReview(state,report,{bench:'reduce-one',row:'keep'},{confirmed:true,notes:'Bench effort ran high.',now:'2026-09-13T20:00:00.000Z'});
const nextBench=Schedule.list(state.scheduledSessions).find(s=>s.id==='adopted:adopt1:w2d0');
assert.equal(nextBench.prescription.plannedExercises[0].sets.length,2);
assert.equal(state.adoptedPrograms[0].weeklyReviews.length,1);

const noLoad=Adoption.prepare({...state,programs:[source],workouts:[]},7,{startDate:'2026-10-05',weeks:1,weekdays:[1,4],defaultTargetRpe:8,inferLoads:false});
assert.ok(!Object.hasOwn(noLoad.sessions[0].exercises[0].sets[0],'weight'));
console.log('program adoption tests passed');
