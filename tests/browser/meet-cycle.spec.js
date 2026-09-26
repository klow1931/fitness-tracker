const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed});
  const config=seed.__cycleFixtureConfig;delete data.__cycleFixtureConfig;
  const proposal=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});
  data=LoadnotePhaseBuilder.save(data,proposal,{confirmed:true,notes:'Cycle lift setup'},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'cycle-base'});
  showTab('coach');showSubTab('coach','co-programs');renderPhaseBuilder();
 },{...phaseFixture().state,__cycleFixtureConfig:phaseFixture().config});
 await page.locator('#phase-builder-panel > summary').click();
});
test('8 12 16 20 and custom week lengths preserve complete phase dates and mock meet',async({page})=>{
 await page.locator('#cycle-new').click();
 for(const weeks of [8,12,16,20,26]){
  if(weeks===26)await page.locator('#cycle-weeks').fill('26');
  else await page.locator('[data-cycle-preset="'+weeks+'"]').click();
  await page.locator('#cycle-form button[type="submit"]').click();
  await expect(page.locator('#cycle-preview')).toContainText('Review all '+weeks+' weeks');
  await expect(page.locator('[data-cycle-week]')).toHaveCount(weeks);
  await expect(page.locator('[data-cycle-week="'+weeks+'"]')).toContainText('Mock meet');
  await expect(page.locator('#cycle-preview')).toContainText('Mock meet');
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#cycle-close').click();
});
test('athlete-approved cycle schedules separate Calendar revisions and keeps history and draft unchanged',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions}));
 await page.locator('#cycle-new').click();
 await page.locator('[data-cycle-preset="8"]').click();
 await page.locator('#cycle-form button[type="submit"]').click();
 await page.locator('#cycle-save').click();
 await expect(page.locator('#cycle-error')).toContainText('Review and approve');
 await page.locator('#cycle-confirm').check();
 await page.locator('#cycle-save').click();
 await expect(page.locator('#cycle-dialog')).not.toBeVisible();
 expect(await page.evaluate(()=>data.meetCycles.length)).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions}))).toBe(before);
 const planned=await page.evaluate(()=>data.meetCycles[0].sessions.length);
 await page.locator('[data-cycle] > summary').click();
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('[data-cycle-schedule]').click();
 await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.length)).toBe(planned);
 expect(await page.evaluate(()=>data.scheduledSessions.every(r=>r.id.startsWith('meet:')))).toBe(true);
 expect(await page.evaluate(()=>data.meetCycles[0].weekly.at(-1).phase)).toBe('mock-meet');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(phaseFixture().state.workouts.length);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.reload();
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');document.getElementById('phase-builder-panel').open=true;renderPhaseBuilder();});
 await expect(page.locator('[data-cycle]')).toContainText('Scheduled');
});

test('builder distinguishes mock meets from named competition meets and supports weekday competition dates',async({page})=>{
 await page.locator('#cycle-new').click();
 await expect(page.locator('#cycle-event-type')).toHaveValue('mock');
 await expect(page.locator('#cycle-event-name-wrap')).toBeHidden();
 await page.locator('#cycle-event-type').selectOption('competition');
 await expect(page.locator('#cycle-event-name-wrap')).toBeVisible();
 await page.locator('#cycle-event-name').fill('State Championships');
 await page.locator('[data-cycle-preset="12"]').click();
 await page.locator('#cycle-meet-date').fill('2026-12-16');
 await page.locator('#cycle-form button[type="submit"]').click();
 await expect(page.locator('#cycle-preview')).toContainText('State Championships');
 await expect(page.locator('[data-cycle-week="12"]')).toContainText('State Championships');
 await page.locator('#cycle-confirm').check();await page.locator('#cycle-save').click();
 await expect(page.locator('#cycle-dialog')).not.toBeVisible();
 const stored=await page.evaluate(()=>({type:data.meetCycles[0].config.eventType,name:data.meetCycles[0].config.eventName,phase:data.meetCycles[0].weekly.at(-1).phase}));
 expect(stored).toEqual({type:'competition',name:'State Championships',phase:'meet'});
 await expect(page.locator('[data-cycle]').first()).toHaveAttribute('data-event-type','competition');
 await expect(page.locator('[data-cycle]').first()).toContainText('State Championships');
});
