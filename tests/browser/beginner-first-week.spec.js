const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-23T15:00:00.000Z')});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});
test('v3.94 first-week Home starts a real logger, preserves unknown RPE and records only after Save',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await expect(page.locator('#beginner-first-week')).toContainText('0 saved workouts');
 await page.locator('#beginner-first-week [data-first-week-action]').click();
 await expect(page.locator('#workout-log-card')).toBeVisible();
 await page.evaluate(()=>{fillWorkoutForm([{name:'Goblet Squat',type:'strength',trackBy:'reps',
  sets:[{weight:15,reps:8,rpe:''}]}],'',false);reviewWorkout();});
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await page.locator('#confirm-workout-save').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await expect(page.locator('#beginner-first-week')).toContainText('1 saved workout');
 await expect(page.locator('#beginner-first-week')).toContainText('No next session is scheduled');
 await page.locator('#beginner-first-week [data-first-week-action]').click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 expect(await page.evaluate(()=>!data.workouts[0].exercises[0].sets[0].rpe)).toBe(true);
});
test('v3.94 first-week next scheduled session is shown as planned, with Calendar action',async({page})=>{
 await page.locator('[data-beginner-entry=help]').click();
 await page.locator('#starter-close').click();
 await page.evaluate(()=>{
  const prescription=LoadnoteIntent.createPrescription([{name:'Goblet Squat',type:'strength',sets:[{weight:null,reps:8,targetRpe:null}]}],{type:'manual',label:'Starter'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Future full body',date:'2026-10-26',role:'general',prescription},{id:'starter-future'});
  renderDashboard();
 });
 await expect(page.locator('#beginner-first-week')).toContainText('2026-10-26');
 await expect(page.locator('#beginner-first-week')).toContainText('plan, not a completed session');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await page.locator('#beginner-first-week [data-first-week-action]').click();
 await expect(page.locator('#panel-calendar')).toBeVisible();
});
test('v3.94 no extra first-week panel for an athlete outside guided beginner route',async({page})=>{
 await expect(page.locator('#beginner-first-week')).toHaveCount(0);
});
