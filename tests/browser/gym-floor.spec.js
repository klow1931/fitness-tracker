const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.clock.install({time:new Date('2026-10-01T18:00:00.000Z')});
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('workouts'));
});

test('v2.62 previous-set context can refill a blank set without copying RPE or completion',async({page})=>{
 await page.evaluate(()=>{
  data.workouts=[{id:'previous-bench',date:'2026-09-20',createdAt:'2026-09-20T18:00:00.000Z',exercises:[{name:'Bench Press',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}]}];
  data.unit='lb';
  document.getElementById('wo-date').value='2026-10-01';
  const name=document.querySelector('#exercise-rows .ex-name');name.value='Bench Press';name.dispatchEvent(new Event('input',{bubbles:true}));
  refreshGymFloorUI();
 });
 const history=page.locator('.logger-set').first().locator('.gym-set-history');
 await expect(history).toBeVisible();
 await expect(history).toContainText('220.5 lb');
 await expect(history).toContainText('5 reps');
 await expect(history).toContainText('RPE 8');
 await history.getByRole('button',{name:'Use last'}).click();
 await expect(page.locator('.logger-set').first().locator('.set-weight')).toHaveValue('220.5');
 await expect(page.locator('.logger-set').first().locator('.set-reps')).toHaveValue('5');
 await expect(page.locator('.logger-set').first().locator('.set-rpe')).toHaveValue('');
 await expect(page.locator('.logger-set').first().locator('.set-done-check')).toHaveCount(0);
});

test('v2.62 numeric keyboards and Enter advance to the next unfinished set',async({page})=>{
 await page.getByRole('button',{name:'+ Same Set'}).click();
 const sets=page.locator('.logger-set');
 await expect(sets).toHaveCount(2);
 await expect(sets.first().locator('.set-reps')).toHaveAttribute('inputmode','numeric');
 await expect(sets.first().locator('.set-weight')).toHaveAttribute('inputmode','decimal');
 await expect(sets.first().locator('.set-rpe')).toHaveAttribute('enterkeyhint','done');
 await sets.first().locator('.set-weight').fill('100');
 await sets.first().locator('.set-reps').fill('5');
 await sets.first().locator('.set-rpe').fill('8');
 await sets.first().locator('.set-rpe').press('Enter');
 await expect(sets.first().locator('.set-done-check')).toBeChecked();
 await expect(sets.nth(1)).toHaveClass(/logger-active-set/);
 await expect.poll(()=>page.evaluate(()=>document.activeElement?.classList.contains('set-weight'))).toBe(true);
});

test('v2.62 mobile dock follows the draft, rest timer and navigation without losing work',async({page})=>{
 await page.locator('.ex-name').fill('Bench Press');
 await page.locator('.set-weight').fill('100');
 await page.locator('.set-reps').fill('5');
 const dock=page.locator('#gym-floor-dock');
 await expect(dock).toBeVisible();
 await expect(dock).toContainText('Bench Press · Set 1');
 await expect(page.locator('#mobile-nav [data-tab="workouts"]')).toHaveClass(/workout-draft-active/);
 await page.getByRole('button',{name:'1m',exact:true}).click();
 await expect(dock.locator('#rest-timer-sticky')).toContainText('60s');
 await page.evaluate(()=>showTab('dashboard'));
 await expect(dock).toBeHidden();
 await page.evaluate(()=>showTab('workouts'));
 await expect(dock).toBeVisible();
 await page.reload();
 await expect(page.locator('#exercise-rows .ex-name')).toHaveValue('Bench Press');
 await page.evaluate(()=>showTab('workouts'));
 await expect(dock).toBeVisible();
 await expect(page.locator('.set-weight')).toHaveValue('100');
 await expect(page.locator('.set-reps')).toHaveValue('5');
});

test('v2.62 gym mode remains one-handed and does not overflow a 390px viewport',async({page})=>{
 await page.evaluate(()=>{data.gymMode=true;applyGymMode();});
 await page.locator('.ex-name').fill('Squat');
 await page.locator('.set-weight').fill('180');
 await page.locator('.set-reps').fill('3');
 await page.locator('.set-rpe').focus();
 await expect(page.locator('.quick-set-entry')).toBeVisible();
 await expect(page.locator('#gym-floor-dock')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});


test('v2.62 entered work requires confirmation before destructive removal',async({page})=>{
 const row=page.locator('#exercise-rows > div').first();
 await row.locator('.ex-name').fill('Deadlift');
 await row.locator('.set-weight').fill('180');
 await row.locator('.set-reps').fill('3');
 page.once('dialog',dialog=>dialog.dismiss());
 await row.locator('[data-workout-action="remove-set"]').click();
 await expect(row.locator('.logger-set')).toHaveCount(1);
 page.once('dialog',dialog=>dialog.accept());
 await row.locator('[data-workout-action="remove-set"]').click();
 await expect(row.locator('.logger-set')).toHaveCount(0);
});
