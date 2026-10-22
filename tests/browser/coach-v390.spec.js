const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');
test('v3.90 offline Coach explains evidence sources and gaps in a continuing conversation',async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T21:00:00.000Z')});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-chat');},fixture());
 for(const [ask,want] of [
  ['Why has my bench stalled, and explain my next workout?','Next scheduled workout:'],
  ['Where did that come from?','Evidence sources from saved records:'],
  ['Just the performance part','Performance: Competition Bench'],
  ["What's missing?",'Evidence coverage from saved records:']
 ]){
  await page.locator('#chat-input').fill(ask);
  await page.locator('#chat-send-btn').click();
  await expect(page.locator('#chat-send-btn')).toBeEnabled();
  const msg=page.locator('#chat-messages .assistant').last();
  await expect(msg).toContainText(want);
  await expect(msg.getByRole('button',{name:/Approve|Apply|Save target/i})).toHaveCount(0);
 }
 const msg=page.locator('#chat-messages .assistant').last();
 await expect(msg).toContainText('Remaining limitation:');
 await expect(msg).not.toContainText('Next scheduled workout:');
});
