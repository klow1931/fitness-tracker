const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);});
test('pound plate inventory, kg storage and public policy links',async({page})=>{
 await page.evaluate(()=>{data.unit='lb';showTab('tools');});
 await page.locator('#plate-target').fill('225');await page.locator('#plate-bar').fill('45');await page.getByRole('button',{name:'Calculate plates',exact:true}).click();
 await expect(page.locator('#plate-result')).toContainText('2 × 45 lb');await expect(page.locator('#plate-result')).not.toContainText('unmatched');
 await page.locator('#plate-target').fill('226');await page.getByRole('button',{name:'Calculate plates',exact:true}).click();await expect(page.locator('#plate-result')).toContainText('loaded total 225 lb');
 expect(await page.evaluate(()=>toStorage(225))).toBeCloseTo(102.058,2);
 await page.locator('#privacy-policy a[href="privacy.html"]').click();await expect(page).toHaveURL(/privacy\.html$/);await expect(page.locator('h1')).toHaveText('Privacy policy');await expect(page.locator('main')).toContainText('local-only');
});
test('unmapped Coach evidence opens confirmed mapping review without changing roles',async({page})=>{
 await page.evaluate(()=>{data.exerciseCatalog=[{id:'bench-test',name:'Competition Bench Press'}];data.exerciseRoles=[];showTab('coach');showSubTab('coach','co-chat');});
 await page.locator('#chat-input').fill('How is my bench progressing?');await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();
 await page.getByRole('button',{name:'Confirm lift mappings',exact:true}).click();await expect(page.locator('#save-exercise-roles')).toBeVisible();expect(await page.evaluate(()=>data.exerciseRoles)).toEqual([]);
 await page.locator('#apply-role-suggestions').click();expect(await page.evaluate(()=>data.exerciseRoles)).toEqual([]);await page.locator('#save-exercise-roles').click();await expect.poll(()=>page.evaluate(()=>LoadnoteReadiness.list(data.exerciseRoles).filter(r=>r.role==='competition').length)).toBe(1);
});
