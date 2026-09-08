const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
  // Core logger tests are independent of third-party charts and CDN styling.
  await page.route(/https:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net)(\/|$)/,route=>route.fulfill({contentType:'text/javascript',body:''}));
  await page.addInitScript(()=>{window.Chart=class {destroy(){} update(){}};});
  await page.goto('/');
  await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
  await page.addStyleTag({content:'.hidden{display:none!important}'});
  await page.evaluate(()=>showTab('workouts'));
});
async function enter(page,name='Bench Press'){
 await page.locator('#exercise-rows .ex-name').fill(name);
 await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill('100');await page.locator('.set-rpe').fill('8');
}
test('delegated dynamic controls and templates bind once',async({page})=>{
 await page.evaluate(()=>{initWorkoutEvents();initWorkoutEvents();});
 await enter(page);await page.getByRole('button',{name:'+ Add Set',exact:true}).click();await expect(page.locator('.set-reps')).toHaveCount(2);
 await page.getByRole('button',{name:'Remove set',exact:true}).last().click();await expect(page.locator('.set-reps')).toHaveCount(1);
 const dialogs=[];page.on('dialog',d=>{dialogs.push(d.type());return d.accept(d.type()==='prompt'?'Upper body':undefined);});
 await page.getByRole('button',{name:'Save as Template',exact:true}).click();expect(await page.evaluate(()=>data.templates.length)).toBe(1);expect(dialogs.filter(d=>d==='prompt')).toHaveLength(1);
 await page.getByRole('button',{name:'Clear',exact:true}).click();await page.locator('#template-select').selectOption({label:'Upper body'});await expect(page.locator('.set-weight')).toHaveValue('100');await expect(page.locator('.set-rpe')).toHaveValue('');
 await page.getByRole('button',{name:'+ Add Cardio',exact:true}).click();await expect(page.locator('.cardio-duration')).toHaveCount(1);
 await page.locator('#exercise-rows > div').last().getByRole('button',{name:'Remove',exact:true}).click();await expect(page.locator('.cardio-duration')).toHaveCount(0);
});
test('delegated history export and import preserve workout identity',async({page})=>{
 await enter(page);await page.locator('#workout-actions .btn-primary').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).not.toBeVisible();
 const original=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('[data-workout-action="tab-history"]').click();
 const download=page.waitForEvent('download');await page.locator('#panel-workouts [data-workout-action="export-json"]').click();expect((await download).suggestedFilename()).toMatch(/\.json$/);
 page.once('dialog',d=>d.accept());await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(original)});
 await expect(page.locator('#panel-dashboard')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 await page.evaluate(()=>showTab('workouts'));await page.locator('[data-workout-action="tab-history"]').click();await expect(page.locator('#workout-history [data-hist-id]')).toHaveCount(1);
 expect(await page.evaluate(()=>data.workouts[0].id)).toBe(JSON.parse(original).workouts[0].id);
});
test('draft values and checkmarks survive refresh',async({page})=>{
 await enter(page);await page.locator('.set-done-check').check();await page.locator('#wo-notes').fill('Keep my notes');
 await page.reload();await expect(page.locator('.set-weight')).toHaveValue('100');await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.set-weight')).toHaveValue('100');await expect(page.locator('.set-done-check')).toBeChecked();await expect(page.locator('#wo-notes')).toHaveValue('Keep my notes');
 expect(await page.evaluate(()=>readLoggerDraft().version)).toBe(2);
});
test('UUID history template and delete buttons work; text stays text',async({page})=>{
 await enter(page,'<img src=x onerror="window.injected=true">');await page.locator('#workout-actions .btn-primary').click();
 await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).not.toBeVisible();
 await page.evaluate(()=>showSubTab('workouts','wo-history'));
 await expect(page.locator('#workout-history [data-hist-id]')).toHaveCount(1);
 expect(await page.evaluate(()=>window.injected)).toBeUndefined();await expect(page.locator('#workout-history img')).toHaveCount(0);
 // The legacy template action displays a second informational alert.
 const accept=d=>d.accept(d.type()==='prompt'?'Bench template':undefined);page.on('dialog',accept);
 await page.locator('#workout-history button').filter({hasText:'Template'}).click();
 expect(await page.evaluate(()=>data.templates.length)).toBe(1);
 await page.locator('#workout-history button').filter({hasText:'Delete'}).click();
 await expect(page.locator('#workout-history [data-hist-id]')).toHaveCount(0);
});
test('review can be cancelled without saving and comparisons show prior sets',async({page})=>{
 await page.evaluate(()=>{data.workouts=[{id:'old',date:'2026-09-01',exercises:[{name:'Bench Press',type:'strength',sets:[{reps:5,weight:80,rpe:9}]}]}];});
 await page.locator('.set-weight').fill('100');await page.locator('.set-reps').fill('5');await page.locator('.ex-name').fill('Bench Press');
 await expect(page.locator('.previous-performance table')).toContainText('80kg');
 await expect(page.locator('.previous-performance table')).toContainText('100kg');
 await page.locator('#workout-actions .btn-primary').click();await expect(page.locator('#workout-review')).toBeVisible();
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
 await page.locator('#back-to-workout').click();await expect(page.locator('.set-weight')).toHaveValue('100');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
});
test('edit survives refresh and replaces a session while preserving program metadata',async({page})=>{
 await enter(page);await page.evaluate(()=>{pendingProgramSession={programId:'plan',dayIndex:0,week:2};});
 await page.locator('#workout-actions .btn-primary').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).not.toBeVisible();
 const originalId=await page.evaluate(()=>data.workouts[0].id);
 await page.evaluate(()=>showSubTab('workouts','wo-history'));await page.locator('#workout-history button').filter({hasText:'Edit'}).click();
 await expect(page.locator('#workout-edit-banner')).toBeVisible();await expect(page.locator('.set-rpe')).toHaveValue('8');
 await page.locator('.set-weight').fill('90');await page.reload();await expect(page.locator('.set-weight')).toHaveValue('90');await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('#workout-edit-banner')).toBeVisible();await page.locator('#workout-actions .btn-primary').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).not.toBeVisible();
 const workouts=await page.evaluate(()=>data.workouts);expect(workouts).toHaveLength(1);expect(workouts[0].id).toBe(originalId);expect(workouts[0].programId).toBe('plan');expect(workouts[0].programWeek).toBe(2);expect(workouts[0].exercises[0].sets[0].weight).toBe(90);
 expect(await page.evaluate(()=>data.prs[0].weight)).toBe(90);
});
test('failed edit save preserves history and keeps review available',async({page})=>{
 await enter(page);await page.locator('#workout-actions .btn-primary').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).not.toBeVisible();
 await page.evaluate(()=>editWorkout(data.workouts[0].id));await page.locator('.set-weight').fill('95');await page.locator('#workout-actions .btn-primary').click();
 await page.evaluate(()=>{persistNow=async()=>{throw Error('simulated quota failure');};});await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).toBeVisible();await expect(page.locator('#confirm-workout-save')).toBeEnabled();expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].weight)).toBe(100);
});
test('last weights protects entered sets and clears historical RPE',async({page})=>{
 await page.evaluate(()=>{data.workouts=[{id:'old',date:'2026-09-01',exercises:[{name:'Bench Press',sets:[{reps:5,weight:80,rpe:9}]}]}];});
 await page.locator('.set-weight').fill('100');await page.locator('.set-reps').fill('3');await page.locator('.ex-name').fill('Bench Press');await page.locator('.set-rpe').fill('7');
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Last weights',exact:true}).click();await expect(page.locator('.set-weight')).toHaveValue('100');
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Last weights',exact:true}).click();await expect(page.locator('.set-weight')).toHaveValue('80');await expect(page.locator('.set-rpe')).toHaveValue('');
});
test('validation blocks bad RPE and unit switching converts draft loads',async({page})=>{
 await enter(page);await page.locator('.set-rpe').fill('11');await page.locator('#workout-actions .btn-primary').click();expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await page.evaluate(()=>setUnit('lb'));await expect(page.locator('.set-weight')).toHaveValue('220.46');await page.evaluate(()=>setUnit('kg'));await expect(page.locator('.set-weight')).toHaveValue('100');
});
