const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');
test('v3.89 offline Coach provides a source-attributed short version of a compound answer',async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T21:00:00.000Z')});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-chat');},fixture());
 for(const [question,expected] of [
  ['Why has my bench stalled, and explain my next workout?','Next scheduled workout:'],
  ['Give me the short version','Short version from saved records:'],
  ['Just the performance part','Performance: Competition Bench'],
  ["What's the takeaway?",'Short version from saved records:']
 ]){
  await page.locator('#chat-input').fill(question);
  await page.locator('#chat-send-btn').click();
  await expect(page.locator('#chat-send-btn')).toBeEnabled();
  const last=page.locator('#chat-messages .assistant').last();
  await expect(last).toContainText(expected);
  await expect(last.getByRole('button',{name:/Approve|Apply|Save target/i})).toHaveCount(0);
 }
});
