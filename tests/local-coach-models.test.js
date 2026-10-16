const assert=require('node:assert/strict'),Models=require('../src/product/local-coach-models'),AI=require('../src/product/local-coach-ai');
(async()=>{
 const raw=[
  {model_id:'Not-Instruct-3B-q4f32_1',vram_required_MB:1700},
  {model_id:'Test-Instruct-800-q4f32_1',vram_required_MB:800},
  {model_id:'Test-Instruct-850-q4f16_1',vram_required_MB:850},
  {model_id:'Test-Instruct-1000-q4f32_1',vram_required_MB:1000},
  {model_id:'Vision-Instruct',vram_required_MB:200},
  {model_id:'Test-Instruct-1000-q4f32_1',vram_required_MB:1000},
  {model_id:'Test-Instruct-700-q4f32_1',vram_required_MB:700,required_features:['missing-feature']},
  {model_id:'Test-Instruct-big-buffer',vram_required_MB:600,buffer_size_required_bytes:2000}
 ];
 const adapter={features:new Set(),limits:{maxStorageBufferBindingSize:1000}},expected=['Test-Instruct-800-q4f32_1','Test-Instruct-1000-q4f32_1'];
 assert.deepEqual(Models.supported(raw,adapter).map(x=>x.id),expected);
 assert.equal(Models.select(Models.supported(raw,adapter),'auto').id,expected[0]);
 assert.equal(Models.select(Models.supported(raw,adapter),expected[1]).id,expected[1]);
 assert.throws(()=>Models.select(Models.supported(raw,adapter),'Not-Instruct-3B-q4f32_1'),/unavailable/);
 assert.throws(()=>Models.select([], 'auto'),/No compatible/);
 assert.equal(Models.supported(raw,{...adapter,features:new Set(['shader-f16'])}).some(m=>m.id.includes('q4f16')),true);
 let runtimeLoads=0,weightLoads=0,unloads=0;
 const engine={unload:async()=>unloads++,interruptGenerate:async()=>{},chat:{completions:{create:async req=>{const p=JSON.parse(req.messages[1].content);return {choices:[{message:{content:JSON.stringify({text:/injury/i.test(p.question)?'I cannot give medical clearance; ask a professional.':'Speed intent uses controlled technique.'})}}]};}}}};
 const api=AI.create({gpu:()=>({requestAdapter:async()=>adapter}),loadRuntime:async()=>{runtimeLoads++;return {prebuiltAppConfig:{model_list:raw},CreateMLCEngine:async id=>{weightLoads++;assert.equal(id,expected[1]);return engine;}}}});
 await assert.rejects(api.listModels(),/Confirm/);assert.equal(runtimeLoads,0);assert.equal(weightLoads,0);
 const list=await api.listModels({confirmed:true});assert.deepEqual(list.map(x=>x.id),expected);
 assert.equal(runtimeLoads,1);assert.equal(weightLoads,0,'Inspection cannot create an engine/download weights');
 await assert.rejects(api.enable({confirmed:false}),/Confirm/);assert.equal(weightLoads,0);
 await assert.rejects(api.enable({confirmed:true,modelId:'malicious-model'}),/unavailable/);assert.equal(weightLoads,0);
 await api.enable({confirmed:true,modelId:expected[1]});
 assert.equal(api.snapshot().status,'ready');assert.equal(api.snapshot().model,expected[1]);assert.equal(api.snapshot().memoryMB,1000);
 assert.equal(runtimeLoads,1,'Use the catalog from the explicit preview');
 assert.equal(weightLoads,1);assert.equal(api.snapshot().conversationConsent,false);
 await api.disable();assert.equal(unloads,1);assert.equal(api.snapshot().status,'off');
 const unsupported=AI.create({gpu:()=>null,loadRuntime:async()=>{throw Error('Unexpected network call')}});
 await assert.rejects(unsupported.listModels({confirmed:true}),/WebGPU/);
 assert.equal(weightLoads,1);
 const cleared=AI.create({gpu:()=>({requestAdapter:async()=>adapter}),loadRuntime:async()=>new Promise(()=>{})});
 const pending=cleared.listModels({confirmed:true});
 await cleared.disable();
 // Cancelling model inspection must not report stale success.
 assert.equal(cleared.snapshot().status,'off');
 void pending;
 console.log('v3.32 device model preview and selection: vetted compatibility, consent, no weight fetch on preview, explicit choice, no arbitrary IDs, safe off state passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
