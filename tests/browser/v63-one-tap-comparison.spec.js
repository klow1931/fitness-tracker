const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.evaluate(()=>{
  setUnit('lb');showTab('workouts');showSubTab('workouts','wo-log');
  document.getElementById('wo-date').value=today();
  data.exerciseCatalog=[{id:'bench',name:'Competition Bench'},{id:'row',name:'Chest-supported Row'}];
  data.workouts=[{id:'prior-bench',date:'2026-10-24',createdAt:'2026-10-24T20:00:00.000Z',
   exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:8,done:true}]}]}];
  fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:''}]},
   {name:'Chest-supported Row',type:'strength',sets:[{weight:60,reps:10,rpe:''}]}],'',false);
 });
 await page.locator('#exercise-rows .set-weight').first().fill('225');
});
test('v6.3 one-tap comparison follows the checked bench when logger advances to the next exercise',async({page})=>{
 const button=page.locator('#training-cockpit [data-cockpit-compare]');
 await expect(button).toHaveCount(0);
 await page.locator('#exercise-rows > div').first().locator('.quick-set-entry:visible [data-quick-rpe="8.5"]').click();
 await expect(button).toBeVisible();
 const saved=await page.evaluate(()=>JSON.stringify(data));
 await button.click();
 await expect(page.locator('#coach-companion-panel')).toBeVisible();
 const reply=page.locator('#cc-messages .assistant').last();
 await expect(reply).toContainText('Exact-rep comparison for Competition Bench');
 await expect(reply).toContainText('220.5 lb');
 await expect(reply).toContainText('225 lb');
 await expect(reply).toContainText('+4.5 lb');
 await expect(reply).toContainText('unsaved draft');
 await expect(page.locator('#cc-quick')).toContainText('Compare my checked set to last time');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(saved);
 await reply.getByRole('button',{name:'Return to workout'}).click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 await expect(page.locator('#exercise-rows .set-weight').first()).toHaveValue('225');
 await expect(page.locator('#exercise-rows .set-rpe').first()).toHaveValue('8.5');
 await expect(page.locator('#exercise-rows .set-done-check').first()).toBeChecked();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(saved);
});
test('v6.3 shows the comparison only for checked strength sets dated today',async({page})=>{
 const button=page.locator('#training-cockpit [data-cockpit-compare]');
 await expect(button).toHaveCount(0);
 await page.locator('#exercise-rows > div').first().locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(button).toBeVisible();
 // The date input is intentionally hidden in gym-floor execution mode.
 // Simulate the same value/input event without opening a hidden secondary form.
 await page.evaluate(day=>{const input=document.getElementById('wo-date');input.value=day;input.dispatchEvent(new Event('input',{bubbles:true}));refreshTrainingCockpit();},'2026-10-31');
 await expect(button).toHaveCount(0);
 await page.evaluate(day=>{const input=document.getElementById('wo-date');input.value=day;input.dispatchEvent(new Event('input',{bubbles:true}));refreshTrainingCockpit();},'2026-11-01');
 await expect(button).toBeVisible();
});
test('v6.3 still opens an honest read-only empty-history result after a checked set',async({page})=>{
 await page.locator('#exercise-rows > div').first().locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(page.locator('#training-cockpit [data-cockpit-compare]')).toBeVisible();
 // The review must read corrected saved state at question time, not cache
 // the previous session from when the draft set was completed.
 await page.evaluate(()=>{data.workouts=[];});
 const saved=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#training-cockpit [data-cockpit-compare]').click();
 await expect(page.locator('#cc-messages .assistant').last()).toContainText('No earlier saved working sets');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(saved);
});
