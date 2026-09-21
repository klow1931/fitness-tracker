const {test,expect}=require('playwright/test');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>{data.templates=[{id:'t',name:'Squat day',exercises:[{name:'Squat',type:'strength',sets:[{weight:100,reps:5,rpe:7}]}]}];showTab('dashboard');});});
async function schedule(page){await page.locator('#home-week-plan > summary').click();await page.locator('#week-plan [data-new-session]').click();await page.locator('#schedule-name').fill('Planned squat');await page.locator('#schedule-source').selectOption('template:0');await page.getByRole('button',{name:'Save schedule',exact:true}).click();await expect(page.locator('#schedule-dialog')).not.toBeVisible();}
test('offline planned draft survives reload and completes only after saving',async({page,context})=>{
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await schedule(page);
 await page.locator('#week-plan [data-start]').click();await expect(page.locator('.set-weight')).toHaveValue('100');await expect(page.locator('.set-rpe')).toHaveValue('');
 await page.reload();await page.evaluate(()=>showTab('workouts'));expect(await page.evaluate(()=>pendingScheduledSession.id)).toBeTruthy();
 await page.locator('.set-rpe').fill('8');await page.getByRole('button',{name:'Review workout',exact:true}).click();await page.getByRole('button',{name:'Save workout',exact:true}).click();await expect(page.locator('#workout-review')).not.toBeVisible();
 await page.evaluate(()=>showTab('dashboard'));await expect(page.locator('#week-plan')).toContainText('1 completed');expect(await page.evaluate(()=>data.workouts[0].sessionIntent.schedule.id)).toBeTruthy();
});
test('reschedule/skip reasons and failed writes do not silently change the plan',async({page})=>{
 await schedule(page);const original=await page.evaluate(()=>JSON.stringify(data.scheduledSessions));await page.locator('#week-plan [data-change]').click();await page.locator('#schedule-state').selectOption('skipped');await page.locator('#schedule-reason').fill('Time constraint');
 await page.evaluate(()=>{window.savedPersist=persistNow;persistNow=async()=>{throw Error('Storage full');};});await page.getByRole('button',{name:'Save schedule',exact:true}).click();await expect(page.locator('#schedule-error')).toContainText('Storage full');expect(await page.evaluate(()=>JSON.stringify(data.scheduledSessions))).toBe(original);
 await page.evaluate(()=>{persistNow=window.savedPersist;});await page.getByRole('button',{name:'Save schedule',exact:true}).click();await expect(page.locator('#week-plan')).toContainText('1 skipped');
});
