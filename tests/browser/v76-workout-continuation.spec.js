const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.locator('[data-beginner-entry=log]').click();await page.evaluate(()=>{data.gymMode=true;data.gymModeUserSet=true;});
 await page.locator('.ex-name').fill('Bench Press');await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill('100');
});
async function complete(page){await page.locator('[data-quick-complete]:visible').click();await expect(page.locator('[data-continuation-set]')).toBeVisible();}
test('continuation only appears after entered work is checked complete and extra set starts entirely blank',async({page})=>{
 await expect(page.locator('.workout-continuation')).toHaveCount(0);await complete(page);const before=await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows[0].sets[0]));const rest=await page.evaluate(()=>LoadnoteRestTimer.checkpoint());
 await page.locator('[data-continuation-set]').click();await expect(page.locator('.set-reps')).toHaveCount(2);await expect(page.locator('.set-reps').nth(1)).toBeFocused();for(const cls of ['set-reps','set-weight','set-rpe'])await expect(page.locator('.'+cls).nth(1)).toHaveValue('');await expect(page.locator('.set-done-check').nth(1)).not.toBeChecked();await expect(page.locator('.workout-continuation')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows[0].sets[0]))).toBe(before);expect(await page.evaluate(()=>LoadnoteRestTimer.checkpoint())).toEqual(rest);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);expect(await page.evaluate(()=>LoadnoteWorkoutContinuationUI.addBlankSet())).toBe(false);
});
test('untouched extra blank set survives reload and does not become performed work when saving',async({page})=>{
 await complete(page);await page.locator('[data-continuation-set]').click();await page.reload();await expect(page.locator('.set-reps')).toHaveCount(2);await page.evaluate(()=>showTab('workouts'));await expect(page.locator('.set-reps').nth(1)).toHaveValue('');
 await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets.length)).toBe(1);expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].weight)).toBe(100);
});
test('pound entry in added set saves actual kg without copying RPE or completion',async({page})=>{
 await page.evaluate(()=>setUnit('lb'));await complete(page);await page.locator('[data-continuation-set]').click();await page.locator('.set-reps').nth(1).fill('3');await page.locator('.set-weight').nth(1).fill('210');await expect(page.locator('.set-rpe').nth(1)).toHaveValue('');await page.locator('[data-quick-complete]:visible').click();await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 const sets=await page.evaluate(()=>data.workouts[0].exercises[0].sets);expect(sets).toHaveLength(2);expect(sets[1].weight).toBeCloseTo(95.25,2);expect(sets[1].rpe).toBeFalsy();
});
test('adding another exercise preserves previous sets and reveals name entry without replacing the draft',async({page})=>{
 await complete(page);const before=await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows[0]));await page.locator('[data-continuation-exercise]').click();await expect(page.locator('.ex-name')).toHaveCount(2);await expect(page.locator('.ex-name').nth(1)).toBeFocused();await expect(page.locator('.ex-name').nth(1)).toHaveValue('');expect(await page.evaluate(()=>LoadnoteWorkoutContinuationUI.addExercise())).toBe(false);
 await page.locator('.ex-name').nth(1).fill('Cable Row');await expect(page.locator('.set-weight').nth(1)).toHaveValue('');expect(await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows[0]))).toBe(before);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('timed strength adds a blank duration and an unchanged captured prescription',async({page})=>{
 page.once('dialog',d=>d.accept());await page.evaluate(()=>fillWorkoutForm([{name:'Plank',type:'strength',trackBy:'duration',sets:[{duration:30,weight:0}]}],'',false,{source:{type:'manual',label:'Hold'}}));
 const before=await page.evaluate(()=>JSON.stringify(captureLoggerDraft().sessionIntent.prescription));await complete(page);await page.locator('[data-continuation-set]').click();await expect(page.locator('.set-duration').nth(1)).toHaveValue('');await expect(page.locator('.set-duration').nth(1)).toBeFocused();await expect(page.locator('.set-weight').nth(1)).toHaveValue('');expect(await page.evaluate(()=>JSON.stringify(captureLoggerDraft().sessionIntent.prescription))).toBe(before);
});
test('completed cardio offers another exercise without manufacturing strength sets',async({page})=>{
 page.once('dialog',d=>d.accept());await page.evaluate(()=>fillWorkoutForm([{name:'Bike',type:'cardio',duration:20,distance:5}],'',false));await page.locator('.cardio-done').check();await expect(page.locator('[data-continuation-exercise]')).toBeVisible();await expect(page.locator('[data-continuation-set]')).toHaveCount(0);expect(await page.evaluate(()=>LoadnoteWorkoutContinuationUI.addBlankSet())).toBe(false);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('review and saving gates block stale continuation actions',async({page})=>{
 await complete(page);await page.locator('[data-cockpit-review]').click();expect(await page.evaluate(()=>LoadnoteWorkoutContinuationUI.addBlankSet())).toBe(false);expect(await page.evaluate(()=>LoadnoteWorkoutContinuationUI.addExercise())).toBe(false);await page.locator('#back-to-workout').click();await page.evaluate(()=>window.loggerSaving=true);expect(await page.evaluate(()=>LoadnoteWorkoutContinuationUI.addBlankSet())).toBe(false);await page.evaluate(()=>window.loggerSaving=false);await expect(page.locator('.set-reps')).toHaveCount(1);
});
test('narrow enlarged-text continuation fits and can be activated by keyboard',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='20px');await complete(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.locator('[data-continuation-set]').focus();await page.keyboard.press('Enter');await expect(page.locator('.set-reps').nth(1)).toBeFocused();
});
