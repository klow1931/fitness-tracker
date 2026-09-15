const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{data=normalizeDataShape({...data,workouts:[{id:'a',date:'2026-01-01',exercises:[{name:'Hip Adduction',sets:[{weight:80,reps:10,rpe:8},{weight:30,reps:10,rpe:8},{weight:80,reps:10,rpe:8}]}]},{id:'b',date:'2026-01-02',exercises:[{name:'Adduction Machine',sets:[{weight:80,reps:10,rpe:8}]}]}]});data.trainingBlocks=LoadnoteBlocks.upsert([],{name:'Base',startDate:'2026-01-01',endDate:'2026-01-31'},{now:'2026-01-01T00:00:00.000Z'});showTab('workouts');showSubTab('workouts','wo-history');});
 await page.locator('#history-cleanup > summary').click();
});
test('flags lead to existing edit flow without changing saved history',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));await expect(page.locator('#history-cleanup')).toContainText('Entries to check (1)');
 await page.locator('[data-clean-edit]').click();await expect(page.locator('#wo-date')).toHaveValue('2026-01-01');expect(await page.evaluate(()=>workoutEdit.id)).toBe('a');expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('alias comparison only stages existing merge controls',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.exerciseCatalog));await page.locator('#history-cleanup details summary').click();await expect(page.locator('.cleanup-columns')).toContainText('2026-01-01');await expect(page.locator('.cleanup-columns')).toContainText('2026-01-02');await page.locator('[data-clean-alias]').click();
 expect(await page.locator('#exercise-alias-source').inputValue()).not.toBe(await page.locator('#exercise-alias-target').inputValue());expect(await page.evaluate(()=>JSON.stringify(data.exerciseCatalog))).toBe(before);
 page.once('dialog',d=>d.dismiss());await page.locator('#merge-exercise-alias').click();expect(await page.evaluate(()=>JSON.stringify(data.exerciseCatalog))).toBe(before);
});
test('coverage opens revisioned block editor and preserves data on failed save',async({page})=>{
 await expect(page.locator('#history-cleanup')).toContainText('2 workouts on 2 dates');await page.locator('[data-clean-block]').click();await page.locator('#block-completeness').selectOption('incomplete');
 await page.evaluate(()=>{persistNow=async()=>{throw Error('Storage unavailable');};});await page.getByRole('button',{name:'Save block',exact:true}).click();await expect(page.locator('#block-error')).toContainText('Storage unavailable');expect(await page.evaluate(()=>LoadnoteBlocks.list(data.trainingBlocks)[0].dataCompleteness)).toBe('unknown');
});
