const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const script=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
const scope='https://example.test/loadnote/';

function harness(failWarm=false){
  const listeners=new Map(),stores=new Map(),calls=[];
  let blockedClients=false,claims=0,skips=0,networkRequests=0;
  const response={ok:true,clone(){return this;}};
  const getCache=name=>{
    if(!stores.has(name)){
      const entries=new Map();
      stores.set(name,{
        entries,
        async addAll(paths){
          calls.push({name,paths:[...paths]});
          if(failWarm&&paths.length>1)throw Error('simulated offline-file failure');
          paths.forEach(p=>entries.set(new URL(p,scope).href,response));
        },
        async match(url){return entries.get(new URL(url,scope).href);},
        async put(url,item){entries.set(new URL(url,scope).href,item);}
      });
    }
    return stores.get(name);
  };
  const source={postMessage(message){calls.push({message});}};
  const self={
    registration:{scope},location:{origin:new URL(scope).origin},
    addEventListener(name,handler){listeners.set(name,handler);},
    clients:{async claim(){claims++;},async matchAll(){return blockedClients?[{url:scope},{url:scope+'index.html'}]:[{url:scope,postMessage(message){calls.push({broadcast:message});}}];}},
    async skipWaiting(){skips++;}
  };
  vm.runInNewContext(script,{self,caches:{open:async name=>getCache(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},URL,fetch:async()=>{networkRequests++;return response;}});
  const fire=async(name,extra={})=>{
    let task,reply;
    listeners.get(name)({...extra,waitUntil(promise){task=promise;},respondWith(promise){reply=promise;}});
    if(task)await task;
    return reply?reply:undefined;
  };
  return {fire,stores,calls,source,getCache,disableFailure(){failWarm=false;},blockOtherTab(value){blockedClients=value;},stats(){return {claims,skips,networkRequests};}};
}

(async()=>{
  const sw=harness();
  sw.getCache('loadnote-v3.26.0');sw.getCache('loadnote-v3.62.0');sw.getCache('other-app-cache');
  await sw.fire('install');
  assert.deepEqual(sw.calls[0].paths,['./index.html'],'An upgrade must not download the full shell before it can wait');
  assert(sw.stores.has('loadnote-v3.62.0'),'The old offline shell must survive while an update waits');
  sw.blockOtherTab(true);
  await sw.fire('message',{data:{type:'APPLY_UPDATE'},source:sw.source});
  assert.equal(sw.stats().skips,0,'A second app window must still block activation');
  assert(sw.calls.some(call=>call.message?.type==='UPDATE_BLOCKED'));
  sw.blockOtherTab(false);
  await sw.fire('message',{data:{type:'APPLY_UPDATE'},source:sw.source});
  assert.equal(sw.stats().skips,1);
  await sw.fire('activate');
  assert.equal(sw.stats().claims,1);
  assert(!sw.stores.has('loadnote-v3.26.0')&&!sw.stores.has('loadnote-v3.62.0'),'Only retired Loadnote asset caches are reclaimed');
  assert(sw.stores.has('other-app-cache'),'Other origin caches must remain untouched');
  assert(sw.getCache('loadnote-v3.66.0').entries.size>100,'Activation must warm the complete offline shell');
  await sw.fire('message',{data:{type:'CHECK_OFFLINE_CACHE'},source:sw.source});
  assert.equal(sw.calls.at(-1).message.ready,true);
  const url=scope+'src/release.js';
  sw.getCache('loadnote-v3.66.0').entries.delete(url);
  const reply=await sw.fire('fetch',{request:{method:'GET',url}});
  // Fetch misses must repopulate their cache when the device is online.
  assert.equal(reply.ok,true);
  assert.equal(sw.stats().networkRequests,1);
  assert(await sw.getCache('loadnote-v3.66.0').match(url));

  const recovery=harness(true);
  recovery.getCache('loadnote-v3.62.0');
  await recovery.fire('install');
  await recovery.fire('activate');
  assert.equal(recovery.stats().claims,1,'Incomplete offline warming must not strand a saved workout');
  assert(recovery.calls.some(call=>call.broadcast?.type==='OFFLINE_CACHE_INCOMPLETE'));
  await recovery.fire('message',{data:{type:'CHECK_OFFLINE_CACHE'},source:recovery.source});
  assert.equal(recovery.calls.at(-1).message.ready,false);
  recovery.disableFailure();
  await recovery.fire('message',{data:{type:'REPAIR_OFFLINE_CACHE'},source:recovery.source});
  assert.equal(recovery.calls.at(-1).message.ready,true,'Offline files must be repairable without clearing training data');
  console.log('Service-worker staged installation, old-cache cleanup, guarded activation and repair tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
