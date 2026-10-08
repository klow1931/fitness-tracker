const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});await page.goto('/');
 await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-programs');},phaseFixture().state);
});
async function phase(page){
 await page.evaluate(()=>LoadnotePhaseBuilderUI.open());
 for(const [i,l]of ['squat','bench','deadlift'].entries()){await page.locator('.phase-lift > summary').nth(i).click();await page.locator('#phase-'+l+'-tm').fill(String([160,120,220][i]));}
}
async function add(page,dialog,name='Chest-supported Row',weight='30'){
 await dialog.locator('[data-accessory-editor] > summary').click();await dialog.locator('[data-accessory-add]').click();
 const row=dialog.locator('[data-accessory-row]').last();await row.getByLabel('Exercise / substitution',{exact:true}).fill(name);
 await row.locator('[data-accessory=weight]').fill(weight);await row.locator('[data-accessory=equipmentConfirmed]').check();return row;
}
test('reviewed phase accessories survive save, backup normalization, scheduling and logger loading',async({page})=>{
 await phase(page);const dialog=page.locator('#phase-dialog');await add(page,dialog);
 await dialog.getByRole('button',{name:'Generate phase preview',exact:true}).click();
 await expect(page.locator('#phase-preview')).toContainText('Chest-supported Row');await expect(page.locator('#phase-preview')).toContainText('rep range 8–12');
 await expect(page.locator('#phase-preview')).toContainText('Accessory workload');await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();
 await expect(dialog).toBeHidden();
 const result=await page.evaluate(()=>{const p=data.phasePrograms.at(-1),original=JSON.stringify(data.workouts);data=LoadnotePhaseBuilder.schedule(data,p.id,{asOf:today()});const normalized=normalizeDataShape(JSON.parse(JSON.stringify(data)));return {catalog:data.exerciseCatalog.some(e=>e.name==='Chest-supported Row'),unchanged:original===JSON.stringify(data.workouts),same:JSON.stringify(normalized.phasePrograms)===JSON.stringify(data.phasePrograms),id:data.scheduledSessions[0].id};});
 expect(result.catalog&&result.unchanged&&result.same).toBe(true);
 await page.clock.setSystemTime(new Date('2026-09-28T12:00:00Z'));
 await page.evaluate(id=>{startScheduledWorkout(id);},result.id);
 await expect(page.locator('#exercise-rows .ex-name').last()).toHaveValue('Chest-supported Row');
 await expect(page.locator('#exercise-rows > div').last().locator('.set-weight').first()).toHaveValue('30');
});
test('accessory input changes invalidate proposals and time/equipment guards block generation',async({page})=>{
 await phase(page);const d=page.locator('#phase-dialog'),row=await add(page,d);
 await row.locator('[data-accessory=equipmentConfirmed]').uncheck();await d.getByRole('button',{name:'Generate phase preview',exact:true}).click();await expect(page.locator('#phase-error')).toContainText('confirm actual equipment');
 await row.locator('[data-accessory=equipmentConfirmed]').check();await page.locator('#phase-minutes').fill('60');await d.getByRole('button',{name:'Generate phase preview',exact:true}).click();await expect(page.locator('#phase-error')).toContainText('needs about');
 await page.locator('#phase-minutes').fill('90');await d.getByRole('button',{name:'Generate phase preview',exact:true}).click();await expect(page.locator('#phase-preview')).toContainText('Chest-supported Row');
 await row.locator('[data-accessory=name]').fill('Dumbbell Row');await expect(page.locator('#phase-preview')).toBeEmpty();
 expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(0);expect(await page.evaluate(()=>data.workouts.length)).toBe(3);
});
test('quick builder supports bodyweight holds and conditioning without percentage-of-max claims',async({page})=>{
 await page.evaluate(()=>LoadnoteProgramBuilderUI.open());const d=page.locator('#builder-dialog');
 await page.locator('#builder-equipment').check();for(const [i,l]of ['squat','bench','deadlift'].entries())await page.locator('#builder-'+l).fill(String([160,120,220][i]));
 const row=await add(page,d,'Plank','0');await row.locator('[data-accessory=group]').selectOption('trunk');await row.locator('[data-accessory=purpose]').selectOption('trunk');await row.locator('[data-accessory=equipment]').selectOption('bodyweight');await row.locator('[data-accessory=weight]').fill('0');await row.locator('[data-accessory=equipmentConfirmed]').check();await row.locator('[data-accessory=mode]').selectOption('duration');
 await d.locator('[data-accessory-add]').click();const cardio=d.locator('[data-accessory-row]').last();await cardio.locator('[data-accessory=name]').fill('Cycling');await cardio.locator('[data-accessory=day]').selectOption('3');await cardio.locator('[data-accessory=group]').selectOption('conditioning');await cardio.locator('[data-accessory=purpose]').selectOption('conditioning');await cardio.locator('[data-accessory=mode]').selectOption('cardio');await cardio.locator('[data-accessory=equipment]').selectOption('cardio');await cardio.locator('[data-accessory=equipmentConfirmed]').check();
 await d.getByRole('button',{name:'Generate preview',exact:true}).click();await expect(page.locator('#builder-preview')).toContainText('30 sec');await expect(page.locator('#builder-preview')).toContainText('10 min');
 await page.locator('#builder-confirm').check();await page.locator('#builder-save').click();await expect(d).toBeHidden();
 const p=await page.evaluate(()=>data.reviewedPrograms.at(-1));expect(p.config.accessories).toHaveLength(2);expect(p.sessions[0].exercises.at(-1).trainingMaxKg).toBeUndefined();
});
test('priority suggestions stay reviewable and do not invent starting loads',async({page})=>{
 await page.evaluate(()=>{data.programmingProfiles[0].context.priorities='Upper back, quads and biceps';});await phase(page);const d=page.locator('#phase-dialog');await d.locator('[data-accessory-editor] > summary').click();await d.locator('[data-accessory-tool][value=dumbbells]').check();await d.locator('[data-accessory-suggest]').click();
 await expect(d.locator('[data-accessory-row]')).toHaveCount(3);await expect(d.locator('[data-accessory=weight]').first()).toHaveValue('');
 await d.getByRole('button',{name:'Generate phase preview',exact:true}).click();await expect(page.locator('#phase-error')).toContainText('explicit accessory starting load');
 expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(0);
});
