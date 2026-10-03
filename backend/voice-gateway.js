'use strict';
const crypto=require('crypto');

const MAX_CONTEXT_BYTES=12000;
const ALLOWED_SURFACES=new Set(['home','train','progress','coach','profile','other']);

function text(value,max=240){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);}
function finite(value){const n=Number(value);return Number.isFinite(n)?n:null;}
function bool(value){return !!value;}
function clampInt(value,min,max){const n=Math.round(Number(value));return Number.isFinite(n)?Math.max(min,Math.min(max,n)):null;}
function safeJson(value){
 const raw=JSON.stringify(value??null);
 return Buffer.byteLength(raw)<=MAX_CONTEXT_BYTES?raw:raw.slice(0,MAX_CONTEXT_BYTES);
}
function sanitizeSet(set){
 if(!set||typeof set!=='object')return null;
 return {
  index:clampInt(set.index,0,99),count:clampInt(set.count,0,99),reps:finite(set.reps),durationSeconds:finite(set.durationSeconds),
  weightKg:finite(set.weightKg),displayWeight:finite(set.displayWeight),displayUnit:text(set.displayUnit,8),rpe:finite(set.rpe),completed:bool(set.completed),
  target:text(set.target,240)||null,previous:text(set.previous,240)||null
 };
}
function sanitizeWorkout(workout){
 if(!workout||typeof workout!=='object'||!workout.active)return null;
 const current=workout.currentExercise&&typeof workout.currentExercise==='object'?workout.currentExercise:null;
 return {
  active:true,date:text(workout.date,24)||null,name:text(workout.name,120)||'Workout',position:text(workout.position,120)||null,
  currentExercise:current?{name:text(current.name,120)||'Exercise',index:clampInt(current.index,0,99),count:clampInt(current.count,0,99),set:sanitizeSet(current.set)}:null,
  exercises:Array.isArray(workout.exercises)?workout.exercises.slice(0,12).map(row=>({name:text(row?.name,120)||'Exercise',completedSets:clampInt(row?.completedSets,0,99),totalSets:clampInt(row?.totalSets,0,99)})):[]
 };
}
function sanitizeContext(input){
 const source=input&&typeof input==='object'?input:{};
 const surface=ALLOWED_SURFACES.has(source.surface)?source.surface:'other';
 const rest=source.restTimer&&typeof source.restTimer==='object'?source.restTimer:{};
 return {
  version:1,surface,
  liveWorkout:sanitizeWorkout(source.liveWorkout),
  restTimer:{active:bool(rest.active),paused:bool(rest.paused),remainingSeconds:clampInt(rest.remainingSeconds,0,3600)},
  capabilities:{workoutMutation:false,programmingMutation:false,historyMutation:false,restTimerActions:true}
 };
}
function tools(){return [
 {type:'function',name:'get_live_workout_context',description:'Read the athlete’s current Loadnote workout, current exercise/set, target/previous context, and surface. Use this for live workout facts.',parameters:{type:'object',properties:{},additionalProperties:false}},
 {type:'function',name:'get_rest_timer',description:'Read the current Loadnote rest timer state.',parameters:{type:'object',properties:{},additionalProperties:false}},
 {type:'function',name:'start_rest_timer',description:'Start or replace the reversible Loadnote rest timer.',parameters:{type:'object',properties:{seconds:{type:'integer',minimum:15,maximum:900}},required:['seconds'],additionalProperties:false}},
 {type:'function',name:'pause_rest_timer',description:'Pause the active rest timer.',parameters:{type:'object',properties:{},additionalProperties:false}},
 {type:'function',name:'resume_rest_timer',description:'Resume the paused rest timer.',parameters:{type:'object',properties:{},additionalProperties:false}},
 {type:'function',name:'add_30_seconds_rest',description:'Add 30 seconds to the active rest timer.',parameters:{type:'object',properties:{},additionalProperties:false}},
 {type:'function',name:'stop_rest_timer',description:'Stop the active rest timer.',parameters:{type:'object',properties:{},additionalProperties:false}},
 {type:'function',name:'ask_loadnote_coach',description:'Ask the existing secure Loadnote Coach for a broader explanation about training, programming rationale, progress, or what to focus on. This is read-only and cannot apply changes.',parameters:{type:'object',properties:{question:{type:'string',minLength:1,maxLength:600}},required:['question'],additionalProperties:false}}
 ];}
function instructions(context){
 return [
  'You are Loadnote Coach Companion, a concise voice companion for strength training.',
  'Keep spoken replies short enough to use between sets unless the athlete asks for more detail.',
  'Use get_live_workout_context for current exercise, set, load, reps, RPE, target, previous performance, or workout position. Do not guess these facts.',
  'Use get_rest_timer and the rest timer tools for timer questions and commands.',
  'Use ask_loadnote_coach for broader training rationale, progress, programming, phase, or adaptation questions.',
  'Loadnote Decisions and the existing logger are authoritative. You cannot log/complete/edit sets, alter workout history, change prescriptions, change programs, accept adaptations, or claim that you did.',
  'If asked to make a training/programming/history change, explain that v2.80 voice is read-only for training data and direct the athlete to the existing Loadnote workflow.',
  'Do not invent physiological measurements, medical diagnoses, readiness scores, or recovery claims.',
  'The athlete explicitly started this microphone session. Do not imply that Loadnote listens when Companion Mode is off.',
  'Seed context (may become stale; refresh live facts with tools): '+safeJson(context)
 ].join('\n');
}
function sessionConfig({context,model='gpt-realtime-2.1',voice='marin',transcriptionModel='gpt-4o-mini-transcribe'}={}){
 const clean=sanitizeContext(context);
 return {session:{
  type:'realtime',model:text(model,80)||'gpt-realtime-2.1',output_modalities:['audio'],instructions:instructions(clean),tools:tools(),tool_choice:'auto',
  audio:{input:{transcription:{model:text(transcriptionModel,80)||'gpt-4o-mini-transcribe'},turn_detection:{type:'semantic_vad',create_response:true,interrupt_response:true}},output:{voice:text(voice,40)||'marin'}}
 }};
}
function safetyIdentifier(accountId){return 'ln_'+crypto.createHash('sha256').update(String(accountId||'anonymous')).digest('hex').slice(0,32);}
function parseClientSecret(payload){
 if(!payload||typeof payload!=='object')throw Error('Voice provider returned an invalid client secret.');
 const value=text(payload.value,4096);if(!value)throw Error('Voice provider did not return a client secret.');
 return {value,expiresAt:finite(payload.expires_at)||null};
}
module.exports={sanitizeContext,tools,instructions,sessionConfig,safetyIdentifier,parseClientSecret};
