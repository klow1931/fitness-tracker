const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');
test('v3.91 two-lift comparison and follow-ups in offline Coach chat',async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T21:00:00.000Z')});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-chat');},fixture());
 for(const [question,expected] of [
  ['Compare my squat and bench progress','Two-lift training trend review:'],
  ["What's missing for those two lifts?",'Available data for the two lifts:'],
  ['What about bench and deadlift?','Competition Sumo Deadlift:']
 ]){
  await page.locator('#chat-input').fill(question);
  await page.locator('#chat-send-btn').click();
  await expect(page.locator('#chat-send-btn')).toBeEnabled();
  const last=page.locator('#chat-messages .assistant').last();
  await expect(last).toContainText(expected);
  await expect(last.getByRole('button',{name:/Approve|Apply|Save target/i})).toHaveCount(0);
 }
});
