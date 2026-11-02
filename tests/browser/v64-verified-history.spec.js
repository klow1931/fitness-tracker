const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-02T16:00:00Z')});
 await page.route('**/api/auth/session',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false})}));
 await page.goto('/');
 await page.evaluate(()=>{
  setUnit('lb');showTab('workouts');showSubTab('workouts','wo-log');
  document.getElementById('wo-date').value=today();
  data.exerciseCatalog=[{id:'bench',name:'Competition Bench',aliases:['Comp Bench']}];
  data.workouts=[
   {id:'saved-old',date:'2026-10-10',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:95,reps:5,rpe:7,done:true}]}]},
   {id:'saved-last',date:'2026-10-24',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[
    {weight:110,reps:3,rpe:9,done:true},{weight:100,reps:5,rpe:8,done:true},
    {weight:130,reps:5,rpe:9.5,done:false},{weight:140,reps:5,rpe:10,warmup:true,done:true}
   ]}]},
   {id:'saved-today',date:'2026-11-02',exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',sets:[{weight:999,reps:5,done:true}]}]}
  ];
  fillWorkoutForm([{name:'Competition Bench',type:'strength',sets:[{weight:100,reps:5,rpe:''}]}],'',false);
  refreshTrainingCockpit();
 });
 await expect(page.locator('#training-cockpit')).toBeVisible();
});
test('v6.4 Train shows distinct same-rep confirmed performance, not ordinal last or same-day sets',async({page})=>{
 const verified=page.locator('#training-cockpit .training-cockpit-verified');
 const before=await page.evaluate(()=>JSON.stringify(data));
 await expect(verified).toContainText('Last confirmed');
 await expect(verified).toContainText('2026-10-24');
 await expect(verified).toContainText('5 reps');
 await expect(verified).toContainText('220.5 lb');
 await expect(verified).toContainText('RPE 8');
 await expect(verified).not.toContainText('999');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.evaluate(()=>{document.querySelector('#exercise-rows .set-reps').value='8';refreshTrainingCockpit();});
 await expect(verified).toHaveCount(0);
 await page.evaluate(()=>{document.querySelector('#exercise-rows .set-reps').value='5';refreshTrainingCockpit();});
 await expect(verified).toContainText('220.5 lb');
});
test('v6.4 corrects immediately when completion or exercise identity changes and preserves kg/lb',async({page})=>{
 const verified=page.locator('#training-cockpit .training-cockpit-verified');
 await page.evaluate(()=>{data.workouts[1].exercises[0].sets[1].done=false;refreshTrainingCockpit();});
 await expect(verified).toContainText('2026-10-10');
 await expect(verified).toContainText('209.4 lb');
 await page.evaluate(()=>{data.exerciseCatalog.push({id:'other',name:'Comp Bench'});document.querySelector('#exercise-rows .ex-name').value='Comp Bench';refreshTrainingCockpit();});
 await expect(verified).toHaveCount(0);
 await page.evaluate(()=>{data.exerciseCatalog.pop();setUnit('kg');refreshTrainingCockpit();});
 await expect(verified).toContainText('95 kg');
});
