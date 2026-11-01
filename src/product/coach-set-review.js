/* v6.0 — deterministic, read-only review of entered strength sets in the
 * currently open workout draft. This is not saved history or an RPE prescription.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachSetReview=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clean=(v,max=150)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
 const nonnegative=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max?v:null;
 const rpe=v=>typeof v==='number'&&Number.isFinite(v)&&v>=1&&v<=10?v:null;
 const int=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max?v:null;
 function intent(question){
  const q=clean(question,240).toLowerCase().replace(/[’‘]/g,"'");
  if(/\b(?:any rpe missing|missing rpe|which (?:checked )?sets? (?:need|needs|lack|are missing) rpe|how many (?:checked )?sets? (?:need|lack|are missing) rpe|did i (?:enter|record|log) (?:my |the )?rpe|have i logged (?:all )?(?:my )?rpe|what (?:rpe|effort) (?:am i|have i been) missing)\b/.test(q))return 'rpe';
  if(/\b(?:review (?:my |the )?last (?:checked |completed )?set|what did i (?:log|enter|record) (?:for |on )?(?:my |the )?(?:last|previous|most recent) set|how (?:did|was) (?:my |the )?(?:last|previous|most recent) set (?:go|feel)|what (?:was|is) (?:my |the )?(?:last|previous|most recent) (?:checked |completed )?set|what (?:did i|have i) (?:just )?log(?:ged)? (?:for |on )?(?:that|the last) set)\b/.test(q))return 'last';
  return null;
 }
 function answer(question,{live=null,asOf}={}){
  const kind=intent(question);if(!kind)return null;
  const result=text=>({
   text,source:'Shared coaching · live draft set review',readOnly:true,liveDraftReview:true,evidence:[],
   intent:{topic:'live-set-review'},actions:[{kind:'current-workout',label:'Return to workout'}],
   followUps:['Review my last checked set','Any RPE missing?']
  });
  const draft=live?.liveWorkout;
  if(!draft?.active)return result('There is no open strength workout draft to review. Open Train to start or resume one. I cannot infer logged sets.');
  if(!asOf||draft.date!==asOf)return result('The open workout draft is dated '+clean(draft.date||'unknown',24)+', not the date being reviewed. Confirm its date in Train first; no saved workout is assumed.');
  const checked=int(draft.checkedStrengthSets,500);
  const missing=int(draft.missingRpeSets,500);
  if(kind==='rpe'){
   if(checked==null||missing==null||missing>checked)return result('RPE coverage for checked sets is not verifiable in this draft. Review each set in Train instead of assuming it was logged.');
   if(checked===0)return result('No strength sets are checked in this open draft, so there is no checked-set RPE to review. Record your actual set details and RPE after performing a set.');
   return result(missing===0?
    'All '+checked+' checked strength '+(checked===1?'set has':'sets have')+' an entered RPE in this open draft. This is not saved workout history, and RPE is your reported effort rather than a recovery measurement.':
    missing+' of '+checked+' checked strength '+(checked===1?'set is':'sets are')+' missing an entered RPE in this open draft. Add the effort you actually experienced where known; do not invent it to fill a blank. Checked sets are not saved workout history.');
  }
  const set=draft.lastCheckedSet;
  if(!set||checked===0)return result('No strength set is checked in the open draft. Complete and check a set in Train before I can review its entered numbers.');
  const exercise=clean(set.exerciseName)||'Unnamed exercise';
  const position=int(set.index,500),setCount=int(set.count,500);
  let text='The last checked strength set displayed in this open draft is '+exercise+(position!=null&&setCount!=null&&setCount>0&&position<setCount?', set '+(position+1)+' of '+setCount:'')+'. ';
  const weight=nonnegative(set.displayWeight,2000),reps=int(set.reps,1000),duration=nonnegative(set.durationSeconds,86400);
  const details=[];
  if(weight!=null)details.push(weight+' '+(set.displayUnit==='lb'?'lb':'kg'));
  if(reps!=null)details.push(reps+' reps');
  else if(duration!=null)details.push(duration+' seconds');
  details.push(rpe(set.rpe)==null?'RPE not entered':'RPE '+rpe(set.rpe));
  text+='Entered values: '+(details.length?details.join(' · '):'not available')+'. ';
  if(weight==null||reps==null&&duration==null)text+='Load or reps/duration may be missing; check the logger before saving. ';
  text+='A checked draft set is not saved history. These entries alone cannot establish whether the target was achieved, your recovery, or the correct next load.';
  return result(text);
 }
 return {intent,answer};
});
