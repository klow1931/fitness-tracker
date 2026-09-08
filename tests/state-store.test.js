const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
function fixture(value){
 const context={console:{warn(){}},localStorage:{getItem:()=>value},window:{}};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/product/state-store.js'),'utf8'),context);return context;
}
(async()=>{
 const marked=fixture(JSON.stringify({_loadnoteFallback:true,workouts:[{id:'latest'}]}));marked.idbGet=async()=>{throw Error('Must not prefer stale IDB');};
 assert.equal((await marked.loadDataAsync()).workouts[0].id,'latest');
 const primary=fixture(null);primary.idbGet=async()=>({workouts:[{id:'idb'}]});assert.equal((await primary.loadDataAsync()).workouts[0].id,'idb');
 const migrate=fixture(JSON.stringify({workouts:[{id:7}]}));let written;migrate.idbGet=async()=>null;migrate.idbSet=async value=>{written=value;};await migrate.loadDataAsync();assert.equal(written.workouts[0].id,7);
 const blocked=fixture('bad json');blocked.idbGet=async()=>{throw Error('Unavailable');};assert.equal((await blocked.loadDataAsync()).workouts.length,0);
 const writer=fixture(null);const req={};const tx={objectStore:()=>({put:()=>req})};writer.openIDB=async()=>({transaction:()=>tx});let done=false;const save=writer.idbSet({}).then(()=>{done=true;});await Promise.resolve();assert(!done);tx.oncomplete();await save;assert(done);
 console.log('Storage precedence, migration, fallback and transaction completion tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
