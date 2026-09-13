const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){} update(){}};});await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));
});
async function save(page,name='Bench Press',weight='100'){
 await page.locator('.ex-name').fill(name);await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill(weight);await page.locator('.set-rpe').fill('8');await page.locator('#workout-actions [data-workout-action="review"]').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).not.toBeVisible();
}
test('duplicate is a new draft and edit/delete revisions can be undone',async({page})=>{
 await save(page);const original=await page.evaluate(()=>data.workouts[0].id);await page.evaluate(()=>showSubTab('workouts','wo-history'));
 await page.locator(`[data-hist-id="${original}"] [data-workout-action="duplicate"]`).click();await expect(page.locator('.set-weight')).toHaveValue('100');await expect(page.locator('.set-rpe')).toHaveValue('');
 await page.locator('.set-rpe').fill('7');await page.locator('#workout-actions [data-workout-action="review"]').click();await page.locator('#confirm-workout-save').click();expect(await page.evaluate(()=>new Set(data.workouts.map(w=>w.id)).size)).toBe(2);
 await page.evaluate(id=>editWorkout(id),original);await page.locator('.set-weight').fill('90');await page.locator('#workout-actions [data-workout-action="review"]').click();await page.locator('#confirm-workout-save').click();
 await page.evaluate(()=>showSubTab('workouts','wo-history'));
 await expect(page.locator('#workout-history')).toContainText('Edited workout');page.once('dialog',d=>d.accept());await page.locator('[data-workout-action="undo-change"]').first().click();expect(await page.evaluate(id=>data.workouts.find(w=>w.id===id).exercises[0].sets[0].weight,original)).toBe(100);
 page.once('dialog',d=>d.accept());await page.locator(`[data-hist-id="${original}"] [data-workout-action="delete"]`).click();expect(await page.evaluate(id=>data.workouts.some(w=>w.id===id),original)).toBe(false);await expect(page.locator('#workout-history')).toContainText('Deleted workout');page.once('dialog',d=>d.accept());await page.locator('[data-workout-action="undo-change"]').first().click();expect(await page.evaluate(id=>data.workouts.some(w=>w.id===id),original)).toBe(true);
});
test('replacement import previews changes, saves recovery, and restores prior state',async({page})=>{
 await save(page,'Squat','120');const before=await page.evaluate(()=>JSON.parse(JSON.stringify(data)));const incoming={schemaVersion:11,workouts:[{id:'replacement',date:'2026-09-01',exercises:[{name:'Deadlift',sets:[{weight:150,reps:3,rpe:7}]}]}],nutrition:[],trainingBlocks:[]};let message='';
 page.once('dialog',dialog=>{message=dialog.message();dialog.accept();});await page.locator('#import-file').setInputFiles({name:'incoming.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});await expect.poll(()=>page.evaluate(()=>data.workouts[0].id)).toBe('replacement');expect(message).toContain('Workouts: 1 → 1');expect(message).toContain('1 added');expect(message).toContain('1 removed');
 await page.evaluate(()=>showTab('tools'));await expect(page.locator('#recovery-snapshots')).toContainText('Before JSON import');await page.locator('details:has(#recovery-snapshots) > summary').click();page.once('dialog',d=>d.accept());await page.locator('#recovery-snapshots [data-restore-snapshot]').click();await expect.poll(()=>page.evaluate(()=>data.workouts[0].id)).toBe(before.workouts[0].id);
});
test('exercise alias merge preserves labels and unifies identities',async({page})=>{
 await page.evaluate(()=>{data.workouts=[{id:'a',date:'2026-08-01',exercises:[{name:'Adduction Machine',sets:[{weight:50,reps:10}]}]},{id:'b',date:'2026-08-08',exercises:[{name:'Hip Adduction',sets:[{weight:55,reps:10}]}]}];data=LoadnoteIntegrity.normalizeState(data);invalidateViews();showTab('tools');});
 await page.locator('details:has(#exercise-alias-tools) > summary').click();
 await page.locator('#exercise-alias-source').selectOption({label:'Adduction Machine'});await page.locator('#exercise-alias-target').selectOption({label:'Hip Adduction'});page.once('dialog',d=>d.accept());await page.locator('#merge-exercise-alias').click();
 const result=await page.evaluate(()=>({names:data.workouts.map(w=>w.exercises[0].name),ids:data.workouts.map(w=>w.exercises[0].exerciseId)}));expect(result.names).toEqual(['Adduction Machine','Hip Adduction']);expect(new Set(result.ids).size).toBe(1);await expect(page.locator('#recovery-snapshots')).toContainText('Before exercise identity merge');
});
