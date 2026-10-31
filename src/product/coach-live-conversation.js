/* Fresh logger context only. Checked draft sets are not saved workout history. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteCoachLiveConversation=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,180);
 const count=v=>Number.isInteger(v)&&v>=0&&v<=500?v:null;
 function answer(question,{live=null,asOf}={}){
  const q=clean(question).toLowerCase().replace(/[’‘]/g,"'");
  const kind=/\b(?:how many|what).{0,20}(?:sets?|work).{0,15}(?:left|remaining)|\bwhat(?:'s| is) left\b/.test(q)?'remaining':/\b(?:how many sets? (?:have i|did i)|what (?:have i|did i) (?:check|complete)|am i (?:done|finished)|did i finish)\b/.test(q)?'completed':/\b(?:what(?:'s| is) my (?:current |next )?(?:target|set)|what am i (?:doing|on)|where am i in (?:my |the )?workout)\b/.test(q)?'current':/\b(?:how (?:long|much) (?:of )?(?:my |the )?rest (?:is )?(?:left|remaining)|am i (?:still )?resting|rest.{0,15}(?:left|remaining))\b/.test(q)?'rest':null;
  if(!kind)return null;
  const result=text=>({text,source:'Shared coaching · live workout',readOnly:true,liveConversation:true,evidence:[],intent:{topic:'live-workout'},actions:[{kind:'current-workout',label:'Return to workout'}],followUps:['What is my current target?','How many sets are left?']});
  const w=live?.liveWorkout;
  if(!w?.active)return result('There is no active workout draft available. Open Train to choose or resume a workout; I will not infer completed work.');
  if(!asOf||w.date!==asOf)return result('The open workout draft is dated '+clean(w.date||'unknown')+'. Review its date in Train before treating it as today’s workout.');
  if(kind==='rest'){
   const r=live.restTimer;
   if(!r?.active)return result('No rest timer is running. This describes the timer, not whether you are ready for the next set.');
   const remaining=Number.isInteger(r.remainingSeconds)&&r.remainingSeconds>=0&&r.remainingSeconds<=1800?r.remainingSeconds:null;
   return result((remaining==null?'The remaining rest time is unavailable.':'The timer shows '+remaining+' seconds remaining'+(r.paused?' and is paused.':'.'))+' Keep the reviewed rest target; the timer does not measure readiness.');
  }
  const rows=Array.isArray(w.exercises)?w.exercises:[];
  const valid=rows.length>0&&rows.every(e=>count(e.completedSets)!=null&&count(e.totalSets)!=null&&e.completedSets<=e.totalSets);
  if(kind==='completed'||kind==='remaining'){
   if(!valid)return result('The draft’s set counts are incomplete. Review the logger rather than assuming the workout is finished.');
   const done=rows.reduce((n,e)=>n+e.completedSets,0),total=rows.reduce((n,e)=>n+e.totalSets,0),left=total-done;
   const text=kind==='completed'?done+' of '+total+' displayed strength sets are checked in the open draft.':left+' displayed strength sets remain unchecked in the open draft.';
   return result(text+' Checked sets are not saved workout history. Review and save the actual work when you finish; cardio or other work may need separate review.');
  }
  const e=w.currentExercise,s=e?.set;
  if(!e?.name||!s)return result('No current unchecked strength set is available. Review the logger before deciding the workout is complete.');
  const position=count(s.index)!=null&&count(s.count)!=null&&s.index<s.count?' · set '+(s.index+1)+' of '+s.count:'';
  return result('The logger currently shows '+clean(e.name)+position+'. '+(s.target?'Reviewed target: '+clean(s.target)+'.':'No reviewed target is displayed for this set.')+' This is planned work, not confirmation that you performed it.');
 }
 return {answer};
});
