const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const script=fs.readFileSync(path.join(__dirname,'../src/product/app-lifecycle.js'),'utf8');
function element(){
 const events={};return {hidden:true,disabled:false,textContent:'',events,
  addEventListener(name,listener){events[name]=listener;},click(){events.click?.();}};
}
async function startApp(){
 const ids=['connection-status','app-update','app-update-status','apply-app-update','check-app-update','repair-offline-cache','update-check-status'];
 const ui=Object.fromEntries(ids.map(id=>[id,element()]));
 const listeners={window:{},document:{},sw:{},registration:{}};
 const messages=[];let saved=0,checked=0;
 const controller={postMessage(message){messages.push(message);}};
 const registration={waiting:null,installing:null,update:async()=>{checked++;},
  addEventListener(name,listener){listeners.registration[name]=listener;}};
 const navigator={onLine:true,serviceWorker:{controller,
  register:async()=>registration,addEventListener(name,listener){listeners.sw[name]=listener;}}};
 const document={hidden:false,getElementById:id=>ui[id],addEventListener(name,listener){listeners.document[name]=listener;}};
 const window={LoadnotePlatform:{detect:()=>({native:false}),apply:(_,platform)=>platform},
  addEventListener(name,listener){listeners.window[name]=listener;}};
 vm.runInNewContext(script,{window,document,navigator,location:{reload(){}},
  data:{workouts:[]},saveTimer:0,clearTimeout(){},saveLoggerDraft:()=>true,
  persistNow:async()=>{saved++;},reportStorageFailure(){}});
 await window.LoadnoteLifecycle.start();
 return {ui,listeners,registration,messages,controller,stats:()=>({saved,checked}),navigator};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const h=await startApp();
 assert.equal(h.ui['check-app-update'].hidden,false,'The manual update check must be discoverable');
 h.ui['check-app-update'].click();await settle();
 assert(h.ui['update-check-status'].textContent.includes('Update check completed'));
 assert(h.stats().checked>=2,'The check must run on startup and on explicit request');

 h.listeners.sw.message({data:{type:'OFFLINE_CACHE_STATUS',ready:false}});
 assert.equal(h.ui['repair-offline-cache'].hidden,false);
 assert(h.ui['app-update-status'].textContent.includes('Do not clear website data'));
 h.ui['repair-offline-cache'].click();
 assert.equal(h.messages.at(-1).type,'REPAIR_OFFLINE_CACHE');
 h.listeners.sw.message({data:{type:'OFFLINE_CACHE_STATUS',ready:true}});
 assert.equal(h.ui['repair-offline-cache'].hidden,true);
 assert.equal(h.ui['app-update'].hidden,true);

 h.registration.waiting={postMessage(message){h.messages.push(message);}};
 h.ui['check-app-update'].click();
 assert.equal(h.ui['app-update'].hidden,false,'Waiting updates must be offered, not applied silently');
 assert.equal(h.stats().saved,0,'Checking must not change training state');
 h.ui['apply-app-update'].click();await settle();
 assert.equal(h.stats().saved,1,'Save must complete before activation');
 assert.equal(h.messages.at(-1).type,'APPLY_UPDATE');
 h.listeners.sw.message({data:{type:'UPDATE_BLOCKED'}});
 assert.equal(h.ui['apply-app-update'].disabled,false,'An extra tab must leave the update retryable');

 h.registration.waiting=null;
 const worker={state:'installing',addEventListener(name,listener){this.listener=listener;}};
 h.registration.installing=worker;
 h.listeners.registration.updatefound();
 worker.state='redundant';worker.listener();
 assert.equal(h.ui['apply-app-update'].hidden,true);
 assert(h.ui['app-update-status'].textContent.includes('could not finish installing'));
 assert.equal(h.stats().saved,1,'Failed installation must not erase or replace saved records');
 console.log('PWA manual checks, offline repair, guarded activation and failure messages passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
