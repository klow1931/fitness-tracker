const assert=require('node:assert/strict'),P=require('../src/product/workout-review-sets'),Session=require('../src/product/workout-session');
const draft={unit:'lb',date:'2026-11-01',notes:'',rows:[{name:'',sets:[]},{name:'Bench',type:'strength',sets:[{weight:'225',reps:'5',rpe:'8',done:true},{weight:'225',reps:'4',rpe:'',done:false}]},{name:'Hold',trackBy:'duration',sets:[{weight:'0',duration:'30',rpe:'',done:true}]},{name:'Bike',type:'cardio',duration:'10',distance:'3',cardioDone:false}]};
const before=JSON.stringify(draft),free=P.inspect(draft);assert.equal(free.exercises.length,3);assert.equal(free.missingRpe,2);assert.equal(free.excluded,0);assert.equal(free.exercises[0].rowIndex,1);assert.equal(free.exercises[0].exercise.sets[0].weight,102.06);
// Reuse the production prescription shape.
draft.sessionIntent={prescription:require('../src/product/session-intent').createPrescription([{name:'Bench',type:'strength',sets:[{weight:102.06,reps:5,targetRpe:8}]}])};const planned=P.inspect(draft);assert.equal(planned.excluded,2);assert.equal(planned.missingRpe,1);assert.deepEqual(planned.exercises[0].setNumbers,[1]);assert.equal(planned.exercises.length,2);
draft.rows[1].sets[0].done=false;draft.rows[1].sets[1].done=true;assert.deepEqual(P.inspect(draft).exercises[0].setNumbers,[2]);
draft.edit={id:'saved'};assert.equal(P.inspect(draft).excluded,0);assert.equal(P.inspect(draft).exercises.length,3);
for(const unit of ['kg','lb']){draft.unit=unit;const snapshot=JSON.stringify(draft),report=P.inspect(draft);assert.deepEqual(report.exercises.map(e=>e.exercise),Session.fromDraft(draft,'review').exercises);assert.equal(JSON.stringify(draft),snapshot);}
const empty=P.inspect({...draft,rows:[]});assert.deepEqual(empty,{exercises:[],missingRpe:0,excluded:0});assert(before.includes('225'));
const fs=require('node:fs');for(const f of ['playwright.config.js','.github/workflows/test.yml'])assert(fs.readFileSync(f,'utf8').includes('v70-workout-review.spec.js'));
console.log('v7.0 review projection respects serializer, units, completion, edits, timed/cardio work and source indices');
