/* v6.4 — read-only last confirmed same-rep evidence for the Train cockpit.
 * Uses the same corrected saved history and strict catalog identity as Coach.
 * Never reads current draft entries as saved performance or copies weights.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-live-history'),require('./coach-training-history'));
 else root.LoadnoteCockpitVerifiedHistory=factory(root.LoadnoteCoachLiveHistory,root.LoadnoteCoachTrainingHistory);
})(typeof globalThis!=='undefined'?globalThis:this,function(Bridge,History){
 'use strict';
 const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
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
   return {date:session.date,reps,weight:set.weight,rpe:set.rpe,exercise:matched.name,
    confirmed:true,source:'corrected-saved-history'};
  }
  return null;
 }
 return {lastConfirmed};
});
