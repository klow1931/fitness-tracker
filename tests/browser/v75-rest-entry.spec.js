const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-06T16:00:00Z')});await page.clock.setFixedTime(new Date('2026-11-06T16:00:00Z'));await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.locator('[data-beginner-entry=log]').click();await page.evaluate(()=>{data.gymMode=true;data.gymModeUserSet=true;saveData(data);});
 await page.locator('.ex-name').fill('Bench Press');await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill('100');
 await expect(page.locator('[data-cockpit-options]')).toBeVisible();await page.locator('[data-cockpit-options]').click();
 await page.getByRole('button',{name:'+ Same Set',exact:true}).click();await page.getByRole('button',{name:'Close options',exact:true}).click();await expect(page.locator('.set-weight')).toHaveCount(2);await page.locator('.set-weight').first().focus();
});
async function complete(page){await page.locator('[data-quick-complete]:visible').click();await expect(page.locator('[data-cockpit-rest]')).toBeVisible();}
test('rest clock, pause and extension preserve controls and do not change training',async({page})=>{
 await complete(page);const before=await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows));const pause=page.locator('[data-cockpit-rest-pause]');
 await expect(page.locator('[data-rest-clock]')).toHaveText('1:30');await pause.focus();await page.clock.setFixedTime(new Date('2026-11-06T16:00:01.100Z'));await page.clock.runFor(300);await expect(page.locator('[data-rest-clock]')).toHaveText('1:29');await expect(pause).toBeFocused();
 await pause.click();await expect(page.locator('[data-rest-state]')).toHaveText('Rest paused');await page.clock.runFor(10000);await expect(page.locator('[data-rest-clock]')).toHaveText('1:29');
 await page.locator('[data-cockpit-rest-add]').click();await expect(page.locator('[data-rest-clock]')).toHaveText('1:59');expect(await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows))).toBe(before);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('Back to set ends rest and focuses the next unfinished load without completing or saving it',async({page})=>{
 await page.evaluate(()=>setUnit('lb'));await complete(page);const before=await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows));
 await page.getByRole('button',{name:'Back to set',exact:true}).click();await expect(page.locator('[data-cockpit-rest]')).toHaveCount(0);await expect(page.locator('.set-weight').nth(1)).toBeFocused();await expect(page.locator('.set-done-check').first()).toBeChecked();await expect(page.locator('.set-done-check').nth(1)).not.toBeChecked();await expect(page.locator('.set-rpe').nth(1)).toHaveValue('');
 expect(await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows))).toBe(before);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('loadnote-rest-v1'))).toBeNull();
});
test('paused rest and the unfinished set survive reload and explicit return',async({page})=>{
 await complete(page);await page.locator('[data-cockpit-rest-pause]').click();await page.reload();await expect(page.locator('.set-weight')).toHaveCount(2);await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('[data-rest-state]')).toHaveText('Rest paused');await expect(page.locator('[data-rest-clock]')).toHaveText('1:30');await page.getByRole('button',{name:'Back to set',exact:true}).click();await expect(page.locator('.set-weight').nth(1)).toBeFocused();await expect(page.locator('.set-done-check').nth(1)).not.toBeChecked();expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('finished work has no return-to-set action and cannot be silently completed twice',async({page})=>{
 await complete(page);await page.getByRole('button',{name:'Back to set',exact:true}).click();await page.locator('[data-quick-complete]:visible').click();await expect(page.locator('[data-cockpit-rest-return]')).toHaveCount(0);
 expect(await page.evaluate(()=>LoadnoteTrainingCockpitUI.returnToEntry())).toBe(false);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);await expect(page.locator('.set-done-check')).toHaveCount(2);await expect(page.locator('.set-done-check').nth(1)).toBeChecked();
});
test('return supports a timed next exercise without recording a duration or effort',async({page})=>{
 page.once('dialog',dialog=>dialog.accept());await page.evaluate(()=>{fillWorkoutForm([{name:'Bench Press',type:'strength',sets:[{weight:100,reps:5}]},{name:'Plank',type:'strength',trackBy:'duration',sets:[{weight:0,duration:30}]}],'',false);});
 await complete(page);await page.getByRole('button',{name:'Back to set',exact:true}).click();await expect(page.locator('.set-weight').nth(1)).toBeFocused();await expect(page.locator('.set-duration')).toHaveValue('30');await expect(page.locator('.set-rpe').nth(1)).toHaveValue('');await expect(page.locator('.set-done-check').nth(1)).not.toBeChecked();expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('narrow enlarged-text rest controls fit and remain keyboard reachable',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='20px');await complete(page);const button=page.getByRole('button',{name:'Back to set',exact:true});await expect(button).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await button.focus();await page.keyboard.press('Enter');await expect(page.locator('.set-weight').nth(1)).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('cardio return focuses duration without marking cardio done or recording a new workout',async({page})=>{
 page.once('dialog',dialog=>dialog.accept());await page.evaluate(()=>fillWorkoutForm([{name:'Bench Press',type:'strength',sets:[{weight:100,reps:5}]},{name:'Bike',type:'cardio',duration:20,distance:5}],'',false));
 await complete(page);const before=await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows));await page.getByRole('button',{name:'Back to exercise',exact:true}).click();await expect(page.locator('.cardio-duration')).toBeFocused();await expect(page.locator('.cardio-done')).not.toBeChecked();expect(await page.evaluate(()=>JSON.stringify(captureLoggerDraft().rows))).toBe(before);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
