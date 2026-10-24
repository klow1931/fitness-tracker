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
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Future full body',date:'2026-10-26',role:'mixed',prescription},{id:'starter-future'});
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

test('v3.95 after a saved workout on an earlier day, the beginner can reach the next log or history without auto-logging',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>{fillWorkoutForm([{name:'Goblet Squat',type:'strength',trackBy:'reps',sets:[{weight:15,reps:8,rpe:''}]}],'',false);reviewWorkout();});
 await page.locator('#confirm-workout-save').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 await page.clock.setSystemTime(new Date('2026-10-24T15:00:00.000Z'));
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 const card=page.locator('#beginner-first-week');
 await expect(card).toContainText('Repeat last workout');
 await expect(card).toContainText('No training day is assumed');
 await expect(card.locator('[data-first-week-history]')).toBeVisible();
 await card.locator('[data-first-week-history]').click();
 await expect(page.locator('#panel-workouts')).toBeVisible();
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await card.locator('[data-first-week-action]').click();
 await expect(page.locator('#workout-log-card')).toBeVisible();
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Goblet Squat');
 await expect(page.locator('#exercise-rows .set-rpe').first()).toHaveValue('');
 await expect(page.locator('#exercise-rows .set-done-check').first()).not.toBeChecked();
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].rpe)).toBeFalsy();
});

test('v3.96 repeating workout two preserves historical data, leaves effort unknown, and recovers offline draft',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>{fillWorkoutForm([{name:'Goblet Squat',type:'strength',trackBy:'reps',
  sets:[{weight:15,reps:8,rpe:8}]}],'',false);reviewWorkout();});
 await page.locator('#confirm-workout-save').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));
 const sourceId=await page.evaluate(()=>String(data.workouts[0].id));
 await page.clock.setSystemTime(new Date('2026-10-24T15:00:00.000Z'));
 await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 const card=page.locator('#beginner-first-week');
 await expect(card.locator('[data-first-week-new]')).toBeVisible();
 await expect(card).toContainText('mark only sets you complete');
 await card.locator('[data-first-week-action]').click();
 await expect(page.locator('#workout-log-card')).toBeVisible();
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Goblet Squat');
 await expect(page.locator('#exercise-rows .set-reps').first()).toHaveValue('8');
 await expect(page.locator('#exercise-rows .set-rpe').first()).toHaveValue('');
 await expect(page.locator('#exercise-rows .set-done-check').first()).not.toBeChecked();
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
 const expectedSource=await page.evaluate(()=>readLoggerDraft()?.sessionIntent?.source?.referenceId);
 expect(expectedSource===sourceId||String(expectedSource)===sourceId).toBe(true);
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);
 await expect(page.locator('#exercise-rows .ex-name').first()).toHaveValue('Goblet Squat');
 await expect(page.locator('#exercise-rows .set-rpe').first()).toHaveValue('');
 await expect(page.locator('#exercise-rows .set-done-check').first()).not.toBeChecked();
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('v3.96 a next scheduled session or unfinished draft outranks repeat',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>{fillWorkoutForm([{name:'Goblet Squat',type:'strength',
  sets:[{weight:15,reps:8}]}],'',false);reviewWorkout();});
 await page.locator('#confirm-workout-save').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 await page.clock.setSystemTime(new Date('2026-10-24T15:00:00.000Z'));
 await page.evaluate(()=>{
  const prescription=LoadnoteIntent.createPrescription([{name:'Goblet Squat',type:'strength',
   sets:[{weight:null,reps:8,targetRpe:null}]}],{type:'manual',label:'Starter'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Upcoming',date:'2026-10-26',role:'mixed',prescription},{id:'planned-repeat'});
  renderDashboard();
 });
 await expect(page.locator('#beginner-first-week [data-first-week-action]')).toContainText('View upcoming workout');
 await expect(page.locator('#beginner-first-week [data-first-week-new]')).toHaveCount(0);
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
});
