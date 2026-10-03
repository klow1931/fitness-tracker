const assert=require('node:assert/strict');
const Proactive=require('../src/product/proactive-coach');

(()=>{
 assert.equal(Proactive.normalizeMode('QUIET'),'quiet');
 assert.equal(Proactive.normalizeMode('unknown'),'normal');

 const small=Proactive.rpeDeviationEvent({exercise:'Competition Squat',setNumber:2,actualRpe:8.5,targetRpe:8});
 assert(small);assert.equal(small.minMode,'proactive');assert.equal(small.priority,'normal');assert.equal(small.data.difference,0.5);
 const large=Proactive.rpeDeviationEvent({exercise:'Competition Squat',setNumber:3,actualRpe:9,targetRpe:8});
 assert(large);assert.equal(large.minMode,'normal');assert.equal(large.priority,'important');assert.match(large.message,/RPE 9/);assert.match(large.message,/target 8/);
 assert.equal(Proactive.rpeDeviationEvent({actualRpe:8.4,targetRpe:8}),null,'sub-0.5 deviation must stay silent');
 assert.equal(Proactive.rpeDeviationEvent({actualRpe:null,targetRpe:8}),null,'missing actual RPE must stay silent');

 const rest=Proactive.restCompleteEvent({nextLabel:'Bench Press set 3: 225 lb × 5'});
 assert.equal(rest.minMode,'quiet');assert.equal(rest.priority,'essential');assert.match(rest.message,/Rest complete/);
 const transition=Proactive.exerciseTransitionEvent({completedExercise:'Squat',nextExercise:'Bench Press'});
 assert.equal(transition.minMode,'normal');assert.match(transition.message,/Squat complete/);
 assert.equal(Proactive.workoutCompleteEvent().priority,'essential');

 let now=1000;
 const gate=Proactive.createGate({mode:'normal',cooldownMs:8000,dedupeMs:60000,now:()=>now});
 assert.equal(gate.eligible(small,{active:true}).reason,'mode','normal mode must suppress proactive-only observations');
 assert.equal(gate.eligible(large,{active:false}).reason,'inactive');
 assert.equal(gate.eligible(large,{active:true,busy:true}).reason,'busy');
 assert.equal(gate.eligible(large,{active:true}).ok,true);gate.markDelivered(large);
 assert.equal(gate.eligible(large,{active:true}).reason,'duplicate');
 const transition2=Proactive.exerciseTransitionEvent({completedExercise:'Bench Press',nextExercise:'Deadlift'});
 assert.equal(gate.eligible(transition2,{active:true}).reason,'cooldown');
 assert.equal(gate.eligible(rest,{active:true}).ok,true,'essential rest-complete cue bypasses ordinary cooldown');
 gate.markDelivered(rest);
 gate.pause();assert.equal(gate.eligible(Proactive.workoutCompleteEvent(),{active:true}).reason,'paused');
 gate.resume();assert.equal(gate.eligible(Proactive.workoutCompleteEvent(),{active:true}).ok,true);
 gate.setMode('quiet');assert.equal(gate.eligible(transition2,{active:true}).reason,'mode');
 gate.setMode('proactive');now+=9000;assert.equal(gate.eligible(small,{active:true}).ok,true);

 console.log('v2.82 proactive Coach deterministic modes, RPE thresholds, cooldown, dedupe and pause/resume passed');
})();
