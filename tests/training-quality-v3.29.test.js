/* v3.29 training loop acceptance: real records are distinct from planned targets. */
const assert=require('node:assert/strict');
const P=require('../src/product/offline-planner');
const S=require('../src/product/workout-session');
const {phaseFixture}=require('./fixtures/phase-builder');
const state=phaseFixture().state;
const unchanged=JSON.stringify(state);
const ask=P.answer(state,'Create an upper body workout today for 30 minutes with dumbbells');
assert.equal(ask.source,'Shared coaching · offline planning');
assert.equal(JSON.stringify(state),unchanged,'Conversation does not mutate training history');
const choices=P.candidates(state,ask.planning);
assert(choices.length>=2&&choices.every(e=>e.equipment==='dumbbells'));
const first=choices[0];
const request=[{key:first.key,sets:2,reps:8,weightKg:12,rpe:7,rest:120}];
assert.throws(()=>P.workout(state,ask.planning,request),/Confirm/);
const draft=P.workout(state,ask.planning,request,{confirmed:true,now:'2026-10-16T12:00:00.000Z'});
assert.equal(draft.prescription.plannedExercises[0].sets.length,2);
assert(draft.prescription.plannedExercises[0].sets.every(set=>set.targetRpe===7&&!Object.hasOwn(set,'rpe')));
assert.equal(JSON.stringify(state),unchanged,'Preview never saves workout, target or performance');
const planned=draft.prescription;
const originalDraft={
 date:'2026-10-16',notes:'Preserve unknown effort',unit:'lb',
 sessionIntent:{version:1,role:'volume',goal:'Quality loop',prescription:planned,deviationReason:'none'},
 rows:[{
   name:planned.plannedExercises[0].name,type:'strength',trackBy:'reps',
   sets:[{reps:'8',weight:(12*2.2046226218).toFixed(2),rpe:'',done:true},
         {reps:'8',weight:(12*2.2046226218).toFixed(2),rpe:'',done:false}]
 },{
   name:'Bike',type:'cardio',duration:'20',distance:'0',distanceUnit:'mi',cardioDone:false
 }]
};
const inputBefore=JSON.stringify(originalDraft);
const saved=S.fromDraft(originalDraft,'quality-actual');
assert.equal(saved.id,'quality-actual');assert.equal(saved.exercises.length,1,'Unperformed plan/cardio excluded');
assert.equal(saved.exercises[0].sets.length,1,'Only performed strength set saved');
assert(Math.abs(saved.exercises[0].sets[0].weight-12)<0.01,'Pounds converted once into kg');
assert(!Object.hasOwn(saved.exercises[0].sets[0],'rpe'),'Unknown actual effort remains unknown');
assert.equal(saved.sessionIntent.prescription.plannedExercises[0].sets.length,2,'Original two-set plan remains intact');
assert.equal(saved.sessionIntent.prescription.plannedExercises[0].sets[0].targetRpe,7,'Target never becomes actual RPE');
assert.equal(JSON.stringify(originalDraft),inputBefore,'Saving cannot mutate captured review');
assert.equal(JSON.stringify(state),unchanged,'Review and save helper do not mutate source state');
console.log('v3.29 training journey: offline request, reviewed target, partial actual logging, kg/lb, RPE and immutability passed');
