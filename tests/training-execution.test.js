const assert=require('node:assert/strict');
const Execution=require('../src/product/training-execution');

assert.equal(Execution.meaningful([{type:'strength',name:'Bench',sets:[{measure:'',weight:'',rpe:'',done:false}]}]),false);
assert.equal(Execution.meaningful([{type:'strength',name:'Bench',sets:[{measure:'5',weight:'',rpe:'',done:false}]}]),true);
assert.equal(Execution.meaningful([{type:'strength',name:'',sets:[{measure:'5',weight:'100',rpe:'8',done:false}]}]),false);
assert.equal(Execution.meaningful([{type:'cardio',name:'Bike',duration:'20',distance:'',done:false}]),true);
assert.equal(Execution.meaningful([],{scheduled:true}),true);
assert.equal(Execution.meaningful([],{started:true}),true);

assert.deepEqual(Execution.classify([
 {complete:true,total:3,done:3},
 {complete:false,total:3,done:1},
 {complete:false,total:2,done:0}
]).map(x=>x.state),['complete','current','upcoming']);
assert.deepEqual(Execution.classify([
 {complete:true,total:3,done:3},
 {complete:true,total:2,done:2}
]).map(x=>x.state),['complete','complete']);

assert.deepEqual(Execution.restSnapshot(null),{active:false,paused:false,remainingMs:0,totalMs:0,label:'—'});
assert.deepEqual(Execution.restSnapshot({total:90000,deadline:100000,paused:false,remaining:90000},40000),{
 active:true,paused:false,remainingMs:60000,totalMs:90000,label:'60s'
});
assert.deepEqual(Execution.restSnapshot({total:90000,deadline:100000,paused:true,remaining:45000},90000),{
 active:true,paused:true,remainingMs:45000,totalMs:90000,label:'45s · paused'
});

console.log('v2.75 execution state activates only for meaningful work and classifies workout/rest focus deterministically');