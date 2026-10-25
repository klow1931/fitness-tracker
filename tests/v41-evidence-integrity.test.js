const assert=require('node:assert/strict');
const Intent=require('../src/product/session-intent');
const Handoff=require('../src/product/adaptive-handoff');
const plan=Intent.createPrescription([{exerciseId:'bench',name:'Competition Bench',type:'strength',trackBy:'reps',loadConvention:'total',sets:[
 {weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}
]}],{type:'manual'},'2026-10-01T12:00:00.000Z');
const workout=(sets,exercise={})=>({id:'compare',date:'2026-10-02',createdAt:'2026-10-02T18:00:00.000Z',
 sessionIntent:{prescription:plan},
 exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',trackBy:'reps',loadConvention:'total',sets,...exercise}]
});
const base=[{weight:100,reps:5,rpe:8},{weight:100,reps:5,rpe:8.5},{weight:100,reps:5,rpe:7.5}];
assert.equal(Intent.sameSet({weight:0,reps:8},{weight:0,reps:8},'reps'),true);
assert.equal(Intent.sameSet({weight:0,reps:8},{weight:null,reps:8},'reps'),false);
assert.equal(Intent.sameSet({weight:0,reps:8},{weight:'',reps:8},'reps'),false);
assert.equal(Intent.sameSet({weight:100,reps:5},{weight:100,reps:null},'reps'),false);
assert.equal(Intent.sameSet({weight:100,reps:5},{weight:100,reps:''},'reps'),false);
assert.equal(Intent.sameSet({weight:100,reps:5},{weight:100,reps:5},'reps'),true);
assert.equal(Intent.sameSet({weight:100,reps:5},{weight:105,reps:5},'reps'),false);
assert.equal(Intent.sameSet({weight:100,reps:5},{weight:100,reps:6},'reps'),false);
assert.equal(Intent.sameSet({weight:0,duration:30},{weight:0,duration:30},'duration'),true);
assert.equal(Intent.sameSet({weight:0,duration:30},{weight:null,duration:30},'duration'),false);
assert.equal(Intent.sameSet({weight:0,reps:10,minReps:8,maxReps:12},{weight:0,reps:11},'reps'),true);
assert.equal(Intent.sameSet({weight:0,reps:10,minReps:8,maxReps:12},{weight:0,reps:13},'reps'),false);

let p=Handoff.performance(workout(base));
assert.equal(p.comparableRpeSets,3);assert.equal(p.unmatchedRpeSets,0);assert.equal(p.unknownActualRpeSets,0);assert.equal(p.averageActualRpe,8);
p=Handoff.performance(workout([{weight:105,reps:5,rpe:10},{weight:100,reps:4,rpe:9},{weight:100,reps:5,rpe:8}]));
assert.equal(p.comparableRpeSets,1,'RPE from changed loads/reps must not enter the paired average');
assert.equal(p.unmatchedRpeSets,2);assert.equal(p.averageActualRpe,8);
p=Handoff.performance(workout([base[0],{weight:100,reps:5,rpe:null},base[2]]));
assert.equal(p.comparableRpeSets,2);assert.equal(p.unknownActualRpeSets,1);
p=Handoff.performance(workout([{weight:null,reps:5,rpe:9},base[1],base[2]]));
assert.equal(p.comparableRpeSets,2);assert.equal(p.unmatchedRpeSets,1);
p=Handoff.performance(workout([base[0]]));
assert.equal(p.comparableRpeSets,1);assert.equal(p.unmatchedRpeSets,2);
p=Handoff.performance(workout(base,{loadConvention:'per-hand'}));
assert.equal(p.comparableRpeSets,0,'Different load conventions are never RPE comparable');
assert.equal(p.unmatchedRpeSets,3);
// A known unique exercise ID may be recovered by exact name and tracking mode.
p=Handoff.performance(workout(base,{exerciseId:null}));
assert.equal(p.comparableRpeSets,3);
p=Handoff.performance(workout(base,{exerciseId:'other'}));
assert.equal(p.comparableRpeSets,0,'A conflicting explicit exercise identity cannot inherit the plan ID');
const noPlan={id:'standalone',exercises:[{name:'Squat',sets:base}]};
p=Handoff.performance(noPlan);assert.equal(p.comparableRpeSets,0);assert.equal(p.comparison,null);
const body=Intent.createPrescription([{exerciseId:'bw',name:'Bodyweight Squat',type:'strength',sets:[{weight:0,reps:12,targetRpe:7}]}],{type:'manual'},'2026-10-01T12:00:00.000Z');
const bodyWorkout={id:'bw',date:'2026-10-02',sessionIntent:{prescription:body},exercises:[{exerciseId:'bw',name:'Bodyweight Squat',type:'strength',sets:[{weight:0,reps:12,rpe:7}]}]};
assert.equal(Intent.compare(bodyWorkout).exactSets,1);
bodyWorkout.exercises[0].sets[0].weight=null;
assert.equal(Intent.compare(bodyWorkout).exactSets,0);
assert.equal(Handoff.performance(bodyWorkout).comparableRpeSets,0);
const record=workout(base);const before=JSON.stringify(record);Handoff.performance(record);assert.equal(JSON.stringify(record),before,'Read-only evidence must never mutate workout history');
console.log('v4.1 identity-safe, exact-dose RPE pairing, explicit zero and missing values passed');
