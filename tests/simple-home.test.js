const assert=require('node:assert/strict'),H=require('../src/product/simple-home');
const w=(id,date,name='Synthetic press',sets=[{weight:100,reps:5,rpe:8}])=>({id,date,exercises:[{name,sets}]});
const state={workouts:[w('old','2026-11-01'),w('a','2026-11-12'),w('b','2026-11-16'),w('b','2026-11-16'),w('future','2026-11-17'),w('invalid','bad'),w('blank','2026-11-16','Blank',[]),w('unfinished','2026-11-16','Unfinished',[{weight:900,reps:5,completed:false}])]},before=JSON.stringify(state);
let r=H.inspect(state,{asOf:'2026-11-16'});assert.equal(r.sessions,2);assert.equal(r.from,'2026-11-10');assert.equal(r.latest.id,'b');assert.deepEqual(r.latest.names,['Synthetic press']);assert.equal(JSON.stringify(state),before);
assert.equal(H.inspect({workouts:[{id:'cardio',date:'2026-11-16',exercises:[{name:'Run',type:'cardio',duration:20}]}]},{asOf:'2026-11-16'}).sessions,1);
assert.equal(H.inspect({workouts:[w('hold','2026-11-16','Hold',[{duration:30}])]},{asOf:'2026-11-16'}).sessions,1);
assert.equal(H.inspect({},{asOf:'2026-11-16'}).latest,null);assert.throws(()=>H.inspect(state,{asOf:'2026-02-30'}));
assert.equal(H.inspect({...state,workouts:state.workouts.filter(w=>w.id!=='b')},{asOf:'2026-11-16'}).latest.id,'a');
console.log('Simple Home projection counts only saved dated work, excludes future/blank/duplicates, preserves history and handles corrections');
