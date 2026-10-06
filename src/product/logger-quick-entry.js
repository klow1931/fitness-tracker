/* v2.49 — small deterministic helpers for fast between-set logging. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteLoggerQuickEntry=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const RPE_VALUES=[6,6.5,7,7.5,8,8.5,9,9.5,10];
 function entered(set){return Number(set?.reps)>0||Number(set?.duration)>0;}
 function done(set){return entered(set)&&set?.done===true;}
 function nextIncompleteIndex(sets,start=-1){
  const rows=Array.isArray(sets)?sets:[];if(!rows.length)return -1;
  for(let i=Math.max(-1,Number(start)||-1)+1;i<rows.length;i++)if(entered(rows[i])&&!done(rows[i]))return i;
  for(let i=0;i<=Math.max(-1,Number(start)||-1)&&i<rows.length;i++)if(entered(rows[i])&&!done(rows[i]))return i;
  return -1;
 }
 function normalizeRpe(value){
  if(value==null||value==='')return null;const n=Number(value);
  if(!Number.isFinite(n)||n<1||n>10)return null;
  return Math.round(n*2)/2;
 }
 function completionError(set){
  if(!String(set?.name||'').trim())return {field:'name',message:'Name the exercise before finishing a set.'};
  const duration=set.trackBy==='duration',field=duration?'duration':'reps',measure=Number(set[field]);
  if(!Number.isFinite(measure)||measure<=0||(!duration&&!Number.isInteger(measure)))return {field,message:duration?'Enter positive hold seconds.':'Enter positive whole-number reps.'};
  if(set.weight!==''&&set.weight!=null&&(!Number.isFinite(Number(set.weight))||Number(set.weight)<0))return {field:'weight',message:'Enter a valid, nonnegative weight.'};
  if(set.rpe!==''&&set.rpe!=null&&(!Number.isFinite(Number(set.rpe))||Number(set.rpe)<1||Number(set.rpe)>10))return {field:'rpe',message:'RPE must be between 1 and 10.'};
  return null;
 }
 return {RPE_VALUES,entered,done,nextIncompleteIndex,normalizeRpe,completionError};
});
