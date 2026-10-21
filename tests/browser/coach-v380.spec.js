const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-21T15:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
async function ask(page,q){
 await page.locator('#coach-companion-launcher').isVisible()&&!await page.locator('#coach-companion-panel').isVisible()?await page.locator('#coach-companion-launcher').click():null;
 await page.locator('#cc-input').fill(q);
 await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-form button[type="submit"]')).toBeEnabled();
 return page.locator('#cc-messages .assistant').last();
}
test('v3.80 curated Coach cites the actual recent education topic on narrow screens',async({page})=>{
 await page.setViewportSize({width:390,height:780});
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}));
 const first=await ask(page,'Explain dynamic effort');
 await expect(first).toContainText('Dynamic effort');
 const reply=await ask(page,'What sources support that?');
 await expect(reply).toContainText('Sources for Dynamic effort');
 const section=reply.locator('details').filter({hasText:'Sources and coverage'});
 await expect(section).toHaveCount(1);
 await section.locator('summary').click();
 await expect(section.getByRole('link',{name:/Starting Conjugate: Dynamic Effort/})).toHaveCount(1);
 await expect(reply).toContainText('not imported chapters');
 await expect(page.locator('#chat-messages .assistant').last()).toContainText('Sources for Dynamic effort');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('v3.80 independent user question expires the earlier source context',async({page})=>{
 await ask(page,'Explain dynamic effort');
 await ask(page,'Hello');
 const reply=await ask(page,'Where did that come from?');
 await expect(reply).toContainText('Which training principle would you like sources for?');
 await expect(reply.locator('details').filter({hasText:'Sources and coverage'})).toHaveCount(0);
});
