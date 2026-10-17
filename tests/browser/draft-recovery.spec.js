const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('workouts'));
});
test('corrupt primary draft recovers entered load, reps, RPE and completion after reload',async({page})=>{
 await page.locator('.ex-name').fill('Competition Bench Press');
 await page.locator('.set-weight').first().fill('100');
 await page.locator('.set-reps').first().fill('5');
 await page.locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(page.locator('.set-done-check').first()).toBeChecked();
 await expect.poll(()=>page.evaluate(()=>!!localStorage.getItem('loadnote-workout-draft-v1-recovery'))).toBe(true);
 await page.evaluate(()=>localStorage.setItem('loadnote-workout-draft-v1','{"truncated":'));
 await page.reload();
 await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.ex-name')).toHaveValue('Competition Bench Press');
 await expect(page.locator('.set-weight').first()).toHaveValue('100');
 await expect(page.locator('.set-reps').first()).toHaveValue('5');
 await expect(page.locator('.set-rpe').first()).toHaveValue('8');
 await expect(page.locator('.set-done-check').first()).toBeChecked();
 await page.evaluate(()=>reviewWorkout());
 await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).not.toBeVisible();
 await expect.poll(()=>page.evaluate(()=>[localStorage.getItem('loadnote-workout-draft-v1'),localStorage.getItem('loadnote-workout-draft-v1-recovery')])).toEqual([null,null]);
 await page.evaluate(()=>showTab('dashboard'));
 await expect(page.locator('#today-training')).toContainText('Training logged');
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].weight)).toBe(100);
});

test('closing and reopening mid-session restores the latest entered training without the network',async({page,context})=>{
 await page.locator('.ex-name').fill('Competition Sumo Deadlift');
 await page.locator('.set-weight').first().fill('185');
 await page.locator('.set-reps').first().fill('3');
 await page.locator('.set-rpe').first().fill('7.5');
 await expect.poll(()=>page.evaluate(()=>readLoggerDraft()?.rows?.[0]?.sets?.[0]?.weight)).toBe('185');
 await page.close(); // Simulates a terminated web session, not merely a same-page refresh.
 const reopened=await context.newPage();
 await reopened.goto('/');
 await reopened.evaluate(()=>showTab('workouts'));
 await expect(reopened.locator('.ex-name')).toHaveValue('Competition Sumo Deadlift');
 await expect(reopened.locator('.set-weight').first()).toHaveValue('185');
 await expect(reopened.locator('.set-reps').first()).toHaveValue('3');
 await expect(reopened.locator('.set-rpe').first()).toHaveValue('7.5');
 expect(await reopened.evaluate(()=>data.workouts.length)).toBe(0,'draft recovery must not fabricate saved history');
});
