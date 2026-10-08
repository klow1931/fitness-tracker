const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});data.programmingProfiles[0].context.priorities='Upper back, quads and biceps';data.programmingProfiles[0].context.accessoryEquipment=['bodyweight','dumbbells'];},phaseFixture().state);
});
test('priority options use available tools, explain matches and require reviewed loads',async({page},info)=>{
 await page.evaluate(()=>LoadnotePhaseBuilderUI.open());const d=page.locator('#phase-dialog');
 await d.locator('[data-accessory-editor] > summary').click();await d.locator('[data-accessory-suggest]').click();
 await expect(d.locator('[data-accessory-row]')).toHaveCount(3);
 await expect(d.locator('[data-accessory-reason]').first()).toContainText('stated upper back priority');
 const equipment=await d.locator('[data-accessory=equipment]').evaluateAll(es=>es.map(e=>e.value));expect(equipment.every(e=>['bodyweight','dumbbells'].includes(e))).toBe(true);
 await expect(d.locator('[data-accessory=weight]').first()).toHaveValue('');await expect(d.locator('[data-accessory=equipmentConfirmed]').first()).not.toBeChecked();
 const first=d.locator('[data-accessory-row]').first();await first.locator('[data-accessory-movement]').selectOption(await page.evaluate(()=>LoadnoteIntegrity.stableExerciseId('Dumbbell Row')));
 await expect(first.locator('[data-accessory-reason]')).toContainText('Rowing work');await expect(first.locator('[data-accessory=weight]')).toHaveValue('');
 await expect(first.locator('[data-accessory-movement] optgroup')).toHaveCount(7);
 await first.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('exercise-options.png')});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Companion explains shared equipment and follows alternatives without changing data',async({page},info)=>{
 const before=await page.evaluate(()=>JSON.stringify(data));await page.locator('#coach-companion-launcher').click();
 async function ask(q){await page.locator('#cc-input').fill(q);await page.locator('#cc-form button').click();await expect(page.locator('#cc-form button')).toBeEnabled();}
 await ask('What equipment for Lat Pulldown?');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Equipment: Cable');
 await ask('Only dumbbells instead?');await expect(page.locator('#cc-messages .assistant').last()).toContainText('Chest-supported Row');await expect(page.locator('#cc-messages .assistant').last()).toContainText('separate starting load');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 await page.screenshot({path:info.outputPath('companion-alternatives.png')});
});
test('saved accessory access survives profile editing and blocks unavailable new proposals',async({page})=>{
 await page.evaluate(()=>openProgrammingProfile());const d=page.locator('#programming-profile-dialog');await expect(d.locator('[data-profile-accessory-equipment][value=dumbbells]')).toBeChecked();await expect(d.locator('[data-profile-accessory-equipment][value=cable]')).not.toBeChecked();
 await d.getByRole('button',{name:'Save programming profile',exact:true}).click();await expect(d).toBeHidden();
 expect(await page.evaluate(()=>LoadnoteProgrammingProfile.current(data.programmingProfiles).context.accessoryEquipment)).toEqual(['bodyweight','dumbbells']);
});
