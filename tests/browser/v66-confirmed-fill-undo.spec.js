const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-03T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await page.evaluate(()=>{
  setUnit('lb');showTab('workouts');showSubTab('workouts','wo-log');
  document.getElementById('wo-date').value=today();
  data.exerciseCatalog=[{id:'bench',name:'Competition Bench'}];
  data.workouts=[{id:'last',date:'2026-10-24',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:8,done:true}]}]}];
  fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:'',reps:5,rpe:''}]}],'',false);
  const weight=document.querySelector('#exercise-rows .set-weight');
  weight.value='';weight.dispatchEvent(new Event('input',{bubbles:true}));
  refreshTrainingCockpit();
 });
 await expect(page.locator('#training-cockpit')).toBeVisible();
 await expect(page.locator('#training-cockpit [data-cockpit-use-confirmed]')).toBeVisible();
});
test('v6.6 reversible fill restores only blank load and preserves saved workout, RPE and reps',async({page})=>{
 const use=page.locator('#training-cockpit [data-cockpit-use-confirmed]'),undo=page.locator('#training-cockpit [data-cockpit-undo-confirmed]');
 const weight=page.locator('#exercise-rows .set-weight').first(),rpe=page.locator('#exercise-rows .set-rpe').first(),reps=page.locator('#exercise-rows .set-reps').first();
 const history=await page.evaluate(()=>JSON.stringify(data));
 await expect(undo).toHaveCount(0);
 await use.click();await expect(weight).toHaveValue('220.5');await expect(undo).toBeVisible();
 await undo.click();await expect(weight).toHaveValue('');await expect(reps).toHaveValue('5');
 await expect(rpe).toHaveValue('');await expect(page.locator('#exercise-rows .set-done-check').first()).not.toBeChecked();
 await expect(undo).toHaveCount(0);await expect(use).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(history);
});
test('v6.6 manual numeric entry invalidates undo, including typing back to the same load',async({page})=>{
 const use=page.locator('#training-cockpit [data-cockpit-use-confirmed]'),undo=page.locator('#training-cockpit [data-cockpit-undo-confirmed]');
 const input=page.locator('#exercise-rows .set-weight').first();
 await use.click();await expect(undo).toBeVisible();
 await input.fill('225');await expect(undo).toHaveCount(0);
 await input.fill('220.5');await expect(undo).toHaveCount(0);
 await expect(input).toHaveValue('220.5');
});
test('v6.6 changing reps, units or completing the set revokes undo',async({page})=>{
 const use=page.locator('#training-cockpit [data-cockpit-use-confirmed]'),undo=page.locator('#training-cockpit [data-cockpit-undo-confirmed]');
 await use.click();await expect(undo).toBeVisible();
 await page.evaluate(()=>{const reps=document.querySelector('#exercise-rows .set-reps');reps.value='3';reps.dispatchEvent(new Event('input',{bubbles:true}));refreshTrainingCockpit();});
 await expect(undo).toHaveCount(0);
 await page.evaluate(()=>{const reps=document.querySelector('#exercise-rows .set-reps');reps.value='5';reps.dispatchEvent(new Event('input',{bubbles:true}));refreshTrainingCockpit();});
 await expect(undo).toHaveCount(0);
 await page.evaluate(()=>{const weight=document.querySelector('#exercise-rows .set-weight');weight.value='';weight.dispatchEvent(new Event('input',{bubbles:true}));refreshTrainingCockpit();});
 await use.click();await expect(undo).toBeVisible();
 await page.evaluate(()=>{setUnit('kg');refreshTrainingCockpit();});
 await expect(undo).toHaveCount(0);
 await page.evaluate(()=>{setUnit('lb');refreshTrainingCockpit();});
 await expect(undo).toHaveCount(0);
 await page.evaluate(()=>{const weight=document.querySelector('#exercise-rows .set-weight');weight.value='';weight.dispatchEvent(new Event('input',{bubbles:true}));refreshTrainingCockpit();});
 await use.click();await expect(undo).toBeVisible();
 await page.locator('#exercise-rows > div').first().locator('.quick-set-entry:visible [data-quick-rpe="8"]').click();
 await expect(undo).toHaveCount(0);
});
test('v6.6 undo works during rest, does not open numeric keyboard and is transient across reload',async({page})=>{
 const use=page.locator('#training-cockpit [data-cockpit-use-confirmed]'),undo=page.locator('#training-cockpit [data-cockpit-undo-confirmed]');
 await page.evaluate(()=>startRest(90));
 const history=await page.evaluate(()=>JSON.stringify(data));
 await use.click();await expect(undo).toBeVisible();
 await undo.click();
 expect(await page.evaluate(()=>LoadnoteRestTimer.snapshot().active)).toBe(true);
 expect(await page.evaluate(()=>document.activeElement?.classList.contains('set-weight'))).toBe(false);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(history);
 await use.click();await expect(undo).toBeVisible();
 await page.reload();
 await expect(page.locator('#training-cockpit [data-cockpit-undo-confirmed]')).toHaveCount(0);
});
