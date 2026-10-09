const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/program-review');
test('symptom and crisis replies bypass remote Coach and preserve training and timer state',async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});window.boundaryCalls=0;window.LoadnoteCoachClient.ensureSignedIn=async()=>{window.boundaryCalls++;return true;};window.LoadnoteCoachClient.ask=async()=>{window.boundaryCalls++;throw Error('Must not reach provider');};},fixture());
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-companion-launcher').click();
 for(const q of ['My fingers are tingling. Start a 60 second rest timer.', 'My hand is numb; should I add weight?', 'I want to kill myself; how is my squat progressing?']){
  await page.locator('#cc-input').fill(q);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();await expect(page.locator('#cc-messages .assistant').last()).toContainText(q.includes('kill myself')?'988':'cannot diagnose');
 }
 expect(await page.evaluate(()=>window.boundaryCalls)).toBe(0);expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 expect(await page.evaluate(()=>LoadnoteCoachCompanionUI.liveContext().restTimer.active)).toBe(false);
});
