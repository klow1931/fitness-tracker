/* v2.81 — hands-free logging adapter over the existing workout form.
 * Voice may update only the active unsaved workout draft. Saved history,
 * reviewed prescriptions, programs and adaptation state are never mutated here.
 */
(function(root,factory){
 const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LoadnoteVoiceWorkoutLogging=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const LB_PER_KG=2.2046226218,MAX_ACTIONS=20,DUPLICATE_WINDOW_MS=3000;
 const actions=[];let lastCommit=null;
 function round(value,places=2){const p=10**places;return Math.round((Number(value)||0)*p)/p;}
 function unit(value){const v=String(value||'').toLowerCase();return v==='lb'||v==='lbs'||v==='pound'||v==='pounds'?'lb':v==='kg'||v==='kgs'||v==='kilogram'||v==='kilograms'?'kg':null;}
 function convertWeight(value,from,to){
  const n=Number(value),a=unit(from),b=unit(to);if(!Number.isFinite(n)||!a||!b)return null;if(a===b)return round(n,2);return round(a==='lb'?n/LB_PER_KG:n*LB_PER_KG,2);
 }
 function halfStep(value){return Math.abs(Number(value)*2-Math.round(Number(value)*2))<1e-8;}
 function normalizeSetPatch(args={},context={}){
  const trackBy=context.trackBy==='duration'?'duration':'reps',displayUnit=unit(context.displayUnit)||'kg',patch={};
  const has=(key)=>Object.prototype.hasOwnProperty.call(args,key)&&args[key]!==null&&args[key]!=='';
  if(has('weight')){
   const source=unit(args.weightUnit);if(!source)return {ok:false,error:'Say kg or pounds with the load so I do not guess the unit.'};
   const weight=Number(args.weight);if(!Number.isFinite(weight)||weight<0||weight>(source==='lb'?2200:1000))return {ok:false,error:'That load is outside the supported range.'};
   patch.displayWeight=convertWeight(weight,source,displayUnit);patch.weightKg=convertWeight(weight,source,'kg');patch.sourceWeight=round(weight,2);patch.sourceUnit=source;
  }
  if(has('reps')){
   const reps=Number(args.reps);if(trackBy!=='reps')return {ok:false,error:'This set is tracked by hold duration, not reps.'};
   if(!Number.isInteger(reps)||reps<1||reps>200)return {ok:false,error:'Reps must be a whole number between 1 and 200.'};patch.reps=reps;
  }
  if(has('durationSeconds')){
   const seconds=Number(args.durationSeconds);if(trackBy!=='duration')return {ok:false,error:'This set is tracked by reps, not hold duration.'};
   if(!Number.isInteger(seconds)||seconds<1||seconds>3600)return {ok:false,error:'Hold duration must be whole seconds between 1 and 3600.'};patch.durationSeconds=seconds;
  }
  if(has('rpe')){
   const rpe=Number(args.rpe);if(!Number.isFinite(rpe)||rpe<1||rpe>10||!halfStep(rpe))return {ok:false,error:'RPE must be from 1 to 10 in 0.5 steps.'};patch.rpe=rpe;
  }
  if(has('completed'))patch.completed=args.completed===true;
  if(!Object.keys(patch).length)return {ok:false,error:'No set values were provided.'};
  return {ok:true,patch,trackBy,displayUnit};
 }
 function setRows(row){return row?[...row.querySelectorAll('.sets-container > div')]:[];}
 function isComplete(set){return !!set?.querySelector('.set-done-check')?.checked;}
 function strengthRows(doc){return [...doc.querySelectorAll('#exercise-rows > div')].filter(row=>row.dataset.type!=='cardio');}
 function currentTarget(doc=root.document){
  if(!doc?.querySelectorAll)return null;const rows=strengthRows(doc);if(!rows.length)return null;
  let row=null,set=null,exerciseIndex=-1,setIndex=-1;const active=doc.querySelector('#exercise-rows .logger-active-set');
  if(active&&!isComplete(active)){row=active.closest('#exercise-rows > div');exerciseIndex=rows.indexOf(row);set=active;setIndex=setRows(row).indexOf(set);}
  if(!row){for(let i=0;i<rows.length;i++){const sets=setRows(rows[i]),j=sets.findIndex(candidate=>!isComplete(candidate));if(j>=0){row=rows[i];set=sets[j];exerciseIndex=i;setIndex=j;break;}}}
  if(!row||!set)return null;return {row,set,exerciseIndex,setIndex,exerciseName:row.querySelector('.ex-name')?.value.trim()||'Exercise',trackBy:row.dataset.trackBy==='duration'?'duration':'reps'};
 }
 function targetByIdentity(identity,doc=root.document){
  const rows=strengthRows(doc),row=rows[identity?.exerciseIndex],set=row&&setRows(row)[identity?.setIndex];if(!row||!set)return null;
  const name=row.querySelector('.ex-name')?.value.trim()||'Exercise';if(identity.exerciseName&&name!==identity.exerciseName)return null;
  return {row,set,exerciseIndex:identity.exerciseIndex,setIndex:identity.setIndex,exerciseName:name,trackBy:row.dataset.trackBy==='duration'?'duration':'reps'};
 }
 function capture(target){const set=target.set,check=set.querySelector('.set-done-check');return {reps:set.querySelector('.set-reps')?.value??null,duration:set.querySelector('.set-duration')?.value??null,weight:set.querySelector('.set-weight')?.value??null,rpe:set.querySelector('.set-rpe')?.value??null,hadCheckbox:!!check,checked:!!check?.checked};}
 function dispatch(el,type){if(!el)return;const EventCtor=el.ownerDocument?.defaultView?.Event||root.Event;if(typeof EventCtor==='function')el.dispatchEvent(new EventCtor(type,{bubbles:true}));}
 function ensureCheckbox(set){let check=set.querySelector('.set-done-check');if(check)return check;const doc=set.ownerDocument;check=doc.createElement('input');check.type='checkbox';check.className='set-done-check';check.dataset.voiceCreated='true';check.setAttribute('aria-label','Mark set done');check.title='Mark set done';check.addEventListener('change',()=>set.classList.toggle('set-row-done',check.checked));set.insertBefore(check,set.firstChild);return check;}
 function restore(target,state){
  const fields=[['.set-reps','reps'],['.set-duration','duration'],['.set-weight','weight'],['.set-rpe','rpe']];for(const [selector,key] of fields){const input=target.set.querySelector(selector);if(input&&state[key]!==null){input.value=state[key];dispatch(input,'input');}}
  let check=target.set.querySelector('.set-done-check');if(state.hadCheckbox){check=check||ensureCheckbox(target.set);check.checked=state.checked;dispatch(check,'change');}
  else if(check?.dataset.voiceCreated==='true'){check.remove();target.set.classList.remove('set-row-done');dispatch(target.set,'change');}
  target.set.classList.remove('voice-logged-set');delete target.set.dataset.voiceLoggedAt;
 }
 function displayUnit(){try{return unit(typeof root.unitLabel==='function'?root.unitLabel():'kg')||'kg';}catch{return 'kg';}}
 function values(target){const set=target.set,weightRaw=set.querySelector('.set-weight')?.value;const displayWeight=weightRaw===''||weightRaw==null?null:Number(weightRaw);return {exercise:target.exerciseName,exerciseIndex:target.exerciseIndex,setIndex:target.setIndex,reps:set.querySelector('.set-reps')?.value===''||!set.querySelector('.set-reps')?null:Number(set.querySelector('.set-reps').value),durationSeconds:set.querySelector('.set-duration')?.value===''||!set.querySelector('.set-duration')?null:Number(set.querySelector('.set-duration').value),displayWeight,displayUnit:displayUnit(),weightKg:displayWeight==null?null:convertWeight(displayWeight,displayUnit(),'kg'),rpe:set.querySelector('.set-rpe')?.value===''||!set.querySelector('.set-rpe')?null:Number(set.querySelector('.set-rpe').value),completed:isComplete(set)};}
 function summary(result){const v=result.values,measure=v.durationSeconds!=null?v.durationSeconds+' sec':v.reps!=null?v.reps+' reps':'set';const load=v.displayWeight!=null?round(v.displayWeight,2)+' '+v.displayUnit+' × ':'';const rpe=v.rpe!=null?' @ RPE '+v.rpe:'';return `${v.exercise} set ${v.setIndex+1}: ${load}${measure}${rpe}${v.completed?' logged':''}.`;}
 function emit(kind,result){const doc=root.document;if(!doc?.dispatchEvent)return;const Ctor=doc.defaultView?.CustomEvent||root.CustomEvent;if(typeof Ctor==='function')doc.dispatchEvent(new Ctor('loadnote:voice-log',{detail:{kind,...result}}));}
 function apply(target,normalized,{complete=null,before=null,replaceLast=false}={}){
  const original=before||capture(target),p=normalized.patch;
  if(Object.prototype.hasOwnProperty.call(p,'displayWeight')){const input=target.set.querySelector('.set-weight');if(!input)return {ok:false,error:'This set has no load field.'};input.value=String(p.displayWeight);dispatch(input,'input');}
  if(Object.prototype.hasOwnProperty.call(p,'reps')){const input=target.set.querySelector('.set-reps');if(!input)return {ok:false,error:'This set is not rep-based.'};input.value=String(p.reps);dispatch(input,'input');}
  if(Object.prototype.hasOwnProperty.call(p,'durationSeconds')){const input=target.set.querySelector('.set-duration');if(!input)return {ok:false,error:'This set is not duration-based.'};input.value=String(p.durationSeconds);dispatch(input,'input');}
  if(Object.prototype.hasOwnProperty.call(p,'rpe')){const input=target.set.querySelector('.set-rpe');if(!input)return {ok:false,error:'This set has no RPE field.'};input.value=String(p.rpe);dispatch(input,'input');}
  const completion=complete===null?(Object.prototype.hasOwnProperty.call(p,'completed')?p.completed:null):complete;
  if(completion!==null){const measure=target.trackBy==='duration'?target.set.querySelector('.set-duration')?.value:target.set.querySelector('.set-reps')?.value;if(completion&&!measure){restore(target,original);return {ok:false,error:'Enter the reps or hold duration before completing this set.'};}const check=ensureCheckbox(target.set);check.checked=completion;dispatch(check,'change');}
  target.set.classList.add('voice-logged-set');target.set.dataset.voiceLoggedAt=String(Date.now());
  const result={ok:true,values:values(target),identity:{exerciseIndex:target.exerciseIndex,setIndex:target.setIndex,exerciseName:target.exerciseName},before:original};result.summary=summary(result);
  if(replaceLast&&actions.length){const prior=actions[actions.length-1];prior.after=result.values;prior.summary=result.summary;}
  else{actions.push({identity:result.identity,before:original,after:result.values,summary:result.summary,at:Date.now()});if(actions.length>MAX_ACTIONS)actions.shift();}
  emit('applied',result);return result;
 }
 function duplicateSignature(args){const copy={weight:args.weight??null,weightUnit:unit(args.weightUnit),reps:args.reps??null,durationSeconds:args.durationSeconds??null,rpe:args.rpe??null};return JSON.stringify(copy);}
 function logCurrentSet(args={}){
  const now=Date.now(),signature=duplicateSignature(args);if(lastCommit&&lastCommit.signature===signature&&now-lastCommit.at<DUPLICATE_WINDOW_MS)return {ok:true,duplicate:true,summary:'Duplicate voice log ignored.',values:lastCommit.values};
  const target=currentTarget();if(!target)return {ok:false,error:'There is no active strength set to log.'};const normalized=normalizeSetPatch(args,{trackBy:target.trackBy,displayUnit:displayUnit()});if(!normalized.ok)return normalized;
  const result=apply(target,normalized,{complete:true});if(result.ok){lastCommit={signature,at:now,values:result.values};}return result;
 }
 function updateCurrentSet(args={}){const target=currentTarget();if(!target)return {ok:false,error:'There is no active strength set to update.'};const normalized=normalizeSetPatch(args,{trackBy:target.trackBy,displayUnit:displayUnit()});if(!normalized.ok)return normalized;return apply(target,normalized,{complete:false});}
 function correctLast(args={}){
  const prior=actions[actions.length-1];if(!prior)return {ok:false,error:'There is no voice-entered set to correct.'};const target=targetByIdentity(prior.identity);if(!target)return {ok:false,error:'The previously voice-entered set is no longer available.'};const normalized=normalizeSetPatch(args,{trackBy:target.trackBy,displayUnit:displayUnit()});if(!normalized.ok)return normalized;return apply(target,normalized,{complete:null,before:prior.before,replaceLast:true});
 }
 function undoLast(){const prior=actions.pop();if(!prior)return {ok:false,error:'There is no voice logging action to undo.'};const target=targetByIdentity(prior.identity);if(!target)return {ok:false,error:'The voice-entered set is no longer available to undo.'};restore(target,prior.before);lastCommit=null;const result={ok:true,summary:`Undid voice entry for ${prior.identity.exerciseName} set ${prior.identity.setIndex+1}.`,identity:prior.identity,values:values(target)};emit('undo',result);return result;}
 function lastAction(){const item=actions[actions.length-1];return item?{identity:{...item.identity},summary:item.summary,after:{...item.after}}:null;}
 function reset(){actions.splice(0);lastCommit=null;}
 return {LB_PER_KG,convertWeight,normalizeSetPatch,currentTarget,logCurrentSet,updateCurrentSet,correctLast,undoLast,lastAction,reset};
});
