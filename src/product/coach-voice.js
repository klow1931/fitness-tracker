/* v2.82 — workout-scoped Realtime Voice Companion transport.
 * Standard provider credentials remain server-side. This client receives only
 * a short-lived realtime client secret after an explicit athlete action.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LoadnoteCoachVoice=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const CALLS_URL='https://api.openai.com/v1/realtime/calls';
 function json(value,fallback={}){try{return JSON.parse(String(value||''));}catch{return fallback;}}
 function serialize(value){try{return JSON.stringify(value??null);}catch{return JSON.stringify({error:'unserializable_tool_result'});}}
 function makeError(message,code){const error=new Error(message);error.code=code;return error;}
 function createController(options={}){
  const root=typeof globalThis!=='undefined'?globalThis:{};
  const fetchImpl=options.fetchImpl||root.fetch?.bind(root);
  const PeerConnection=options.PeerConnection||root.RTCPeerConnection;
  const mediaDevices=options.mediaDevices||root.navigator?.mediaDevices;
  const requestSession=options.requestSession||(async context=>{
   const account=root.LoadnoteAccountSession;
   if(!account?.request)throw makeError('Account session is unavailable.','voice_account_unavailable');
   const response=await account.request('/api/voice/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context})});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw makeError(payload.error||'Voice Companion is unavailable.',payload.code||'voice_session_failed');
   return payload;
  });
  const toolHandler=options.toolHandler||(async()=>({error:'tool_unavailable'}));
  const onState=typeof options.onState==='function'?options.onState:()=>{};
  const onTranscript=typeof options.onTranscript==='function'?options.onTranscript:()=>{};
  const onEvent=typeof options.onEvent==='function'?options.onEvent:()=>{};
  const audioFactory=options.audioFactory||(()=>{if(!root.document)return null;const audio=root.document.createElement('audio');audio.autoplay=true;audio.playsInline=true;return audio;});
  let pc=null,channel=null,stream=null,remoteAudio=null,state='off',muted=false,assistantBuffer='',handledCalls=new Set(),finalTranscripts=new Set();
  function snapshot(){return {state,active:!!pc,muted,connected:channel?.readyState==='open'};}
  function setState(next,detail=''){state=next;onState({...snapshot(),detail});}
  function send(event){if(channel?.readyState!=='open')throw makeError('Voice data channel is not ready.','voice_channel_unavailable');channel.send(JSON.stringify(event));}
  function announce(text){
   const cue=String(text||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,600);if(!cue)throw makeError('A proactive cue is required.','voice_cue_missing');
   send({type:'response.create',response:{instructions:'Speak this Loadnote training cue concisely. Preserve every number and training fact exactly. Do not add advice, diagnoses, motivation, or programming changes. Cue: '+cue}});return true;
  }
  function emitFinal(role,text,itemId){
   const clean=String(text||'').trim();if(!clean)return;
   const key=[role,itemId||'',clean].join('|');if(finalTranscripts.has(key))return;finalTranscripts.add(key);
   onTranscript({role,text:clean,final:true,itemId:itemId||null});
  }
  async function runTool(item){
   const callId=String(item?.call_id||item?.callId||'');if(!callId||handledCalls.has(callId))return;
   handledCalls.add(callId);
   const name=String(item?.name||''),args=json(item?.arguments,{});
   let result;
   try{result=await toolHandler(name,args);}catch(error){result={error:'tool_failed',message:String(error?.message||'Tool failed').slice(0,240)};}
   if(channel?.readyState!=='open')return;
   send({type:'conversation.item.create',item:{type:'function_call_output',call_id:callId,output:serialize(result)}});
   send({type:'response.create'});
  }
  function handleEvent(raw){
   const event=typeof raw==='string'?json(raw,null):raw?.data!=null?json(raw.data,null):raw;
   if(!event||typeof event!=='object')return;
   onEvent(event);
   if(event.type==='session.created'||event.type==='session.updated')setState(muted?'muted':'listening');
   if(event.type==='input_audio_buffer.speech_started'&&!muted)setState('listening','speech');
   if(event.type==='conversation.item.input_audio_transcription.completed'&&event.transcript)emitFinal('user',event.transcript,event.item_id);
   if(event.type==='conversation.item.input_audio_transcription.delta'&&event.delta)onTranscript({role:'user',text:String(event.delta),final:false,itemId:event.item_id||null});
   if(event.type==='response.output_audio_transcript.delta'&&event.delta){assistantBuffer+=String(event.delta);onTranscript({role:'assistant',text:String(event.delta),final:false,itemId:event.item_id||null});}
   if(event.type==='response.output_audio_transcript.done'){emitFinal('assistant',event.transcript||assistantBuffer,event.item_id);assistantBuffer='';}
   if(event.type==='response.output_item.done'&&event.item?.type==='function_call')void runTool(event.item);
   if(event.type==='response.function_call_arguments.done')void runTool({call_id:event.call_id,name:event.name,arguments:event.arguments});
   if(event.type==='error')setState('error',String(event.error?.message||'Realtime voice error'));
  }
  async function start({context=null}={}){
   if(pc)return snapshot();
   if(typeof fetchImpl!=='function'||typeof PeerConnection!=='function'||!mediaDevices?.getUserMedia)throw makeError('Realtime voice is not supported on this device.','voice_unsupported');
   setState('connecting');
   let session;
   try{session=await requestSession(context);}catch(error){setState('error',error.message);throw error;}
   const secret=String(session?.clientSecret?.value||session?.value||'');if(!secret){const error=makeError('Voice session did not include a client secret.','voice_secret_missing');setState('error',error.message);throw error;}
   try{
    stream=await mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    pc=new PeerConnection();for(const track of stream.getAudioTracks())pc.addTrack(track,stream);
    remoteAudio=audioFactory();
    pc.ontrack=event=>{if(remoteAudio){const fallback=typeof MediaStream==='function'?new MediaStream([event.track]):null;remoteAudio.srcObject=event.streams?.[0]||fallback;const play=remoteAudio.play?.();if(play?.catch)play.catch(()=>{});}};
    pc.onconnectionstatechange=()=>{const value=pc?.connectionState;if(value==='failed'||value==='disconnected')setState('error','Voice connection lost.');if(value==='connected')setState(muted?'muted':'listening');};
    channel=pc.createDataChannel('oai-events');
    if(typeof channel.addEventListener==='function')channel.addEventListener('message',handleEvent);else channel.onmessage=handleEvent;
    channel.onopen=()=>setState(muted?'muted':'listening');channel.onclose=()=>{if(pc)setState('error','Voice connection closed.');};
    const offer=await pc.createOffer();await pc.setLocalDescription(offer);
    const response=await fetchImpl(CALLS_URL,{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/sdp'},body:offer.sdp});
    if(!response.ok)throw makeError('Realtime voice connection was rejected.','voice_webrtc_failed');
    const answer=await response.text();await pc.setRemoteDescription({type:'answer',sdp:answer});return snapshot();
   }catch(error){stop();setState('error',error.message);throw error;}
  }
  function setMuted(next){muted=!!next;for(const track of stream?.getAudioTracks?.()||[])track.enabled=!muted;if(pc)setState(muted?'muted':'listening');return snapshot();}
  function toggleMuted(){return setMuted(!muted);}
  function stop(){
   try{channel?.close?.();}catch{}channel=null;try{pc?.close?.();}catch{}pc=null;
   for(const track of stream?.getTracks?.()||[])try{track.stop();}catch{}stream=null;
   if(remoteAudio){try{remoteAudio.pause?.();remoteAudio.srcObject=null;}catch{}}remoteAudio=null;assistantBuffer='';handledCalls=new Set();finalTranscripts=new Set();muted=false;setState('off');return snapshot();
  }
  return {start,stop,setMuted,toggleMuted,snapshot,handleEvent,send,announce};
 }
 return {CALLS_URL,createController};
});
