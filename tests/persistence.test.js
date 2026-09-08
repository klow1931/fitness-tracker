const assert=require('assert');
const {createWriter}=require('../src/product/persistence');
(async()=>{
 let backend='indexedDB',stored,commits=[];
 const io={backend:()=>backend,setBackend:b=>{backend=b;},key:'state',local:{setItem:(k,v)=>{stored=JSON.parse(v);},removeItem:()=>{stored=null;}},idbSet:async v=>{commits.push(v);}};
 const write=createWriter(io);const state={workouts:[1]};const pending=write(state);state.workouts.push(2);await pending;
 assert.deepEqual(commits[0].workouts,[1]);
 io.idbSet=async()=>{throw Error('abort');};await write({workouts:[3]});assert.equal(backend,'localStorage');assert.equal(stored._loadnoteFallback,true);
 io.local.setItem=()=>{throw Error('quota');};await assert.rejects(write({workouts:[4]}),/quota/);
 io.local.setItem=(k,v)=>{stored=JSON.parse(v);};await write({workouts:[5]});assert.deepEqual(stored.workouts,[5]);
 await Promise.all([write({workouts:[6]}),write({workouts:[7]})]);assert.deepEqual(stored.workouts,[7]);
 console.log('Persistence snapshot, fallback, failure, and queue tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
