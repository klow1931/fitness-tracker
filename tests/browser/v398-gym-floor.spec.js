const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('workouts'));
});

test('v3.98 refuses blank load before quick completion, while explicit zero is valid',async({page})=>{
 const row=page.locator('#exercise-rows > div').first();
 await row.locator('.ex-name').fill('Bodyweight Squat');
 await row.locator('.set-reps').fill('12');
 const quick=row.locator('.quick-set-entry:visible');
 await expect(quick).toContainText('Enter load (0 for bodyweight)');
 await expect(quick.locator('[data-quick-rpe="8"]')).toBeDisabled();
 expect(await page.evaluate(()=>completeLoggerSetQuickly(document.querySelector('.sets-container > div'),8))).toBe(false);
 await expect(row.locator('.set-done-check:checked')).toHaveCount(0);
 expect(await page.evaluate(()=>LoadnoteRestTimer.snapshot().active)).toBe(false);
 await row.locator('.set-weight').fill('0');
 await expect(quick.locator('[data-quick-rpe="8"]')).toBeEnabled();
 await quick.locator('[data-quick-rpe="8"]').click();
 await expect(row.locator('.set-done-check')).toBeChecked();
 await expect(row.locator('.set-weight')).toHaveValue('0');
 await expect(row.locator('.set-rpe')).toHaveValue('8');
 await page.reload();await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.set-weight').first()).toHaveValue('0');
 await expect(page.locator('.set-done-check').first()).toBeChecked();
});

test('v3.98 Done without RPE clears typed effort, and undo retains actual load/reps',async({page})=>{
 const row=page.locator('#exercise-rows > div').first();
 await row.locator('.ex-name').fill('Squat');
 await row.locator('.set-weight').fill('100');
 await row.locator('.set-reps').fill('5');
 await row.locator('.set-rpe').fill('8');
 await row.locator('.quick-set-entry:visible [data-quick-done]').click();
 await expect(row.locator('.set-done-check')).toBeChecked();
 await expect(row.locator('.set-rpe')).toHaveValue('');
 await expect(page.locator('#training-cockpit [data-cockpit-undo]')).toBeVisible();
 await page.locator('#training-cockpit [data-cockpit-undo]').click();
 await expect(row.locator('.set-done-check')).not.toBeChecked();
 await expect(row.locator('.set-weight')).toHaveValue('100');
 await expect(row.locator('.set-reps')).toHaveValue('5');
 await expect(row.locator('.set-rpe')).toHaveValue('8');
});

test('v3.98 same-set quick fill never replaces explicitly entered zero',async({page})=>{
 await page.evaluate(()=>{
  const row=document.querySelector('#exercise-rows > div');
  row.querySelector('.ex-name').value='Bodyweight Hold';
  row.querySelector('.set-weight').value='0';
  row.querySelector('.set-reps').value='12';
  addSetToContainer(row.querySelector('.sets-container'),{reps:'',weight:'',rpe:'',showCompletion:true},'reps');
  saveLoggerDraft();refreshGymFloorUI();refreshLoggerQuickEntry();
 });
 const sets=page.locator('#exercise-rows .sets-container > div');
 await sets.first().locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 const next=sets.nth(1);
 await next.locator('.set-weight').fill('0');
 await expect(next.locator('[data-gym-copy-prior]')).toHaveCount(0);
 await next.locator('.set-weight').fill('');
 await expect(next.locator('[data-gym-copy-prior]')).toBeVisible();
 await next.locator('[data-gym-copy-prior]').click();
 await expect(next.locator('.set-weight')).toHaveValue('0');
 await expect(next.locator('.set-reps')).toHaveValue('12');
 await expect(next.locator('.set-rpe')).toHaveValue('');
 await expect(next.locator('.set-done-check')).not.toBeChecked();
 expect(await page.evaluate(()=>document.activeElement?.matches('#exercise-rows input')??false)).toBe(false);
});

test('v3.98 previous-set reuse during rest does not reopen the numeric keyboard',async({page})=>{
 await page.evaluate(()=>{
  data.workouts=[{id:'older',date:'2026-01-01',exercises:[{name:'Bench Press',type:'strength',trackBy:'reps',sets:[{weight:90,reps:5,rpe:8}]}]}];
  const name=document.querySelector('.ex-name');
  name.value='Bench Press';name.dispatchEvent(new Event('input',{bubbles:true}));
  startRest(90);document.activeElement.blur();
  refreshGymFloorUI();
 });
 const row=page.locator('#exercise-rows > div').first();
 await expect(row.locator('[data-gym-use-last]')).toBeVisible();
 await row.locator('[data-gym-use-last]').click();
 await expect(row.locator('.set-weight')).toHaveValue('90');
 await expect(row.locator('.set-reps')).toHaveValue('5');
 await expect(row.locator('.set-rpe')).toHaveValue('');
 expect(await page.evaluate(()=>document.activeElement?.matches('#exercise-rows input')??false)).toBe(false);
 expect(await page.evaluate(()=>LoadnoteRestTimer.snapshot().active)).toBe(true);
});
