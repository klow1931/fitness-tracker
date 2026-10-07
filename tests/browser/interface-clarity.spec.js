const {test,expect}=require('playwright/test');
const F=require('../fixtures/coaching');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-12T20:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(state=>{data=normalizeDataShape({...data,...state});showTab('coach');showSubTab('coach','co-decisions');renderCoachingReview();},F.hypertrophy());
});
test('weekly review keeps actions and restrictions visible with full evidence keyboard-accessible',async({page},info)=>{
 await page.setViewportSize({width:320,height:844});
 const before=await page.evaluate(()=>JSON.stringify(data));
 const parent=page.locator('#shared-coaching-panel');
 const entry=parent.locator(':scope > summary');await entry.focus();await page.keyboard.press('Enter');
 await expect(parent).toHaveJSProperty('open',true);
 await expect(page.getByRole('region',{name:'Week at a glance'})).toBeVisible();
 await expect(page.locator('.review-facts')).toBeVisible();
 await expect(page.locator('#coaching-sleep')).toBeVisible();
 await expect(page.getByLabel('Sleep',{exact:true})).toHaveAttribute('aria-describedby','coaching-check-in-help');
 await expect(page.getByLabel('Sleep',{exact:true})).toHaveValue('unknown');
 await expect(page.getByLabel('Sleep',{exact:true}).locator('option:checked')).toHaveText('Not reported');
 const evidence=page.locator('#coaching-review-evidence');
 await expect(evidence).toHaveJSProperty('open',false);
 await evidence.locator('summary').focus();await page.keyboard.press('Space');
 await expect(evidence).toHaveJSProperty('open',true);await expect(evidence).toContainText('No causal learning');
 await page.keyboard.press('Enter');await expect(evidence).toHaveJSProperty('open',false);
 await page.screenshot({path:info.outputPath('weekly-review-compact.png')});
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 // All active restrictions remain outside collapsed evidence, not just a generic gap count.
 await page.evaluate(()=>{const build=LoadnoteCoachingReview.proposals;LoadnoteCoachingReview.proposals=(...args)=>{const p=build(...args);p.context.priorities=[{kind:'review',text:'Current intake symptoms hold generated programming and increases; review an individual plan.'}];return p;};renderCoachingReview();});
 await expect(page.locator('.review-priority')).toBeVisible();await expect(page.locator('.review-priority')).toContainText('hold generated programming');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
});
test('workload empty state avoids an empty table; mapped table remains named and scrollable',async({page},info)=>{
 await page.setViewportSize({width:320,height:844});
 await page.evaluate(()=>{data.exerciseCatalog=data.exerciseCatalog.map(e=>{const copy={...e};delete copy.muscles;return copy;});LoadnoteTrainingKnowledgeUI.render();});
 const host=page.locator('#muscle-workload'),parent=host.locator('..');
 await parent.locator(':scope > summary').focus();await page.keyboard.press('Enter');
 await expect(host.locator('table')).toHaveCount(0);await expect(host).toContainText('unknown is not zero');
 await expect(host.locator('#muscle-map-open')).toBeVisible();
 const help=host.locator('#workload-counts-help');await help.locator('summary').focus();await page.keyboard.press('Enter');
 await expect(help).toHaveJSProperty('open',true);await expect(help).toContainText('unmapped sets');
 await page.evaluate(()=>{data.exerciseCatalog[0].muscles={confirmed:true,mode:'resistance',primary:['quadriceps'],secondary:['glutes']};LoadnoteTrainingKnowledgeUI.render();});
 const table=page.getByRole('region',{name:'Muscle workload table'});await expect(table).toBeVisible();
 await table.focus();await expect(table).toBeFocused();await expect(table.locator('th[scope=col]')).toHaveCount(5);
 await expect(table.locator('caption')).toContainText('scroll horizontally');
 expect(await table.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
 await page.screenshot({path:info.outputPath('workload-compact.png')});
});
