const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const script=fs.readFileSync(path.join(__dirname,'../src/product/app-lifecycle.js'),'utf8');
function element(){
 const events={};return {hidden:true,disabled:false,textContent:'',events,
  addEventListener(name,listener){events[name]=listener;},click(){events.click?.();}};
}
async function startApp(options={}){
 const ids=['connection-status','app-version-status','app-update','app-update-status','apply-app-update','check-app-update','repair-offline-cache','update-check-status'];
 const ui=Object.fromEntries(ids.map(id=>[id,element()]));
 const listeners={window:{},document:{},sw:{},registration:{}};
 const messages=[];let saved=0,checked=0;
 const controller={postMessage(message){messages.push(message);}};
 const registration={waiting:null,installing:null,update:async()=>{checked++;},
  addEventListener(name,listener){listeners.registration[name]=listener;}};
 const navigator={onLine:true,serviceWorker:{controller,
  register:async()=>registration,addEventListener(name,listener){listeners.sw[name]=listener;}}};
 const document={hidden:false,getElementById:id=>ui[id],addEventListener(name,listener){listeners.document[name]=listener;}};
 const window={LoadnoteAppVersion:require('../src/product/app-version'),LoadnoteCore:{RELEASE_VERSION:'7.7.0'},
  fetch:async()=>{if(options.fetchFailed)throw Error('Network unavailable');return {ok:true,json:async()=>({version:'7.7.0'})};},
  LoadnotePlatform:{detect:()=>({native:!!options.native}),apply:(_,platform)=>platform},
  addEventListener(name,listener){listeners.window[name]=listener;}};
 vm.runInNewContext(script,{window,document,navigator,location:{reload(){}},
  data:{workouts:[]},saveTimer:0,AbortController,setTimeout(fn){listeners.timeout=fn;return 1;},clearTimeout(){listeners.timeout=null;},saveLoggerDraft:()=>!options.draftFailed,
  persistNow:async()=>{if(options.persistFailed)throw Error('Disk full');saved++;},reportStorageFailure(){}});
 await window.LoadnoteLifecycle.start();
 return {ui,listeners,registration,messages,controller,stats:()=>({saved,checked}),navigator};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const h=await startApp();
 assert.equal(h.ui['check-app-update'].hidden,false,'The manual update check must be discoverable');
 h.ui['check-app-update'].click();await settle();
 assert(h.ui['update-check-status'].textContent.includes('Update check completed'));
 assert.match(h.ui['app-version-status'].textContent,/You have the current version/);
 assert(h.stats().checked>=2,'The check must run on startup and on explicit request');

 h.listeners.sw.message({data:{type:'OFFLINE_CACHE_STATUS',ready:false}});
 assert.equal(h.ui['repair-offline-cache'].hidden,false);
 assert(h.ui['app-update-status'].textContent.includes('Do not clear website data'));
 h.ui['repair-offline-cache'].click();
 assert.equal(h.messages.at(-1).type,'REPAIR_OFFLINE_CACHE');
 h.listeners.sw.message({data:{type:'OFFLINE_CACHE_PROGRESS',cached:200,total:315,failed:0}});
 assert.match(h.ui['update-check-status'].textContent,/200 of 315/);assert.equal(h.ui['repair-offline-cache'].disabled,true);
 h.listeners.timeout();assert.equal(h.ui['repair-offline-cache'].disabled,false);assert.match(h.ui['update-check-status'].textContent,/taking longer/);
 h.listeners.sw.message({data:{type:'OFFLINE_CACHE_STATUS',ready:false,cached:314,total:315,failed:1}});
 assert.match(h.ui['update-check-status'].textContent,/1 of 315/);assert.match(h.ui['update-check-status'].textContent,/Completed downloads are kept/);
 h.listeners.sw.message({data:{type:'OFFLINE_CACHE_STATUS',ready:true}});
 assert.equal(h.ui['repair-offline-cache'].hidden,true);
 assert.equal(h.ui['app-update'].hidden,true);

 h.registration.waiting={postMessage(message){h.messages.push(message);}};
 h.ui['check-app-update'].click();
 await settle();
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
 for(const failure of ['draftFailed','persistFailed']){
  const failed=await startApp({[failure]:true});failed.registration.waiting={postMessage(message){failed.messages.push(message);}};
  failed.ui['apply-app-update'].click();await settle();
  assert.equal(failed.messages.some(message=>message.type==='APPLY_UPDATE'),false,'Failed '+failure+' must block activation');
  assert.match(failed.ui['app-update-status'].textContent,/Update paused/);assert.equal(failed.ui['apply-app-update'].disabled,false);
 }
 const network=await startApp({fetchFailed:true});network.ui['check-app-update'].click();await settle();
 assert.match(network.ui['app-version-status'].textContent,/could not be verified/);
 network.navigator.onLine=false;network.ui['check-app-update'].click();await settle();
 assert.match(network.ui['app-version-status'].textContent,/Connect to check/);
 const native=await startApp({native:true});assert.match(native.ui['app-version-status'].textContent,/new app build/);assert.equal(native.stats().checked,0);
 console.log('PWA manual checks, offline repair, guarded activation and failure messages passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
