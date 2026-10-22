const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');
test('v3.86 Coach keeps an explicitly named alternate lift in the existing evidence flow',async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T21:00:00.000Z')});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-chat');},fixture());
 await page.locator('#chat-input').fill("How's my squats doing?");
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 await expect(page.locator('#chat-messages .assistant').last()).toContainText('Competition Squat');
 await page.locator('#chat-input').fill('And my bench?');
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 const last=page.locator('#chat-messages .assistant').last();
 await expect(last).toContainText('Competition Bench');
 await expect(last).toContainText('not a tested max');
 await expect(last.getByRole('button',{name:/Approve|Apply|Save target/i})).toHaveCount(0);
});
