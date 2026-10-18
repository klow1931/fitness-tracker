const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-16T14:00:00Z')});await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(async state=>{data=normalizeDataShape({...data,...state});await persistNow(data);invalidateViews();window.planningOnlineCalls=0;LoadnoteCoachClient.ensureSignedIn=async()=>{window.planningOnlineCalls++;return true;};showTab('coach');showSubTab('coach','co-chat');window.planningOnlineCalls=0;},phaseFixture().state);
});
async function ask(page,q){await page.locator('#chat-input').fill(q);await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();return page.locator('#chat-messages .assistant').last();}
// Mobile WebKit's navigator.maxTouchPoints can report zero despite a touch-enabled
// Playwright context. Use the project's input capability, not that browser value.
async function activateAction(action){if(test.info().project.name.startsWith('mobile'))await action.tap();else await action.click();}
async function daily(page,{expectedTitle='Draft your daily workout'}={}){
 await ask(page,'Create an upper-body workout today for 30 minutes with dumbbells');
 const action=page.locator('#chat-messages').getByRole('button',{name:'Draft my workout',exact:true}).last();
 // Real touch events exercise mobile WebKit more accurately than synthetic mouse clicks.
 await activateAction(action);
 const d=page.locator('#offline-plan-dialog');await expect(d).toBeVisible();
 await expect(d.locator('#offline-plan-title')).toHaveText(expectedTitle,{timeout:15000});
 return d;
}
async function review(page,d){for(const field of await d.locator('[data-value=load]').all())await field.fill('12');await d.locator('#offline-workout-confirm').check();await d.locator('button[type=submit]').click();await expect(d.locator('#offline-workout-preview')).toContainText('Review planned work');}
test('complete replies scroll the appended action into the chat viewport before the first tap',async({page})=>{
 await ask(page,'Create an upper-body workout today for 30 minutes with dumbbells');
 const action=page.locator('#chat-messages').getByRole('button',{name:'Draft my workout',exact:true});
 expect(await action.evaluate(button=>{const host=document.getElementById('chat-messages'),a=button.getBoundingClientRect(),h=host.getBoundingClientRect();return a.top>=h.top&&a.bottom<=h.bottom;})).toBe(true);
 await action.hover();const before=await action.boundingBox();await page.mouse.down();
 expect(before.height).toBeGreaterThanOrEqual(44);expect(before.height).toBeLessThanOrEqual(80);
 const pressed=await action.boundingBox(),x=before.x+before.width/2,y=before.y+before.height/2;
 expect(x>=pressed.x&&x<=pressed.x+pressed.width&&y>=pressed.y&&y<=pressed.y+pressed.height).toBe(true);await expect(page.locator('#offline-plan-dialog')).toHaveCount(0);
 await page.mouse.up();await expect(page.locator('#offline-plan-dialog')).toBeVisible();
});
test('chat actions support touch taps and keyboard activation',async({page},info)=>{
 await ask(page,'Create an upper-body workout today for 30 minutes with dumbbells');
 const action=page.locator('#chat-messages').getByRole('button',{name:'Draft my workout',exact:true});
 if(info.project.name.startsWith('mobile'))await action.tap();else{await action.focus();await page.keyboard.press('Enter');}
 await expect(page.locator('#offline-plan-dialog')).toBeVisible();
});
test('offline conversation collects requirements over turns without a training write or online call',async({page,context})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));await context.setOffline(true);
 await ask(page,'Build a program');for(const q of ['Strength','12 weeks','Four days per week','45 minutes','Full gym'])await ask(page,q);
 await expect(page.locator('#chat-messages .assistant').last()).toContainText('12 weeks');await expect(page.locator('#chat-messages .assistant').last()).toContainText('4 days/week');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);expect(await page.evaluate(()=>window.planningOnlineCalls)).toBe(0);
 await activateAction(page.locator('#chat-messages').getByRole('button',{name:'Review program request',exact:true}).last());await expect(page.locator('#offline-plan-dialog')).toBeVisible();
});
test('chat request generates an exact 12-week editable strength preview, preserving explicit max review',async({page})=>{
 await ask(page,'Create a 12-week powerlifting program four days per week, 60 minutes, full gym and bench priority');
 await activateAction(page.locator('#chat-messages').getByRole('button',{name:'Review program request',exact:true}));await expect(page.locator('#offline-plan-dialog')).toBeVisible();await expect(page.locator('#offline-plan-dialog [data-offline-day]:checked')).toHaveCount(4);await page.locator('#offline-program-continue').click();
 const d=page.locator('#phase-dialog');await expect(d).toBeVisible();await d.getByRole('button',{name:'Show all fields',exact:true}).click();
 await expect(d.locator('#phase-accumulation')).toHaveValue('5');await expect(d.locator('#phase-strength')).toHaveValue('6');await expect(d.locator('[data-phase-day]:checked')).toHaveCount(4);
 for(const [i,lift] of ['squat','bench','deadlift'].entries()){await d.locator('.phase-lift > summary').nth(i).click();await expect(d.locator('#phase-'+lift+'-tm')).toHaveValue('');await d.locator('#phase-'+lift+'-tm').fill(String([160,120,220][i]));}
 await d.locator('button[type=submit]').click();await expect(d.locator('#phase-error')).toBeEmpty();await expect(d.locator('#phase-preview')).toContainText('Week 12');
 expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(0);expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);
 await d.locator('#phase-confirm').check();await d.locator('#phase-save').click();await expect(d).not.toBeVisible();
 expect(await page.evaluate(()=>data.phasePrograms.at(-1).config.phases.reduce((n,p)=>n+p.weeks,0))).toBe(12);expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);
});
test('daily draft needs explicit loads and loads targets without actual effort or completion',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));const d=await daily(page);await expect(d.locator('[data-value=load]').first()).toHaveValue('');
 await review(page,d);await d.locator('#offline-load-confirm').check();await d.locator('#offline-load-workout').click();await expect(d).not.toBeVisible();
 await expect(page.locator('.set-rpe').first()).toHaveValue('');for(const check of await page.locator('.set-done-check').all())await expect(check).not.toBeChecked();
 expect(await page.evaluate(()=>pendingPrescription.plannedExercises.every(e=>e.loadConvention==='per-hand'))).toBe(true);expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
 await page.reload({waitUntil:'domcontentloaded'});expect(await page.evaluate(()=>!!pendingPrescription)).toBe(true);
});
test('first workout offers one-question-at-a-time guidance without guessing a starting weight',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts)),d=await daily(page);
 await d.locator('#offline-guide-start').click();await expect(d.locator('#offline-guide-status')).toContainText('Step 1 of 4');
 await expect(d.locator('[data-value=load]').first()).not.toBeVisible();
 await d.locator('#offline-guide-next').click();await expect(d.locator('#offline-guide-status')).toContainText('Step 2 of 4');
 await expect(d.locator('#offline-load-help')).toBeVisible();await d.locator('#offline-load-help summary').click();
 await expect(d.locator('#offline-load-help')).toContainText('not infer a number');
 await d.locator('#offline-guide-next').click();await expect(d.locator('#offline-plan-error')).toContainText('starting load');
 for(const field of await d.locator('[data-value=load]').all())await field.fill('12');
 await d.locator('#offline-guide-next').click();await expect(d.locator('#offline-guide-status')).toContainText('Step 3 of 4');
 await expect(d.locator('#offline-guide-help')).toContainText('RPE 7');
 await d.locator('#offline-guide-next').click();await expect(d.locator('#offline-guide-status')).toContainText('Step 4 of 4');
 await d.locator('#offline-workout-confirm').check();await d.locator('#offline-review-targets').click();
 await expect(d.locator('#offline-workout-preview')).toContainText('Review planned work');
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('fresh review cannot replace an unfinished logger or silently use changed doses',async({page})=>{
 await page.evaluate(()=>{showTab('workouts');});await page.locator('.ex-name').fill('Keep my session');await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 const d=await daily(page);await review(page,d);await d.locator('#offline-load-confirm').check();await d.locator('#offline-load-workout').click();await expect(d.locator('#offline-plan-error')).toContainText('has not been replaced');
 expect(await page.evaluate(()=>document.querySelector('.ex-name').value)).toBe('Keep my session');
 await d.locator('[data-value=sets]').first().evaluate(el=>el.value='4');await d.locator('#offline-load-workout').click();await expect(d.locator('#offline-plan-error')).toContainText('context changed');
});
test('an existing Calendar plan is reviewed through the existing adaptation controller',async({page})=>{
 await page.evaluate(()=>{const plan=LoadnoteIntent.createPrescription([{name:'Bench',type:'strength',sets:[{weight:100,reps:5,targetRpe:7}]}],{type:'manual'});data.scheduledSessions=LoadnoteSchedule.create([],{name:'Existing bench',date:today(),prescription:plan},{id:'existing'});});
 const before=await page.evaluate(()=>JSON.stringify(data.scheduledSessions));const d=await daily(page,{expectedTitle:'You already have planned training'});await expect(d).toContainText('Existing bench');await d.locator('#offline-review-scheduled').click();
 await expect(page.locator('#adaptive-minutes')).toHaveValue('30');expect(await page.evaluate(()=>JSON.stringify(data.scheduledSessions))).toBe(before);
});
test('unsupported duration is clarified instead of silently changing the program',async({page})=>{
 const reply=await ask(page,'Create a 20-week strength program three days per week 60 minutes full gym');await expect(reply).toContainText('not silently shorten');await expect(reply.getByRole('button',{name:'Review program request'})).toHaveCount(0);
});
test('muscle-growth request carries weeks, days and matching identities without filling loads',async({page})=>{
 await page.evaluate(()=>{
  data.athleteGoals=LoadnoteGoals.upsert([],{name:'Grow muscle',sport:'Resistance training',equipment:'Dumbbells',availableDays:[0,2,4],sessionMinutes:60,trainingContext:{primary:'hypertrophy',secondary:[],season:'off-season',scheduleKnown:true,practiceDays:[],competitionDays:[]}});
  for(const [id,name,primary] of [['dbpress','Dumbbell Bench Press','chest'],['dbrow','Dumbbell Row','upper-back'],['split','Split Squat','quadriceps']])data.exerciseCatalog.push({id,name,muscles:{confirmed:true,mode:'resistance',primary:[primary],secondary:[]}});
 });
 await ask(page,'Create a six-week muscle-growth program three days per week 60 minutes dumbbells');await activateAction(page.locator('#chat-messages').getByRole('button',{name:'Review program request',exact:true}));
 await page.locator('[data-offline-day][value="1"]').uncheck();await page.locator('[data-offline-day][value="4"]').check();await page.locator('#offline-program-continue').click();
 const d=page.locator('#hyp-dialog');await expect(d).toBeVisible();
 await expect(d.locator('#hyp-weeks')).toHaveValue('6');await expect(d.locator('[data-hyp-day]:checked')).toHaveCount(3);await expect(d.locator('[data-hyp-slot]')).toHaveCount(9);
 for(const field of await d.locator('[data-slot=load]').all())await expect(field).toHaveValue('');for(const check of await d.locator('[data-slot=confirmed]').all())await expect(check).not.toBeChecked();
});
test('device exclusions apply and changed device preferences invalidate a reviewed workout',async({page})=>{
 await page.evaluate(async()=>{data.exerciseCatalog.push({id:'dbbench',name:'Dumbbell Bench Press'});await setDeviceRecord('adaptive-session-preferences-v1',{version:1,preferences:{equipment:[],excludedExerciseIds:['dbbench'],equipmentConfirmed:false,minutes:null},movements:[]});});
 const d=await daily(page);await expect(d.locator('[data-offline-movement=dumbbell_bench]')).toHaveCount(0);await review(page,d);await d.locator('#offline-load-confirm').check();
 await page.evaluate(async()=>{await setDeviceRecord('adaptive-session-preferences-v1',{version:1,preferences:{equipment:[],excludedExerciseIds:[],equipmentConfirmed:false,minutes:null},movements:[]});});
 await d.locator('#offline-load-workout').click();await expect(d.locator('#offline-plan-error')).toContainText('preferences changed');expect(await page.evaluate(()=>pendingPrescription)).toBe(null);
});
test('clearing the shared conversation removes the unfinished planning request',async({page,context})=>{
 await context.setOffline(true);await ask(page,'Build a program');await ask(page,'Strength');await page.getByRole('button',{name:'Clear conversation',exact:true}).click();
 const reply=await ask(page,'12 weeks');await expect(reply).not.toContainText('strength program request');await expect(page.locator('#chat-messages').getByRole('button',{name:'Review program request'})).toHaveCount(0);
});
test('a new user reviews setup explicitly; workout preview fits a narrow phone',async({page},info)=>{
 await page.evaluate(()=>data.programmingProfiles=[]);await ask(page,'Create a 12-week strength program four days per week 45 minutes full gym');await activateAction(page.locator('#chat-messages').getByRole('button',{name:'Review program request',exact:true}));
 await expect(page.locator('#programming-profile-dialog')).toBeVisible();expect(await page.evaluate(()=>data.programmingProfiles.length)).toBe(0);await page.locator('#profile-close').click();
 await page.evaluate(state=>{data.programmingProfiles=state.programmingProfiles;},phaseFixture().state);const d=await daily(page);await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='20px');
 await review(page,d);expect(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.screenshot({path:info.outputPath('offline-workout-review.png')});
});

test('equipment correction across chat turns does not reuse unavailable gear',async({page,context})=>{
 const original=await page.evaluate(()=>JSON.stringify(data));await context.setOffline(true);
 await ask(page,'Create an upper body workout today for 30 minutes with a barbell');
 const withdrawn=await ask(page,'No barbell');
 await expect(withdrawn).toContainText('What equipment can you use');
 await expect(withdrawn.getByRole('button',{name:'Draft my workout'})).toHaveCount(0);
 await ask(page,'Dumbbells instead');
 await activateAction(page.locator('#chat-messages').getByRole('button',{name:'Draft my workout',exact:true}).last());
 const d=page.locator('#offline-plan-dialog');await expect(d).toBeVisible();
 await expect(d.locator('[data-offline-movement=dumbbell_bench]')).toHaveCount(1);
 expect(await d.locator('[data-offline-movement]').evaluateAll(rows=>rows.every(row=>!row.textContent.includes('Barbell')))).toBe(true);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(original);
 expect(await page.evaluate(()=>window.planningOnlineCalls)).toBe(0);
});
test('updated exercise role invalidates a reviewed daily draft before it can load',async({page})=>{
 const d=await daily(page);await review(page,d);await d.locator('#offline-load-confirm').check();
 await page.evaluate(()=>{data.exerciseRoles[0].revisions.at(-1).context.notes='Updated movement role review';});
 await d.locator('#offline-load-workout').click();
 await expect(d.locator('#offline-plan-error')).toContainText('context changed');
 expect(await page.evaluate(()=>pendingPrescription)).toBe(null);
});

test('slow device preference reads show immediate feedback, then a reviewed draft',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>{
  const read=window.LoadnoteAdaptiveSessionUI.readProfile;
  let release;const deferred=new Promise(resolve=>{release=resolve;});
  window.releaseOfflineProfileRead=release;
  window.LoadnoteAdaptiveSessionUI.readProfile=async()=>{await deferred;return read();};
 });
 await ask(page,'Create an upper-body workout today for 30 minutes with dumbbells');
 const action=page.locator('#chat-messages').getByRole('button',{name:'Draft my workout',exact:true}).last();
 await activateAction(action);
 const d=page.locator('#offline-plan-dialog');await expect(d).toBeVisible();
 await expect(d.locator('[role=status]')).toContainText('Reading saved training preferences');
 await expect(d.locator('[data-value=load]')).toHaveCount(0);
 await page.evaluate(()=>window.releaseOfflineProfileRead());
 await expect(d.locator('#offline-plan-title')).toHaveText('Draft your daily workout',{timeout:15000});
 await expect(d.locator('[data-value=load]').first()).toHaveValue('');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('unavailable device preferences cannot produce a workout dose',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>{window.LoadnoteAdaptiveSessionUI.readProfile=async()=>{throw Error('Device preferences unavailable');};});
 await ask(page,'Create an upper-body workout today for 30 minutes with dumbbells');
 const action=page.locator('#chat-messages').getByRole('button',{name:'Draft my workout',exact:true}).last();
 await activateAction(action);
 const d=page.locator('#offline-plan-dialog');await expect(d).toBeVisible();
 await expect(d.locator('#offline-plan-title')).toHaveText('Review training preferences');
 await expect(d.locator('[data-value=load]')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
