/* Model selection policy for optional local conversation; the runtime is the catalog.
 * The GPU figures are the runtime's estimates, NOT download size, speed or quality.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteLocalCoachModels=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_GPU_MB=1400;
 const eligible=(m,adapter)=>!!(m&&typeof m.model_id==='string'&&/instruct/i.test(m.model_id)&&!/(embedding|vision|vl-|reasoning|deepseek)/i.test(m.model_id)&&Number.isFinite(m.vram_required_MB)&&m.vram_required_MB>0&&m.vram_required_MB<=MAX_GPU_MB&&(!/f16/i.test(m.model_id)||adapter?.features?.has?.('shader-f16'))&&(!m.required_features?.length||m.required_features.every(f=>adapter?.features?.has?.(f)))&&(!Number.isFinite(m.buffer_size_required_bytes)||!Number.isFinite(adapter?.limits?.maxStorageBufferBindingSize)||m.buffer_size_required_bytes<=adapter.limits.maxStorageBufferBindingSize));
 function supported(records=[],adapter={}){
  const ids=new Set();
  return (Array.isArray(records)?records:[]).filter(m=>eligible(m,adapter)&&!ids.has(m.model_id)&&ids.add(m.model_id)).map(m=>({id:m.model_id,estimatedGpuMB:Math.ceil(m.vram_required_MB)}))
   .sort((a,b)=>Number(/Qwen2\.5-0\.5B/.test(b.id))-Number(/Qwen2\.5-0\.5B/.test(a.id))||a.estimatedGpuMB-b.estimatedGpuMB||a.id.localeCompare(b.id));
 }
 function select(list,requested='auto'){
  if(requested==='auto'||requested==null){if(!list.length)throw Error('No compatible small instruction model is available on this device');return list[0];}
  if(typeof requested!=='string')throw Error('Unknown local model selection');
  const match=list.find(m=>m.id===requested);if(!match)throw Error('That model is unavailable or exceeds the local GPU memory limit. Inspect supported models again.');
  return match;
 }
 return {MAX_GPU_MB,supported,select};
});