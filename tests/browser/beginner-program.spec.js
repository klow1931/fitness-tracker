const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-23T12:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
test('v3.93 first-time athlete reviews a three-question program before save and separately schedules',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,customPrograms:data.customPrograms,scheduledSessions:data.scheduledSessions}));
 await page.locator('[data-beginner-entry=help]').click();
 const dialog=page.locator('#beginner-program-dialog');
 await expect(dialog).toBeVisible();
 await dialog.locator('#starter-goal').selectOption('strength');
 await dialog.locator('#starter-equipment').selectOption('dumbbells');
 await dialog.locator('#starter-preview-btn').click();
 await expect(dialog.locator('#starter-plan-preview')).toContainText('12 sessions');
 await expect(dialog.locator('#starter-plan-preview')).toContainText('Starting weights and RPE targets are blank');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,customPrograms:data.customPrograms,scheduledSessions:data.scheduledSessions}))).toBe(before);
 await dialog.locator('[data-starter-name="0-0"]').fill('Goblet Squat');
 await expect(dialog.locator('#starter-plan-preview')).toBeEmpty();
 await expect(dialog.locator('#starter-save')).toBeHidden();
 await dialog.locator('#starter-refresh').click();
 await expect(dialog.locator('#starter-plan-preview')).toContainText('12 sessions');
 await dialog.locator('#starter-save').click();
 await expect(dialog.locator('#starter-status')).toContainText('confirm');
 await dialog.locator('#starter-confirm').check();await dialog.locator('#starter-save').click();
 await expect(dialog.locator('#starter-status')).toContainText('not scheduled');
 expect(await page.evaluate(()=>data.customPrograms.length)).toBe(1);
 expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 expect(await page.evaluate(()=>data.customPrograms[0].entries.every(e=>e.weightKg===null&&e.rpe===null))).toBe(true);
 await dialog.locator('#starter-schedule').click();
 await expect(dialog.locator('#starter-status')).toContainText('Confirm');
 await dialog.locator('#starter-schedule-confirm').check();await dialog.locator('#starter-schedule').click();
 await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.length)).toBe(12);
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('v3.93 unsaved or failed-review plan cannot modify athlete training',async({page})=>{
 await page.locator('[data-beginner-entry=help]').click();
 await page.locator('#starter-preview-btn').click();
 await expect(page.locator('#starter-plan-preview')).toContainText('12 sessions');
 await page.locator('#starter-confirm').check();
 await page.evaluate(()=>{window.starterPersist=persistNow;persistNow=async()=>{throw Error('Storage unavailable');};});
 await page.locator('#starter-save').click();
 await expect(page.locator('#starter-status')).toContainText('Storage unavailable');
 expect(await page.evaluate(()=>data.customPrograms.length+data.scheduledSessions.length+data.workouts.length)).toBe(0);
 await page.evaluate(()=>{persistNow=window.starterPersist;});
 await page.locator('#starter-close').click();
 expect(await page.evaluate(()=>data.customPrograms.length+data.scheduledSessions.length+data.workouts.length)).toBe(0);
});
test('v3.93 unavailable days, edits and missing exercise review are blocked',async({page})=>{
 await page.locator('[data-beginner-entry=help]').click();
 const d=page.locator('#beginner-program-dialog');
 // Uncheck by stable value: the :checked locator shrinks after each click.
 for(const value of await d.locator('[data-starter-day]:checked').evaluateAll(nodes=>nodes.map(node=>node.value)))
  await d.locator('[data-starter-day][value="'+value+'"]').uncheck();
 await d.locator('#starter-preview-btn').click();
 await expect(d.locator('#starter-status')).toContainText('Choose two or three');
 await d.locator('[data-starter-day][value="0"]').check();await d.locator('[data-starter-day][value="3"]').check();
 await d.locator('#starter-preview-btn').click();
 await expect(d.locator('#starter-plan-preview')).toContainText('8 sessions');
 await d.locator('[data-starter-name="0-1"]').fill('');
 await d.locator('#starter-refresh').click();
 await expect(d.locator('#starter-status')).toContainText('valid exercise name');
 expect(await page.evaluate(()=>data.customPrograms.length)).toBe(0);
});

test('v3.95 beginner day selection communicates expected workouts without saving or scheduling',async({page})=>{
 await page.locator('[data-beginner-entry=help]').click();
 const d=page.locator('#beginner-program-dialog');
 const hint=d.locator('#starter-days-hint');
 await expect(hint).toContainText('3 days selected');
 await expect(hint).toContainText('12 planned workouts');
 const checked=await d.locator('[data-starter-day]:checked').evaluateAll(nodes=>nodes.map(el=>el.value));
 for(const day of checked)await d.locator('[data-starter-day][value="'+day+'"]').uncheck();
 await expect(hint).toContainText('0 days selected');
 await expect(d.locator('#starter-days')).toHaveAttribute('aria-invalid','true');
 await d.locator('[data-starter-day][value="1"]').check();
 await d.locator('[data-starter-day][value="3"]').check();
 await expect(hint).toContainText('8 planned workouts');
 await expect(d.locator('#starter-days')).toHaveAttribute('aria-invalid','false');
 expect(await page.evaluate(()=>data.customPrograms.length+data.scheduledSessions.length+data.workouts.length)).toBe(0);
 await d.locator('#starter-preview-btn').click();
 await expect(d.locator('#starter-plan-preview')).toContainText('8 sessions');
 await expect(d.locator('#starter-status')).toContainText('Nothing has been scheduled');
});
