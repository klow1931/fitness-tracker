const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-18T14:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-chat');},phaseFixture().state);
});
async function ask(page,q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();return page.locator('#chat-messages .assistant').last();}
async function press(button){if(test.info().project.name.startsWith('mobile'))await button.tap();else await button.click();}
test('Coach presents a compact training recap and keeps details expandable',async({page})=>{
 const unchanged=await page.evaluate(()=>JSON.stringify(data));
 const reply=await ask(page,'Summarize my training');
 await expect(reply.locator('.cc-clarity')).toContainText('What happened');
 await expect(reply.locator('.cc-clarity')).toContainText('What it means');
 await expect(reply.locator('.cc-clarity')).toContainText('Your next action');
 await expect(reply.getByText('Evidence and limitations')).toBeVisible();
 await reply.locator('details').first().locator('summary').click();
 await expect(reply.locator('details').first()).toContainText('RPE-aware');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(unchanged);
});
test('direct weekday request remains read-only until review and explicit Save',async({page})=>{
 const before=await page.evaluate(()=>({profile:data.programmingProfiles.length,days:data.programmingProfiles.at(-1).context.availableDays,workouts:JSON.stringify(data.workouts),scheduled:JSON.stringify(data.scheduledSessions)}));
 const reply=await ask(page,'Use Monday, Wednesday, and Friday as my training days');
 await expect(reply).toContainText('Nothing has changed');
 expect(await page.evaluate(()=>data.programmingProfiles.length)).toBe(before.profile);
 await press(reply.getByRole('button',{name:'Review training days before saving'}));
 const d=page.locator('#programming-profile-dialog');await expect(d).toBeVisible();
 await expect(d.getByLabel('Review coaching preference')).toContainText('Requested: Mon, Wed, Fri');
 await expect(d.locator('[data-profile-day]:checked')).toHaveCount(3);
 await d.locator('#profile-close').click();
 expect(await page.evaluate(()=>data.programmingProfiles.length)).toBe(before.profile);
 await press(reply.getByRole('button',{name:'Review training days before saving'}));
 await d.getByRole('button',{name:'Save programming profile'}).click();await expect(d).not.toBeVisible();
 const after=await page.evaluate(()=>({profile:data.programmingProfiles.length,days:data.programmingProfiles.at(-1).context.availableDays,workouts:JSON.stringify(data.workouts),scheduled:JSON.stringify(data.scheduledSessions)}));
 expect(after).toEqual({...before,profile:before.profile+1,days:[0,2,4]});
});
test('stale chat preference cannot overwrite a newer training setup',async({page})=>{
 const reply=await ask(page,'Set my training days to Tuesday and Thursday');
 await page.evaluate(()=>{const current=LoadnoteProgrammingProfile.current(data.programmingProfiles);data.programmingProfiles=LoadnoteProgrammingProfile.save(data.programmingProfiles,{...current.context,notes:'Newly saved elsewhere'},{now:'2026-10-18T14:01:00.000Z'});});
 await press(reply.getByRole('button',{name:'Review training days before saving'}));
 await expect(page.locator('#programming-profile-dialog')).not.toBeVisible();
 expect(await page.evaluate(()=>LoadnoteProgrammingProfile.current(data.programmingProfiles).context.notes)).toBe('Newly saved elsewhere');
});
test('Coach can propose equipment, time and priorities but saves each only through reviewed Profile',async({page})=>{
 const initial=await page.evaluate(()=>({profile:data.programmingProfiles.length,workouts:JSON.stringify(data.workouts)}));
 const equipment=await ask(page,'Set my equipment to barbell, plates, rack and bench');
 await expect(equipment).toContainText('Nothing has changed');
 await press(equipment.getByRole('button',{name:'Review equipment before saving'}));
 const dialog=page.locator('#programming-profile-dialog');await expect(dialog.getByLabel('Review coaching preference')).toContainText('Requested equipment: barbell, bench, plates, rack');
 await dialog.locator('#profile-close').click();expect(await page.evaluate(()=>data.programmingProfiles.length)).toBe(initial.profile);
 await press(equipment.getByRole('button',{name:'Review equipment before saving'}));await dialog.getByRole('button',{name:'Save programming profile'}).click();await expect(dialog).toBeHidden();
 const minutes=await ask(page,'Set my session time to 75 minutes');await press(minutes.getByRole('button',{name:'Review session time before saving'}));
 await expect(dialog.getByLabel('Review coaching preference')).toContainText('Requested session time: 75 minutes');
 await dialog.getByRole('button',{name:'Save programming profile'}).click();await expect(dialog).toBeHidden();
 const priority=await ask(page,'Set my training priority to bench technique');await press(priority.getByRole('button',{name:'Review training priority before saving'}));
 await expect(dialog.getByLabel('Review coaching preference')).toContainText('Requested training priority: bench technique');
 await dialog.getByRole('button',{name:'Save programming profile'}).click();await expect(dialog).toBeHidden();
 const after=await page.evaluate(()=>({profile:data.programmingProfiles.length,setup:LoadnoteProgrammingProfile.current(data.programmingProfiles).context,workouts:JSON.stringify(data.workouts)}));
 expect(after.profile).toBe(initial.profile+3);expect(after.setup.equipment).toEqual(['barbell','bench','plates','rack']);expect(after.setup.sessionMinutes).toBe(75);expect(after.setup.priorities).toBe('bench technique');expect(after.workouts).toBe(initial.workouts);
});
test('Coach evidence offers a direct, read-only route to the workout logger',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts)),reply=await ask(page,'Summarize my training');
 await press(reply.getByRole('button',{name:'Open workout logger'}));
 await expect(page.locator('#panel-dashboard')).toBeVisible();expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('20-week powerlifting request carries its duration into reviewed meet lift setup',async({page})=>{
 const initial=await ask(page,'Create a 20-week strength program three days per week 60 minutes full gym');
 await expect(initial).toContainText('not silently shorten');
 await expect(initial.getByRole('button',{name:'Review program request'})).toHaveCount(0);
 const clarified=await ask(page,'Make it meet prep');
 await expect(clarified).toContainText('20 weeks');
 await press(clarified.getByRole('button',{name:'Review program request'}));
 const request=page.locator('#offline-plan-dialog');await expect(request).toBeVisible();
 await expect(request).toContainText('Meet-prep handoff');
 await request.locator('#offline-program-continue').click();
 const setup=page.locator('#phase-dialog');await expect(setup).toBeVisible();
 await expect(setup).toContainText('20-week timeline is transferred');
 await expect(setup.locator('#phase-squat-tm')).toHaveValue('');
 await setup.getByRole('button',{name:'Show all fields',exact:true}).click();
 for(const [i,lift] of ['squat','bench','deadlift'].entries())await setup.locator('#phase-'+lift+'-tm').fill(String([160,120,220][i]));
 await setup.getByRole('button',{name:'Review lift setup',exact:true}).click();
 await expect(setup.locator('#phase-error')).toBeEmpty();
 await setup.locator('#phase-confirm').check();await setup.locator('#phase-save').click();
 const timeline=page.locator('#cycle-dialog');await expect(timeline).toBeVisible();
 const expected=await page.evaluate(()=>{const start=data.phasePrograms.at(-1).config.startDate,day=new Date(start+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+19*7+5);return day.toISOString().slice(0,10);});
 await expect(timeline.locator('#cycle-meet-date')).toHaveValue(expected);
 await expect(timeline).toContainText('20 weeks requested');
 await timeline.locator('#cycle-form button[type=submit]').click();await expect(timeline.locator('#cycle-error')).toBeEmpty();
 await expect(timeline.locator('#cycle-preview')).toContainText('20 weeks');
 await expect(timeline.locator('[data-meet-full-timeline]')).toContainText('Complete 20-week timeline');
 await expect(timeline.locator('[data-meet-stage]')).toHaveCount(5);
 await expect(timeline.locator('[data-meet-stage="mock-meet"]')).toContainText('0 sessions');
 const chosenDays=await page.evaluate(()=>data.phasePrograms.at(-1).config.days.map(d=>['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][d]).join(', '));
 await expect(timeline.locator('[data-meet-full-timeline]')).toContainText(chosenDays);
 expect(await page.evaluate(()=>data.meetCycles.length)).toBe(0);
});
