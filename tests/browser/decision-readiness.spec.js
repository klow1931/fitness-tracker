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
 await page.locator('#save-exercise-roles').click();await expect.poll(()=>page.evaluate(()=>data.exerciseRoles.length)).toBe(3);await expect(card).toContainText('0/3 ready');await expect(card).toContainText('Latest logged load');await expect(card).toContainText('Baseline capacity');await expect(card).toContainText('Latest capacity');await expect(card).toContainText('Observed RPE≥7 sets/week');await expect(card).toContainText('Planned-session coverage');await expect(card).toContainText('No planned-work snapshots are recorded');await expect(card).toContainText('Block training max');await expect(card).toContainText('Known 1RM');await expect(card).toContainText('Profile benchmark');await expect(card).toContainText('not equivalent to strength gains');await expect(card).toContainText('v2.6 Decision Center');await expect(card).toContainText('Insufficient evidence');await expect(card).toContainText('Next exposure');await expect(card).toContainText('Watch next');await expect(card.locator('.decision-answer-first')).toBeVisible();await expect(card.locator('.decision-evidence-panel')).not.toHaveAttribute('open','');expect(await page.evaluate(()=>typeof LoadnoteDecisionEngine?.snapshot)).toBe('function');expect(await page.evaluate(()=>LoadnoteReadiness.snapshot(data,{asOf:'2026-09-13',retrospective:true}).decisionAllowed)).toBe(false);
});
test('historical as-recorded replay withholds later block and mapping knowledge',async({page})=>{
 const card=page.locator('#decision-readiness-card');await card.locator('summary', {hasText:'Confirm exercise roles and lift relationships'}).click();await page.locator('#apply-role-suggestions').click();await page.locator('#save-exercise-roles').click();await expect.poll(()=>page.evaluate(()=>data.exerciseRoles.length)).toBe(3);
 await card.locator('.decision-date-tools > summary').click();
 await page.locator('#readiness-date').fill('2026-06-30');await page.locator('#readiness-date').dispatchEvent('change');await page.locator('#readiness-as-recorded').check();await expect(card).toContainText('Historical as-recorded replay');await expect(card).toContainText('No active block on this date');await expect(card).toContainText('0/3 ready');await expect(card).toContainText('Competition lift not mapped');
});

test('live decisions record athlete feedback while historical replay stays read-only',async({page})=>{
 const card=page.locator('#decision-readiness-card');
 await card.locator('summary',{hasText:'Confirm exercise roles and lift relationships'}).click();
 await page.locator('#apply-role-suggestions').click();await page.locator('#save-exercise-roles').click();
 await expect.poll(()=>page.evaluate(()=>data.exerciseRoles.length)).toBe(3);
 const squat=card.locator('.decision-answer-first .readiness-lift').filter({hasText:'Squat'}).first();
 await expect(squat).not.toHaveAttribute('open','');
 await squat.locator('summary.decision-lift-summary').click();
 await expect(squat).toContainText('Athlete response');
 await squat.getByRole('button',{name:'Accept',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>data.decisionEvents?.length||0)).toBe(1);
 await expect(squat).toContainText('Accepted');
 const saved=await page.evaluate(()=>data.decisionEvents[0]);
 expect(saved.response).toBe('accept');expect(saved.snapshot.lift).toBe('squat');
 await card.locator('.decision-date-tools > summary').click();
 await page.locator('#readiness-date').fill('2026-06-30');await page.locator('#readiness-date').dispatchEvent('change');
 await expect(card).toContainText('Athlete feedback is recorded only for today');
 expect(await card.getByRole('button',{name:'Accept',exact:true}).count()).toBe(0);
});

test('Decision Performance attributes one follow-up once and filters lifts',async({page})=>{
 await page.evaluate(()=>{
  const id=LoadnoteIntegrity.resolveExercise(data.exerciseCatalog,'Back Squat').id;
  const base={version:4,lift:'squat',label:'Squat',mode:'current-corrected',readiness:'ready',decisionAllowed:true,decision:'hold',reason:'Stable',nextExposure:'Stay',watchNext:'Capacity',evidence:[]};
  const make=(day,workoutId)=>({...base,asOf:day,evidence:[{workoutId,date:day,exerciseId:id,weight:130,reps:5,rpe:8,estimatedCapacity:160.3}]});
  let ev=LoadnoteDecisionFeedback.record([],make('2026-06-18','s2'),{response:'accept'},{now:'2026-06-18T20:00:00.000Z',id:'perf-1'});
  ev=LoadnoteDecisionFeedback.record(ev,make('2026-06-20','s2'),{response:'modify',chosenDirection:'increase',note:'Felt ready'},{now:'2026-06-20T20:00:00.000Z',id:'perf-2'});
  data.decisionEvents=ev;invalidateViews();window.renderDecisionReadiness?.();
 });
 const card=page.locator('#decision-readiness-card');
 const panel=card.locator('.decision-performance');await expect(panel).toBeVisible();await panel.locator('summary').first().click();
 await expect(panel).toContainText('Unique follow-ups');
 await expect(panel).toContainText('1 / 2');
 await expect(panel).toContainText('1 overlapping');
 await panel.locator('#decision-performance-lift').selectOption('bench');
 await expect(panel).toContainText('No recorded responses for this lift yet.');
 await panel.locator('#decision-performance-lift').selectOption('squat');
 await expect(panel).toContainText('Overlapping · excluded');
 await expect(panel).toContainText('hold → increase');
 const audit=panel.locator('details').filter({has:page.locator('summary',{hasText:'Audit decision and workout evidence'})}).first();
 await audit.locator('summary').first().click();
 const observed=audit.locator('.decision-performance-rows article').filter({hasText:'Unique follow-up'}).first();
 await observed.locator('summary',{hasText:'Evidence and original recommendation'}).click();
 await observed.getByRole('button',{name:'View exact workout in Train'}).click();
 await expect(page.locator('[data-hist-id="s3"]')).toBeVisible();
 await expect(page.locator('[data-hist-id="s3"]')).toHaveClass(/decision-evidence-target/);
});

test('decision summaries stay compact and expand one lift at a time',async({page})=>{
 const card=page.locator('#decision-readiness-card');
 await expect(card.locator('.decision-lift')).toHaveCount(3);
 await expect(card.locator('.decision-lift[open]')).toHaveCount(0);
 await expect(card.locator('.decision-date-tools')).not.toHaveAttribute('open','');
 const squat=card.locator('[data-decision-lift="squat"]');
 await squat.locator('summary.decision-lift-summary').click();
 await expect(squat).toHaveAttribute('open','');
 await expect(squat.locator('.decision-feedback')).toBeVisible();
 const bench=card.locator('[data-decision-lift="bench"]');
 await bench.locator('summary.decision-lift-summary').click();
 await expect(bench).toHaveAttribute('open','');
 await expect(squat).not.toHaveAttribute('open','');
});

test('v2.6 shows explicit testing intent without pretending a general block is strength',async({page})=>{
 await page.evaluate(()=>{
  const current=LoadnoteBlocks.list(data.trainingBlocks)[0];
  data.trainingBlocks=LoadnoteBlocks.upsert(data.trainingBlocks,{...current,blockType:'general',progressionIntent:'testing',dataCompleteness:'unknown',trainingMaxes:[],known1RMs:[]},{id:current.id,now:'2026-09-03T00:00:00.000Z'});
  invalidateViews();window.renderDecisionReadiness();
 });
 const card=page.locator('#decision-readiness-card');
 await expect(card.locator('.decision-phase-label').first()).toContainText('Block: Testing');
 await expect(card.locator('.decision-phase-label').first()).toContainText('progression intent: testing');
 const squat=card.locator('.decision-lift[data-decision-lift="squat"]');
 await squat.locator('summary.decision-lift-summary').click();
 await squat.locator('.decision-block-context > summary').click();
 await expect(squat).toContainText('No block training max is recorded');
 await expect(squat).toContainText('more specific than the general block type');
});
