const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
});

test('v2.63 anonymous athletes keep offline Coach and never send provider-style requests',async({page})=>{
 let coachCalls=0;
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:true,authRequired:true,loginAvailable:true,provider:{id:'test',name:'Sign in'}})}));
 await page.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,coach:{configured:true,authRequired:true}})}));
 await page.route('**/api/coach',route=>{coachCalls++;return route.fulfill({status:500,contentType:'application/json',body:'{}'});});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 await expect(page.locator('#coach-online-status')).toContainText('Offline coaching');
 await expect(page.locator('#coach-account-link')).toBeVisible();
 await page.locator('#chat-input').fill('How should I progress my lifts?');
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-messages')).toContainText('progress');
 expect(coachCalls).toBe(0);
 expect(await page.locator('#api-key').count()).toBe(0);
 expect(await page.locator('#api-provider').count()).toBe(0);
});

test('v2.63 signed-in Coach sends only question, bounded context and history through the authenticated server',async({page})=>{
 let requestBody=null,requestHeaders=null;
 await page.addInitScript(()=>localStorage.setItem('fitness-tracker-api-key','legacy-browser-secret-that-must-not-be-used'));
 await page.route('**/api/auth/session',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({authenticated:true,account:{id:'acct_secure_coach_browser_123456789',displayName:'Athlete',email:'athlete@example.com',emailVerified:true,providers:['test']},expiresAt:'2030-01-01T00:00:00.000Z',csrf:'coach-csrf',transport:'cookie',authConfigured:true,authRequired:true,loginAvailable:true,provider:{id:'test',name:'Sign in'}})
 }));
 await page.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,coach:{configured:true,authRequired:true}})}));
 await page.route('**/api/coach',async route=>{
  requestBody=route.request().postDataJSON();
  requestHeaders=await route.request().allHeaders();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({coach:{
   summary:'Keep the reviewed plan.',
   insights:[{type:'info',title:'Current evidence',body:'Your logged work supports staying with the reviewed session.'}],
   recommendation:{action:'hold',exercise:'Competition Squat',weightKg:100,sets:3,reps:5,targetRPE:8,reason:'The current plan is already reviewed.'},
   confidence:'high'
  }})});
 });
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 expect(await page.evaluate(()=>localStorage.getItem('fitness-tracker-api-key'))).toBeNull();
 await page.evaluate(()=>{data.unit='lb';showTab('coach');showSubTab('coach','co-chat');renderCoach();});
 await expect(page.locator('#coach-online-status')).toContainText('Secure online Coach available');
 await expect(page.locator('#coach-account-link')).toBeHidden();

 await page.locator('#chat-input').fill('What should I focus on today?');
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-messages')).toContainText('Keep the reviewed plan.');
 await expect(page.locator('#coach-proactive')).toContainText('220.5 lb');
 await expect.poll(()=>requestBody!==null).toBe(true);

 expect(Object.keys(requestBody).sort()).toEqual(['context','history','question']);
 expect(requestBody.question).toBe('What should I focus on today?');
 expect(requestBody.messages).toBeUndefined();
 expect(requestBody.apiKey).toBeUndefined();
 expect(requestBody.provider).toBeUndefined();
 expect(requestBody.model).toBeUndefined();
 expect(requestBody.context.unit).toBe('lb');
 expect(requestHeaders['x-loadnote-csrf']).toBe('coach-csrf');
 expect(JSON.stringify(requestBody)).not.toContain('legacy-browser-secret-that-must-not-be-used');
});

test('v2.63 online Coach failure falls back to built-in coaching without losing the question',async({page})=>{
 await page.route('**/api/auth/session',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({authenticated:true,account:{id:'acct_secure_coach_fallback_123456789',displayName:'Athlete',providers:['test']},expiresAt:'2030-01-01T00:00:00.000Z',csrf:'coach-csrf',transport:'cookie',authConfigured:true,authRequired:true,loginAvailable:true})
 }));
 await page.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,coach:{configured:true,authRequired:true}})}));
 await page.route('**/api/coach',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Online Coach is not configured.',code:'coach_unavailable'})}));
 await page.goto('/');
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 await page.locator('#chat-input').fill('How do I know when to deload?');
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-messages')).toContainText('Online Coach unavailable');
 await expect(page.locator('#chat-messages')).toContainText('deload');
});
