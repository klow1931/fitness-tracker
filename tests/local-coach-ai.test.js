const assert=require('node:assert/strict'),AI=require('../src/product/local-coach-ai');
(async()=>{
 assert.equal(AI.acceptable('{"text":"Perform 5 sets."}'),null);assert.equal(AI.acceptable('{"text":"This will cure the issue."}'),null);assert.equal(AI.acceptable('not json'),null);assert.equal(AI.acceptable('{"text":"<script>bad</script>"}'),null);
 assert.equal(AI.acceptable('{"text":"Speed intent serves a different goal from heavy strength work."}'),'Speed intent serves a different goal from heavy strength work.');
 let imports=0,unloads=0,requests=[];
 const candidate={unload:async()=>unloads++,chat:{completions:{create:async request=>{requests.push(request);const q=JSON.parse(request.messages[1].content).question;return {choices:[{message:{content:JSON.stringify({text:/injury/.test(q)?'I cannot decide that; ask a qualified professional.':'Use speed intent while preserving controlled technique.'})}}]};}}}};
 const options={gpu:()=>({requestAdapter:async()=>({})}),loadRuntime:async()=>{imports++;return {prebuiltAppConfig:{model_list:[{model_id:'Huge-Instruct',vram_required_MB:5000},{model_id:'Tiny-Instruct',vram_required_MB:500}]},CreateMLCEngine:async id=>{assert.equal(id,'Tiny-Instruct');return candidate;}};}};
 const api=AI.create(options);assert.equal(imports,0);await assert.rejects(api.enable(),/Confirm/);assert.equal(imports,0);
 const enabled=await api.enable({confirmed:true});assert.equal(enabled.status,'ready');assert.equal(enabled.evaluation.passed,true);assert.equal(requests.length,2);
 const cards=[{title:'Speed',summary:'Submaximal resistance with speed intent.',application:'Review the exact setup.'}];assert.ok(await api.explain('Explain speed work',cards));const payload=JSON.parse(requests.at(-1).messages[1].content);assert.deepEqual(Object.keys(payload),['question','summaries']);assert.ok(!JSON.stringify(payload).includes('workouts'));
 await api.disable();assert.equal(api.snapshot().status,'off');assert.equal(await api.explain('Explain speed',cards),null);assert.equal(unloads,1);
 const unsupported=AI.create({...options,gpu:()=>null});await assert.rejects(unsupported.enable({confirmed:true}),/WebGPU/);
 const failed=AI.create({...options,loadRuntime:async()=>({...await options.loadRuntime(),CreateMLCEngine:async()=>({unload:async()=>{},chat:{completions:{create:async()=>({choices:[{message:{content:'{"text":"Use 100 kg."}'}}]})}}})})});await assert.rejects(failed.enable({confirmed:true}),/did not pass/);assert.equal(failed.snapshot().status,'unavailable');
 console.log('Local AI: explicit download, device checks, output rejection, prompt minimization and safe fallback passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
