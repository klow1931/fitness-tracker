/* v6.5 — confirmed same-rep evidence and safe opt-in load-only fill for Train.
 * Uses the same corrected saved history and strict catalog identity as Coach.
 * Never reads draft entries as saved evidence; fill requires explicit action.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-live-history'),require('./coach-training-history'));
 else root.LoadnoteCockpitVerifiedHistory=factory(root.LoadnoteCoachLiveHistory,root.LoadnoteCoachTrainingHistory);
})(typeof globalThis!=='undefined'?globalThis:this,function(Bridge,History){
 'use strict';
 const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
 function lastConfirmed(state,{name='',date=null,reps=null,unit='kg',trackBy='reps'}={}){
  if(trackBy!=='reps'||!validDate(date)||!Number.isInteger(reps)||reps<1||reps>1000)return null;
  const matched=Bridge?.selection?.(state,name);
  if(!matched||matched.error)return null;
  const day=new Date(date+'T12:00:00Z');day.setUTCDate(day.getUTCDate()-1);
  let reviewed;
  try{reviewed=History.inspect(state,matched,{asOf:day.toISOString().slice(0,10),unit:unit==='lb'?'lb':'kg',withSetEvidence:true});}
  catch{return null;}
  // Match by actual rep count, not by the set's ordinal position. Search
  // the three most recent corrected saved sessions, never same-day/future.
  for(const session of reviewed.sessions||[]){
   const eligible=session.sets.filter(s=>s.explicitlyCompleted===true&&s.reps===reps);
   if(!eligible.length)continue;
   const set=eligible[eligible.length-1];
   return {date:session.date,reps,weight:set.weight,weightKg:set.weightKg,rpe:set.rpe,exercise:matched.name,
    confirmed:true,source:'corrected-saved-history'};
  }
  return null;
 }
 // The caller MUST re-read live corrected history immediately before applying
 // this optional fill; never trust a rendered card as a stale load proposal.
 // Only blank load is writable. Entered reps, RPE, completion and targets
 // remain owned by the workout logger and are never populated by this helper.
 function confirmedLoadValue(evidence,{reps=null,currentWeight=null,done=false,unit='kg'}={}){
  if(!evidence||evidence.confirmed!==true||evidence.source!=='corrected-saved-history')return null;
  if(!Number.isInteger(reps)||reps<1||reps>1000||reps!==evidence.reps||done!==false)return null;
  if(typeof currentWeight!=='string'||currentWeight.trim()!=='')return null;
  if(unit!=='kg'&&unit!=='lb')return null;
  const kg=evidence.weightKg;
  if(typeof kg!=='number'||!Number.isFinite(kg)||kg<0||kg>2000)return null;
  const displayed=Math.round(kg*(unit==='lb'?2.2046226218:1)*10)/10;
  return Object.is(displayed,-0)?0:displayed;
 }
 return {lastConfirmed,confirmedLoadValue};
});
