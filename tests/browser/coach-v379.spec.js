const {test,expect}=require('playwright/test');

async function submit(page,question){
 await page.locator('#cc-input').fill(question);
 await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-form button[type="submit"]')).toBeEnabled();
 return page.locator('#cc-messages .assistant').last();
}
const authenticated={authenticated:true,account:{id:'coach_379_test',displayName:'Athlete',providers:['test']},expiresAt:'2030-01-01T00:00:00.000Z',csrf:'coach-test-csrf',transport:'cookie',authConfigured:true,authRequired:true,loginAvailable:true};

test('v3.79 online failure retains local evidence, source links and read-only context on both Coach surfaces',async({page})=>{
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(authenticated)}));
 let attempted=0;
 await page.route('**/api/coach',route=>{attempted++;return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Temporarily unavailable"}'});});
 await page.setViewportSize({width:390,height:780});
 await page.goto('/');await expect.poll(()=>page.evaluate(()=>LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 await page.evaluate(()=>{
  const original=LoadnoteCoachConversation.answer;
  LoadnoteCoachConversation.answer=(state,q,options)=>q==='Explain my previous training evidence'?
   {text:'Recorded workout history is available from the local Coach.',
    source:'Descriptive training evidence',readOnly:true,
    evidenceCards:[{title:'Recorded sessions',status:'observed',observed:'Two saved workouts with actual reps and RPE.',limitation:'Not an approved progression.',source:'Recorded workout history'}],
    citations:[{id:'nsca',title:'NSCA public training reference',url:'https://www.nsca.com/education/articles/kinetic-select/preparatory-period/',kind:'Public excerpt',coverage:'General guidance only; not personal training evidence.'}],
    actions:[]}:original(state,q,options);
 });
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}));
 await page.locator('#coach-companion-launcher').click();
 const reply=await submit(page,'Explain my previous training evidence');
 await expect(reply).toContainText('Online Coach unavailable.');
 await expect(reply).toContainText('Recorded workout history is available');
 await expect(reply.locator('.cc-evidence article')).toHaveCount(1);
 const sources=reply.locator('details').filter({hasText:'Sources and coverage'});
 await expect(sources).toHaveCount(1);
 await sources.locator('summary').click();
 await expect(reply.getByRole('link',{name:'NSCA public training reference'})).toHaveAttribute('href',/^https:\/\/www\.nsca\.com\//);
 await expect(page.locator('#chat-messages .assistant').last().locator('.cc-evidence article')).toHaveCount(1);
 await expect(reply).toContainText('Online request failed · showing available local guidance');
 expect(attempted).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('v3.79 rejected on-device conversation keeps the deterministic Coach answer and stays private',async({page})=>{
 let onlineCalls=0;
 await page.route('**/api/coach',route=>{onlineCalls++;return route.fulfill({status:500,body:'{}'});});
 await page.goto('/');
 await page.evaluate(()=>{
  window.LoadnoteLocalCoachAI={snapshot:()=>({status:'ready',conversationConsent:true}),respond:async()=>{throw Error('GPU lost');},explain:async()=>{throw Error('GPU lost');}};
 });
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,reviewedPrograms:data.reviewedPrograms}));
 await page.locator('#coach-companion-launcher').click();
 const reply=await submit(page,'Explain dynamic effort');
 await expect(reply).toContainText('Dynamic effort');
 await expect(reply).toContainText('Westside');
 await expect(reply).toContainText('local AI unavailable');
 await expect(reply).not.toContainText('Local AI conversation (experimental):');
 await expect(reply.getByText('Sources and coverage')).toBeVisible();
 expect(onlineCalls).toBe(0,'Local consent must not silently fall back to the online server');
 await submit(page,'Explain max effort');
 await expect(page.locator('#cc-messages .user')).toHaveCount(2);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,reviewedPrograms:data.reviewedPrograms}))).toBe(before);
});

test('v3.79 rejected reference-only explanation keeps source citations and conversational input usable',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>{
  window.LoadnoteLocalCoachAI={snapshot:()=>({status:'ready',conversationConsent:false}),explain:async()=>{throw Error('inference unavailable');}};
 });
 await page.locator('#coach-companion-launcher').click();
 const reply=await submit(page,'Explain dynamic effort');
 await expect(reply).toContainText('Dynamic effort');
 await expect(reply).toContainText('local AI unavailable');
 await expect(reply.locator('details').filter({hasText:'Sources and coverage'})).toHaveCount(1);
 await expect(page.locator('#cc-input')).toBeEnabled();
});


test('v3.79 authenticated Coach keeps exact history and corrected lift evidence local',async({page})=>{
 let remoteCalls=0;
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(authenticated)}));
 await page.route('**/api/coach',route=>{remoteCalls++;return route.fulfill({status:200,contentType:'application/json',body:'{"coach":{"summary":"Remote reply should not replace logged evidence."}}'});});
 const {fixture}=require('../fixtures/program-review');
 await page.goto('/');
 await expect.poll(()=>page.evaluate(()=>LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});},fixture());
 await page.locator('#coach-companion-launcher').click();
 const history=await submit(page,'How did my bench training change across my last three workouts?');
 await expect(history).toContainText('Last 3 recorded workouts');
 await expect(history).not.toContainText('Remote reply should not replace');
 const evidence=await submit(page,'How is my squat progress?');
 await expect(evidence).toContainText('Current corrected evidence');
 expect(remoteCalls).toBe(0,'Verified logged and corrected lift evidence must not be routed to generative online Coach');
});
