const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-15T16:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
test('untouched planned sets never save; a partial completion survives reload and saves only actual work',async({page},info)=>{
 await page.evaluate(()=>{
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Squat',type:'strength',sets:Array.from({length:6},()=>({weight:115,reps:5,targetRpe:7}))}],{type:'manual',label:'Audit squat day'});
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Audit squat day',date:today(),role:'volume',prescription:plan},{id:'audit-day'});
  showTab('dashboard');renderDashboard();
 });
 await page.locator('#today-training [data-today-train]').click();
 await page.locator('[data-cockpit-review]').click();await expect(page.locator('#workout-review')).not.toBeVisible();await expect(page.locator('#toast-host')).toContainText('Untouched targets are not saved');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await page.locator('.set-weight').first().fill('117.5');await page.locator('.set-rpe').first().fill('8');
 await page.locator('[data-cockpit-review]').click();await expect(page.locator('#workout-review')).not.toBeVisible();
 await page.locator('.set-done-check').first().check();await page.reload();await page.evaluate(()=>{showTab('workouts');showSubTab('workouts','wo-log');});
 await expect(page.locator('.set-done-check').first()).toBeChecked();await page.locator('[data-cockpit-review]').click();
 await expect(page.locator('#workout-review-content')).toContainText('1/6 planned sets represented');await expect(page.locator('#workout-review-content')).toContainText('Unchecked targets are excluded');
 await page.screenshot({path:info.outputPath('partial-workout-review.png')});
 await page.locator('#confirm-workout-save').click();await expect(page.locator('#workout-review')).not.toBeVisible();
 const saved=await page.evaluate(()=>data.workouts[0]);expect(saved.exercises[0].sets).toHaveLength(1);expect(saved.exercises[0].sets[0].weight).toBe(117.5);expect(saved.sessionIntent.prescription.plannedExercises[0].sets).toHaveLength(6);
});
test('new athlete confirms lifts and reviews meet setup without creating workout history',async({page},info)=>{
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed,workouts:[],workoutRevisions:[],exerciseCatalog:[],exerciseRoles:[],phasePrograms:[],meetCycles:[]});showTab('coach');showSubTab('coach','co-programs');LoadnotePhaseBuilderUI.open(null,{continueToMeet:true});},phaseFixture().state);
 const identities=page.locator('#competition-lifts-dialog');await expect(identities).toBeVisible();await expect(identities).toContainText('No workout history is required');
 await identities.getByRole('button',{name:'Save lifts & continue'}).click();await expect(page.locator('#competition-lifts-error')).toContainText('Confirm');
 await page.locator('#competition-name-deadlift').fill('Competition Sumo Deadlift');await page.locator('#competition-lifts-confirm').check();await identities.getByRole('button',{name:'Save lifts & continue'}).click();
 await expect(page.locator('#phase-dialog')).toBeVisible();await expect(identities).not.toBeVisible();
 expect(await page.evaluate(()=>data.workouts.length)).toBe(0);expect(await page.evaluate(()=>LoadnoteReadiness.list(data.exerciseRoles).length)).toBe(3);
 for(const [l,tm]of [['squat',180],['bench',126],['deadlift',216]])await page.locator('#phase-'+l+'-tm').fill(String(tm));
 await page.screenshot({path:info.outputPath('fresh-meet-setup.png')});
 await page.locator('#phase-dialog button[type=submit]').click();await expect(page.locator('#phase-error')).toBeEmpty();await expect(page.locator('#phase-preview')).toContainText('Review lift setup');
});
