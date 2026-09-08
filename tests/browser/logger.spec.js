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
test('draft values and checkmarks survive refresh',async({page})=>{
 await enter(page);await page.locator('.set-done-check').check();await page.locator('#wo-notes').fill('Keep my notes');
 await page.reload();await expect(page.locator('.set-weight')).toHaveValue('100');await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.set-weight')).toHaveValue('100');await expect(page.locator('.set-done-check')).toBeChecked();await expect(page.locator('#wo-notes')).toHaveValue('Keep my notes');
 expect(await page.evaluate(()=>readLoggerDraft().version)).toBe(2);
});
test('UUID history template and delete buttons work; text stays text',async({page})=>{
 await enter(page,'<img src=x onerror="window.injected=true">');await page.locator('#workout-actions .btn-primary').click();
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
