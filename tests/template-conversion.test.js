const assert=require('assert');const S=require('../src/product/workout-session');
const draft={date:'2026-09-08',unit:'kg',rows:[{name:' Bench ',type:'strength',trackBy:'reps',sets:[{reps:'5',weight:'100.125',rpe:'9'}]},{name:'Plank',type:'strength',trackBy:'duration',sets:[{duration:'30',weight:'',rpe:'7'}]},{name:'Bike',type:'cardio',duration:'',distance:'',distanceUnit:'mi'}]};
const template=S.fromDraft(draft,null,{template:true}).exercises;
assert.equal(template.length,3);assert.equal(template[0].name,'Bench');assert.equal(template[0].sets[0].weight,100.125);assert.equal(template[0].sets[0].rpe,undefined);assert.equal(template[1].sets[0].weight,0);assert.equal(template[2].duration,0);
assert.equal(S.fromDraft(draft,'session').exercises.length,2,'Session still ignores empty cardio');
assert.equal(S.fromDraft({...draft,unit:'lb',rows:[{name:'Bench',sets:[{reps:5,weight:220.46}]}]},null,{template:true}).exercises[0].sets[0].weight,100);
const workouts=[{date:'2026-09-07',exercises:[{name:'Bench',sets:[{reps:5}]}]}];assert.equal(S.findPerformance(workouts,'bench',e=>e.sets.length).date,'2026-09-07');assert.equal(S.findPerformance(workouts,'Missing'),null);
console.log('Shared draft conversion preserves template-specific behavior');
