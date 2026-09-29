/* v2.62 — deterministic gym-floor logger helpers. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteGymFloor=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function inputMode(kind){
  return kind==='reps'?'numeric':['weight','rpe','duration','distance','hr'].includes(kind)?'decimal':'text';
 }
 function previousPayload(set,trackBy='reps'){
  if(!set||typeof set!=='object')return null;
  const weight=Number(set.weight);
  const measure=trackBy==='duration'?Number(set.duration):Number(set.reps);
  if(!(measure>0))return null;
  const out={weight:Number.isFinite(weight)&&weight>=0?weight:null};
  if(trackBy==='duration')out.duration=measure;
  else out.reps=Math.trunc(measure);
  return out;
 }
 function nextUnfinishedIndex(rows,currentIndex){
  const list=Array.isArray(rows)?rows:[];
  const start=Number.isInteger(currentIndex)?currentIndex:-1;
  for(let i=start+1;i<list.length;i++)if(!list[i]?.done)return i;
  return -1;
 }
 function keyboardLikelyOpen(layoutHeight,viewportHeight,threshold=140){
  const layout=Number(layoutHeight),visible=Number(viewportHeight),cut=Number(threshold);
  return layout>0&&visible>0&&Number.isFinite(cut)&&layout-visible>=cut;
 }
 return {inputMode,previousPayload,nextUnfinishedIndex,keyboardLikelyOpen};
});
