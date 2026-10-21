const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-18T14:00:00Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-chat');},phaseFixture().state);
});
async function ask(page,text){
 await page.locator('#chat-input').fill(text);await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 return page.locator('#chat-messages .assistant').last();
}
test('v3.77 Coach shows bounded source-labeled evidence cards without changing workouts',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 const before=await page.evaluate(()=>JSON.stringify(data));
 const reply=await ask(page,'Why has my bench stalled, and explain my next workout?');
 const summary=reply.locator('.cc-evidence > summary');
 await expect(summary).toHaveText('Evidence at a glance');
 const cards=reply.locator('.cc-evidence article');
 await expect(cards).toHaveCount(2);
 await expect(reply.locator('.cc-evidence')).not.toHaveAttribute('open','');
 await summary.click();
 await expect(cards.first()).toContainText('Performance trend');
 await expect(cards.last()).toContainText('Next workout');
 await expect(cards.first()).toContainText('trend');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('v3.77 Coach compares only reviewed workflows and never writes an adjustment',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 const reply=await ask(page,'Compare my options for next week');
 await expect(reply).toContainText(/No future change is proposed|Keep saved targets/);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await expect(reply.getByRole('button',{name:/Approve|Apply target|Save change/i})).toHaveCount(0);
});
