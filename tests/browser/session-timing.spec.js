const {test,expect}=require('playwright/test');
test.use({serviceWorkers:'allow'});
test('explicit start and revised plan survive offline reload and save without rewriting original',async({page,context})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('.ex-name').fill('Squat');await page.locator('.set-reps').first().fill('5');await page.locator('.set-weight').first().fill('100');await page.locator('#session-intent > summary').click();await page.locator('[data-workout-action="capture-plan"]').click();const original=await page.evaluate(()=>JSON.stringify(pendingPrescription));
 await page.locator('[data-workout-action="start-session"]').click();const started=await page.evaluate(()=>pendingSessionTiming.startedAt);await expect(page.locator('#session-timing-summary')).toContainText('before-training');
 await page.locator('.set-weight').first().fill('105');await page.locator('[data-workout-action="capture-plan"]').click();expect(await page.evaluate(()=>JSON.stringify(pendingPrescription))).toBe(original);await expect(page.locator('#session-timing-summary')).toContainText('1 plan revisions');
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});expect(await page.evaluate(()=>pendingSessionTiming.startedAt)).toBe(started);expect(await page.evaluate(()=>pendingSessionTiming.revisions.length)).toBe(1);
 await page.locator('[data-workout-action="review"]').first().click();await page.locator('#confirm-workout-save').click();await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);expect(await page.evaluate(()=>data.workouts[0].sessionIntent.prescription.plannedExercises[0].sets[0].weight)).toBe(100);expect(await page.evaluate(()=>data.workouts[0].sessionIntent.timing.revisions[0].plan.plannedExercises[0].sets[0].weight)).toBe(105);
 await page.evaluate(()=>editWorkout(data.workouts[0].id));await page.locator('[data-workout-action="start-session"]').click();expect(await page.evaluate(()=>pendingSessionTiming.startedAt)).toBe(started);
});
test('start-only draft persists and storage failure leaves timing unchanged',async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Full');};});await page.locator('[data-workout-action="start-session"]').click();expect(await page.evaluate(()=>pendingSessionTiming)).toBe(null);
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem;});await page.locator('[data-workout-action="start-session"]').click();await page.reload();expect(await page.evaluate(()=>pendingSessionTiming?.startedAt)).toBeTruthy();
});
