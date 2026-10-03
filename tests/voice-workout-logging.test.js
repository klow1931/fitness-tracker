const assert=require('node:assert/strict');
const Logging=require('../src/product/voice-workout-logging');

(()=>{
 assert.equal(Logging.convertWeight(405,'lb','kg'),183.7);
 assert.equal(Logging.convertWeight(100,'kg','lb'),220.46);
 assert.equal(Logging.convertWeight(100,'kg','kg'),100);
 assert.equal(Logging.convertWeight(100,'stones','kg'),null);

 let result=Logging.normalizeSetPatch({weight:405,weightUnit:'lb',reps:4,rpe:8.5},{trackBy:'reps',displayUnit:'lb'});
 assert.equal(result.ok,true);
 assert.equal(result.patch.displayWeight,405);
 assert.equal(result.patch.weightKg,183.7);
 assert.equal(result.patch.reps,4);
 assert.equal(result.patch.rpe,8.5);
 assert.equal(Object.hasOwn(result.patch,'targetRPE'),false,'voice actual entry must not create a target-RPE field');

 result=Logging.normalizeSetPatch({weight:100,weightUnit:'kg',reps:5},{trackBy:'reps',displayUnit:'lb'});
 assert.equal(result.ok,true);
 assert.equal(result.patch.displayWeight,220.46,'kg input should convert only for the displayed form value');
 assert.equal(result.patch.weightKg,100,'internal evidence remains explicit kg');

 assert.equal(Logging.normalizeSetPatch({weight:405,reps:4},{trackBy:'reps',displayUnit:'lb'}).ok,false,'weight unit must never be guessed');
 assert.match(Logging.normalizeSetPatch({weight:405,reps:4},{trackBy:'reps',displayUnit:'lb'}).error,/kg or pounds/i);
 assert.equal(Logging.normalizeSetPatch({reps:4.5},{trackBy:'reps',displayUnit:'kg'}).ok,false);
 assert.equal(Logging.normalizeSetPatch({durationSeconds:30},{trackBy:'reps',displayUnit:'kg'}).ok,false);
 assert.equal(Logging.normalizeSetPatch({reps:5},{trackBy:'duration',displayUnit:'kg'}).ok,false);
 assert.equal(Logging.normalizeSetPatch({durationSeconds:30,rpe:8},{trackBy:'duration',displayUnit:'kg'}).ok,true);
 assert.equal(Logging.normalizeSetPatch({reps:5,rpe:8.25},{trackBy:'reps',displayUnit:'kg'}).ok,false,'voice RPE follows the logger 0.5-step contract');
 assert.equal(Logging.normalizeSetPatch({reps:5,rpe:10.5},{trackBy:'reps',displayUnit:'kg'}).ok,false);
 assert.equal(Logging.normalizeSetPatch({},{trackBy:'reps',displayUnit:'kg'}).ok,false);

 console.log('v2.81 voice workout logging unit conversion, measure and actual-RPE guardrails passed');
})();
