const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});},fixture());
});
async function ask(page,q){await page.locator('#cc-input').fill(q);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();}
test('Companion shares referenced Westside knowledge with full Coach without altering training',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-companion-launcher').click();await ask(page,'Explain Louie Simmons book of methods');const message=page.locator('#cc-messages .assistant').last();await expect(message).toContainText('Westside');await message.getByText('Sources and coverage',{exact:true}).click();await expect(message.getByRole('link',{name:'Westside Barbell Book of Methods',exact:true})).toBeVisible();
 await ask(page,'Tell me more');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Westside');await page.evaluate(()=>{LoadnoteCoachCompanionUI.close();showTab('coach');showSubTab('coach','co-chat');});await expect(page.locator('#chat-messages')).toContainText('Book of Methods');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('Reference explorer searches, explains source coverage, and makes download opt-in',async({page})=>{
 let downloads=0;await page.route('**/esm.run/**',r=>{downloads++;return r.abort();});await page.evaluate(()=>LoadnoteCoachingLibraryUI.open());const dialog=page.locator('#coaching-library-dialog');await expect(dialog).toBeVisible();await dialog.locator('#knowledge-search').fill('dynamic effort');await expect(dialog.locator('#knowledge-results')).toContainText('speed intent');await dialog.getByText('Books and source coverage',{exact:true}).click();await expect(dialog).toContainText('fifth edition');await expect(dialog).toContainText('full textbook not imported');await dialog.getByText('Optional local AI · experimental',{exact:true}).click();await dialog.locator('#local-ai-enable').click();await expect(dialog.locator('#local-ai-status')).toContainText('Confirm the optional model download');expect(downloads).toBe(0);
 await dialog.locator('[data-review-close]').click();await expect(dialog).toHaveCount(0);
});
