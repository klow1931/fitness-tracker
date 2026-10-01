/* v2.75 — deterministic execution-first workout helpers.
 * Pure UI-state helpers only: no training data mutation or programming policy.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteTrainingExecution=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const finite=x=>Number.isFinite(Number(x))?Number(x):null;
 function meaningful(rows,{scheduled=false,started=false}={}){
  if(scheduled||started)return true;
  return (rows||[]).some(row=>{
   if(!String(row?.name||'').trim())return false;
   if(row?.type==='cardio')return Number(row.duration)>0||Number(row.distance)>0||row.done===true;
   return (row.sets||[]).some(set=>Number(set.measure)>0||Number(set.weight)>0||(finite(set.rpe)>=1&&finite(set.rpe)<=10)||set.done===true);
  });
 }
 function classify(progress){
  const rows=progress||[],currentIndex=rows.findIndex(x=>!x.complete);
  return rows.map((row,index)=>({
   ...row,index,
   state:row.complete?'complete':currentIndex<0?'complete':index===currentIndex?'current':'upcoming',
   collapsed:row.complete||index!==currentIndex
  }));
 }
 function restSnapshot(state,now=Date.now()){
  if(!state)return {active:false,paused:false,remainingMs:0,totalMs:0,label:'—'};
  const total=Math.max(0,Number(state.total)||0);
  const left=Math.max(0,state.paused?Number(state.remaining)||0:(Number(state.deadline)||0)-now);
  return {
   active:left>0,
   paused:!!state.paused&&left>0,
   remainingMs:left,totalMs:total,
   label:left>0?Math.ceil(left/1000)+'s'+(state.paused?' · paused':''):'—'
  };
 }
 return {meaningful,classify,restSnapshot};
});