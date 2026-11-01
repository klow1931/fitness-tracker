const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{
  setUnit('lb');
  showTab('workouts');showSubTab('workouts','wo-log');
  document.getElementById('wo-date').value=today();
  fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:225,reps:5,rpe:''},{weight:225,reps:5,rpe:''}]}],'',false);
 });
});
async function ask(page,question){
 await page.evaluate(()=>{LoadnoteCoachCompanionUI.close();showTab('coach');showSubTab('coach','co-chat');});
 await page.locator('#chat-input').fill(question);await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 return page.locator('#chat-messages .assistant').last();
}
test('v6.0 checked-set review uses entered lb and missing RPE without saving the draft',async({page})=>{
 await page.locator('#exercise-rows .set-done-check').first().check();
 const before=await page.evaluate(()=>JSON.stringify(data));
 let reply=await ask(page,'Review my last checked set');
 await expect(reply).toContainText('Competition Bench, set 1 of 2');
 await expect(reply).toContainText('225 lb');
 await expect(reply).toContainText('5 reps');
 await expect(reply).toContainText('RPE not entered');
 await expect(reply).toContainText('not saved history');
 reply=await ask(page,'Any RPE missing?');
 await expect(reply).toContainText('1 of 1 checked strength set is missing an entered RPE');
 await reply.getByRole('button',{name:'Return to workout'}).click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 await page.locator('#exercise-rows .set-rpe').first().fill('8.5');
 reply=await ask(page,'What did I log for my last set?');
 await expect(reply).toContainText('RPE 8.5');
 reply=await ask(page,'Did I log my RPE?');
 await expect(reply).toContainText('All 1 checked strength set has an entered RPE');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 expect(await page.locator('#exercise-rows .set-done-check:checked').count()).toBe(1);
});
test('v6.0 live Coach review follows newly checked sets and remains read-only',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 let reply=await ask(page,'Review my last checked set');
 await expect(reply).toContainText('No strength set is checked');
 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('#exercise-rows .set-done-check').nth(1).check();
 await page.locator('#exercise-rows .set-rpe').nth(1).fill('9');
 reply=await ask(page,'Review my last checked set');
 await expect(reply).toContainText('Competition Bench, set 2 of 2');
 await expect(reply).toContainText('225 lb');
 await expect(reply).toContainText('RPE 9');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
