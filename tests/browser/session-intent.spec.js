const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
  await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
  await page.addInitScript(()=>{window.Chart=class {destroy(){} update(){}};});
  await page.goto('/');await page.addStyleTag({content:'.hidden{display:none!important}'});await page.evaluate(()=>showTab('workouts'));
  await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});
async function enterPlan(page){
  await page.locator('.ex-name').fill('Back Squat');await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill('140');await page.locator('.set-rpe').fill('7');
  await page.locator('#session-intent > summary').click();
  await page.locator('#session-role').selectOption('technique');await page.locator('#session-goal').fill('Competition movement practice');
}
test('manual plan keeps target and actual performance separate through save and history',async({page})=>{
  await enterPlan(page);await page.getByRole('button',{name:'Use entered work as plan'}).click();
  await expect(page.locator('#planned-work-summary')).toContainText('1 planned exercises · 1 planned sets');await expect(page.locator('.set-rpe')).toHaveValue('');
  await page.locator('.set-rpe').fill('6');await page.getByRole('button',{name:'Review workout',exact:true}).click();
  await expect(page.locator('#workout-review-content')).toContainText('Session role: Technique / skill');await expect(page.locator('#workout-review-content')).toContainText('1/1 planned sets represented');
  await page.getByRole('button',{name:'Save workout',exact:true}).click();await expect(page.locator('#workout-review')).not.toBeVisible();
  const saved=await page.evaluate(()=>data.workouts[0]);expect(saved.sessionIntent.prescription.plannedExercises[0].sets[0].targetRpe).toBe(7);expect(saved.exercises[0].sets[0].rpe).toBe(6);expect(await page.evaluate(()=>LoadnoteIntent.compare(data.workouts[0]).status)).toBe('as-planned');
  await page.evaluate(()=>showSubTab('workouts','wo-history'));await expect(page.locator('#workout-history')).toContainText('Technique / skill');await expect(page.locator('#workout-history')).toContainText('1/1 planned sets represented');
});
test('modified planned session persists its reason and survives draft refresh',async({page})=>{
  await enterPlan(page);await page.getByRole('button',{name:'+ Add Set',exact:true}).click();await page.getByRole('button',{name:'Use entered work as plan'}).click();
  await page.getByRole('button',{name:'Remove set',exact:true}).last().click();await page.locator('#session-deviation-reason').selectOption('fatigue');await page.locator('#session-deviation-notes').fill('Readiness was lower than expected');
  await page.reload();await page.evaluate(()=>showTab('workouts'));await expect(page.locator('#session-role')).toHaveValue('technique');await expect(page.locator('#session-deviation-reason')).toHaveValue('fatigue');await expect(page.locator('#planned-work-summary')).toContainText('2 planned sets');
  await page.locator('.set-rpe').fill('8');await page.getByRole('button',{name:'Review workout',exact:true}).click();await expect(page.locator('#workout-review-content')).toContainText('1/2 planned sets represented');await expect(page.locator('#workout-review-content')).toContainText('Fatigue / readiness');
  await page.getByRole('button',{name:'Save workout',exact:true}).click();const comparison=await page.evaluate(()=>LoadnoteIntent.compare(data.workouts[0]));expect(comparison.status).toBe('modified');expect(comparison.hasExplanation).toBe(true);
});
test('templates automatically become provenance-labelled plans',async({page})=>{
  await page.evaluate(()=>{data.templates=[{id:'template-1',name:'Squat volume',created:'2026-09-14',exercises:[{name:'Back Squat',type:'strength',sets:[{reps:5,weight:120}]}]}];renderTemplates();});
  await page.locator('#template-select').selectOption('template-1');await expect(page.locator('#planned-work-summary')).toContainText('Template · Squat volume');
  const plan=await page.evaluate(()=>pendingPrescription);expect(plan.source.type).toBe('template');expect(plan.source.referenceId).toBe('template-1');
});
