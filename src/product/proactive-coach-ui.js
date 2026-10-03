/* v2.82 — browser adapter for deterministic proactive Coach cues.
 * The adapter observes the existing logger/timer. It never mutates training
 * data and only emits cues while the athlete has an active Voice session.
 */
(function(){
 'use strict';
 const STORAGE_KEY='loadnote-proactive-coach-mode-v1',Core=()=>window.LoadnoteProactiveCoach,Companion=()=>window.LoadnoteCoachCompanionUI;
 let gate=null,queued=null,queueTimer=null,initialized=false;
 function storedMode(){try{return Core()?.normalizeMode(localStorage.getItem(STORAGE_KEY)||'normal')||'normal';}catch{return 'normal';}}
 function ensureGate(){if(!gate&&Core()?.createGate)gate=Core().createGate({mode:storedMode()});return gate;}
 function emitState(){const detail=state();try{document.dispatchEvent(new CustomEvent('loadnote:proactive-state',{detail}));}catch{}return detail;}
 function state(){const value=ensureGate()?.state?.()||{mode:storedMode(),paused:false};return {...value,queued:!!queued};}
 function setMode(mode){const next=Core()?.normalizeMode(mode)||'normal';ensureGate()?.setMode(next);try{localStorage.setItem(STORAGE_KEY,next);}catch{}emitState();return state();}
 function pause(){queued=null;clearTimeout(queueTimer);queueTimer=null;ensureGate()?.pause();emitState();return state();}
 function resume(){ensureGate()?.resume();emitState();flush();return state();}
 function beginSession(){queued=null;clearTimeout(queueTimer);queueTimer=null;ensureGate()?.resume();emitState();return state();}
 function voiceActivity(){try{return window.LoadnoteCoachVoiceUI?.activity?.()||window.LoadnoteCoachVoiceUI?.state?.()||{active:false,connected:false};}catch{return {active:false,connected:false};}}
 function active(activity){return !!activity?.active&&activity?.connected!==false;}
 function busy(activity){return !!activity?.userSpeaking||!!activity?.assistantSpeaking;}
 function dispatchCue(event){try{document.dispatchEvent(new CustomEvent('loadnote:proactive-cue',{detail:event}));return true;}catch{return false;}}
 function schedule(event,delay=700){queued={event,expiresAt:Date.now()+10000};clearTimeout(queueTimer);queueTimer=setTimeout(flush,Math.max(150,delay));emitState();}
 function flush(){clearTimeout(queueTimer);queueTimer=null;if(!queued)return false;if(Date.now()>queued.expiresAt){queued=null;emitState();return false;}const item=queued;queued=null;const result=offer(item.event,{fromQueue:true});emitState();return result;}
 function offer(event,{fromQueue=false}={}){
  const engine=ensureGate(),activity=voiceActivity(),verdict=engine?.eligible?.(event,{active:active(activity),busy:busy(activity)});if(!verdict?.ok){
   if(active(activity)&&verdict?.reason==='busy'&&event?.priority!=='normal'&&!fromQueue)schedule(event,700);
   else if(active(activity)&&verdict?.reason==='busy'&&fromQueue)schedule(event,700);
   return false;
  }
  if(!dispatchCue(event))return false;engine.markDelivered(event);emitState();return true;
 }
 function setRows(row){return row?[...row.querySelectorAll('.sets-container > div')]:[];}
 function setMeasure(set,row){const selector=row?.dataset.trackBy==='duration'?'.set-duration':'.set-reps';return Number(set?.querySelector(selector)?.value||0);}
 function rowMeaningful(row){if(!row)return false;const name=row.querySelector('.ex-name')?.value.trim();if(name)return true;if(row.dataset.type==='cardio')return Number(row.querySelector('.cardio-duration')?.value)>0||Number(row.querySelector('.cardio-distance')?.value)>0;return setRows(row).some(set=>setMeasure(set,row)>0);}
 function rowComplete(row){
  if(!row||!rowMeaningful(row))return false;if(row.dataset.type==='cardio')return !!row.querySelector('.cardio-done')?.checked&&(Number(row.querySelector('.cardio-duration')?.value)>0||Number(row.querySelector('.cardio-distance')?.value)>0);
  const sets=setRows(row);return sets.length>0&&sets.every(set=>setMeasure(set,row)>0&&!!set.querySelector('.set-done-check')?.checked);
 }
 function meaningfulRows(){return [...document.querySelectorAll('#exercise-rows > div')].filter(rowMeaningful);}
 function nextIncomplete(afterRow){const rows=meaningfulRows(),index=rows.indexOf(afterRow);for(let i=Math.max(0,index+1);i<rows.length;i++)if(!rowComplete(rows[i]))return rows[i];return rows.find(row=>!rowComplete(row))||null;}
 function workoutComplete(){const rows=meaningfulRows();return rows.length>0&&rows.every(rowComplete);}
 function exerciseName(row){return row?.querySelector('.ex-name')?.value.trim()||'Exercise';}
 function plannedExercise(row){
  let prescription=null;try{if(typeof pendingPrescription!=='undefined')prescription=pendingPrescription;}catch{}if(!prescription)return null;
  const plan=Array.isArray(prescription.plannedExercises)?prescription.plannedExercises:[],name=exerciseName(row);let id=null;try{id=window.LoadnoteIntegrity?.resolveExercise(data.exerciseCatalog,name)?.id||null;}catch{}
  const matches=plan.filter(item=>item?.type!=='cardio'&&(id?item.exerciseId===id:!item.exerciseId&&item.name===name));const duplicates=meaningfulRows().filter(candidate=>candidate.dataset.type!=='cardio'&&exerciseName(candidate)===name);
  return matches.length===1&&duplicates.length===1?matches[0]:null;
 }
 function targetRpe(row,set){const exercise=plannedExercise(row),index=setRows(row).indexOf(set),target=exercise?.sets?.[index];const value=Number(target?.targetRpe);return Number.isFinite(value)?value:null;}
 function handleCompletedSet(set){
  if(!set?.isConnected||!set.querySelector('.set-done-check')?.checked)return;const row=set.closest('#exercise-rows > div');if(!row||row.dataset.type==='cardio')return;
  const index=setRows(row).indexOf(set),actual=Number(set.querySelector('.set-rpe')?.value),target=targetRpe(row,set);let deviation=null;
  if(Number.isFinite(actual)&&Number.isFinite(target))deviation=Core()?.rpeDeviationEvent?.({exercise:exerciseName(row),setNumber:index+1,actualRpe:actual,targetRpe:target})||null;
  if(workoutComplete()){offer(Core()?.workoutCompleteEvent?.());return;}
  if(deviation&&offer(deviation))return;
  if(rowComplete(row)){const next=nextIncomplete(row);if(next)offer(Core()?.exerciseTransitionEvent?.({completedExercise:exerciseName(row),nextExercise:exerciseName(next)}));}
 }
 function nextSetLabel(){
  const context=Companion()?.liveContext?.(),exercise=context?.liveWorkout?.currentExercise,set=exercise?.set;if(!exercise||!set)return '';
  let label=`${exercise.name} set ${Number(set.index)+1}`;if(Number(set.count)>0)label+=` of ${set.count}`;
  const target=String(set.target||'').trim();if(target)label+=`: ${target}`;
  else if(set.displayWeight!=null){label+=`: ${set.displayWeight} ${set.displayUnit||''}`;if(set.reps!=null)label+=` × ${set.reps}`;else if(set.durationSeconds!=null)label+=` × ${set.durationSeconds} seconds`;}
  return label;
 }
 function onRestComplete(){offer(Core()?.restCompleteEvent?.({nextLabel:nextSetLabel()}));}
 function onChange(event){const target=event.target;if(target?.matches?.('.set-done-check')&&target.checked)setTimeout(()=>handleCompletedSet(target.closest('.sets-container > div')),0);else if(target?.matches?.('.cardio-done')&&target.checked)setTimeout(()=>{const row=target.closest('#exercise-rows > div');if(workoutComplete())offer(Core()?.workoutCompleteEvent?.());else if(rowComplete(row)){const next=nextIncomplete(row);if(next)offer(Core()?.exerciseTransitionEvent?.({completedExercise:exerciseName(row),nextExercise:exerciseName(next)}));}},0);}
 function init(){if(initialized)return;initialized=true;ensureGate();document.addEventListener('loadnote:rest-complete',onRestComplete);document.addEventListener('change',onChange,true);document.addEventListener('loadnote:voice-activity',flush);emitState();}
 window.LoadnoteProactiveCoachUI={init,state,setMode,pause,resume,beginSession,offer,flush,nextSetLabel,handleCompletedSet};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
