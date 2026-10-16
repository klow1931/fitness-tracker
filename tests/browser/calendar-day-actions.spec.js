const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 page.calendarErrors=[];page.on('pageerror',error=>page.calendarErrors.push(error.message));
 await page.clock.install({time:new Date('2026-10-16T14:00:00Z')});
 await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{showTab('calendar');calCursor=new Date('2026-10-16T12:00:00');renderCalendar();});
});
test.afterEach(async({page})=>{expect(page.calendarErrors).toEqual([]);});
async function choose(page,date,action){
 await page.locator('#calendar-grid [aria-label^="'+date+'"]').click();
 await expect(page.locator('#calendar-day-actions')).toBeVisible();
 await page.locator('[data-calendar-action="'+action+'"]').click();
}
test('past day offers three actions, cancel and day details without changing records',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await choose(page,'2026-10-12','cancel');await expect(page.locator('#calendar-day-actions')).not.toBeVisible();
 await expect(page.locator('#calendar-grid [aria-label^="2026-10-12"]')).toBeFocused();
 await choose(page,'2026-10-12','view');await expect(page.locator('#cal-day-detail')).toBeInViewport();
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('past workout opens full logger on the chosen date and preserves entered work',async({page})=>{
 await choose(page,'2026-10-12','workout');await expect(page.locator('#wo-date')).toHaveValue('2026-10-12');
 await expect(page.locator('#wo-date')).toBeFocused();
 await page.locator('.ex-name').fill('Bench press');await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill('100');
 await page.locator('#wo-notes').evaluate(el=>{el.value='Past workout';});
 await page.evaluate(()=>{saveLoggerDraft();showTab('calendar');});
 page.once('dialog',d=>d.dismiss());await choose(page,'2026-10-13','workout');
 await expect(page.locator('#calendar-day-actions')).toBeVisible();
 expect(await page.evaluate(()=>document.getElementById('wo-date').value)).toBe('2026-10-12');
 page.once('dialog',d=>d.accept());await page.locator('[data-calendar-action="workout"]').click();
 await expect(page.locator('#wo-date')).toHaveValue('2026-10-13');await expect(page.locator('.ex-name')).toHaveValue('Bench press');
 await expect(page.locator('#wo-notes')).toHaveValue('Past workout');
 await page.reload({waitUntil:'domcontentloaded'});expect(await page.evaluate(()=>document.getElementById('wo-date').value)).toBe('2026-10-13');
});
test('nutrition opens food entry for the chosen day and loads that day only',async({page})=>{
 await page.evaluate(()=>{data.nutrition=[{date:'2026-10-12',foods:[{id:'food',name:'Existing oats',servings:1,calories:150,protein:5,carbs:27,fat:3}],complete:false}];});
 const before=await page.evaluate(()=>JSON.stringify(data));
 await choose(page,'2026-10-12','nutrition');await expect(page.locator('#panel-nutrition')).toBeVisible();
 await expect(page.locator('[data-panel="nutrition"][data-sub="nu-add"]')).toBeVisible();
 expect(await page.evaluate(()=>document.getElementById('nu-date').value)).toBe('2026-10-12');
 expect(await page.evaluate(()=>dayFoods.map(f=>f.name))).toEqual(['Existing oats']);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('schedule form carries the tapped date and saving creates only a plan',async({page})=>{
 await page.evaluate(()=>{data.templates=[{id:'t',name:'Bench day',exercises:[{name:'Bench',type:'strength',sets:[{weight:100,reps:5}]}]}];});
 await choose(page,'2026-10-20','schedule');await expect(page.locator('#schedule-date')).toHaveValue('2026-10-20');
 await page.locator('#schedule-name').fill('Tuesday bench');await page.locator('#schedule-source').selectOption('template:0');
 await page.locator('#schedule-dialog button[type=submit]').click();await expect(page.locator('#schedule-dialog')).not.toBeVisible();
 expect(await page.evaluate(()=>LoadnoteSchedule.list(data.scheduledSessions).map(s=>s.date))).toEqual(['2026-10-20']);
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('new user can capture a plan on the chosen date without inventing a schedule',async({page})=>{
 await choose(page,'2026-10-20','schedule');await expect(page.locator('#schedule-dialog')).toContainText('Capture a plan');
 await page.locator('#schedule-open-logger').click();await expect(page.locator('#wo-date')).toHaveValue('2026-10-20');
 await expect(page.locator('#session-intent')).toBeInViewport();
 expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
});
test('future days offer planning while actual logging is unavailable; Escape restores focus',async({page})=>{
 await page.locator('#calendar-grid [aria-label^="2026-10-20"]').click();
 await expect(page.locator('[data-calendar-action="workout"]')).toBeDisabled();await expect(page.locator('[data-calendar-action="nutrition"]')).toBeDisabled();
 await expect(page.locator('[data-calendar-action="schedule"]')).toBeEnabled();await page.keyboard.press('Escape');
 await expect(page.locator('#calendar-grid [aria-label^="2026-10-20"]')).toBeFocused();
});
test('linked workout cannot be silently moved to another day',async({page})=>{
 await page.evaluate(()=>{pendingScheduledSession={id:'linked'};document.getElementById('wo-date').value='2026-10-15';});
 await choose(page,'2026-10-12','workout');await expect(page.locator('#calendar-actions-status')).toContainText('unchanged');
 expect(await page.evaluate(()=>document.getElementById('wo-date').value)).toBe('2026-10-15');
 expect(await page.evaluate(()=>pendingScheduledSession.id)).toBe('linked');
});
test('day menu fits a narrow screen with enlarged text',async({page},info)=>{
 await page.setViewportSize({width:320,height:740});
 await page.evaluate(()=>document.documentElement.style.fontSize='20px');
 await page.locator('#calendar-grid [aria-label^="2026-10-12"]').click();
 const dialog=page.locator('#calendar-day-actions');await expect(dialog).toBeVisible();
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath('calendar-day-menu.png')});
});
test.describe('calendar in a timezone ahead of UTC',()=>{
 test.use({timezoneId:'Asia/Tokyo'});
 test('visible day number and action destination use the same local date',async({page})=>{
  const cell=page.locator('#calendar-grid [aria-label^="2026-10-12"]');await expect(cell.locator('.cal-num')).toHaveText('12');
  await choose(page,'2026-10-12','workout');await expect(page.locator('#wo-date')).toHaveValue('2026-10-12');
 });
});
