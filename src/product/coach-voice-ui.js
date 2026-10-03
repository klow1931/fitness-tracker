/* v2.80 — explicit, workout-scoped Voice Companion controls.
 * Voice is opt-in and read-only for training data. The existing logger and
 * Decisions remain authoritative; only rest-timer actions are executable.
 */
(function(){
 'use strict';
 let controller=null,initialized=false;
 const Voice=()=>window.LoadnoteCoachVoice;
 const Companion=()=>window.LoadnoteCoachCompanionUI;
 const Coach=()=>window.LoadnoteCoachClient;
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
 async function tool(name,args={}){
  if(name==='get_live_workout_context')return {ok:true,context:Companion()?.liveContext?.()||null};
  if(name==='get_rest_timer')return timerResult('get');
  if(name==='start_rest_timer'){
   const seconds=Math.round(Number(args.seconds));if(!Number.isFinite(seconds)||seconds<15||seconds>900)return {ok:false,error:'Rest must be between 15 and 900 seconds.'};
   const t=timer();if(!t)return {ok:false,error:'Rest timer is unavailable.'};t.start?.(seconds);return {ok:true,restTimer:t.snapshot?.()||{active:true,remainingSeconds:seconds}};
  }
  if(name==='pause_rest_timer')return timerResult('pause');
  if(name==='resume_rest_timer')return timerResult('resume');
  if(name==='add_30_seconds_rest')return timerResult('add');
  if(name==='stop_rest_timer')return timerResult('stop');
  if(name==='ask_loadnote_coach'){
   const question=String(args.question||'').trim().slice(0,600);if(!question)return {ok:false,error:'Question is required.'};
   const client=Coach();if(!client)return {ok:false,error:'Secure Coach is unavailable.'};
   try{const answer=await client.ask({question,context:Companion()?.context?.()||{},history:[]});return {ok:true,coach:answer};}catch(error){return {ok:false,error:String(error?.message||'Secure Coach unavailable.').slice(0,240)};}
  }
  return {ok:false,error:'Unsupported Voice Companion tool.'};
 }
 function controls(){
  let host=document.getElementById('cc-voice');if(host)return host;
  const foot=document.querySelector('#coach-companion-panel .cc-foot');if(!foot)return null;
  host=document.createElement('div');host.id='cc-voice';host.className='cc-voice';host.innerHTML='<div class="cc-voice-main"><button type="button" class="cc-voice-start">Start voice</button><span class="cc-voice-state" aria-live="polite">Voice off</span></div><div class="cc-voice-live" hidden><button type="button" class="cc-voice-mute">Mute</button><button type="button" class="cc-voice-end">End</button><span class="cc-voice-privacy">Mic active only while this session is on.</span></div>';
  foot.before(host);
  if(!document.getElementById('coach-voice-style')){const style=document.createElement('style');style.id='coach-voice-style';style.textContent='.cc-voice{border-top:1px solid #e2e8f0;padding:9px 14px;display:grid;gap:7px}.cc-voice-main,.cc-voice-live{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cc-voice button{border:1px solid #cbd5e1;border-radius:999px;background:transparent;color:inherit;padding:7px 10px;font-size:12px;font-weight:700}.cc-voice-start{background:#312e81!important;color:#fff!important;border-color:#312e81!important}.cc-voice-state{font-size:11px;color:#64748b}.cc-voice-state.live::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;margin-right:5px}.cc-voice-privacy{font-size:10px;color:#64748b;flex:1 1 150px}body.dark .cc-voice{border-color:#334155}';document.head.appendChild(style);}
  host.querySelector('.cc-voice-start').addEventListener('click',start);
  host.querySelector('.cc-voice-mute').addEventListener('click',toggleMute);
  host.querySelector('.cc-voice-end').addEventListener('click',stop);
  return host;
 }
 function render(snapshot={state:'off',muted:false}){
  const host=controls();if(!host)return;const active=snapshot.state!=='off'&&snapshot.state!=='error';
  host.querySelector('.cc-voice-start').hidden=active;host.querySelector('.cc-voice-live').hidden=!active;
  const label=host.querySelector('.cc-voice-state');const map={off:'Voice off',connecting:'Connecting microphone…',listening:'Listening',muted:'Muted',error:'Voice unavailable'};label.textContent=map[snapshot.state]||snapshot.state;label.classList.toggle('live',active&&!snapshot.muted);
  host.querySelector('.cc-voice-mute').textContent=snapshot.muted?'Unmute':'Mute';
 }
 function makeController(){
  if(controller)return controller;const api=Voice();if(!api?.createController)return null;
  controller=api.createController({
   toolHandler:tool,
   onState:s=>render(s),
   onTranscript:item=>{if(!item.final||!String(item.text||'').trim())return;append(item.text,item.role==='user'?'user':'assistant',item.role==='user'?'Heard by Voice Companion':'Voice Companion');}
  });return controller;
 }
 async function start(){
  const c=makeController();if(!c){render({state:'error'});append('Voice Companion is not available on this device. Text Coach remains available.');return;}
  render({state:'connecting'});
  try{await c.start({context:Companion()?.liveContext?.()||null});append('Voice Companion started. You can talk naturally and interrupt me.','assistant','Voice session');}
  catch(error){render({state:'error'});const code=error?.code;if(code==='voice_sign_in_required'||code==='auth_required')append('Sign in from Profile to start realtime voice. Text and offline workout guidance still work.');else append('Realtime voice could not start. Text Companion remains available. '+String(error?.message||'').slice(0,180));}
 }
 function toggleMute(){const c=makeController();if(!c)return;render(c.toggleMuted());}
 function stop(){if(!controller)return;controller.stop();render({state:'off'});append('Voice Companion ended.','assistant','Voice session');}
 function init(){if(initialized)return;initialized=true;const wait=()=>{if(controls()){render(controller?.snapshot?.()||{state:'off'});return;}setTimeout(wait,100);};wait();document.addEventListener('visibilitychange',()=>{if(document.hidden&&controller?.snapshot?.().active)controller.setMuted(true);});}
 window.LoadnoteCoachVoiceUI={init,start,stop,toggleMute,tool,state:()=>controller?.snapshot?.()||{state:'off',active:false,muted:false}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
