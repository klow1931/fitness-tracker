/* v2.82 — Voice Companion controls, hands-free logging and proactive cues.
 * Voice writes only through the active workout form/draft. Proactive coaching
 * is event-driven and never changes programming or saved history.
 */
(function(){
 'use strict';
 let controller=null,initialized=false,userSpeaking=false,assistantSpeaking=false;
 const Voice=()=>window.LoadnoteCoachVoice;
 const Companion=()=>window.LoadnoteCoachCompanionUI;
 const Coach=()=>window.LoadnoteCoachClient;
 const Logger=()=>window.LoadnoteVoiceWorkoutLogging;
 const Proactive=()=>window.LoadnoteProactiveCoachUI;
 function append(text,role='assistant',meta='Voice Companion'){
  if(Companion()?.append)return Companion().append(text,role,meta);
  const host=document.getElementById('cc-messages');if(!host)return;
  const row=document.createElement('div');row.className='cc-msg '+(role==='user'?'user':'assistant');row.textContent=String(text||'');
  if(meta){const small=document.createElement('small');small.textContent=meta;row.appendChild(small);}host.appendChild(row);host.scrollTop=host.scrollHeight;
 }
 function timer(){return window.LoadnoteRestTimer;}
 function timerResult(action){const t=timer();if(!t)return {ok:false,error:'Rest timer is unavailable.'};const snap=()=>t.snapshot?.()||{};
  if(action==='get')return {ok:true,restTimer:snap()};
  if(action==='pause'){if(!snap().active)return {ok:false,error:'No rest timer is running.'};if(snap().paused)return {ok:true,restTimer:snap()};t.pause?.();return {ok:true,restTimer:snap()};}
  if(action==='resume'){if(!snap().active)return {ok:false,error:'No rest timer is running.'};if(!snap().paused)return {ok:true,restTimer:snap()};t.pause?.();return {ok:true,restTimer:snap()};}
  if(action==='add'){if(!snap().active)return {ok:false,error:'No rest timer is running.'};t.add?.();return {ok:true,restTimer:snap()};}
  if(action==='stop'){if(!snap().active)return {ok:true,restTimer:snap()};t.stop?.();return {ok:true,restTimer:snap()};}
  return {ok:false,error:'Unsupported rest action.'};
 }
 function renderLastAction(){
  const host=document.getElementById('cc-voice-last');if(!host)return;const action=Companion()?.liveContext?.()?.sportWorkout?null:Logger()?.lastAction?.();host.hidden=!action;
  if(!action){host.querySelector('span').textContent='';return;}host.querySelector('span').textContent='✓ '+action.summary;host.querySelector('button').disabled=false;
 }
 function renderProactive(){
  const host=document.getElementById('cc-proactive');if(!host)return;const value=Proactive()?.state?.()||{mode:'normal',paused:false};
  const select=host.querySelector('select');if(select&&select.value!==value.mode)select.value=value.mode;
  const pause=host.querySelector('.cc-cues-pause');if(pause)pause.textContent=value.paused?'Resume cues':'Pause cues';
  const status=host.querySelector('.cc-cues-state');if(status)status.textContent=value.paused?'Unsolicited cues paused':value.mode.charAt(0).toUpperCase()+value.mode.slice(1)+' cues';
 }
 function loggerResult(method,args){
  if(Companion()?.liveContext?.()?.sportWorkout)return {ok:false,error:'Record sport observations in the sport-session form; strength voice logging is unavailable in this recorder.'};
  const logger=Logger();if(!logger||typeof logger[method]!=='function')return {ok:false,error:'Hands-free workout logging is unavailable.'};
  const result=logger[method](args);renderLastAction();Companion()?.refresh?.();return result;
 }
 function proactiveResult(action,args={}){
  const proactive=Proactive();if(!proactive)return {ok:false,error:'Proactive coaching controls are unavailable.'};
  let value;if(action==='get')value=proactive.state();else if(action==='mode')value=proactive.setMode(args.mode);else if(action==='pause')value=proactive.pause();else if(action==='resume')value=proactive.resume();else return {ok:false,error:'Unsupported proactive coaching action.'};
  renderProactive();return {ok:true,proactive:value};
 }
 async function tool(name,args={}){
  if(name==='get_live_workout_context')return {ok:true,context:Companion()?.liveContext?.()||null};
  if(name==='log_current_set')return loggerResult('logCurrentSet',args);
  if(name==='update_current_set')return loggerResult('updateCurrentSet',args);
  if(name==='correct_last_voice_entry')return loggerResult('correctLast',args);
  if(name==='undo_last_voice_entry')return loggerResult('undoLast');
  if(name==='get_rest_timer')return timerResult('get');
  if(name==='start_rest_timer'){
   const seconds=Math.round(Number(args.seconds));if(!Number.isFinite(seconds)||seconds<15||seconds>900)return {ok:false,error:'Rest must be between 15 and 900 seconds.'};
   const t=timer();if(!t)return {ok:false,error:'Rest timer is unavailable.'};t.start?.(seconds);return {ok:true,restTimer:t.snapshot?.()||{active:true,remainingSeconds:seconds}};
  }
  if(name==='pause_rest_timer')return timerResult('pause');
  if(name==='resume_rest_timer')return timerResult('resume');
  if(name==='add_30_seconds_rest')return timerResult('add');
  if(name==='stop_rest_timer')return timerResult('stop');
  if(name==='get_proactive_coaching_state')return proactiveResult('get');
  if(name==='set_proactive_coaching_mode')return proactiveResult('mode',args);
  if(name==='pause_proactive_coaching')return proactiveResult('pause');
  if(name==='resume_proactive_coaching')return proactiveResult('resume');
  if(name==='ask_loadnote_coach'){
   const question=String(args.question||'').trim().slice(0,600);if(!question)return {ok:false,error:'Question is required.'};
   const live=Companion()?.liveContext?.();let local=null;try{local=window.LoadnoteCoachConversation?.answer(data,question,{asOf:today(),unit:currentUnit(),live});}catch{}
   if(local?.source?.startsWith('Shared coaching'))return {ok:true,coach:{summary:local.text,recommendation:{action:'none'},source:local.source,readOnly:true}};
   const client=Coach();if(!client)return {ok:false,error:'Secure Coach is unavailable.'};
   try{const answer=await client.ask({question,context:Companion()?.context?.()||{},history:[]});return {ok:true,coach:answer};}catch(error){return {ok:false,error:String(error?.message||'Secure Coach unavailable.').slice(0,240)};}
  }
  return {ok:false,error:'Unsupported Voice Companion tool.'};
 }
 function controls(){
  let host=document.getElementById('cc-voice');if(host)return host;
  const foot=document.querySelector('#coach-companion-panel .cc-foot');if(!foot)return null;
  host=document.createElement('div');host.id='cc-voice';host.className='cc-voice';host.innerHTML='<div class="cc-voice-main"><button type="button" class="cc-voice-start">Start voice</button><span class="cc-voice-state" aria-live="polite">Voice off</span></div><div class="cc-voice-live" hidden><button type="button" class="cc-voice-mute">Mute</button><button type="button" class="cc-voice-end">End</button><span class="cc-voice-privacy">Mic active only while this session is on.</span></div><div id="cc-proactive" class="cc-proactive"><label>Coach cues <select aria-label="Proactive Coach cue level"><option value="quiet">Quiet</option><option value="normal">Normal</option><option value="proactive">Proactive</option></select></label><button type="button" class="cc-cues-pause">Pause cues</button><span class="cc-cues-state"></span></div><div id="cc-voice-last" class="cc-voice-last" hidden><span></span><button type="button">Undo</button></div>';
  foot.before(host);
  if(!document.getElementById('coach-voice-style')){const style=document.createElement('style');style.id='coach-voice-style';style.textContent='.cc-voice{border-top:1px solid #e2e8f0;padding:9px 14px;display:grid;gap:7px}.cc-voice-main,.cc-voice-live,.cc-voice-last,.cc-proactive{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cc-voice button,.cc-proactive select{border:1px solid #cbd5e1;border-radius:999px;background:transparent;color:inherit;padding:7px 10px;font-size:12px;font-weight:700}.cc-proactive label{font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px}.cc-proactive select{padding:5px 8px}.cc-cues-state{font-size:10px;color:#64748b}.cc-voice-start{background:#312e81!important;color:#fff!important;border-color:#312e81!important}.cc-voice-state{font-size:11px;color:#64748b}.cc-voice-state.live::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;margin-right:5px}.cc-voice-privacy{font-size:10px;color:#64748b;flex:1 1 150px}.cc-voice-last{font-size:11px;padding:7px 9px;border-radius:10px;background:#ecfdf5;color:#065f46}.cc-voice-last span{flex:1 1 200px}.cc-voice-last button{border-color:#a7f3d0;color:#047857;padding:4px 8px}.voice-logged-set{outline:2px solid #34d39955;outline-offset:2px}body.dark .cc-voice{border-color:#334155}body.dark .cc-voice-last{background:#064e3b;color:#d1fae5}';document.head.appendChild(style);}
  host.querySelector('.cc-voice-start').addEventListener('click',start);
  host.querySelector('.cc-voice-mute').addEventListener('click',toggleMute);
  host.querySelector('.cc-voice-end').addEventListener('click',stop);
  host.querySelector('#cc-voice-last button').addEventListener('click',()=>{const result=loggerResult('undoLast');if(result?.ok)append(result.summary,'assistant','Voice logging');});
  host.querySelector('#cc-proactive select').addEventListener('change',event=>{Proactive()?.setMode?.(event.target.value);renderProactive();});
  host.querySelector('.cc-cues-pause').addEventListener('click',()=>{const state=Proactive()?.state?.();if(state?.paused)Proactive()?.resume?.();else Proactive()?.pause?.();renderProactive();});
  renderProactive();return host;
 }
 function render(snapshot={state:'off',muted:false}){
  const host=controls();if(!host)return;const active=snapshot.state!=='off'&&snapshot.state!=='error';
  host.querySelector('.cc-voice-start').hidden=active;host.querySelector('.cc-voice-live').hidden=!active;
  const label=host.querySelector('.cc-voice-state');const map={off:'Voice off',connecting:'Connecting microphone…',listening:'Listening',muted:'Muted',error:'Voice unavailable'};label.textContent=map[snapshot.state]||snapshot.state;label.classList.toggle('live',active&&!snapshot.muted);
  host.querySelector('.cc-voice-mute').textContent=snapshot.muted?'Unmute':'Mute';renderLastAction();renderProactive();
 }
 function signalActivity(){try{document.dispatchEvent(new CustomEvent('loadnote:voice-activity',{detail:activity()}));}catch{}}
 function onRealtimeEvent(event){
  let changed=false;if(event?.type==='input_audio_buffer.speech_started'){userSpeaking=true;changed=true;}
  if(event?.type==='input_audio_buffer.speech_stopped'||event?.type==='conversation.item.input_audio_transcription.completed'){userSpeaking=false;changed=true;}
  if(event?.type==='response.created'){assistantSpeaking=true;changed=true;}
  if(event?.type==='response.done'||event?.type==='response.cancelled'||event?.type==='response.failed'||event?.type==='error'){assistantSpeaking=false;changed=true;}
  if(changed)signalActivity();
 }
 function makeController(){
  if(controller)return controller;const api=Voice();if(!api?.createController)return null;
  controller=api.createController({toolHandler:tool,onState:s=>{render(s);signalActivity();},onEvent:onRealtimeEvent,onTranscript:item=>{if(!item.final||!String(item.text||'').trim())return;append(item.text,item.role==='user'?'user':'assistant',item.role==='user'?'Heard by Voice Companion':'Voice Companion');}});return controller;
 }
 function handleProactiveCue(event){
  const cue=event?.detail;if(!cue?.message)return false;const info=activity();if(!info.active||!info.connected||info.userSpeaking||info.assistantSpeaking)return false;
  try{return makeController()?.announce?.(cue.message)===true;}catch{return false;}
 }
 async function start(){
  const c=makeController();if(!c){render({state:'error'});append('Voice Companion is not available on this device. Text Coach remains available.');return;}
  render({state:'connecting'});
  try{await c.start({context:Companion()?.liveContext?.()||null});Proactive()?.beginSession?.();append('Voice Companion started. You can talk naturally, log the current set, and use Quiet, Normal, or Proactive coaching cues.','assistant','Voice session');signalActivity();}
  catch(error){render({state:'error'});const code=error?.code;if(code==='voice_sign_in_required'||code==='auth_required')append('Sign in from Profile to start realtime voice. Text and offline workout guidance still work.');else append('Realtime voice could not start. Text Companion remains available. '+String(error?.message||'').slice(0,180));}
 }
 function toggleMute(){const c=makeController();if(!c)return;render(c.toggleMuted());signalActivity();}
 function stop(){if(!controller)return;controller.stop();userSpeaking=false;assistantSpeaking=false;render({state:'off'});signalActivity();append('Voice Companion ended.','assistant','Voice session');}
 function activity(){return {...(controller?.snapshot?.()||{state:'off',active:false,muted:false,connected:false}),userSpeaking,assistantSpeaking};}
 function init(){if(initialized)return;initialized=true;const wait=()=>{if(controls()){render(controller?.snapshot?.()||{state:'off'});return;}setTimeout(wait,100);};wait();document.addEventListener('visibilitychange',()=>{if(document.hidden&&controller?.snapshot?.().active)controller.setMuted(true);});document.addEventListener('loadnote:voice-log',renderLastAction);document.addEventListener('loadnote:proactive-state',renderProactive);document.addEventListener('loadnote:proactive-cue',handleProactiveCue);}
 window.LoadnoteCoachVoiceUI={init,start,stop,toggleMute,tool,state:()=>controller?.snapshot?.()||{state:'off',active:false,muted:false,connected:false},activity};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
