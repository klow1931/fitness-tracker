const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-25T12:00:00.000Z')});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});
async function seed(page){
 await page.evaluate(()=>{
  const day=today(),prior=new Date(day+'T12:00:00Z');
  prior.setUTCDate(prior.getUTCDate()-2);
  const before=prior.toISOString().slice(0,10);
  const plan=LoadnoteIntent.createPrescription([{name:'Competition Bench Press',exerciseId:'bench',
    type:'strength',trackBy:'reps',loadConvention:'total',sets:[{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}]
   }],{type:'manual',label:'Bench day'},before+'T08:00:00.000Z');
  data.scheduledSessions=LoadnoteSchedule.create([],{name:'Bench day',date:day,role:'heavy-exposure',goal:'Bench strength',prescription:plan},{id:'preview-bench',now:before+'T09:00:00.000Z'});
  data.workouts=[{id:'bench-prev',date:before,createdAt:before+'T18:00:00.000Z',exercises:[{
    name:'Competition Bench Press',exerciseId:'bench',type:'strength',trackBy:'reps',loadConvention:'total',sets:[{weight:95,reps:5,rpe:7.5}]
   }]}];
  saveData(data);renderDashboard();
 });
}
test('v4.2 Home and Train show the current target beside a prior exact-identity logged set without extra taps',async({page})=>{
 await seed(page);
 const home=page.locator('#today-training');
 const line=home.locator('[data-today-performance]');
 await expect(line).toContainText('Competition Bench Press');
 await expect(line).toContainText('Target: 100 kg × 5 @8');
 await expect(line).toContainText('Last logged');
 await expect(line).toContainText('95 kg × 5 @7.5');
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}));
 await page.evaluate(()=>{showTab('workouts');requestTrainLauncher();});
 await expect(page.locator('#train-launcher [data-today-performance]')).toContainText('Target: 100 kg × 5 @8');
 await expect(page.locator('#train-launcher [data-today-performance]')).toContainText('95 kg × 5 @7.5');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions}))).toBe(before);
 await page.locator('#train-launcher [data-train-primary="start"]').click();
 await expect(page.locator('#training-cockpit')).toBeVisible();
 await expect(page.locator('.ex-name').first()).toHaveValue('Competition Bench Press');
});

test('v4.2 converts only the display to pounds and never places preview ahead of an unfinished draft',async({page})=>{
 await seed(page);
 await page.evaluate(()=>{data.unit='lb';updateUnitToggle();renderDashboard();});
 const line=page.locator('#today-training [data-today-performance]');
 await expect(line).toContainText('lb');
 await expect(line).not.toContainText('100 kg');
 expect(await page.evaluate(()=>data.scheduledSessions[0].revisions[0].context.prescription.plannedExercises[0].sets[0].weight)).toBe(100);
 await page.evaluate(()=>{
  fillWorkoutForm([{name:'Unfinished Squat',type:'strength',sets:[{weight:120,reps:5,rpe:7}]}],'',false);
  saveLoggerDraft();
  showTab('dashboard');renderDashboard();
 });
 await expect(page.locator('#today-training')).toContainText('Workout in progress');
 await expect(page.locator('#today-training [data-today-performance]')).toHaveCount(0);
 await expect(page.locator('#today-training [data-today-train]')).toHaveCount(0);
 expect(await page.evaluate(()=>readLoggerDraft()?.rows?.[0]?.name)).toBe('Unfinished Squat');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
