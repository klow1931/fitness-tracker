const {test,expect}=require('playwright/test');
async function nav(page,tab){await page.locator('#tab-'+tab+':visible, #mobile-nav [data-tab="'+tab+'"]:visible').click();}
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);});
test('first-run pounds choice saves actual loads in kg and preserves the preference after reload',async({page})=>{
 await page.locator('[data-start-unit=lb]').click();await expect(page.locator('[data-start-unit=lb]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-beginner-entry=log]').click();await page.locator('.ex-name').first().fill('Goblet Squat');await page.locator('.set-weight').first().fill('100');await page.locator('.set-reps').first().fill('8');
 await expect(page.locator('.beginner-set-label').first()).toContainText('(lb)');
 await page.locator('[data-quick-complete]').first().click();await page.locator('[data-cockpit-review]').click();await expect(page.locator('#workout-review-content')).toContainText('100lb');await page.locator('#confirm-workout-save').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].weight)).toBe(45.36);
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].rpe)).toBeFalsy();
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);expect(await page.evaluate(()=>currentUnit())).toBe('lb');
});
test('Simple history puts sessions and search first while preserving filters and original actions',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>{data.workouts=[{id:'bench',date:today(),notes:'morning',exercises:[{name:'Bench Press',type:'strength',sets:[{weight:40,reps:5,rpe:8}]}]},{id:'row',date:today(),notes:'evening',exercises:[{name:'Cable Row',type:'strength',sets:[{weight:30,reps:8}]}]}];invalidateViews();showTab('workouts');showSubTab('workouts','wo-history');});
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));
 await expect(page.locator('#history-search')).toBeVisible();await expect(page.locator('[data-hist-id]')).toHaveCount(2);await expect(page.locator('[data-hist-id=bench] .history-session-preview')).toHaveText('Bench Press');
 await expect(page.locator('#history-from')).toBeHidden();await expect(page.locator('[data-workout-action=export-json]')).toBeHidden();await expect(page.locator('[data-hist-id=bench] [data-workout-action=delete]')).toBeHidden();
 await page.locator('#history-extra-filters>summary').click();await page.locator('#history-from').fill('2020-01-01');await page.locator('#history-search').fill('morning');await expect(page.locator('[data-hist-id]')).toHaveCount(1);
 await page.locator('[data-hist-id=bench] .history-card-more>summary').click();await expect(page.locator('[data-hist-id=bench] [data-workout-action=duplicate]')).toBeVisible();
 await page.locator('#history-manage>summary').click();await expect(page.locator('[data-workout-action=export-json]')).toBeVisible();
 await nav(page,'dashboard');await page.locator('#simple-show-all').click();await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-history');});
 await expect(page.locator('#history-from')).toBeVisible();await expect(page.locator('#history-from')).toHaveValue('2020-01-01');await expect(page.locator('#history-search')).toHaveValue('morning');await expect(page.locator('[data-hist-id]')).toHaveCount(1);
 await nav(page,'profile');await page.locator('#profile-simple-view').click();await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-history');});
 await expect(page.locator('#history-extra-filters')).toHaveAttribute('open');await expect(page.locator('#history-from')).toHaveValue('2020-01-01');
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('review flags stay visible above management controls in Simple history',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();await page.evaluate(()=>{data.workouts=[{id:'bad',date:today(),exercises:[{name:'Row',type:'strength',sets:[{weight:10,reps:8,rpe:11}]}]}];invalidateViews();showTab('workouts');showSubTab('workouts','wo-history');});
 await expect(page.locator('#history-review-notice')).toBeVisible();await expect(page.locator('[data-hist-id=bad] .history-review-badge')).toBeVisible();await expect(page.locator('#history-manage')).not.toHaveAttribute('open');
});
test('Profile offers optional planning and keeps competition mapping in advanced setup until a powerlifting goal exists',async({page})=>{
 await nav(page,'profile');await expect(page.locator('#profile-training-setup')).toContainText('Training setup is optional');await expect(page.locator('#profile-lift-mapping')).toBeHidden();
 await page.locator('#profile-training-setup .setup-details>summary').click();await expect(page.locator('#profile-lift-mapping')).toBeVisible();
 await page.locator('#profile-edit-training').click();await page.locator('#programming-profile-dialog button[type=submit]').click();
 await expect(page.locator('#profile-training-setup')).toContainText('General powerlifting');await expect(page.locator('#profile-lift-mapping')).toBeVisible();
});
test('narrow enlarged-text history retains readable actions without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.locator('[data-beginner-entry=log]').click();await page.evaluate(()=>{document.documentElement.style.fontSize='20px';data.workouts=[{id:'small',date:today(),exercises:[{name:'Competition sumo deadlift',type:'strength',sets:[{weight:150,reps:3}]}]}];invalidateViews();showTab('workouts');showSubTab('workouts','wo-history');});
 await page.locator('#history-extra-filters>summary').click();await page.locator('[data-hist-id=small] .history-card-more>summary').click();await page.locator('#history-manage>summary').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
