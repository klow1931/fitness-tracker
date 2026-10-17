const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-28T18:00:00Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
async function seed(page,meet=false){await page.evaluate(async ({state,meet})=>{
 data=normalizeDataShape({...data,...state});data.onboardingDismissed=true;updateOnboardingUI();
 if(meet){data.workouts=[];data.prs=[];const p=LoadnoteProgrammingProfile.current(data.programmingProfiles).context;data.programmingProfiles=LoadnoteProgrammingProfile.save(data.programmingProfiles,{...p,goal:'meet',experience:'unknown',eventDate:'2026-12-19'});}
 await persistNow(data);invalidateViews();showTab('coach');showSubTab('coach','co-programs');renderProgrammingWorkspace();
},{state:phaseFixture().state,meet});}
const next=dialog=>dialog.locator('[data-wizard-action=next]').click();
test('guided profile preserves answers, points to missing days and survives a failed save',async({page})=>{
 await page.locator('[data-beginner-entry=help]').click();const d=page.locator('#programming-profile-dialog');
 await expect(d.locator('.program-wizard-progress')).toContainText('Step 1 of 4');await expect(d.locator('#profile-experience')).toHaveValue('unknown');
 await next(d);for(const checkbox of await d.locator('[data-profile-day]').all())await checkbox.uncheck();await next(d);
 await expect(d.locator('[data-field-error]')).toContainText('at least one day');await expect(d.locator('[data-profile-day]').first()).toBeFocused();
 for(const day of [0,2,4])await d.locator('[data-profile-day][value="'+day+'"]').check();await next(d);
 for(const equipment of ['barbell','plates','rack','bench'])await d.locator('[data-profile-equipment][value='+equipment+']').check();await next(d);
 await d.locator('#profile-priorities').fill('Upper back practice');await d.locator('[data-wizard-action=back]').click();await next(d);await expect(d.locator('#profile-priorities')).toHaveValue('Upper back practice');
 await expect(d.locator('.program-selected-summary')).toContainText('Mon, Wed, Fri');
 await page.evaluate(()=>{window.uxPersist=persistNow;persistNow=async()=>{throw Error('Test storage failure');};});await d.locator('button[type=submit]').click();await expect(d.locator('#profile-error')).toContainText('Test storage failure');expect(await page.evaluate(()=>data.programmingProfiles.length)).toBe(0);
 await page.evaluate(()=>{persistNow=window.uxPersist;});await d.locator('button[type=submit]').click();await expect(d).toBeHidden();expect(await page.evaluate(()=>LoadnoteProgrammingProfile.current(data.programmingProfiles).context.experience)).toBe('unknown');
});
test('guided phase setup reviews one explicit proposal and separates Reviewed from Scheduled',async({page})=>{
 await seed(page);await page.locator('#programming-workspace-primary').click();const d=page.locator('#phase-dialog');
 await expect(d.locator('.program-wizard-progress')).toContainText('Step 1 of 3');
 await expect(d.locator('#phase-guided-advanced')).toHaveCount(1);
 await expect(d.locator('#phase-guided-advanced')).not.toHaveAttribute('open');
 await expect(d.locator('#phase-periodization')).toHaveValue('auto');
 await expect(d.locator('#phase-style-reason')).toContainText('setup suggestion');
 await expect(d.locator('#phase-squat-tm')).toHaveValue('');
 await expect(d.locator('#phase-guided-advanced #phase-accumulation')).toHaveAttribute('type','number');
 for(const day of [1])await d.locator('[data-phase-day][value="'+day+'"]').uncheck();await d.locator('[data-phase-day][value="4"]').check();
 await next(d);await next(d);await expect(d.locator('#phase-squat-tm')).toBeFocused();await expect(d.locator('#phase-squat-tm')).toHaveValue('');
 for(const [lift,value] of [['squat','160'],['bench','120'],['deadlift','220']])await d.locator('#phase-'+lift+'-tm').fill(value);
 await next(d);await expect(d.locator('.program-selected-summary')).toContainText('Mon, Wed, Fri');
 await d.locator('[data-accessory-editor]>summary').click();await d.locator('[data-accessory-add]').click();await d.locator('[data-accessory=name]').fill('My accessory');await d.locator('[data-accessory=weight]').fill('12');await d.locator('[data-accessory-remove]').click();await d.locator('[data-undo-action=planner]').click();await expect(d.locator('[data-accessory=name]')).toHaveValue('My accessory');await expect(d.locator('[data-accessory=weight]')).toHaveValue('12');await d.locator('[data-accessory-remove]').click();await d.locator('[data-undo-scope=planner]').getByRole('button',{name:'Dismiss',exact:true}).click();
 await d.locator('button[type=submit]').click();const preview=d.locator('#phase-preview');await expect(preview.locator('.program-overview')).toContainText('What is my first workout?');
 await expect(preview.locator('.program-overview')).toContainText('Build training volume');await expect(preview.locator('[aria-current=step]')).toHaveText('Draft');
 await d.locator('#phase-confirm').check();await d.locator('#phase-save').click();await expect(d).toBeHidden();
 expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);await expect(page.locator('#phase-builder [aria-current=step]').first()).toHaveText('Reviewed');
 page.once('dialog',dialog=>dialog.accept());await page.locator('[data-phase-schedule]').click();await expect(page.locator('#phase-builder [aria-current=step]').first()).toHaveText('Scheduled');
});
test('meet prep explains the five review questions, schedules explicitly and logs first actual work',async({page})=>{
 await seed(page,true);await page.locator('#programming-workspace-primary').click();const d=page.locator('#phase-dialog');await next(d);
 for(const [lift,value] of [['squat','160'],['bench','120'],['deadlift','220']])await d.locator('#phase-'+lift+'-tm').fill(value);
 await next(d);await d.locator('button[type=submit]').click();await expect(d.locator('#phase-error')).toBeEmpty();await d.locator('#phase-confirm').check();await d.locator('#phase-save').click();
 const cycle=page.locator('#cycle-dialog');await expect(cycle).toBeVisible();await cycle.locator('button[type=submit]').click();
 const overview=cycle.locator('.program-overview');for(const question of ['When will I train?','How long will sessions take?','What is my first workout?','How does training change?','What happens when I confirm?'])await expect(overview).toContainText(question);
 await expect(overview).toContainText('No completed workouts or meet attempts are created');await cycle.locator('#cycle-confirm').check();await cycle.locator('#cycle-save').click();
 expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);await expect(page.locator('#meet-cycle [aria-current=step]').first()).toHaveText('Reviewed');
 page.once('dialog',dialog=>dialog.accept());await page.locator('[data-cycle-schedule]').click();await page.evaluate(()=>{showTab('dashboard');renderDashboard();});
 await page.locator('#today-training [data-today-train]').click();await expect(page.locator('#workout-log-card')).toBeVisible();
 const sets=await page.locator('.set-reps').count();for(let i=0;i<sets;i++)await page.locator('.quick-set-entry:visible [data-quick-done]').first().click();
 await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).toBeHidden();
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);expect(await page.evaluate(()=>data.workouts[0].exercises.every(e=>e.sets.every(s=>s.rpe==null)))).toBe(true);
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderProgramLifecycle();});await expect(page.locator('#decision-action-center [aria-current=step]')).toHaveText('In progress');
});
test('logger Undo restores exact entered sets and exercise data, and expires on clear',async({page})=>{
 page.on('dialog',d=>d.accept());await page.evaluate(()=>{fillWorkoutForm([{name:'Bench Press',type:'strength',sets:[{weight:60,reps:5,rpe:8},{weight:60,reps:5,rpe:''}]}],'Actual session',true);openFastStartLogger({compact:false});saveLoggerDraft();});
 const before=await page.evaluate(()=>{const draft=captureLoggerDraft();delete draft.updatedAt;return draft;});
 await page.evaluate(()=>removeWorkoutSet(document.querySelector('[data-workout-action=remove-set]')));await expect(page.locator('.set-reps')).toHaveCount(1);await page.locator('[data-undo-action=logger]').click();
 expect(await page.evaluate(()=>{const draft=captureLoggerDraft();delete draft.updatedAt;return draft;})).toEqual(before);
 await page.evaluate(()=>removeWorkoutExercise(document.querySelector('[data-workout-action=remove-exercise]')));await expect(page.locator('.ex-name')).toHaveCount(0);await page.locator('[data-undo-action=logger]').click();
 expect(await page.evaluate(()=>{const draft=captureLoggerDraft();delete draft.updatedAt;return draft;})).toEqual(before);
 await page.evaluate(()=>{removeWorkoutExercise(document.querySelector('[data-workout-action=remove-exercise]'));clearWorkoutForm(true);});await expect(page.locator('[data-undo-action=logger]')).toHaveCount(0);await expect(page.locator('.ex-name')).toHaveValue('');
});
test('calendar Undo appends a revision and remains retryable after failed storage',async({page})=>{
 await page.evaluate(()=>{
  const prescription=LoadnoteIntent.createPrescription([{name:'Bench',type:'strength',sets:[{weight:60,reps:5}]}],{type:'manual',label:'Bench'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Bench day',date:'2026-09-29',prescription},{id:'undo-calendar'});showTab('calendar');renderSchedule();
 });
 await page.locator('#calendar-plan [data-change=undo-calendar]').click();await page.locator('#schedule-date').fill('2026-09-30');await page.locator('#schedule-state').selectOption('skipped');await page.locator('#schedule-reason').fill('Travel');await page.locator('#schedule-dialog button[type=submit]').click();
 const before=await page.evaluate(()=>JSON.stringify(data));await page.evaluate(()=>{window.uxPersist=persistNow;persistNow=async()=>{throw Error('Undo storage failure');};});await page.locator('[data-undo-action=calendar]').click();await expect(page.locator('[data-undo-scope=calendar] [role=status]')).toContainText('Undo storage failure');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.evaluate(()=>{persistNow=window.uxPersist;});await page.locator('[data-undo-action=calendar]').click();await expect.poll(()=>page.evaluate(()=>LoadnoteSchedule.list(data.scheduledSessions)[0].date)).toBe('2026-09-29');expect(await page.evaluate(()=>data.scheduledSessions[0].revisions.length)).toBe(3);
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);expect(await page.evaluate(()=>LoadnoteSchedule.list(data.scheduledSessions)[0].status)).toBe('scheduled');
});
test('calendar Undo refuses later revisions and guided layout fits 320px with larger text',async({page},info)=>{
 await page.evaluate(()=>{
  const prescription=LoadnoteIntent.createPrescription([{name:'Bench',type:'strength',sets:[{weight:60,reps:5}]}],{type:'manual',label:'Bench'});
  const before=LoadnoteSchedule.create([],{name:'Bench',date:'2026-09-29',prescription},{id:'stale-calendar'});
  const after=LoadnoteSchedule.change(before,'stale-calendar',{date:'2026-09-30',reason:'Move'},new Date(Date.now()+1).toISOString());data.scheduledSessions=after;showTab('calendar');renderSchedule();LoadnoteEditUndoUI.calendar(before[0],after[0]);
  data.scheduledSessions=LoadnoteSchedule.change(after,'stale-calendar',{date:'2026-10-01',reason:'Later edit'},new Date(Date.now()+2).toISOString());
 });await page.locator('[data-undo-action=calendar]').click();await expect(page.locator('[data-undo-scope=calendar] [role=status]')).toContainText('changed again');
 await page.evaluate(()=>{showTab('profile');openProgrammingProfile({guided:true});});const d=page.locator('#programming-profile-dialog');
 await page.setViewportSize({width:320,height:600});await page.evaluate(()=>{document.documentElement.style.fontSize='24px';});
 for(const dark of [false,true]){await page.evaluate(dark=>document.body.classList.toggle('dark',dark),dark);for(let i=0;i<4;i++){expect(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);if(i<3)await next(d);}for(let i=0;i<3;i++)await d.locator('[data-wizard-action=back]').click();}
 await d.screenshot({path:info.outputPath('guided-setup-320-large-text.png')});
});
test('muscle-growth guided fields keep dose choices and Undo restores a removed movement slot',async({page})=>{
 await page.clock.setSystemTime(new Date('2026-10-04T18:00:00Z'));
 await page.evaluate(s=>{data=normalizeDataShape({...data,...s});showTab('coach');showSubTab('coach','co-programs');document.getElementById('programming-tools-panel').open=true;document.getElementById('hypertrophy-builder-panel').open=true;renderHypertrophyBuilder();},require('../fixtures/coaching').hypertrophy());
 await page.locator('#hyp-new').click();
 const d=page.locator('#hyp-dialog'),before=await page.evaluate(()=>JSON.stringify(data));await d.locator('#hyp-goal').selectOption({label:'Muscle growth'});
 let slot=d.locator('[data-hyp-slot]');await slot.locator('[data-slot=exercise]').selectOption({label:'Leg press'});await slot.locator('[data-slot=equipment]').selectOption('machine');await slot.locator('[data-slot=load]').fill('40');await slot.locator('[data-slot=increment]').fill('5');await slot.locator('[data-slot=purpose]').fill('Athlete-selected quad practice');await slot.locator('[data-slot=confirmed]').check();
 await slot.locator('[data-slot-remove]').click();await expect(d.locator('[data-hyp-slot]')).toHaveCount(0);await d.locator('[data-undo-action=planner]').click();slot=d.locator('[data-hyp-slot]');await expect(slot.locator('[data-slot=load]')).toHaveValue('40');await expect(slot.locator('[data-slot=confirmed]')).toBeChecked();
 await d.locator('[data-wizard-toggle]').click();await next(d);await expect(slot).toBeVisible();await next(d);await d.locator('button[type=submit]').click();await expect(d.locator('#hyp-error')).toBeEmpty();await expect(d.locator('#hyp-preview .program-overview')).toContainText('What is my first workout?');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
