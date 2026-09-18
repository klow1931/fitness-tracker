const {test,expect}=require('playwright/test');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{
  const ws=['2026-06-10','2026-07-10','2026-08-10'].map((date,i)=>({id:'review-'+i,date,createdAt:date+'T18:00:00.000Z',exercises:[{exerciseId:'sq',name:'Squat <test>',sets:[{weight:100+i*10,reps:5,rpe:i===2?9.5:6}]}]}));
  for(const w of ws)w.sessionIntent=LoadnoteIntent.context({prescription:LoadnoteIntent.createPrescription(w.exercises,{type:'manual'},w.date+'T10:00:00.000Z')});
  data.workouts=ws;data.trainingBlocks=LoadnoteBlocks.upsert([],{name:'Return block',startDate:'2026-06-01',endDate:'2026-09-01',blockType:'return-reentry',loadStrategy:'conservative',progressionIntent:'return-ramp'},{now:'2026-09-01T18:00:00.000Z'});
  showTab('dashboard');renderTrainingReview();
 });await page.locator('#review-as-of').fill('2026-08-20');await page.locator('#review-refresh').click();
});
test('review separates trends, escapes evidence without changing saved workouts',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));
 await page.locator('.review-lift summary').click();
 await expect(page.locator('.review-lift')).toContainText('Prescription progression');
 await expect(page.locator('.review-lift')).toContainText('100 kg → 120 kg');
 await expect(page.locator('.review-lift')).toContainText('Workout review-0');
 await expect(page.locator('#training-review-results')).toContainText('not equivalent');
 await expect(page.locator('.review-lift test')).toHaveCount(0);
 await page.locator('#review-mode').selectOption('recorded');
 await expect(page.locator('#training-review-results')).not.toContainText('Return block');
 await page.locator('#review-weeks').selectOption('1');
 await expect(page.locator('#training-review-results')).toContainText('Not enough data');
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
});
test('review loads offline in dark mode and converts display without rewriting kg',async({page,context})=>{
 await page.evaluate(async()=>{data.dark=true;data.unit='lb';applyDark();await persistNow(data);});
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();await page.evaluate(()=>{showTab('dashboard');renderTrainingReview();});
 await page.locator('#training-review-panel > summary').click();
 await page.locator('#review-as-of').fill('2026-08-20');await page.locator('#review-refresh').click();await page.locator('.review-lift summary').click();
 await expect(page.locator('.review-lift')).toContainText('lb');
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].weight)).toBe(100);
 const box=await page.locator('#training-review').boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width+1);
 await expect(page.locator('#review-error')).toBeEmpty();
 await page.locator('#review-block').selectOption(await page.evaluate(()=>data.trainingBlocks[0].id));
 await expect(page.locator('#review-weeks')).toBeDisabled();
 await expect(page.locator('#training-review-results')).toContainText('in Return block');
});
test('selected block respects historical knowledge and does not silently switch ranges',async({page})=>{
 const id=await page.evaluate(()=>data.trainingBlocks[0].id);
 await page.locator('#review-block').selectOption(id);
 await expect(page.locator('#training-review-results')).toContainText('2026-06-01 – 2026-08-20');
 await page.locator('#review-mode').selectOption('recorded');
 await expect(page.locator('#review-error')).toContainText('not available');
 await expect(page.locator('#training-review-results')).toBeEmpty();
 await page.locator('#review-block').selectOption('');
 await expect(page.locator('#review-error')).toBeEmpty();
 await expect(page.locator('#review-weeks')).toBeEnabled();
});
test('low RPE and submaximal singles have distinct explanations',async({page})=>{
 await page.evaluate(()=>{data.workouts[0].exercises[0].sets=[{weight:200,reps:1,rpe:7},{weight:100,reps:5,rpe:5},{weight:100,reps:5}];renderTrainingReview();});
 await page.locator('.review-lift summary').click();
 await expect(page.locator('.review-lift')).toContainText('Low-effort set');
 await expect(page.locator('.review-lift')).toContainText('Submaximal single: observed load only');
 await expect(page.locator('.review-lift')).toContainText('RPE not recorded');
 await expect(page.locator('.review-lift')).toContainText('200 kg × 1 @ 7');
 await expect(page.locator('.cleanup-single-table')).toContainText('200 kg');
 await expect(page.locator('.cleanup-single-table')).toContainText('7');
 await page.locator('[data-review-edit]').first().click();
 await expect(page.locator('#wo-date')).toHaveValue('2026-06-10');
 expect(await page.evaluate(()=>workoutEdit.id)).toBe('review-0');
});

test('review stays compact until opened and filters exercises',async({page})=>{
 await expect(page.locator('#training-review-panel')).not.toHaveAttribute('open','');
 await page.locator('#training-review-panel > summary').click();
 await expect(page.locator('#training-review-panel')).toHaveAttribute('open','');
 await page.evaluate(()=>{
   const w=data.workouts[2];w.exercises.push({exerciseId:'row',name:'Row',sets:[{weight:60,reps:8,rpe:8}]});renderTrainingReview();
 });
 await page.locator('#review-exercises').selectOption({label:'Squat <test>'});
 await expect(page.locator('.review-lift')).toHaveCount(1);
 await expect(page.locator('.review-lift summary')).toContainText('Squat <test>');
 await expect(page.locator('#training-review-results')).not.toContainText('Row ·');
});
