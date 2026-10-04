const assert=require('node:assert'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const status={textContent:''};const context=vm.createContext({window:{},document:{getElementById:id=>id==='device-save-status'?status:null},console});
 vm.runInContext(fs.readFileSync(require.resolve('../src/product/state-store.js'),'utf8'),context);
 vm.runInContext('var pendingWrites=[];persistenceWriter=()=>new Promise((resolve,reject)=>pendingWrites.push({resolve,reject}));',context);
 const first=vm.runInContext('persistNow({workouts:[1]})',context);
 const second=vm.runInContext('persistNow({workouts:[2]})',context);
 vm.runInContext('pendingWrites[0].resolve()',context);await first;
 assert.equal(context.window.LoadnoteSaveHealth,'pending');assert.equal(status.textContent,'Saving on this device…');
 vm.runInContext('pendingWrites[1].reject(Error("quota"))',context);await assert.rejects(second,/quota/);
 assert.equal(context.window.LoadnoteSaveHealth,'failed');
 const retry=vm.runInContext('persistNow({workouts:[2]})',context);
 vm.runInContext('pendingWrites[2].resolve()',context);await retry;
 assert.equal(context.window.LoadnoteSaveHealth,'saved');
 console.log('Save health tracks latest pending, failed and retried writes');
})().catch(error=>{console.error(error);process.exitCode=1;});
