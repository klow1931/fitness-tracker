const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
});

test('v2.79 Coach Companion stays available across surfaces and handles rest locally',async({page})=>{
 let coachCalls=0;
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:true,authRequired:true,loginAvailable:true})}));
 await page.route('**/api/coach',route=>{coachCalls++;return route.fulfill({status:500,body:'{}'});});
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await page.locator('#coach-companion-launcher').click();
 await expect(page.locator('#cc-context')).toContainText('home');
 await page.locator('.cc-close').click();

 await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('#exercise-rows .ex-name').first().fill('Competition Squat');
 await page.locator('#exercise-rows .set-weight').first().fill('180');
 await page.locator('#exercise-rows .set-reps').first().fill('4');
 await page.locator('#coach-companion-launcher').click();
 await expect(page.locator('#cc-context')).toContainText('train');
 await expect(page.locator('#cc-context')).toContainText('Workout active');
 await page.locator('#cc-input').fill("What's next?");
 await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-messages')).toContainText('Competition Squat');

 await page.locator('#cc-input').fill('Start a 3 minute rest');
 await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-messages')).toContainText('Rest timer started for 180 seconds.');
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteRestTimer?.snapshot().active)).toBe(true);
 expect(coachCalls).toBe(0);
});

test('v2.79 signed-in companion sends bounded live workout state with explicit kg/display units',async({page})=>{
 let requestBody=null;
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:true,account:{id:'acct_companion_test',displayName:'Athlete',providers:['test']},expiresAt:'2030-01-01T00:00:00.000Z',csrf:'companion-csrf',transport:'cookie',authConfigured:true,authRequired:true,loginAvailable:true})}));
 await page.route('**/api/coach',route=>{
  requestBody=route.request().postDataJSON();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({coach:{summary:'Stay with the reviewed target for this set.',insights:[],recommendation:{action:'none',exercise:null,weightKg:null,sets:null,reps:null,targetRPE:null,reason:''},confidence:'high'}})});
 });
 await page.goto('/');
 await expect(page.locator('#coach-companion-launcher')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.LoadnoteAccountSession?.snapshot().status)).toBe('authenticated');
 await page.evaluate(()=>{setUnit('lb');showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('#exercise-rows .ex-name').first().fill('Competition Squat');
 await page.locator('#exercise-rows .set-weight').first().fill('405');
 await page.locator('#exercise-rows .set-reps').first().fill('4');
 await page.locator('#exercise-rows .set-rpe').first().fill('8.5');
 await page.locator('#coach-companion-launcher').click();
 await page.locator('#cc-input').fill('Why this set?');
 await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-messages')).toContainText('Stay with the reviewed target');
 await expect.poll(()=>requestBody!==null).toBe(true);
 expect(requestBody.context.companion.surface).toBe('train');
 expect(requestBody.context.companion.liveWorkout.currentExercise.name).toBe('Competition Squat');
 expect(requestBody.context.companion.liveWorkout.currentExercise.set.displayWeight).toBe(405);
 expect(requestBody.context.companion.liveWorkout.currentExercise.set.displayUnit).toBe('lb');
 expect(requestBody.context.companion.liveWorkout.currentExercise.set.weightKg).toBeGreaterThan(183);
 expect(requestBody.context.companion.liveWorkout.currentExercise.set.weightKg).toBeLessThan(184);
 expect(requestBody.context.companion.capabilities.workoutMutation).toBe(false);
 expect(requestBody.context.companion.capabilities.programmingMutation).toBe(false);
});
