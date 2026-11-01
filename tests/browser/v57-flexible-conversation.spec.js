const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00.000Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(state=>{data=normalizeDataShape({...data,...state});showTab('coach');showSubTab('coach','co-chat');},fixture());
});
async function ask(page,q){
 await page.locator('#chat-input').fill(q);
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 return page.locator('#chat-messages .assistant').last();
}
test('v5.7 full offline Coach can listen, recover after RPE, and end naturally',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 let r=await ask(page,'Can we talk about work?');await expect(r).toContainText('What would you like to talk about?');
 r=await ask(page,'Everything was rushed today');await expect(r).toContainText('Everything was rushed');
 r=await ask(page,'Just listen');await expect(r).toContainText('Go ahead at your pace');
 r=await ask(page,'My shift was exhausting');await expect(r).toContainText('My shift was exhausting');
 r=await ask(page,'What does RPE mean?');await expect(r).toContainText('Missing RPE is unknown');
 r=await ask(page,'Back to what we were talking about');await expect(r).toContainText('My shift was exhausting');
 r=await ask(page,'Can you give me some ideas?');await expect(r).toContainText('work through options');
 r=await ask(page,"That's all for now");await expect(r).toContainText('leave it here');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('v5.7 mixed vent stays separate from training and safety always wins',async({page})=>{
 let r=await ask(page,'The bench work was fine; work was stressful and I just want to vent');
 await expect(r).toContainText('work was stressful');
 await expect(r).not.toContainText('bench work was fine');
 r=await ask(page,'Actually, it was my confidence, not my energy');
 await expect(r).toContainText('confidence');
 r=await ask(page,'My knee hurts; just listen');
 await expect(r).toContainText('cannot diagnose');
 r=await ask(page,'Back to what we were talking about');
 await expect(r).toContainText('No earlier user topic');
});
test('v5.7 quick Companion shares the session and Clear really resets',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await ask(page,'Can we talk about my routine?');
 await ask(page,'I wanted less rushed evenings');
 await page.evaluate(()=>showTab('dashboard'));
 await page.locator('#coach-companion-launcher').click();
 const input=page.locator('#cc-input');
 await input.fill('Back to what we were talking about');
 await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();
 await expect(page.locator('#cc-messages .assistant').last()).toContainText('less rushed evenings');
 await page.evaluate(()=>clearCoachConversation());
 await input.fill('Back to what we were talking about');await page.locator('#cc-form button').click();
 await expect(page.locator('#cc-messages .assistant').last()).toContainText('No earlier user topic');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});