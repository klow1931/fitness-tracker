const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{
  window.Chart=class{destroy(){}update(){}};
  window.__voiceEvents=[];window.__micRequests=0;window.__voiceTrack={enabled:true,stopped:false,stop(){this.stopped=true;}};
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{window.__micRequests++;const track=window.__voiceTrack;return {getAudioTracks:()=>[track],getTracks:()=>[track]};}}});
  window.RTCPeerConnection=class{
   constructor(){this.connectionState='new';}
   addTrack(){}
   createDataChannel(){const channel={readyState:'open',send:value=>window.__voiceEvents.push(JSON.parse(value)),close(){this.readyState='closed';},addEventListener(type,fn){if(type==='message')this._message=fn;}};this.channel=channel;return channel;}
   async createOffer(){return {type:'offer',sdp:'test-offer'};}
   async setLocalDescription(value){this.localDescription=value;}
   async setRemoteDescription(value){this.remoteDescription=value;setTimeout(()=>this.channel?.onopen?.(),0);}
   close(){this.closed=true;}
  };
 });
});

test('v2.80 voice is explicit, shows mic controls, and releases the microphone',async({page})=>{
 let sessionCalls=0,realtimeCalls=0;
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:true,account:{id:'acct_voice_test',displayName:'Athlete',providers:['test']},expiresAt:'2030-01-01T00:00:00.000Z',csrf:'voice-csrf',transport:'cookie',authConfigured:true,authRequired:true,loginAvailable:true})}));
 await page.route('**/api/voice/session',route=>{sessionCalls++;expect(route.request().headers()['x-loadnote-csrf']).toBe('voice-csrf');return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({clientSecret:{value:'TEST_EPHEMERAL_VALUE'},model:'gpt-realtime-2.1',voice:'marin'})});});
 await page.route('https://api.openai.com/v1/realtime/calls',route=>{realtimeCalls++;expect(route.request().headers().authorization).toBe('Bearer TEST_EPHEMERAL_VALUE');return route.fulfill({status:200,contentType:'application/sdp',body:'test-answer'});});
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.locator('#coach-companion-launcher').click();
 await expect(page.locator('#cc-voice .cc-voice-start')).toBeVisible();
 expect(await page.evaluate(()=>window.__micRequests)).toBe(0,'opening Coach must not request the microphone');
 await page.locator('#cc-voice .cc-voice-start').click();
 await expect(page.locator('#cc-voice .cc-voice-state')).toContainText('Listening');
 expect(sessionCalls).toBe(1);expect(realtimeCalls).toBe(1);expect(await page.evaluate(()=>window.__micRequests)).toBe(1);
 await page.locator('#cc-voice .cc-voice-mute').click();
 await expect(page.locator('#cc-voice .cc-voice-state')).toContainText('Muted');
 expect(await page.evaluate(()=>window.__voiceTrack.enabled)).toBe(false);
 await page.locator('#cc-voice .cc-voice-mute').click();
 expect(await page.evaluate(()=>window.__voiceTrack.enabled)).toBe(true);
 await page.locator('#cc-voice .cc-voice-end').click();
 await expect(page.locator('#cc-voice .cc-voice-state')).toContainText('Voice off');
 expect(await page.evaluate(()=>window.__voiceTrack.stopped)).toBe(true);
});

test('v2.80 voice tool surface is read-only for training data',async({page})=>{
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:true,authRequired:true,loginAvailable:true})}));
 await page.goto('/');
 await page.locator('#coach-companion-launcher').click();
 await expect(page.locator('#cc-voice')).toBeVisible();
 const unsupported=await page.evaluate(()=>window.LoadnoteCoachVoiceUI.tool('log_set',{weight:405,reps:4,rpe:8}));
 expect(unsupported.ok).toBe(false);expect(unsupported.error).toContain('Unsupported');
 const live=await page.evaluate(()=>window.LoadnoteCoachVoiceUI.tool('get_live_workout_context',{}));
 expect(live.ok).toBe(true);
});
