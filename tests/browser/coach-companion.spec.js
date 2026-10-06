const {test,expect}=require('playwright/test');

test('v2.84 Companion refresh preserves quick controls, focus and a single working click handler',async({page})=>{
 await page.route('**/api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:false,authConfigured:false,loginAvailable:false})}));
 await page.goto('/');
 await page.locator('#coach-companion-launcher').click();
 const question=page.locator('#cc-quick button').first();
 await question.focus();
 expect(await page.evaluate(()=>{
  const before=document.querySelector('#cc-quick button');
  for(let i=0;i<5;i++)LoadnoteCoachCompanionUI.refresh();
  return before===document.querySelector('#cc-quick button')&&document.activeElement===before;
 })).toBe(true);
 await question.click();
 await expect(page.locator('#cc-messages .user')).toHaveCount(1);
 await expect(page.locator('#cc-messages .assistant')).toHaveCount(2);
 await page.evaluate(()=>{
  showTab('workouts');showSubTab('workouts','wo-log');
  fillWorkoutForm([{name:'Competition Squat',type:'strength',sets:[{weight:100,reps:5,rpe:7}]}],'',false);
  LoadnoteCoachCompanionUI.refresh();
 });
 await expect(page.locator('#cc-quick')).toContainText('Why this set?');
 await expect(page.locator('#cc-quick')).not.toContainText('How is my training going?');
});

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
});

async function expectMobileLauncherClearOfDock(page){
 const viewport=page.viewportSize();
 if(!viewport||viewport.width>640)return;
 await expect(page.locator('body')).toHaveClass(/gym-floor-dock-visible/);
 await expect.poll(()=>page.evaluate(()=>{
  const launcher=document.getElementById('coach-companion-launcher')?.getBoundingClientRect();
  const dock=document.getElementById('gym-floor-dock')?.getBoundingClientRect();
  if(!launcher||!dock)return false;
  return dock.top>=launcher.bottom||dock.bottom<=launcher.top||dock.right<=launcher.left||dock.left>=launcher.right;
 })).toBe(true);
}

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
 await expectMobileLauncherClearOfDock(page);
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
 await expectMobileLauncherClearOfDock(page);
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

test('v2.82.1 mobile dark-mode Companion stays readable, inside the viewport, and dismissible',async({page})=>{
 await page.setViewportSize({width:390,height:667});
 await page.goto('/');
 await page.evaluate(()=>document.body.classList.add('dark'));
 await page.locator('#coach-companion-launcher').click();
 await expect(page.locator('#coach-companion-panel')).toBeVisible();
 await expect(page.locator('.cc-close')).toBeVisible();
 await expect(page.locator('#coach-companion-backdrop')).toBeVisible();
 const result=await page.evaluate(()=>{
  const panel=document.getElementById('coach-companion-panel').getBoundingClientRect();
  const head=document.querySelector('.cc-head').getBoundingClientRect();
  const message=getComputedStyle(document.querySelector('#coach-companion-panel .cc-msg.assistant'));
  return {panelTop:panel.top,panelBottom:panel.bottom,headTop:head.top,headBottom:head.bottom,viewport:window.innerHeight,messageBackground:message.backgroundColor,messageColor:message.color,closeHeight:document.querySelector('.cc-close').getBoundingClientRect().height};
 });
 expect(result.panelTop).toBeGreaterThanOrEqual(0);
 expect(result.panelBottom).toBeLessThanOrEqual(result.viewport+1);
 expect(result.headTop).toBeGreaterThanOrEqual(result.panelTop-1);
 expect(result.headBottom).toBeLessThanOrEqual(result.viewport);
 expect(result.closeHeight).toBeGreaterThanOrEqual(44);
 expect(result.messageBackground).toBe('rgb(30, 41, 59)');
 expect(result.messageColor).toBe('rgb(226, 232, 240)');
 await page.locator('#coach-companion-backdrop').click({position:{x:2,y:2}});
 await expect(page.locator('#coach-companion-panel')).toBeHidden();
 await page.locator('#coach-companion-launcher').click();
 await page.keyboard.press('Escape');
 await expect(page.locator('#coach-companion-panel')).toBeHidden();
});
