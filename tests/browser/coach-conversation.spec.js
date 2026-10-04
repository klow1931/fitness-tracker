const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});},fixture());
});
async function ask(page,text){await page.locator('#cc-input').fill(text);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();}
test('offline Companion follows lift questions, changes topic, and clears session context',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-companion-launcher').click();
 await ask(page,'How is my squat progress?');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Competition Squat');
 await ask(page,'What about bench?');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Competition Bench');
 await ask(page,'What accessories should I use?');await expect(page.locator('#cc-messages .assistant').last()).toContainText('not diagnosed weaknesses');
 await page.evaluate(()=>clearCoachConversation());await ask(page,'Why?');await expect(page.locator('#cc-messages .assistant').last()).toContainText('clear prior topic');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('full offline Coach remembers follow-ups and escapes hostile exercise labels',async({page})=>{
 await page.evaluate(()=>{data.exerciseCatalog.find(e=>e.id==='s').name='<img src=x onerror=alert(1)> Squat';showTab('coach');showSubTab('coach','co-chat');});
 async function full(q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();}
 await full('How is my squat progress?');await expect(page.locator('#chat-messages')).toContainText('<img src=x onerror=alert(1)> Squat');await expect(page.locator('#chat-messages img')).toHaveCount(0);
 await full('What about bench?');await expect(page.locator('#chat-messages')).toContainText('Competition Bench');
 await page.getByRole('button',{name:'Clear conversation',exact:true}).click();await full('Why?');await expect(page.locator('#chat-messages')).toContainText('clear prior topic');
});
