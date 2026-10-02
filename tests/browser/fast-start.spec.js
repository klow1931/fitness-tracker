const {test,expect}=require('playwright/test');

async function openTrain(page){
 const desktop=page.locator('#tab-workouts');
 if(await desktop.isVisible())await desktop.click();
 else await page.locator('.mobile-nav-btn[data-tab="workouts"]').filter({visible:true}).first().click();
}

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v2.77 Train opens a calm launcher and keeps setup behind Workout options',async({page})=>{
 await openTrain(page);
 const launcher=page.locator('#train-launcher');
 await expect(launcher).toBeVisible();
 await expect(launcher).toContainText('What are you training today?');
 await expect(page.locator('#workout-log-card')).toBeHidden();
 await launcher.locator('[data-train-primary="empty"]').click();
 await expect(page.locator('#workout-log-card')).toBeVisible();
 await expect(page.locator('#train-fast-options')).toBeVisible();
 await expect(page.locator('#wo-date')).toBeHidden();
 await page.locator('[data-fast-options-toggle]').click();
 await expect(page.locator('#wo-date')).toBeVisible();
 await expect(page.locator('#session-intent')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('v2.77 scheduled workout previews the plan and Start loads the existing logger',async({page})=>{
 await page.evaluate(()=>{
  const date=today();
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Bench Press',exerciseId:'bench-fast',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:7},{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Bench day'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Bench strength',date,role:'heavy-exposure',goal:'Bench strength',prescription:plan},{id:'fast-bench'});
  saveData(data);
 });
 await openTrain(page);
 const launcher=page.locator('#train-launcher');
 await expect(launcher).toContainText('Bench strength');
 await expect(launcher).toContainText('Competition Bench Press');
 await expect(launcher.locator('[data-train-primary="start"]')).toHaveText('Start workout');
 await launcher.locator('[data-train-primary="start"]').click();
 await expect(page.locator('#workout-log-card')).toBeVisible();
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Competition Bench Press');
 await expect.poll(()=>page.evaluate(()=>readLoggerDraft()?.sessionIntent?.schedule?.id)).toBe('fast-bench');
 await expect(page.locator('#wo-date')).toBeHidden();
});

test('v2.77 unrelated unfinished work wins over a new scheduled Start and survives Resume',async({page})=>{
 await page.evaluate(()=>{
  const date=today();
  const plan=LoadnoteIntent.createPrescription([{name:'Scheduled Deadlift',exerciseId:'dead-fast',type:'strength',trackBy:'reps',sets:[{weight:140,reps:3,targetRpe:7}]}],{type:'manual',label:'Deadlift day'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Scheduled deadlift',date,role:'heavy-exposure',goal:'Deadlift',prescription:plan},{id:'fast-dead'});
  fillWorkoutForm([{name:'Manual Squat',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}],'',false);
  document.getElementById('wo-date').value=date;
  saveLoggerDraft();saveData(data);
 });
 await openTrain(page);
 const launcher=page.locator('#train-launcher');
 await expect(launcher).toContainText('Workout in progress');
 await expect(launcher).toContainText('Resume it before starting something new');
 await expect(launcher.locator('[data-train-primary="resume"]')).toBeVisible();
 await expect(launcher.locator('[data-train-primary="start"]')).toHaveCount(0);
 await launcher.locator('[data-train-primary="resume"]').click();
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Manual Squat');
 expect(await page.evaluate(()=>readLoggerDraft()?.sessionIntent?.schedule?.id||null)).toBe(null);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('v2.77 Home Start bypasses the launcher and goes directly to the compact logger',async({page})=>{
 await page.evaluate(()=>{
  const date=today();
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Squat',exerciseId:'squat-fast',type:'strength',trackBy:'reps',sets:[{weight:120,reps:4,targetRpe:7}]}],{type:'manual',label:'Squat day'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Squat strength',date,role:'heavy-exposure',goal:'Squat strength',prescription:plan},{id:'fast-squat'});saveData(data);renderDashboard();
 });
 await page.locator('#today-training [data-today-train="fast-squat"]').click();
 await expect(page.locator('#workout-log-card')).toBeVisible();
 await expect(page.locator('#train-launcher')).toBeHidden();
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Competition Squat');
 await expect(page.locator('#train-fast-options')).toBeVisible();
});
