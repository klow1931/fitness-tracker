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
 assert.equal(typeof channelRef.messageHandler,'function');
 assert.equal(channelRef.onmessage,undefined,'data channel must have one message subscription');
 channelRef.onopen?.();
 assert.equal(controller.snapshot().active,true);

 controller.setMuted(true);assert.equal(track.enabled,false);assert.equal(controller.snapshot().muted,true);
 controller.setMuted(false);assert.equal(track.enabled,true);
 const userFinal={type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'What is next?'};
 controller.handleEvent(userFinal);controller.handleEvent(userFinal);
 controller.handleEvent({type:'response.output_audio_transcript.delta',delta:'Competition '});
 const assistantFinal={type:'response.output_audio_transcript.done',item_id:'a1',transcript:'Competition squat is next.'};
 controller.handleEvent(assistantFinal);controller.handleEvent(assistantFinal);
 assert.equal(transcripts.filter(row=>row.role==='user'&&row.final&&row.text==='What is next?').length,1,'final user transcript must not duplicate');
 assert.equal(transcripts.filter(row=>row.role==='assistant'&&row.final&&row.text==='Competition squat is next.').length,1,'final assistant transcript must not duplicate');

 controller.handleEvent({type:'response.output_item.done',item:{type:'function_call',call_id:'call_1',name:'get_live_workout_context',arguments:'{}'}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(tools,[{name:'get_live_workout_context',args:{}}]);
 const output=sent.find(row=>row.type==='conversation.item.create'&&row.item?.type==='function_call_output');
 assert(output);assert.equal(output.item.call_id,'call_1');assert.equal(JSON.parse(output.item.output).ok,true);
 assert.equal(sent.some(row=>row.type==='response.create'),true);
 controller.handleEvent({type:'response.output_item.done',item:{type:'function_call',call_id:'call_1',name:'get_live_workout_context',arguments:'{}'}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(tools.length,1,'duplicate realtime tool completion must not execute twice');

 const before=sent.length;assert.equal(controller.announce('Rest complete. Next: Competition Bench set 3.'),true);
 const proactive=sent.slice(before).find(row=>row.type==='response.create');assert(proactive);assert.match(proactive.response.instructions,/Preserve every number and training fact exactly/);assert.match(proactive.response.instructions,/Rest complete\. Next: Competition Bench set 3\./);assert.doesNotMatch(proactive.response.instructions,/change the program/i);
 assert.throws(()=>controller.announce(''),/cue is required/i);

 controller.stop();assert.equal(track.stopped,true);assert.equal(pcRef.closed,true);assert.equal(controller.snapshot().state,'off');
 assert.equal(states.some(row=>row.state==='connecting'),true);
 console.log('v2.82 realtime voice explicit start, de-duplication, tools and bounded proactive announcement transport passed');
})().catch(error=>{console.error(error);process.exit(1);});
