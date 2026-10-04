const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const original={schemaVersion:25,unit:'lb',workouts:[{id:'original',date:'2026-10-03',exercises:[]}],recoverySnapshots:[]};
const incoming={schemaVersion:25,unit:'kg',workouts:[{id:'replacement',date:'2026-10-03',exercises:[]}],recoverySnapshots:[]};
const button={disabled:false},cancel={disabled:false},messages=[];
const context={data:original,saveTimer:0,clearTimeout(){},document:{addEventListener(){},getElementById:id=>id==='confirm-import-review'?button:cancel},LoadnoteIntegrity:require('../src/product/data-integrity'),persistNow:async()=>{throw Error('quota failure');},reportStorageFailure:error=>messages.push(error.message),showToast:message=>messages.push(message)};
vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/product/data-transfer'),'utf8'),context);
vm.runInContext('pendingImportReview={incoming,previousState:data}',Object.assign(context,{incoming}));
(async()=>{
 const before=JSON.stringify(original);await context.commitImportReview();
 assert.equal(context.data,original);assert.equal(JSON.stringify(original),before);assert.equal(button.disabled,false);assert.equal(cancel.disabled,false);
 assert(messages.includes('quota failure'));assert(messages.at(-1).includes('Current data is unchanged'));
 console.log('Failed restore persistence leaves original in-memory data unchanged and controls retryable');
})().catch(error=>{console.error(error);process.exitCode=1;});
