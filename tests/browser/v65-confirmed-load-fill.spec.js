const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-03T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await page.evaluate(()=>{
  setUnit('lb');showTab('workouts');showSubTab('workouts','wo-log');
  document.getElementById('wo-date').value=today();
  data.exerciseCatalog=[{id:'bench',name:'Competition Bench',aliases:['Comp Bench']}];
  data.workouts=[
   {id:'last',date:'2026-10-24',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[
    {weight:100,reps:5,rpe:8,done:true},{weight:125,reps:5,rpe:9,done:false},{weight:130,reps:5,warmup:true,done:true}
   ]}]},
   {id:'today',date:'2026-11-03',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:900,reps:5,done:true}]}]}
  ];
  fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:'',reps:5,rpe:''}]}],'',false);
  const set=document.querySelector('#exercise-rows .sets-container > div');
  set.querySelector('.set-weight').value='';
  set.querySelector('.set-weight').dispatchEvent(new Event('input',{bubbles:true}));
  refreshTrainingCockpit();
 });
 await expect(page.locator('#training-cockpit')).toBeVisible();
});
test('v6.5 one-tap load-only fill preserves reps, RPE, completion and saved history',async({page})=>{
 const button=page.locator('#training-cockpit [data-cockpit-use-confirmed]');
 const input=page.locator('#exercise-rows .set-weight').first(),reps=page.locator('#exercise-rows .set-reps').first(),rpe=page.locator('#exercise-rows .set-rpe').first();
 await expect(button).toBeVisible();
 await expect(page.locator('.training-cockpit-verified')).toContainText('220.5 lb');
 const saved=await page.evaluate(()=>JSON.stringify(data));
 await button.click();
 await expect(input).toHaveValue('220.5');
 await expect(reps).toHaveValue('5');
 await expect(rpe).toHaveValue('');
 await expect(page.locator('#exercise-rows .set-done-check').first()).not.toBeChecked();
 await expect(button).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(saved);
 await page.evaluate(()=>{const input=document.querySelector('#exercise-rows .set-weight');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));refreshTrainingCockpit();});
 await expect(button).toBeVisible();
 await input.fill('0');
 await expect(button).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(saved);
});
test('v6.5 click-time evidence is reread after correcting saved workout and respects rest mode',async({page})=>{
 const button=page.locator('#training-cockpit [data-cockpit-use-confirmed]');
 await expect(button).toBeVisible();
 await page.evaluate(()=>{data.workouts[0].exercises[0].sets[0].weight=105;startRest(90);});
 const saved=await page.evaluate(()=>JSON.stringify(data));
 await button.click();
 await expect(page.locator('#exercise-rows .set-weight').first()).toHaveValue('231.5');
 await expect(page.locator('#training-cockpit [data-cockpit-use-confirmed]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.activeElement?.classList.contains('set-weight'))).toBe(false);
 expect(await page.evaluate(()=>LoadnoteRestTimer.snapshot().active)).toBe(true);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(saved);
});
test('v6.5 missing or unconfirmed source, ambiguous names and rep edits never enable fill',async({page})=>{
 const button=page.locator('#training-cockpit [data-cockpit-use-confirmed]');
 await expect(button).toBeVisible();
 await page.evaluate(()=>{document.querySelector('#exercise-rows .set-reps').value='8';refreshTrainingCockpit();});
 await expect(button).toHaveCount(0);
 await page.evaluate(()=>{document.querySelector('#exercise-rows .set-reps').value='5';data.workouts[0].exercises[0].sets[0].done=false;refreshTrainingCockpit();});
 await expect(button).toHaveCount(0);
 await page.evaluate(()=>{data.workouts[0].exercises[0].sets[0].done=true;data.exerciseCatalog.push({id:'other',name:'Comp Bench'});document.querySelector('#exercise-rows .ex-name').value='Comp Bench';refreshTrainingCockpit();});
 await expect(button).toHaveCount(0);
});
