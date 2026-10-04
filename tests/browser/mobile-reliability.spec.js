const {test,expect}=require('playwright/test');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('workouts'));
});
async function enter(page){
 await page.locator('.ex-name').fill('Competition Bench');await page.locator('.set-reps').fill('5');
 await page.locator('.set-weight').fill('100');await page.locator('.set-rpe').fill('8');
}
test('draft failure stays visible in execution mode and retry checkpoints latest values',async({page})=>{
 await enter(page);
 await page.evaluate(()=>{window.originalDraftSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='loadnote-workout-draft-v1')throw Error('quota');return window.originalDraftSet.call(this,key,value);};});
 await page.locator('.set-weight').fill('105');
 await expect(page.locator('#logger-draft-failure')).toBeVisible();
 await expect(page.locator('#logger-draft-failure')).toContainText('excludes unfinished sets');
 expect(await page.evaluate(()=>readLoggerDraft().rows[0].sets[0].weight)).toBe('100');
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalDraftSet;});
 await page.getByRole('button',{name:'Retry draft save',exact:true}).click();
 await expect(page.locator('#logger-draft-failure')).toBeHidden();
 await page.reload();await expect(page.locator('.set-weight')).toHaveValue('105');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('offline interruption checkpoints cardio, units, notes and completion without creating history',async({page,context})=>{
 await enter(page);
 await page.evaluate(()=>{setUnit('lb');document.getElementById('wo-notes').value='Interrupted session';addExerciseRow({name:'Cycling',type:'cardio'});const row=document.querySelector('#exercise-rows').lastElementChild;row.querySelector('.cardio-duration').value='12';row.querySelector('.cardio-done').checked=true;window.dispatchEvent(new Event('pagehide'));});
 const before=await page.evaluate(()=>{const d=readLoggerDraft();delete d.updatedAt;return d;});
 // Cached offline app must resume from an acknowledged draft, not invent a workout.
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();
 await expect(page.locator('.set-weight')).toHaveValue('220.46');
 const after=await page.evaluate(()=>{const d=LoadnoteDraft.normalize(captureLoggerDraft());delete d.updatedAt;return d;});
 expect(after).toEqual(before);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await context.setOffline(false);
});
test('failed reviewed commit retries exactly once and survives restart',async({page})=>{
 await enter(page);await page.evaluate(()=>reviewWorkout());
 await page.evaluate(()=>{window.originalWorkoutPersist=persistNow;persistNow=async()=>{throw Error('quota');};});
 await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-save-status')).toContainText('Workout not saved');
 await expect(page.locator('#confirm-workout-save')).toBeEnabled();
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await page.evaluate(()=>{persistNow=window.originalWorkoutPersist;});
 await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).toBeHidden();
 await page.reload();expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
 expect(await page.evaluate(()=>readLoggerDraft())).toBeNull();
});
test('legacy draft survives current release without rewriting its training values',async({page})=>{
 // Seed on the new document, after the outgoing page's pagehide checkpoint.
 await page.addInitScript(()=>localStorage.setItem('loadnote-workout-draft-v1',JSON.stringify({version:1,date:'2026-09-25',notes:'Legacy draft',unit:'kg',program:null,rows:[{type:'strength',trackBy:'reps',setCount:1,fields:[{value:'Competition Squat'},{value:'Keep cue'},{value:'5'},{value:'140'},{value:'7'}]}]})));
 await page.reload();await expect(page.locator('.ex-name')).toHaveValue('Competition Squat');
 await expect(page.locator('.set-weight')).toHaveValue('140');await expect(page.locator('.set-rpe')).toHaveValue('7');
 expect(await page.evaluate(()=>captureLoggerDraft().notes)).toBe('Legacy draft');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
