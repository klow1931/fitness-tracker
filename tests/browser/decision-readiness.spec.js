const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){} update(){}};});await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>{
  const exercise=(name,weight,rpe)=>({name,sets:[{weight,reps:5,rpe}]});
  data.workouts=[
   {id:'s1',date:'2026-06-10',createdAt:'2026-06-10T20:00:00.000Z',updatedAt:'2026-06-10T20:00:00.000Z',exercises:[exercise('Back Squat',120,6)]},
   {id:'s2',date:'2026-06-17',createdAt:'2026-06-17T20:00:00.000Z',updatedAt:'2026-06-17T20:00:00.000Z',exercises:[exercise('Back Squat',130,7)]},
   {id:'s3',date:'2026-06-24',createdAt:'2026-06-24T20:00:00.000Z',updatedAt:'2026-06-24T20:00:00.000Z',exercises:[exercise('Back Squat',140,8)]},
   {id:'b1',date:'2026-06-11',createdAt:'2026-06-11T20:00:00.000Z',updatedAt:'2026-06-11T20:00:00.000Z',exercises:[exercise('Bench Press',90,7)]},
   {id:'d1',date:'2026-06-12',createdAt:'2026-06-12T20:00:00.000Z',updatedAt:'2026-06-12T20:00:00.000Z',exercises:[exercise('Deadlift',160,7)]}
  ];data=LoadnoteIntegrity.normalizeState(data);const squat=LoadnoteIntegrity.resolveExercise(data.exerciseCatalog,'Back Squat').id;
  data.trainingBlocks=LoadnoteBlocks.upsert([],{name:'Return to Powerlifting',startDate:'2026-06-10',endDate:null,blockType:'return-reentry',primaryGoal:'Rebuild strength and work capacity',loadStrategy:'conservative',progressionIntent:'return-ramp',dataCompleteness:'complete',trainingMaxes:[{exercise:'Back Squat',exerciseId:squat,kg:165.56,observedOn:'2026-06-10'}],known1RMs:[{exercise:'Back Squat',exerciseId:squat,kg:202.3,observedOn:'2026-06-01'}]},{now:'2026-09-01T00:00:00.000Z'});invalidateViews();showTab('coach');showSubTab('coach','co-programs');
 });
});
test('confirmed roles create separated evidence without enabling decisions',async({page})=>{
 const card=page.locator('#decision-readiness-card');await expect(card).toContainText('0/3 ready');await card.locator('summary', {hasText:'Confirm exercise roles and lift relationships'}).click();await page.locator('#apply-role-suggestions').click();expect(await page.locator('[data-role]').evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(['competition','competition','competition']);
 await page.locator('#save-exercise-roles').click();await expect.poll(()=>page.evaluate(()=>data.exerciseRoles.length)).toBe(3);await expect(card).toContainText('0/3 ready');await expect(card).toContainText('Latest logged load');await expect(card).toContainText('Baseline capacity');await expect(card).toContainText('Latest capacity');await expect(card).toContainText('Observed RPE≥7 sets/week');await expect(card).toContainText('Planned-session coverage');await expect(card).toContainText('No planned-work snapshots are recorded');await expect(card).toContainText('Block training max');await expect(card).toContainText('Known 1RM');await expect(card).toContainText('Profile benchmark');await expect(card).toContainText('not equivalent to strength gains');await expect(card).toContainText('v2.1 Decision Center');await expect(card).toContainText('Insufficient evidence');await expect(card.locator('.decision-answer-first')).toBeVisible();await expect(card.locator('.decision-evidence-panel')).not.toHaveAttribute('open','');expect(await page.evaluate(()=>typeof LoadnoteDecisionEngine?.snapshot)).toBe('function');expect(await page.evaluate(()=>LoadnoteReadiness.snapshot(data,{asOf:'2026-09-13',retrospective:true}).decisionAllowed)).toBe(false);
});
test('historical as-recorded replay withholds later block and mapping knowledge',async({page})=>{
 const card=page.locator('#decision-readiness-card');await card.locator('summary', {hasText:'Confirm exercise roles and lift relationships'}).click();await page.locator('#apply-role-suggestions').click();await page.locator('#save-exercise-roles').click();await expect.poll(()=>page.evaluate(()=>data.exerciseRoles.length)).toBe(3);
 await page.locator('#readiness-date').fill('2026-06-30');await page.locator('#readiness-date').dispatchEvent('change');await page.locator('#readiness-as-recorded').check();await expect(card).toContainText('Historical as-recorded replay');await expect(card).toContainText('No active block on this date');await expect(card).toContainText('0/3 ready');await expect(card).toContainText('Competition lift not mapped');
});
