const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.addStyleTag({content:'.hidden{display:none!important}'});await page.evaluate(()=>showTab('workouts'));
});
async function enter(page){await page.locator('.set-weight').fill('100');await page.locator('.set-reps').fill('5');await page.locator('.ex-name').fill('Bench Press');}
async function openOptions(page){const button=page.locator('#training-cockpit [data-cockpit-options]');await expect(button).toBeVisible();if((await button.textContent())==='Workout options')await button.click();}
test('Focus collapses completed exercises and can reopen them',async({page})=>{
 await enter(page);await openOptions(page);await page.locator('#training-focus').check();await page.locator('#training-cockpit').getByRole('button',{name:'Close options'}).click();await page.locator('.set-done-check').check();
 await expect(page.locator('.set-weight')).not.toBeVisible();await expect(page.locator('#training-progress-label')).toContainText('1/1 sets');await expect(page.locator('#training-progress-label')).toContainText('Ready to review');
 await page.getByRole('button',{name:'Show sets',exact:true}).click();await expect(page.locator('.set-weight')).toHaveValue('100');
 await page.locator('.set-done-check').uncheck();await expect(page.locator('#exercise-rows > div')).toHaveClass(/training-current/);
});
test('Reorder and swap preserve sets and survive refresh',async({page})=>{
 await enter(page);await page.locator('.set-rpe').fill('8');await page.locator('.set-done-check').check();
 await openOptions(page);await page.getByRole('button',{name:'+ Add Strength',exact:true}).click();
 const second=page.locator('#exercise-rows > div').nth(1);await second.locator('.ex-name').fill('Squat');await second.getByRole('button',{name:'Move exercise up'}).click();
 const bench=page.locator('#exercise-rows > div').nth(1);await bench.getByRole('button',{name:'Swap',exact:true}).click();
 await page.locator('#swap-name').fill('Machine Press');await page.getByRole('button',{name:'Swap and keep sets'}).click();
 await expect(bench.locator('.set-weight')).toHaveValue('100');await expect(bench.locator('.set-rpe')).toHaveValue('8');await expect(bench.locator('.set-done-check')).toBeChecked();
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(2);await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.ex-name').first()).toHaveValue('Squat');await expect(page.locator('.ex-name').last()).toHaveValue('Machine Press');await expect(page.locator('.set-weight').last()).toHaveValue('100');
});
test('Paused rest survives refresh and expired rest completes once',async({page})=>{
 await page.getByRole('button',{name:'1.5m',exact:true}).click();await page.locator('#rest-pause').click();
 await page.locator('#rest-add').click();const before=await page.locator('#rest-timer').textContent();
 await page.reload();await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('#rest-timer')).toHaveText(before);await expect(page.locator('#rest-pause')).toHaveText('Resume');
 await page.locator('#rest-pause').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('loadnote-rest-v1')).paused)).toBe(false);
 await page.evaluate(()=>{localStorage.setItem('loadnote-rest-v1',JSON.stringify({total:60000,remaining:60000,deadline:Date.now()-1,paused:false}));});
 await page.reload();await expect(page.locator('#rest-timer')).toHaveText('Done!');expect(await page.evaluate(()=>localStorage.getItem('loadnote-rest-v1'))).toBeNull();
});
test('Finish reviews before saving and recap shows matching prior sets',async({page})=>{
 await page.evaluate(()=>{data.workouts=[{id:'previous',date:'2026-01-01',exercises:[{name:'Bench Press',type:'strength',trackBy:'reps',sets:[{reps:5,weight:80}]}]}];});
 await enter(page);await page.locator('#training-cockpit').getByRole('button',{name:'Finish',exact:true}).click();
 await expect(page.locator('#workout-recap')).not.toBeVisible();await page.locator('#confirm-workout-save').click();
 await expect(page.locator('#workout-recap')).toContainText('Session saved');await expect(page.locator('#workout-recap')).toContainText('80kg');await expect(page.locator('#workout-recap')).toContainText('100kg');
});
test('v2.75 execution mode hides setup chrome after meaningful work and keeps one primary finish action',async({page})=>{
 await expect(page.locator('body')).not.toHaveClass(/training-execution-active/);
 await expect(page.locator('#wo-date')).toBeVisible();
 await page.locator('.ex-name').fill('Bench Press');
 await expect(page.locator('body')).not.toHaveClass(/training-execution-active/);
 await page.locator('.set-weight').fill('100');await page.locator('.set-reps').fill('5');
 await expect(page.locator('body')).toHaveClass(/training-execution-active/);
 await expect(page.locator('#wo-date')).not.toBeVisible();
 await expect(page.getByRole('button',{name:'+ Add Strength',exact:true})).not.toBeVisible();
 await expect(page.locator('#training-cockpit [data-cockpit-review]')).toBeVisible();
 await expect(page.locator('#workout-actions [data-workout-action="review"]')).not.toBeVisible();
 await openOptions(page);
 await expect(page.locator('body')).toHaveClass(/training-execution-options-open/);
 await expect(page.locator('#wo-date')).toBeVisible();
 await expect(page.getByRole('button',{name:'+ Add Strength',exact:true})).toBeVisible();
 await expect(page.locator('#training-cockpit [data-cockpit-review]')).toBeVisible();
 await expect(page.locator('#workout-actions [data-workout-action="review"]')).not.toBeVisible();
 await page.locator('#training-cockpit').getByRole('button',{name:'Close options'}).click();
 await expect(page.locator('#wo-date')).not.toBeVisible();
});

test('v2.75 current exercise stays expanded while upcoming and completed exercises collapse',async({page})=>{
 await page.evaluate(()=>{
  data.checklistMode=true;toggleChecklistMode();
  const first=document.querySelector('#exercise-rows > div');
  first.querySelector('.ex-name').value='Bench Press';first.querySelector('.set-weight').value='100';first.querySelector('.set-reps').value='5';
  addExerciseRow({name:'Chest-Supported Row',type:'strength',trackBy:'reps',sets:[{weight:60,reps:8,rpe:''}]});
  saveLoggerDraft();refreshTrainingExecution();updateTrainingFlow();
 });
 const rows=page.locator('#exercise-rows > div');
 await expect(rows.first()).toHaveClass(/training-execution-current/);
 await expect(rows.nth(1)).toHaveClass(/training-execution-upcoming/);
 await expect(rows.nth(1)).toHaveClass(/training-collapsed/);
 await expect(rows.nth(1).locator('.set-weight')).not.toBeVisible();
 await rows.first().locator('.set-done-check').check();
 await expect(rows.first()).toHaveClass(/training-execution-complete/);
 await expect(rows.first()).toHaveClass(/training-collapsed/);
 await expect(rows.nth(1)).toHaveClass(/training-execution-current/);
 await expect(rows.nth(1)).not.toHaveClass(/training-collapsed/);
 await expect(rows.nth(1).locator('.set-weight')).toBeVisible();
});

test('v2.75 active rest controls live in the cockpit while legacy rest controls stay behind Workout options',async({page})=>{
 await enter(page);
 await expect(page.locator('body')).toHaveClass(/training-execution-active/);
 const cockpit=page.locator('#training-cockpit');
 await openOptions(page);
 await page.getByRole('button',{name:'1.5m',exact:true}).click();
 await expect(cockpit.locator('[data-cockpit-rest]')).toContainText('90s');
 await cockpit.getByRole('button',{name:'Close options'}).click();
 await expect(page.locator('#rest-pause')).not.toBeVisible();
 await cockpit.locator('[data-cockpit-rest-add]').click();
 await expect(cockpit.locator('[data-cockpit-rest]')).toContainText('120s');
 await cockpit.locator('[data-cockpit-rest-pause]').click();
 await expect(cockpit.locator('[data-cockpit-rest]')).toContainText('paused');
 await cockpit.locator('[data-cockpit-rest-stop]').click();
 await expect(cockpit.locator('[data-cockpit-rest]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Cardio completion is recoverable and mobile controls fit',async({page})=>{
 await page.getByRole('button',{name:'+ Add Cardio',exact:true}).click();await page.locator('.cardio-duration').fill('20');await page.locator('.ex-name').last().fill('Cycling');await page.locator('.cardio-done').check();
 await page.reload();await page.evaluate(()=>showTab('workouts'));await expect(page.locator('#exercise-rows > div').last()).toHaveClass(/training-collapsed/);
 await page.getByRole('button',{name:'Show sets',exact:true}).last().click();await expect(page.locator('.cardio-done')).toBeChecked();
 for(const dark of [false,true]){await page.evaluate(dark=>{data.dark=dark;applyDark();},dark);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
});
