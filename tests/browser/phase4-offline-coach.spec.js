const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed});
  window.phase4OnlineCalls=0;
  LoadnoteCoachClient.ensureSignedIn=async()=>{window.phase4OnlineCalls++;return true;};
  LoadnoteCoachClient.ask=async()=>{window.phase4OnlineCalls++;throw Error('Deterministic offline question must not reach online Coach');};
 },fixture());
});
async function ask(page,q){
 await page.locator('#cc-input').fill(q);
 await page.locator('#cc-form button').click();
 await expect(page.locator('#cc-form button')).toBeEnabled();
 return page.locator('#cc-messages .assistant').last();
}
test('offline Coach uses updated capability, recap and source-guided explanations without network or history writes',async({page,context})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-companion-launcher').click();
 await context.setOffline(true);
 await ask(page,'How can the offline coach help?');
 await expect(page.locator('#cc-messages .assistant').last()).toContainText('explain your saved training');
 await ask(page,'Summarize my training');
 await expect(page.locator('#cc-messages .assistant').last()).toContainText('most recent 28 days');
 await ask(page,'Why deload?');
 await expect(page.locator('#cc-messages .assistant').last()).toContainText('reduced work');
 expect(await page.evaluate(()=>window.phase4OnlineCalls)).toBe(0);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('conversational plan request remains a reviewed draft without inventing training maxes',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-companion-launcher').click();
 await ask(page,'Could you help me build a 12-week strength program with 3 days, 60 minutes and full gym?');
 const reply=page.locator('#cc-messages .assistant').last();
 await expect(reply).toContainText('12 weeks');
 await expect(reply).toContainText('3 days/week');
 await expect(reply.getByRole('button',{name:'Review program request',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 const selected=await page.evaluate(()=>LoadnoteCoachIntentRouter.classify('Why?',[
  {role:'user',content:'How is my squat progress?'},
  {role:'user',content:'Hello'}
 ]));
 expect(selected.kind).toBe('clarify');
});
