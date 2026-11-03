/* v6.6 — pure guardrails for reversing one recent confirmed-load fill.
 * Temporary client-side snapshot only; NEVER modifies workout history.
 * Existing draft persistence owns the actual input writes.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCockpitFillUndo=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d);
 function capture({name='',exerciseId=null,date=null,reps=null,unit='',before=null,after=null}={}){
  if(typeof name!=='string'||!name.trim()||!validDate(date)||!Number.isInteger(reps)||reps<1||reps>1000)return null;
  if(unit!=='kg'&&unit!=='lb')return null;
  if(typeof before!=='string'||before.trim()!=='')return null;
  if(typeof after!=='string'||after.trim()===''||!Number.isFinite(Number(after))||Number(after)<0||Number(after)>5000)return null;
  return Object.freeze({source:'confirmed-load-fill',name,exerciseId:exerciseId==null?null:String(exerciseId),
   date,reps,unit,before,after});
 }
 function canUndo(record,{name='',exerciseId=null,date=null,reps=null,unit='',weight=null,done=false,sameSet=false,connected=false}={}){
  if(!record||record.source!=='confirmed-load-fill'||!sameSet||!connected||done!==false)return false;
  if(record.name!==name||record.exerciseId!==(exerciseId==null?null:String(exerciseId)))return false;
  return record.date===date&&record.reps===reps&&record.unit===unit&&
   typeof weight==='string'&&weight===record.after;
 }
 return {capture,canUndo};
});
