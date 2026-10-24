const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('workouts'));
});

test('v3.99 repeats the last actually completed set with one tap but not effort or completion',async({page})=>{
 await page.evaluate(()=>{
  data.gymMode=true;data.gymModeUserSet=true;
  const row=document.querySelector('#exercise-rows > div');
  row.querySelector('.ex-name').value='Competition Bench Press';
  row.querySelector('.set-weight').value='100';
  row.querySelector('.set-reps').value='5';
  addSetToContainer(row.querySelector('.sets-container'),{weight:'',reps:'',rpe:'',showCompletion:true},'reps');
  saveLoggerDraft();refreshLoggerQuickEntry();refreshGymFloorUI();refreshTrainingCockpit();
 });
 const sets=page.locator('#exercise-rows .sets-container > div');
 await expect(page.locator('#training-cockpit [data-cockpit-repeat]')).toHaveCount(0);
 await sets.first().locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 const repeat=page.locator('#training-cockpit [data-cockpit-repeat]');
 await expect(repeat).toContainText('Repeat set 1');
 await repeat.click();
 await expect(sets.nth(1).locator('.set-weight')).toHaveValue('100');
 await expect(sets.nth(1).locator('.set-reps')).toHaveValue('5');
 await expect(sets.nth(1).locator('.set-rpe')).toHaveValue('');
 await expect(sets.nth(1).locator('.set-done-check')).not.toBeChecked();
 await expect(repeat).toHaveCount(0);
 expect(await page.evaluate(()=>document.activeElement?.matches('#exercise-rows input')??false)).toBe(false);
 await page.reload();await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.set-weight').nth(1)).toHaveValue('100');
 await expect(page.locator('.set-reps').nth(1)).toHaveValue('5');
 await expect(page.locator('.set-rpe').nth(1)).toHaveValue('');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await page.locator('.quick-set-entry:visible [data-quick-rpe="7.5"]').click();
 await page.locator('#training-cockpit [data-cockpit-review]').click();
 await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).not.toBeVisible();
 const setsSaved=await page.evaluate(()=>data.workouts[0].exercises[0].sets);
 expect(setsSaved.map(s=>({weight:s.weight,reps:s.reps,rpe:s.rpe}))).toEqual([{weight:100,reps:5,rpe:8},{weight:100,reps:5,rpe:7.5}]);
});

test('v3.99 repeat does not replace a chosen target, partial performance or typed RPE',async({page})=>{
 await page.evaluate(()=>{
  const row=document.querySelector('#exercise-rows > div');
  row.querySelector('.ex-name').value='Bench Press';
  row.querySelector('.set-weight').value='80';
  row.querySelector('.set-reps').value='5';
  addSetToContainer(row.querySelector('.sets-container'),{weight:'',reps:'',showCompletion:true},'reps');
  document.querySelector('.set-done-check').checked=true;
  saveLoggerDraft();refreshTrainingCockpit();
 });
 const second=page.locator('#exercise-rows .sets-container > div').nth(1);
 await expect(page.locator('[data-cockpit-repeat]')).toBeVisible();
 await second.locator('.set-weight').fill('0');
 await expect(page.locator('[data-cockpit-repeat]')).toHaveCount(0);
 await second.locator('.set-weight').fill('');
 await second.locator('.set-rpe').fill('7.5');
 await expect(page.locator('[data-cockpit-repeat]')).toHaveCount(0);
});

test('v3.99 dock Undo is one tap, restores effort, preserves load and removes stale actions',async({page})=>{
 await page.evaluate(()=>{data.gymMode=true;data.gymModeUserSet=true;});
 await page.locator('.ex-name').fill('Bodyweight Squat');
 await page.locator('.set-weight').fill('0');
 await page.locator('.set-reps').fill('12');
 await page.locator('.set-rpe').fill('7.5');
 await expect(page.locator('#gym-floor-dock [data-gym-undo]')).toBeHidden();
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 const dock=page.locator('#gym-floor-dock');
 await expect(dock).toBeVisible();
 await expect(dock.locator('[data-gym-undo]')).toBeVisible();
 await expect(page.locator('.set-rpe').first()).toHaveValue('8');
 await dock.locator('[data-gym-undo]').click();
 await expect(page.locator('.set-done-check').first()).not.toBeChecked();
 await expect(page.locator('.set-rpe').first()).toHaveValue('7.5');
 await expect(page.locator('.set-weight').first()).toHaveValue('0');
 await expect(page.locator('.set-reps').first()).toHaveValue('12');
 await expect(dock.locator('[data-gym-undo]')).toBeHidden();
 expect(await page.evaluate(()=>LoadnoteRestTimer.snapshot().active)).toBe(false);
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(dock.locator('[data-gym-undo]')).toBeVisible();
 await page.locator('.set-reps').first().fill('10');
 await expect(dock.locator('[data-gym-undo]')).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('v3.99 narrow phone shows accessible Undo without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:320,height:700});
 await page.locator('.ex-name').fill('Deadlift');
 await page.locator('.set-weight').fill('200');
 await page.locator('.set-reps').fill('3');
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 const dock=page.locator('#gym-floor-dock');
 await expect(dock.locator('[data-gym-undo]')).toBeVisible();
 await expect(dock.locator('[data-gym-undo]')).toHaveAttribute('aria-label','Undo last completed set');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await dock.locator('[data-gym-undo]').click();
 await expect(page.locator('.set-done-check').first()).not.toBeChecked();
});
