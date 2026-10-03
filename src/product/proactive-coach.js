/* v2.82 — deterministic proactive Coach event policy.
 * Training state decides when a cue is relevant. This module does not alter
 * workouts, prescriptions, programs, Decisions, fatigue or recovery state.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LoadnoteProactiveCoach=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MODES=Object.freeze({quiet:0,normal:1,proactive:2});
 const DEFAULT_MODE='normal',DEFAULT_COOLDOWN_MS=8000,DEFAULT_DEDUPE_MS=60000;
 const round1=value=>Math.round(Number(value)*10)/10;
 function normalizeMode(value){const mode=String(value||'').toLowerCase();return Object.hasOwn(MODES,mode)?mode:DEFAULT_MODE;}
 function clean(value,max=120){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);}
 function makeEvent(type,{message,key,minMode='normal',priority='normal',data={}}={}){
  const text=clean(message,500),eventKey=clean(key||type,240);if(!text)return null;
  return {version:1,type:clean(type,60),message:text,key:eventKey,minMode:normalizeMode(minMode),priority:priority==='essential'?'essential':priority==='important'?'important':'normal',data};
 }
 function rpeDeviationEvent({exercise='Exercise',setNumber=1,actualRpe,targetRpe}={}){
  const actual=Number(actualRpe),target=Number(targetRpe);if(!Number.isFinite(actual)||!Number.isFinite(target)||actual<1||actual>10||target<1||target>10)return null;
  const diff=round1(actual-target),magnitude=Math.abs(diff);if(magnitude<0.5)return null;
  const name=clean(exercise,120)||'Exercise',number=Math.max(1,Math.round(Number(setNumber)||1));
  const direction=diff>0?'above':'below',amount=Math.abs(diff);
  const observation=diff>0?'Review the remaining work rather than automatically increasing load.':'It came in easier than target; keep the approved next target unless you deliberately change it.';
  return makeEvent('rpe_deviation',{message:`${name} set ${number} was RPE ${actual}, ${amount} ${direction} target ${target}. ${observation}`,key:`rpe:${name}:${number}:${actual}:${target}`,minMode:magnitude>=1?'normal':'proactive',priority:magnitude>=1?'important':'normal',data:{exercise:name,setNumber:number,actualRpe:actual,targetRpe:target,difference:diff}});
 }
 function restCompleteEvent({nextLabel=''}={}){
  const next=clean(nextLabel,220);return makeEvent('rest_complete',{message:next?`Rest complete. Next: ${next}.`:'Rest complete.',key:`rest:${next||'none'}`,minMode:'quiet',priority:'essential',data:{nextLabel:next||null}});
 }
 function exerciseTransitionEvent({completedExercise='Exercise',nextExercise=''}={}){
  const done=clean(completedExercise,120)||'Exercise',next=clean(nextExercise,120);if(!next)return null;
  return makeEvent('exercise_transition',{message:`${done} complete. Next: ${next}.`,key:`exercise:${done}->${next}`,minMode:'normal',priority:'normal',data:{completedExercise:done,nextExercise:next}});
 }
 function workoutCompleteEvent(){return makeEvent('workout_complete',{message:'All entered workout work is complete. Review and save the session when you are ready.',key:'workout_complete',minMode:'quiet',priority:'essential'});}
 function createGate({mode=DEFAULT_MODE,cooldownMs=DEFAULT_COOLDOWN_MS,dedupeMs=DEFAULT_DEDUPE_MS,now=()=>Date.now()}={}){
  let currentMode=normalizeMode(mode),paused=false,lastDeliveredAt=-Infinity;const delivered=new Map();
  function prune(time){for(const [key,at] of delivered)if(time-at>dedupeMs)delivered.delete(key);}
  function eligible(event,{active=true,busy=false}={}){
   if(!event)return {ok:false,reason:'invalid'};if(!active)return {ok:false,reason:'inactive'};if(paused)return {ok:false,reason:'paused'};if(busy)return {ok:false,reason:'busy'};
   if(MODES[currentMode]<MODES[normalizeMode(event.minMode)])return {ok:false,reason:'mode'};
   const time=Number(now());prune(time);const previous=delivered.get(event.key);if(Number.isFinite(previous)&&time-previous<dedupeMs)return {ok:false,reason:'duplicate'};
   if(event.priority!=='essential'&&time-lastDeliveredAt<cooldownMs)return {ok:false,reason:'cooldown',retryAfterMs:Math.max(0,cooldownMs-(time-lastDeliveredAt))};
   return {ok:true};
  }
  function markDelivered(event){const time=Number(now());delivered.set(event.key,time);lastDeliveredAt=time;return state();}
  function setMode(next){currentMode=normalizeMode(next);return state();}
  function pause(){paused=true;return state();}
  function resume(){paused=false;return state();}
  function state(){return {mode:currentMode,paused,lastDeliveredAt:Number.isFinite(lastDeliveredAt)?lastDeliveredAt:null,cooldownMs,dedupeMs};}
  return {eligible,markDelivered,setMode,pause,resume,state};
 }
 return {MODES,DEFAULT_MODE,DEFAULT_COOLDOWN_MS,DEFAULT_DEDUPE_MS,normalizeMode,makeEvent,rpeDeviationEvent,restCompleteEvent,exerciseTransitionEvent,workoutCompleteEvent,createGate};
});
