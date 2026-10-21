const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-18T18:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
async function studio(page){await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderCustomProgramStudio();});await page.locator('#custom-studio-open').click();}
test('unsafe text targets leave the current draft intact; rest and cues survive supported import',async({page})=>{
 await studio(page);await page.locator('[data-custom-row="0"] [data-field="exercise"]').fill('Keep this draft');
 for(const target of ['3x8+ @ 100 kg','3x5 @ -100 kg','3x5 @ 80–100 kg']){
  await page.locator('#custom-upload').setInputFiles({name:'unsupported.txt',mimeType:'text/plain',buffer:Buffer.from('Week 1\nMonday\nSquat '+target)});
  await expect(page.locator('#custom-error')).toContainText('Line 3');await expect(page.locator('#custom-error')).toContainText('unsupported');
  await expect(page.locator('[data-custom-row="0"] [data-field="exercise"]')).toHaveValue('Keep this draft');
 }
 await page.locator('#custom-upload').setInputFiles({name:'supported.txt',mimeType:'text/plain',buffer:Buffer.from('Week 1\nMonday\nBench 1x5 @ 100 kg RPE 8 rest 90s; Pause each rep for two seconds')});
 await expect(page.locator('[data-field="rest"]')).toHaveValue('90');await expect(page.locator('[data-field="notes"]')).toHaveValue('Pause each rep for two seconds');
 expect(await page.evaluate(()=>data.customPrograms.length)).toBe(0);
});

test('reviewed rep ranges and percentages keep exact targets without inventing a max',async({page})=>{
 await studio(page);
 await page.locator('#custom-upload').setInputFiles({name:'ranges.txt',mimeType:'text/plain',buffer:Buffer.from('Week 1\nMonday\nSquat 3x8–12 @ 100 kg RPE 8')});
 await expect(page.locator('[data-custom-row="0"] [data-field="reps"]')).toHaveValue('8-12');
 await page.locator('#custom-start').fill('2026-10-19');
 await page.locator('#custom-preview').click();
 await expect(page.locator('#custom-preview-result')).toContainText('8–12');
 await page.locator('#custom-upload').setInputFiles({name:'percent.txt',mimeType:'text/plain',buffer:Buffer.from('Week 1\nMonday\nBench 5x3 @ 75% RPE 8')});
 await expect(page.locator('[data-custom-row="0"] [data-field="percent"]')).toHaveValue('75');
 await page.locator('#custom-preview').click();
 await expect(page.locator('#custom-error')).toContainText('percentage basis');
 await expect(page.locator('#custom-preview-result')).toBeEmpty();
 await page.locator('[data-custom-row="0"] [data-field="percentBasis"]').selectOption('training-max');
 await page.locator('[data-custom-row="0"] [data-field="reference"]').fill('400');
 await page.locator('[data-custom-row="0"] [data-field="referenceUnit"]').selectOption('lb');
 await page.locator('[data-custom-row="0"] [data-field="roundTo"]').fill('5');
 await page.locator('#custom-unit').selectOption('lb');
 await page.locator('#custom-preview').click();
 await expect(page.locator('#custom-preview-result')).toContainText('300 lb');
 await expect(page.locator('#custom-preview-result')).toContainText('75% training max');
 expect(await page.evaluate(()=>({programs:data.customPrograms.length,calendar:data.scheduledSessions.length}))).toEqual({programs:0,calendar:0});
});

test('training demo retains cues through draft recovery and Coach advances after actual completion',async({page})=>{
 await studio(page);
 const csv='Week,Day,Exercise,Sets,Reps,Weight,Unit,RPE,Notes\n1,Monday,Competition Bench,1,5,100,kg,8,Pause each rep for two seconds\n2,Monday,Competition Bench,1,5,102.5,kg,8,';
 await page.locator('#custom-upload').setInputFiles({name:'review-demo.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 await page.locator('#custom-start').fill('2026-10-19');await page.locator('#custom-preview').click();await page.locator('#custom-confirm').check();await page.locator('#custom-save').click();
 await expect.poll(()=>page.evaluate(()=>data.customPrograms.length)).toBe(1);
 await page.locator('#custom-program-studio details.more-details').filter({has:page.locator('[data-custom-schedule]')}).locator('summary').first().click();
 page.once('dialog',d=>d.accept());await page.locator('[data-custom-schedule]').click();await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.length)).toBe(2);
 await page.clock.setSystemTime(new Date('2026-10-19T18:00:00Z'));await page.evaluate(()=>{showTab('dashboard');renderDashboard();});await page.locator('#today-training [data-today-train]').click();
 await expect(page.locator('.planned-exercise-notes')).toBeVisible();await expect(page.locator('.planned-exercise-notes')).toHaveText('Program cue: Pause each rep for two seconds');
 await page.locator('#training-cockpit').getByRole('button',{name:'Workout options'}).click();
 await page.locator('.ex-name').fill('Different exercise');await expect(page.locator('.planned-exercise-notes')).toHaveCount(0);
 await page.locator('.ex-name').fill('Competition Bench');await expect(page.locator('.planned-exercise-notes')).toBeVisible();
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));
 await expect(page.locator('.planned-exercise-notes')).toHaveText('Program cue: Pause each rep for two seconds');
 await page.locator('.quick-set-entry:visible [data-quick-rpe="9"]').first().click();await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});await page.locator('#chat-input').fill('What is my next workout in my uploaded program?');await page.locator('#chat-send-btn').click();await expect(page.locator('#chat-send-btn')).toBeEnabled();
 await expect(page.locator('#chat-messages .assistant').last()).toContainText('2026-10-26');expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.clock.setSystemTime(new Date('2026-10-26T18:00:00Z'));await page.evaluate(()=>{showSubTab('coach','co-programs');renderCustomProgramStudio();});
 await page.locator('#custom-program-studio details.more-details').filter({has:page.locator('[data-custom-insights]')}).locator('summary').first().click();await page.locator('[data-custom-insights]').click();
 const review=page.locator('[aria-label="Custom program weekly athlete review"]');await expect(review).toContainText('1 above saved cap');await expect(review).toContainText('Review effort targets');await expect(review).not.toContainText('logs are within');
});
test('older Calendar snapshots read cues from the linked original without rewriting history',async({page})=>{
 const original=await page.evaluate(()=>{
  let next=LoadnoteCustomProgram.save(data,LoadnoteCustomProgram.build(data,{name:'Existing plan',weeks:1,startDate:'2026-10-19',unit:'kg',rows:[{week:1,day:'Monday',exercise:'Bench',sets:1,reps:5,weight:100,rpe:8,notes:'Original saved cue'}]}),{confirmed:true,id:'legacy-demo'});
  next=LoadnoteCustomProgram.schedule(next,'legacy-demo');for(const revision of next.scheduledSessions[0].revisions)delete revision.context.prescription.plannedExercises[0].notes;
  data=normalizeDataShape(next);const session=LoadnoteSchedule.list(data.scheduledSessions)[0],before=JSON.stringify(data.scheduledSessions);
  fillWorkoutForm(session.prescription.plannedExercises,'',false,{restore:{prescription:session.prescription,schedule:{id:session.id,revisionAt:session.revisionAt}}});openFastStartLogger({compact:false});return before;
 });
 await expect(page.locator('.planned-exercise-notes')).toHaveText('Program cue: Original saved cue');
 expect(await page.evaluate(()=>JSON.stringify(data.scheduledSessions))).toBe(original);
});
test('program cues render as text without overwriting personal notes',async({page})=>{
 await page.evaluate(()=>{data.exerciseNotes={'Bench':'My personal cue'};const prescription=LoadnoteIntent.createPrescription([{name:'Bench',type:'strength',notes:'<img src=x onerror="window.cueExecuted=true">',sets:[{reps:5,weight:100}]}]);fillWorkoutForm(prescription.plannedExercises,'',false,{restore:{prescription}});openFastStartLogger({compact:false});});
 await expect(page.locator('.planned-exercise-notes')).toContainText('<img');expect(await page.locator('.planned-exercise-notes img').count()).toBe(0);await expect(page.locator('.ex-note')).toHaveValue('My personal cue');expect(await page.evaluate(()=>window.cueExecuted)).toBeUndefined();
});
test('an unspecified planned load remains distinct from explicit zero',async({page})=>{
 await page.evaluate(()=>{const prescription=LoadnoteIntent.createPrescription([{name:'Bench',sets:[{reps:5},{reps:5,weight:0}]}]);fillWorkoutForm(prescription.plannedExercises,'',false,{restore:{prescription}});openFastStartLogger({compact:false});});
 await expect(page.locator('#planned-work-summary')).toContainText('load unspecified');
 await expect(page.locator('#planned-work-summary')).toContainText('0 kg');
});
