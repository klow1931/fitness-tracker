const {test,expect}=require('playwright/test');
async function boot(page){await page.goto('/');await expect(page.locator('#coach-companion-launcher')).toBeVisible();await page.evaluate(()=>{fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:8},{weight:100,reps:4,rpe:''}]},{name:'Competition Squat',type:'strength',sets:[{weight:120,reps:3,rpe:9}]}],'Synthetic review',false);openFastStartLogger({compact:true});document.querySelectorAll('.set-rpe')[0].value='8';document.querySelectorAll('.set-rpe')[2].value='9';});}
test('review lists actual sets, missing effort and returns to the exact existing exercise without saving',async({page})=>{
 await boot(page);await page.setViewportSize({width:320,height:568});await page.evaluate(()=>document.documentElement.style.fontSize='20px');
 const snapshot=()=>page.evaluate(()=>({data:JSON.stringify(data),draft:captureLoggerDraft()}));const before=await snapshot();
 await page.evaluate(()=>reviewWorkout());await expect(page.locator('#workout-review')).toBeVisible();await expect(page.locator('#workout-review-title')).toBeInViewport();await expect(page.locator('.review-exercise')).toHaveCount(2);await expect(page.locator('.review-set-list li')).toHaveCount(3);await expect(page.locator('.review-recording-notice')).toContainText('1 included strength set has no recorded RPE');
 expect(await page.locator('#workout-review').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);expect(await page.locator('#workout-review>.session-review-actions').evaluate(e=>e.getBoundingClientRect().height)).toBeLessThan(120);
 await page.getByRole('button',{name:'Edit Competition Squat exercise 2',exact:true}).click();await expect(page.locator('#workout-review')).toBeHidden();await expect(page.locator('#exercise-rows > div').nth(1).locator('.set-weight')).toBeFocused();
 const after=await snapshot();delete before.draft.updatedAt;delete after.draft.updatedAt;expect(after).toEqual(before);
 await page.locator('#exercise-rows > div').nth(1).locator('.set-reps').fill('4');await page.evaluate(()=>reviewWorkout());await expect(page.locator('.review-exercise').nth(1)).toContainText('4');await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).toBeHidden();expect(await page.evaluate(()=>data.workouts[0].exercises[1].sets[0].reps)).toBe(4);
});
test('lb review stays read-only and a failed save keeps the review and entered work available',async({page})=>{
 await boot(page);await page.evaluate(()=>setUnit('lb'));await page.evaluate(()=>reviewWorkout());await expect(page.locator('.review-set-list')).toContainText(['lb','lb']);
 const before=await page.evaluate(()=>JSON.stringify(data));await page.evaluate(()=>{window.persistNow=async()=>{throw Error('synthetic storage failure');};});await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-save-status')).toContainText('Workout not saved');await expect(page.locator('#confirm-workout-save')).toBeEnabled();expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);await page.locator('#back-to-workout').click();await expect(page.locator('.set-weight').first()).not.toHaveValue('');
});
test('prescription review excludes unchecked targets and preserves original set numbering',async({page})=>{
 await boot(page);await page.evaluate(()=>{
  pendingPrescription=LoadnoteIntent.createPrescription([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,targetRpe:8},{weight:100,reps:4,targetRpe:8}]},{name:'Competition Squat',type:'strength',sets:[{weight:120,reps:3,targetRpe:9}]}]);
  const sets=document.querySelectorAll('.set-done-check');sets[0].checked=false;sets[1].checked=true;sets[2].checked=false;saveLoggerDraft();reviewWorkout();
 });
 await expect(page.locator('.review-exercise')).toHaveCount(1);await expect(page.locator('.review-set-list li')).toHaveCount(1);await expect(page.locator('.review-set-list li')).toContainText('Set 2');await expect(page.locator('.review-recording-notice')).toContainText('2 unchecked targets are excluded');
 await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).toBeHidden();expect(await page.evaluate(()=>data.workouts[0].exercises.map(e=>({name:e.name,sets:e.sets.length})))).toEqual([{name:'Competition Bench',sets:1}]);
});
test('editing a saved session retains unchecked actuals and makes one revision',async({page})=>{
 await boot(page);await page.evaluate(()=>{data.workouts=[{id:'v70-saved',date:today(),notes:'Original',exercises:[{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:8}]}]}];clearWorkoutForm(true);editWorkout('v70-saved');reviewWorkout();});
 await expect(page.locator('.review-set-list li')).toHaveCount(1);await expect(page.locator('#confirm-workout-save')).toHaveText('Save changes');await page.getByRole('button',{name:'Edit Competition Bench exercise 1',exact:true}).click();await page.locator('.set-reps').fill('6');await page.evaluate(()=>reviewWorkout());await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-review')).toBeHidden();expect(await page.evaluate(()=>data.workouts.length)).toBe(1);expect(await page.evaluate(()=>data.workouts[0].id)).toBe('v70-saved');expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].reps)).toBe(6);expect(await page.evaluate(()=>data.workoutRevisions.length)).toBeGreaterThan(0);
});
