const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});
async function addToday(page,id='today-session'){
 await page.evaluate(id=>{
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,targetRpe:7},{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Bench day'});
  data.scheduledSessions=LoadnoteSchedule.create(data.scheduledSessions||[],{name:'Bench day',date:today(),role:'heavy-exposure',goal:'Build bench strength',prescription:plan},{id});
  saveData(data);renderDashboard();
 },id);
}
test('Home makes today scheduled training a one-tap start and resumes the draft after reload',async({page})=>{
 await addToday(page);
 await expect(page.locator('#today-training')).toContainText('Bench day');
 await expect(page.locator('#today-training')).toContainText('2 planned sets');
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 await expect(page.locator('.ex-name')).toHaveValue('Competition Bench Press');
 await expect(page.locator('.set-weight').first()).toHaveValue('100');
 await expect(page.locator('.set-rpe').first()).toHaveValue('');
 expect(await page.evaluate(()=>document.getElementById('wo-date').value===today())).toBe(true);
 await page.locator('.set-rpe').first().fill('7.5');
 await page.reload();await expect(page.locator('.ex-name')).toHaveValue('Competition Bench Press');
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await expect(page.locator('#today-training')).toContainText('Workout in progress');
 await page.getByRole('button',{name:'Resume workout',exact:true}).click();
 await expect(page.locator('.set-rpe').first()).toHaveValue('7.5');
});
test('scheduled session must be rescheduled to today before it can start',async({page})=>{
 await page.evaluate(()=>{
  const d=new Date(today()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);const tomorrow=d.toISOString().slice(0,10);
  const plan=LoadnoteIntent.createPrescription([{name:'Squat',type:'strength',sets:[{weight:100,reps:5,targetRpe:7}]}],{type:'manual',label:'Squat'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Tomorrow squat',date:tomorrow,role:'heavy-exposure',goal:'Squat',prescription:plan},{id:'future'});
 });
 await page.evaluate(()=>startScheduledWorkout('future'));
 await expect(page.locator('#toast-host')).toContainText('Reschedule this session to today');
 expect(await page.evaluate(()=>readLoggerDraft()?.sessionIntent?.schedule?.id||null)).toBeNull();
});
test('Home reports scheduled training as logged after the linked workout is saved',async({page})=>{
 await addToday(page,'complete-me');await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await page.locator('.set-rpe').first().fill('7');await page.locator('.set-rpe').nth(1).fill('7');
 await page.locator('#workout-actions [data-workout-action="review"]').click();
 await page.getByRole('button',{name:'Save workout',exact:true}).click();
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await expect(page.locator('#today-training')).toContainText('Training logged');
 await expect(page.getByRole('button',{name:'View workout history',exact:true})).toBeVisible();
});
