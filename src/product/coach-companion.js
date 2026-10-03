/* v2.79 — deterministic Coach Companion context + safe command helpers.
 * This module never owns programming decisions. It describes live training state
 * and classifies a very small set of reversible workout convenience actions.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachCompanion=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SURFACES=new Set(['home','train','progress','coach','profile','other']);
 const clean=(value,max=240)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
 const finite=value=>{const n=Number(value);return Number.isFinite(n)?n:null;};
 const integer=value=>{const n=finite(value);return n==null?null:Math.round(n);};
 function normalizeSurface(value){const surface=clean(value,32).toLowerCase();return SURFACES.has(surface)?surface:'other';}
 function normalizeSet(raw={}){
  const rpe=finite(raw.rpe);
  return {
   index:Math.max(0,integer(raw.index)||0),
   count:Math.max(0,integer(raw.count)||0),
   reps:finite(raw.reps),
   durationSeconds:finite(raw.durationSeconds),
   weightKg:finite(raw.weightKg),
   displayWeight:finite(raw.displayWeight),
   displayUnit:raw.displayUnit==='lb'?'lb':'kg',
   rpe:rpe!=null&&rpe>=1&&rpe<=10?rpe:null,
   completed:!!raw.completed,
   target:clean(raw.target,180)||null,
   previous:clean(raw.previous,180)||null
  };
 }
 function normalizeExercise(raw={}){
  return {
   name:clean(raw.name,160)||null,
   index:Math.max(0,integer(raw.index)||0),
   count:Math.max(0,integer(raw.count)||0),
   set:raw.set?normalizeSet(raw.set):null
  };
 }
 function normalizeWorkout(raw){
  if(!raw||typeof raw!=='object')return null;
  const exercises=Array.isArray(raw.exercises)?raw.exercises.slice(0,12).map(ex=>({
   name:clean(ex?.name,160)||null,
   completedSets:Math.max(0,integer(ex?.completedSets)||0),
   totalSets:Math.max(0,integer(ex?.totalSets)||0)
  })).filter(ex=>ex.name):[];
  return {
   active:!!raw.active,
   date:clean(raw.date,16)||null,
   name:clean(raw.name,180)||null,
   position:clean(raw.position,180)||null,
   currentExercise:raw.currentExercise?normalizeExercise(raw.currentExercise):null,
   exercises
  };
 }
 function normalizeRest(raw){
  if(!raw||typeof raw!=='object')return {active:false,paused:false,remainingSeconds:0,label:null};
  const remainingMs=finite(raw.remainingMs);
  return {
   active:!!raw.active,
   paused:!!raw.paused,
   remainingSeconds:remainingMs==null?0:Math.max(0,Math.ceil(remainingMs/1000)),
   label:clean(raw.label,80)||null
  };
 }
 function buildContext({surface='other',workout=null,rest=null,capabilities=null}={}){
  return {
   version:1,
   surface:normalizeSurface(surface),
   liveWorkout:normalizeWorkout(workout),
   restTimer:normalizeRest(rest),
   capabilities:{
    liveWorkoutRead:true,
    restTimerControl:true,
    workoutMutation:false,
    programmingMutation:false,
    ...(capabilities&&typeof capabilities==='object'?capabilities:{})
   }
  };
 }
 const numberWords={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
 function durationSeconds(text){
  const q=clean(text,240).toLowerCase();
  const match=q.match(/(?:start|set)(?:\s+(?:a|the))?(?:\s+rest)?(?:\s+timer)?(?:\s+for)?\s+(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*(seconds?|secs?|sec|s|minutes?|mins?|min|m)\b/);
  if(!match)return null;
  const value=numberWords[match[1]]??Number(match[1]);
  if(!Number.isFinite(value)||value<=0)return null;
  const seconds=/^m(in|ins|inute|inutes)?$/.test(match[2])?value*60:value;
  return Math.round(seconds);
 }
 function classifyCommand(text){
  const q=clean(text,240).toLowerCase();
  const seconds=durationSeconds(q);
  if(seconds!=null&&seconds>=5&&seconds<=1800)return {kind:'rest_start',risk:'reversible',args:{seconds}};
  if(/\b(pause|hold)\b.*\brest\b|\brest\b.*\b(pause|hold)\b/.test(q))return {kind:'rest_pause',risk:'reversible',args:{}};
  if(/\b(resume|continue)\b.*\brest\b|\brest\b.*\b(resume|continue)\b/.test(q))return {kind:'rest_resume',risk:'reversible',args:{}};
  if(/\b(add|plus)\b\s*(?:another\s*)?30\s*(?:seconds?|secs?|sec|s)?\b/.test(q))return {kind:'rest_add_30',risk:'reversible',args:{seconds:30}};
  if(/\b(stop|cancel|end)\b.*\brest\b|\brest\b.*\b(stop|cancel|end)\b/.test(q))return {kind:'rest_stop',risk:'reversible',args:{}};
  return null;
 }
 function currentSetSummary(context={}){
  const workout=context.liveWorkout;
  const current=workout?.currentExercise;
  const set=current?.set;
  if(!workout?.active||!current?.name)return null;
  const pieces=[current.name];
  if(set?.count)pieces.push('set '+Math.min(set.index+1,set.count)+' of '+set.count);
  if(set?.target)pieces.push('target '+set.target);
  return pieces.join(' · ');
 }
 function offlineReply(context,question){
  const q=clean(question,500).toLowerCase().replace(/[’‘]/g,"'");
  const summary=currentSetSummary(context);
  if(/\b(what('?s| is)? next|next set|what am i (doing|on)|current set)\b/.test(q)){
   return summary?('You are on '+summary+'.'):'There is no active set I can read right now.';
  }
  if(/\b(rest|timer)\b/.test(q)&&/\b(how (much|long)|remaining|left)\b/.test(q)){
   const rest=context.restTimer||{};
   if(!rest.active)return 'No rest timer is running right now.';
   return 'Rest remaining: '+rest.remainingSeconds+' seconds'+(rest.paused?' · paused':'')+'.';
  }
  if(/\b(where am i|what screen|what section)\b/.test(q))return 'You are in the '+normalizeSurface(context.surface)+' section.';
  return null;
 }
 return {normalizeSurface,normalizeSet,normalizeWorkout,normalizeRest,buildContext,durationSeconds,classifyCommand,currentSetSummary,offlineReply};
});
