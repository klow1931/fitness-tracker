const {test,expect}=require('playwright/test'),P=require('../../src/product/phase-builder'),{phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-09-24T16:00:00Z')});await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);});
test('new drafts remove old saved recaps and repeated headers use the draft date',async({page})=>{
 await page.evaluate(()=>{data.workouts=[{id:'old',date:'2026-09-01',exercises:[{name:'Bench Press',type:'strength',sets:[{weight:100,reps:5,rpe:8}]}]}];showTab('workouts');showSubTab('workouts','wo-log');showWorkoutRecap(data.workouts[0],[],[],false);});
 await expect(page.locator('#workout-recap')).toBeVisible();await page.evaluate(()=>duplicateWorkout('old'));
 await expect(page.locator('#workout-recap')).toBeHidden();await expect(page.locator('#workout-recap')).toBeEmpty();
 await page.locator('#wo-date').fill('2026-09-25');await expect(page.locator('#training-cockpit')).toContainText('Repeated workout');await expect(page.locator('#training-cockpit')).not.toContainText('Sep 1, 2026');
 await page.evaluate(()=>{showWorkoutRecap(data.workouts[0],[],[],false);clearWorkoutForm(true);});await expect(page.locator('#workout-recap')).toBeHidden();await expect(page.locator('#workout-recap')).toBeEmpty();
});
test('changed planned work offers a direct reason editor without silently choosing a reason',async({page})=>{
 await page.evaluate(()=>{fillWorkoutForm([{name:'Bench Press',type:'strength',sets:[{weight:100,reps:5,rpe:8}]}],'',false,{source:{type:'repeated-workout',referenceId:'demo',label:'Old workout'}});showTab('workouts');showSubTab('workouts','wo-log');});
 await page.locator('.set-reps').fill('3');await page.evaluate(()=>reviewWorkout());
 await expect(page.locator('#workout-review')).toContainText('Decisions may withhold progression');await page.getByRole('button',{name:'Add a reason for the change',exact:true}).click();
 await expect(page.locator('#workout-review')).not.toBeVisible();await expect(page.locator('#session-deviation-reason')).toBeVisible();await expect(page.locator('#session-deviation-reason')).toBeFocused();await expect(page.locator('#session-deviation-reason')).toHaveValue('none');
});
test('saved phase plan leads to its schedule control without scheduling automatically',async({page})=>{
 const {state,config}=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'},saved=P.save(state,P.prepare(state,config,args),{confirmed:true},{...args,id:'saved-demo'});
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-programs');renderProgrammingWorkspace();},saved);
 await expect(page.locator('#programming-workspace-primary')).toHaveText('Review and schedule saved program');await page.locator('#programming-workspace-primary').click();
 await expect(page.locator('[data-phase-schedule="saved-demo"]')).toBeVisible();expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);
});
test('completed essentials hide setup tips and empty scheduling explains prerequisites',async({page})=>{
 await page.evaluate(()=>{data.templates=[];data.programs=[];data.scheduledSessions=[];pendingPrescription=null;showTab('dashboard');renderSchedule();});
 await page.locator('#home-week-plan > summary').click();await page.locator('#week-plan [data-new-session]').click();await expect(page.locator('#schedule-dialog')).toContainText('Capture a plan before scheduling');await expect(page.locator('#schedule-name')).toHaveCount(0);
 await page.getByRole('button',{name:'Open logger to capture a plan',exact:true}).click();await expect(page.locator('#session-intent')).toBeVisible();
 const {state}=phaseFixture();await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('dashboard');renderDashboard();},state);await expect(page.locator('#onboarding-card')).toBeHidden();
});
