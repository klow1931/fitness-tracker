const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-programs');},phaseFixture().state);
});
async function open(page,experience='beginner'){
 await page.evaluate(experience=>{const p=LoadnoteProgrammingProfile.current(data.programmingProfiles).context;data.programmingProfiles=LoadnoteProgrammingProfile.save([],{...p,goal:'meet',experience,eventDate:'2026-12-19'},{id:'meet-profile',now:'2026-09-23T11:00:00.000Z'});LoadnotePhaseBuilderUI.open(null,{continueToMeet:true});},experience);
 for(const [i,l]of ['squat','bench','deadlift'].entries())await page.locator('#phase-'+l+'-tm').fill(String([160,120,220][i]));
}
test('beginner setup shows essentials, recommends linear and hands off to protected event planning',async({page},info)=>{
 await open(page);const d=page.locator('#phase-dialog');await expect(d).toContainText('STEP 1 OF 2');await expect(page.locator('#phase-style-hint')).toContainText('suggests Linear');
 await expect(page.locator('#phase-accumulation')).not.toBeVisible();await expect(page.locator('#phase-squat-sets')).not.toBeVisible();
 for(const width of [320,390,430]){await page.setViewportSize({width,height:844});expect(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);}
 await page.evaluate(()=>document.documentElement.style.fontSize='24px');await page.setViewportSize({width:320,height:844});expect(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.evaluate(()=>document.documentElement.style.fontSize='');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.body.classList.add('dark'));await d.evaluate(el=>el.scrollTop=0);
 await page.screenshot({path:info.outputPath('meet-prep-essentials-mobile.png')});
 await d.getByRole('button',{name:'Review lift setup',exact:true}).click();await expect(page.locator('#phase-error')).toBeEmpty();await expect(page.locator('#phase-preview')).toContainText('Linear loading');
 await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();await expect(page.locator('#cycle-dialog')).toBeVisible();await expect(page.locator('#cycle-meet-date')).toHaveValue('2026-12-19');
 await page.locator('#cycle-dialog button[type=submit]').click();await expect(page.locator('#cycle-preview')).toContainText('Decisions calculated your prep');expect(await page.evaluate(()=>data.meetCycles.length)).toBe(0);
});
test('style options produce distinct saved prescriptions and day changes rebuild suggested exposures',async({page})=>{
 await open(page,'intermediate');const d=page.locator('#phase-dialog');await expect(page.locator('#phase-style-hint')).toContainText('suggests Daily-undulating');
 await expect(page.locator('#phase-periodization option:disabled')).toHaveCount(0);await page.locator('#phase-periodization').selectOption('wave');await d.getByRole('button',{name:'Review lift setup',exact:true}).click();await expect(page.locator('#phase-preview')).toContainText('Wave 1 / step 2');
 await page.locator('#phase-periodization').selectOption('undulating');await expect(page.locator('#phase-preview')).toBeEmpty();
 await d.locator('[data-phase-day][value="1"]').uncheck();await d.locator('[data-phase-day][value="4"]').check();await d.getByRole('button',{name:'Review lift setup',exact:true}).click();await expect(page.locator('#phase-error')).toBeEmpty();await expect(page.locator('#phase-preview')).toContainText('Daily-undulating loading');
 await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();expect(await page.evaluate(()=>data.phasePrograms.at(-1).config.periodization)).toBe('undulating');
 expect(await page.evaluate(()=>data.phasePrograms.at(-1).config.days)).toEqual([0,2,4]);
});
test('accessory picker swaps rows for pulldowns and trunk work without inventing loads',async({page})=>{
 await open(page);const d=page.locator('#phase-dialog');await d.locator('[data-accessory-editor]>summary').click();await d.locator('[data-accessory-add]').click();const row=d.locator('[data-accessory-row]');
 await row.locator('[data-accessory-movement]').selectOption({label:'Lat Pulldown'});await expect(row.locator('[data-accessory=name]')).toHaveValue('Lat Pulldown');await expect(row.locator('[data-accessory=equipment]')).toHaveValue('cable');await expect(row.locator('[data-accessory=weight]')).toHaveValue('');
 await row.locator('[data-accessory=weight]').fill('20');await row.locator('[data-accessory=equipmentConfirmed]').check();await d.getByRole('button',{name:'Review lift setup',exact:true}).click();await expect(page.locator('#phase-preview')).toContainText('Lat Pulldown');
 await row.locator('[data-accessory-movement]').selectOption({label:'Plank'});await expect(page.locator('#phase-preview')).toBeEmpty();await expect(row.locator('[data-accessory=mode]')).toHaveValue('duration');await expect(row.locator('[data-accessory=weight]')).toHaveValue('0');await expect(row.locator('[data-accessory=equipmentConfirmed]')).not.toBeChecked();
});
test('preferred accessories beat library order and repeated suggestions do not duplicate movements',async({page})=>{
 await page.evaluate(()=>{const p=data.programmingProfiles[0].context;p.priorities='Upper back';p.accessoryEquipment=['cable','dumbbells','bodyweight'];const id=LoadnoteIntegrity.stableExerciseId('Lat Pulldown');data.exerciseCatalog.push({id,name:'Lat Pulldown',aliases:[]});p.preferredExerciseIds=[id];});await open(page);const d=page.locator('#phase-dialog');await d.locator('[data-accessory-editor]>summary').click();await d.locator('[data-accessory-suggest]').click();
 await expect(d.locator('[data-accessory=name]').first()).toHaveValue('Lat Pulldown');await expect(d.locator('[data-accessory-row]')).toHaveCount(1);await d.locator('[data-accessory-suggest]').click();await expect(d.locator('[data-accessory-row]')).toHaveCount(1);await expect(d.locator('[data-accessory-hint]')).toContainText('already listed');
});
test('weekly-undulating setup explains its targets and retains the style through save, event handoff and reload',async({page},info)=>{
 await open(page);const d=page.locator('#phase-dialog');
 await page.locator('#phase-periodization').selectOption('weekly-undulating');
 await expect(page.locator('#phase-bench-step').locator('..')).toContainText('per two-week pair');
 await d.locator('#phase-style-reason > summary').click();
 await expect(d.locator('#phase-style-reason')).toContainText('two-week pair');
 await expect(d.locator('#phase-style-reason')).toContainText('Phase structure and loading style are separate');
 for(const width of [320,390,430]){await page.setViewportSize({width,height:844});expect(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);}
 await d.getByRole('button',{name:'Review lift setup',exact:true}).click();await expect(page.locator('#phase-error')).toBeEmpty();
 await expect(page.locator('#phase-preview')).toContainText('Weekly-undulating loading');
 await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();
 await expect(page.locator('#cycle-dialog')).toContainText('Reviewed loading style: Weekly undulating');
 const before=await page.evaluate(()=>({workouts:JSON.stringify(data.workouts),source:data.phasePrograms.at(-1)}));
 expect(before.source.config.periodization).toBe('weekly-undulating');
 const primary=phase=>before.source.sessions.filter(s=>s.phase===phase).flatMap(s=>s.exercises).filter(e=>e.lift==='bench'&&e.role==='primary').map(e=>e.sets[0].reps);
 expect(primary('accumulation').slice(0,2)).toEqual([6,4]);expect(primary('strength').slice(0,2)).toEqual([4,2]);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:info.outputPath('weekly-loading-event-handoff.png')});
 await page.locator('#cycle-dialog button[type=submit]').click();await expect(page.locator('#cycle-preview')).toContainText('Decisions calculated your prep');
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before.workouts);
 await page.reload();expect(await page.evaluate(()=>data.phasePrograms.at(-1).config.periodization)).toBe('weekly-undulating');
});
