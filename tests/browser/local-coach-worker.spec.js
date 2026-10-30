const {test,expect}=require('playwright/test');
test('fresh worker offline mode serves cached files and blocks an uncached fetch',async({page})=>{
 let network=0;
 await page.route('https://model-test.invalid/**',r=>{network++;return r.abort();});
 // Exercise the actual worker entry and fetch guard with a tiny deterministic engine.
 // No model weights or GPU generation are represented by this test.
 await page.route('**/assets/vendor/local-coach-runtime.mjs',r=>r.fulfill({contentType:'text/javascript',body:`export class WebWorkerMLCEngineHandler { async onmessage(e){try{const r=await fetch(e.data);self.postMessage({text:await r.text()});}catch(error){self.postMessage({error:error.message});}} }`}));
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const cache=await caches.open('local-coach-test');await cache.put('https://model-test.invalid/cached',new Response('cached model asset'));
  const worker=new Worker(new URL('src/local-ai/coach-worker.mjs?offline=1',document.baseURI),{type:'module'});
  const ask=url=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker test timed out')),5000);worker.onmessage=e=>{clearTimeout(timer);resolve(e.data);};worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message));};worker.postMessage(url);});
  try{return [await ask('https://model-test.invalid/cached'),await ask('https://model-test.invalid/missing')];}finally{worker.terminate();await caches.delete('local-coach-test');}
 });
 expect(result[0].text).toBe('cached model asset');expect(result[1].error).toContain('missing from cache');expect(network).toBe(0);
});
test('local runtime is bundled on this origin and exposes the worker API',async({page})=>{
 await page.goto('/');const info=await page.evaluate(async()=>{const m=await import(new URL('assets/vendor/local-coach-runtime.mjs',document.baseURI));return {worker:typeof m.CreateWebWorkerMLCEngine,direct:typeof m.CreateMLCEngine,models:m.prebuiltAppConfig.model_list.length};});expect(info.worker).toBe('function');expect(info.direct).toBe('undefined');expect(info.models).toBeGreaterThan(0);
});
test('local AI settings expose offline restart and scoped removal without changing training',async({page})=>{
 await page.goto('/');await page.evaluate(()=>{window.aiSettingsCalls=[];const state={status:'ready',model:'Tiny-Instruct',memoryMB:500,conversationConsent:true};window.LoadnoteLocalCoachAI={snapshot:()=>state,testOffline:async options=>{aiSettingsCalls.push(['offline',options.confirmed]);return {...state,offlineTest:{passed:true}};},removeModel:async options=>{aiSettingsCalls.push(['remove',options.modelId,options.confirmed]);return {status:'off'};}};LoadnoteCoachingLibraryUI.open({localAI:true});});
 const before=await page.evaluate(()=>JSON.stringify(data)),d=page.locator('#coaching-library-dialog');await d.locator('#local-ai-offline-test').click();await expect(d.locator('#local-ai-status')).toContainText('fresh offline start passed');await d.locator('#local-ai-remove').click();await expect(d.locator('#local-ai-status')).toContainText('off');expect(await page.evaluate(()=>aiSettingsCalls)).toEqual([['offline',true],['remove','Tiny-Instruct',true]]);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
