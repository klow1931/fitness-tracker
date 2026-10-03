const assert=require('node:assert/strict');
const Voice=require('../src/product/coach-voice');

(async()=>{
 const sent=[],transcripts=[],states=[],tools=[];
 const track={enabled:true,stopped:false,stop(){this.stopped=true;}};
 const media={getAudioTracks:()=>[track],getTracks:()=>[track]};
 let channelRef,pcRef,fetchCall;
 class FakeChannel{
  constructor(){this.readyState='open';this.sent=sent;}
  send(value){this.sent.push(JSON.parse(value));}
  addEventListener(type,fn){if(type==='message')this.messageHandler=fn;}
  close(){this.readyState='closed';}
 }
 class FakePC{
  constructor(){pcRef=this;this.connectionState='new';}
  addTrack(t,s){this.track=t;this.stream=s;}
  createDataChannel(){channelRef=new FakeChannel();return channelRef;}
  async createOffer(){return {type:'offer',sdp:'offer-sdp'};}
  async setLocalDescription(value){this.localDescription=value;}
  async setRemoteDescription(value){this.remoteDescription=value;}
  close(){this.closed=true;}
 }
 const controller=Voice.createController({
  PeerConnection:FakePC,
  mediaDevices:{getUserMedia:async constraints=>{assert.equal(constraints.video,false);return media;}},
  requestSession:async context=>{assert.equal(context.surface,'train');return {clientSecret:{value:'ek_short_lived'}};},
  fetchImpl:async(url,options)=>{fetchCall={url,options};return new Response('answer-sdp',{status:200,headers:{'Content-Type':'application/sdp'}});},
  audioFactory:()=>({play:()=>Promise.resolve(),pause(){},srcObject:null}),
  toolHandler:async(name,args)=>{tools.push({name,args});return {ok:true,name};},
  onState:value=>states.push(value),onTranscript:value=>transcripts.push(value)
 });
 await controller.start({context:{surface:'train'}});
 assert.equal(fetchCall.url,Voice.CALLS_URL);
 assert.equal(fetchCall.options.headers.Authorization,'Bearer ek_short_lived');
 assert.equal(fetchCall.options.headers['Content-Type'],'application/sdp');
 assert.equal(fetchCall.options.body,'offer-sdp');
 assert.equal(pcRef.remoteDescription.sdp,'answer-sdp');
 assert.equal(fetchCall.options.Authorization,undefined);
 channelRef.onopen?.();
 assert.equal(controller.snapshot().active,true);

 controller.setMuted(true);assert.equal(track.enabled,false);assert.equal(controller.snapshot().muted,true);
 controller.setMuted(false);assert.equal(track.enabled,true);
 controller.handleEvent({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'What is next?'});
 controller.handleEvent({type:'response.output_audio_transcript.delta',delta:'Competition '});
 controller.handleEvent({type:'response.output_audio_transcript.done',item_id:'a1',transcript:'Competition squat is next.'});
 assert.equal(transcripts.some(row=>row.role==='user'&&row.final&&row.text==='What is next?'),true);
 assert.equal(transcripts.some(row=>row.role==='assistant'&&row.final&&row.text==='Competition squat is next.'),true);

 controller.handleEvent({type:'response.output_item.done',item:{type:'function_call',call_id:'call_1',name:'get_live_workout_context',arguments:'{}'}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(tools,[{name:'get_live_workout_context',args:{}}]);
 const output=sent.find(row=>row.type==='conversation.item.create'&&row.item?.type==='function_call_output');
 assert(output);assert.equal(output.item.call_id,'call_1');assert.equal(JSON.parse(output.item.output).ok,true);
 assert.equal(sent.some(row=>row.type==='response.create'),true);
 controller.handleEvent({type:'response.output_item.done',item:{type:'function_call',call_id:'call_1',name:'get_live_workout_context',arguments:'{}'}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(tools.length,1,'duplicate realtime tool completion must not execute twice');

 controller.stop();assert.equal(track.stopped,true);assert.equal(pcRef.closed,true);assert.equal(controller.snapshot().state,'off');
 assert.equal(states.some(row=>row.state==='connecting'),true);
 console.log('v2.80 realtime voice explicit start, ephemeral WebRTC, transcripts, mute, stop and tool roundtrip passed');
})().catch(error=>{console.error(error);process.exit(1);});
