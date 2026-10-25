const assert=require('node:assert/strict');
const Intent=require('../src/product/session-intent');
const Handoff=require('../src/product/adaptive-handoff');

const plan=Intent.createPrescription([{
 exerciseId:'comp-bench',name:'Competition Bench',type:'strength',trackBy:'reps',loadConvention:'total',
 sets:[{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}]
}],{type:'manual',label:'Next-exposure test'},'2026-10-01T12:00:00.000Z');
const workout=(id,sets,more={})=>({
 id,date:'2026-10-03',createdAt:'2026-10-03T18:00:00.000Z',
 sessionIntent:{prescription:plan},
 exercises:[{exerciseId:'comp-bench',name:'Competition Bench',type:'strength',trackBy:'reps',loadConvention:'total',sets}],
 ...more
});
const sets=[{weight:100,reps:5,rpe:7.5},{weight:100,reps:5,rpe:8}];
const saved=workout('ok',sets);
const before=JSON.stringify(saved);
let signal=Handoff.learning(saved);
assert.equal(signal.version,1);
assert.equal(signal.status,'within-cap');
assert.equal(signal.verified,true);
assert.equal(signal.plannedSets,2);
assert.equal(signal.matchedSets,2);
assert.equal(signal.effortCompared,2);
assert.equal(signal.aboveCap,0);
assert.match(signal.nextStep,/not proof that the next load should increase/);
assert.equal(JSON.stringify(saved),before,'The signal must not modify saved workout evidence');

signal=Handoff.learning(workout('high',[sets[0],{weight:100,reps:5,rpe:9}]));
assert.equal(signal.status,'above-cap');
assert.equal(signal.aboveCap,1);
assert.match(signal.nextStep,/No automatic reduction/);

signal=Handoff.learning(workout('missing',[sets[0],{weight:100,reps:5,rpe:null}]));
assert.equal(signal.status,'missing-effort');
assert.equal(signal.effortCompared,1);
assert.match(signal.summary,/1 matched set lacked comparable RPE/);
assert.match(signal.nextStep,/remains unknown/);

signal=Handoff.learning(workout('different',[sets[0],{weight:105,reps:5,rpe:8}]));
assert.equal(signal.status,'different-work');
assert.equal(signal.matchedSets,1);
assert.match(signal.summary,/Other work was changed/);

signal=Handoff.learning(workout('unknown',{length:0}));
assert.equal(signal.status,'different-work');

signal=Handoff.learning(workout('late',sets,{sessionIntent:{prescription:{...plan,capturedAt:'2026-10-04T12:00:00.000Z'}}}));
assert.equal(signal.status,'unverified-timing');
assert.equal(signal.verified,false);
assert.doesNotMatch(signal.summary,/matched logged load/);

signal=Handoff.learning(workout('no-plan',sets,{sessionIntent:null}));
assert.equal(signal.status,'no-prior-plan');
assert.equal(signal.verified,false);
assert.match(signal.nextStep,/Capture a plan before a future session/);

const zeroPlan=Intent.createPrescription([{exerciseId:'bw',name:'Bodyweight Squat',type:'strength',trackBy:'reps',sets:[{weight:0,reps:10,targetRpe:7}]}],{type:'manual'},'2026-10-01T12:00:00.000Z');
signal=Handoff.learning(workout('zero',[],{sessionIntent:{prescription:zeroPlan},exercises:[{exerciseId:'bw',name:'Bodyweight Squat',type:'strength',trackBy:'reps',sets:[{weight:0,reps:10,rpe:7}]}]}));
assert.equal(signal.status,'within-cap');
assert.equal(signal.matchedSets,1);

console.log('v4.0 deterministic post-workout signals: verified effort, missing data, bodyweight and no automatic adaptation');
