const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');

test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00.000Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({authenticated:false,authConfigured:false})
 }));
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});},fixture());
});
async function ask(page,question){
 await page.locator('#cc-input').fill(question);
 await page.locator('#cc-form button').click();
 await expect(page.locator('#cc-form button')).toBeEnabled();
 return page.locator('#cc-messages .assistant').last();
}

test('v4.4 offline Coach explains a logged recap briefly, then in detail, using fresh evidence not assistant text',async({page,context})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-companion-launcher').click();
 await context.setOffline(true);
 const first=await ask(page,'Summarize my training');
 await expect(first).toContainText('What happened');
 const brief=await ask(page,'Can you say that in plain English?');
 await expect(brief).toContainText('Here is the short version from your saved training');
 await expect(brief).toContainText('Next:');
 await expect(brief).not.toContainText('What happened');
 const detail=await ask(page,'Can you expand on that?');
 await expect(detail).toContainText('full explanation from your current training records');
 await expect(detail).toContainText('28 days');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('v4.4 uses safety and session reset instead of borrowing a previous conversation',async({page,context})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-companion-launcher').click();
 await context.setOffline(true);
 await ask(page,'Summarize my training');
 const health=await ask(page,'My knee hurts, can you simplify that?');
 await expect(health).toContainText('cannot diagnose');
 const unrelated=await ask(page,'Hello');
 await expect(unrelated).toContainText('Hi');
 const lost=await ask(page,'Can you say that in plain English?');
 await expect(lost).not.toContainText('Here is the short version from your saved training');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
