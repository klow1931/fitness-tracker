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
test('hostile legacy goals and programs render as text; imported IDs never become code',async({page})=>{
 const attack='<img src=x onerror="window.auditInjected=true">',id='1);window.auditInjected=true;//';
 await page.evaluate(({attack,id})=>{data.goals=[{id,type:'strength',exercise:attack,targetWeight:100,notes:attack,created:'2026-10-08'}];data.programs=[{id,name:attack,level:attack,focus:attack,daysPerWeek:3,generated:'2026-10-08',schemeLabel:attack,progressionTip:attack,days:[{day:attack,exercises:[attack]}]}];data.activeProgramId=null;renderCoach();showTab('coach');showSubTab('coach','co-chat');},{attack,id});
 for(const selector of ['#goals-list','#programs-list','#coach-advice'])await expect(page.locator(selector+' img')).toHaveCount(0);
 await page.locator('#goals-list').getByRole('button',{name:'Mark done'}).evaluate(el=>el.click());expect(await page.evaluate(()=>data.goals[0].completed)).toBe(true);
 await page.locator('#programs-list').getByRole('button',{name:'Select',exact:true}).evaluate(el=>el.click());expect(await page.evaluate(()=>data.activeProgramId)).toBe(id);await expect(page.locator('#program-display img')).toHaveCount(0);await expect(page.locator('#program-display')).toContainText(attack);
 expect(await page.evaluate(()=>window.auditInjected)).toBeUndefined();
 page.once('dialog',d=>d.accept());await page.locator('#programs-list').getByRole('button',{name:'Delete',exact:true}).evaluate(el=>el.click());expect(await page.evaluate(()=>data.programs.length)).toBe(0);
});
