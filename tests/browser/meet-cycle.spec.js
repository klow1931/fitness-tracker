const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
const eventDate=(weeks,offset=5)=>{const d=new Date('2026-09-28T12:00:00Z');d.setUTCDate(d.getUTCDate()+(weeks-1)*7+offset);return d.toISOString().slice(0,10);};
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
 await page.locator('#programming-tools-panel > summary').click();
 await page.locator('#phase-builder-panel > summary').click();
});
test('meet date determines 8 12 16 20 and 26-week timelines automatically',async({page})=>{
 await page.locator('#cycle-new').click();
 await expect(page.locator('#cycle-weeks')).toHaveCount(0);
 for(const weeks of [8,12,16,20,26]){
  await page.locator('#cycle-meet-date').fill(eventDate(weeks));
  await page.locator('#cycle-form button[type="submit"]').click();
  await expect(page.locator('#cycle-preview')).toContainText('Review all '+weeks+' weeks');
  await expect(page.locator('[data-program-planning-decision]')).toContainText('Decisions calculated your prep');
  await expect(page.locator('[data-cycle-week]')).toHaveCount(weeks);
  await expect(page.locator('[data-cycle-week="'+weeks+'"]')).toContainText('Mock meet');
  await expect(page.locator('#cycle-preview')).toContainText('Mock meet');
  await expect(page.locator('[data-program-quality-gate]')).toBeVisible();
  await expect(page.locator('[data-program-quality-gate]')).not.toHaveAttribute('data-quality-status','blocking');
  await expect(page.locator('[data-cycle-week="1"]')).toContainText('Quality preview');
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#cycle-close').click();
});
test('athlete-approved cycle schedules separate Calendar revisions and keeps history and draft unchanged',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions}));
 await page.locator('#cycle-new').click();
 await page.locator('#cycle-meet-date').fill(eventDate(8));
 await page.locator('#cycle-form button[type="submit"]').click();
 await page.locator('#cycle-save').click();
 await expect(page.locator('#cycle-error')).toContainText('Review and approve');
 await page.locator('#cycle-confirm').check();
 await page.locator('#cycle-save').click();
 await expect(page.locator('#cycle-dialog')).not.toBeVisible();
 await expect(page.locator('#phase-builder [data-phase-schedule]')).toHaveCount(0);
 await expect(page.locator('#phase-builder')).toContainText('Used as meet-prep lift setup');
 expect(await page.evaluate(()=>data.meetCycles.length)).toBe(1);
 expect(await page.evaluate(()=>data.meetCycles[0].qualityGate?.status)).toBe('pass');
 expect(await page.evaluate(()=>data.meetCycles[0].decisionEnvironment?.policies?.programQualityGate)).toBe('program-quality-gate-v1');
 expect(await page.evaluate(()=>data.meetCycles[0].decisionEnvironment?.policies?.programPlanning)).toBe('program-planning-decision-v1');
 expect(await page.evaluate(()=>data.meetCycles[0].planningDecision?.mode)).toBe('decisions');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phasePrograms:data.phasePrograms,scheduledSessions:data.scheduledSessions}))).toBe(before);
 const planned=await page.evaluate(()=>data.meetCycles[0].sessions.length);
 await page.locator('[data-cycle] > summary').click();
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('[data-cycle-schedule]').click();
 await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.length)).toBe(planned);
 expect(await page.evaluate(()=>data.scheduledSessions.every(r=>r.id.startsWith('meet:')))).toBe(true);
 await expect(page.locator('#decision-action-center')).toContainText(/mock-meet cycle/i);
 await expect(page.locator('#decision-action-center')).toContainText('Upcoming');
 await expect(page.locator('#decision-action-center')).toContainText('Next ');
 await expect(page.locator('#programming-workspace')).toContainText('already scheduled');
 await expect(page.locator('[data-cycle-current]')).toHaveCount(1);
 await expect(page.locator('#decision-action-center')).toBeVisible();
 expect(await page.evaluate(()=>data.activeProgramId??null)).toBe(null);
 expect(await page.evaluate(()=>(data.programs||[]).length)).toBe(0);
 expect(await page.evaluate(()=>data.meetCycles[0].weekly.at(-1).phase)).toBe('mock-meet');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(phaseFixture().state.workouts.length);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.reload();
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');document.getElementById('programming-tools-panel').open=true;document.getElementById('phase-builder-panel').open=true;renderPhaseBuilder();});
 await expect(page.locator('[data-cycle]')).toContainText('Scheduled');
});

test('builder distinguishes mock meets from named competition meets and supports weekday competition dates',async({page})=>{
 await page.locator('#cycle-new').click();
 await expect(page.locator('#cycle-event-type')).toHaveValue('mock');
 await expect(page.locator('#cycle-event-name-wrap')).toBeHidden();
 await page.locator('#cycle-event-type').selectOption('competition');
 await expect(page.locator('#cycle-event-name-wrap')).toBeVisible();
 await page.locator('#cycle-event-name').fill('State Championships');
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


test('20-week date-derived preview makes the extended-phase hold explicit without blocking athlete review',async({page})=>{
 await page.locator('#cycle-new').click();
 await page.locator('#cycle-meet-date').fill(eventDate(20));
 await page.locator('#cycle-form button[type="submit"]').click();
 const gate=page.locator('[data-program-quality-gate]');
 await expect(gate).toHaveAttribute('data-quality-status','review');
 await expect(gate).toContainText('beyond six progressive weeks');
 await expect(page.locator('#cycle-save')).toBeEnabled();
 await page.locator('#cycle-close').click();
});


test('advanced phase override is optional and cannot change the meet-date total',async({page})=>{
 await page.locator('#cycle-new').click();
 await page.locator('#cycle-meet-date').fill(eventDate(11));
 await page.locator('#cycle-form button[type="submit"]').click();
 await expect(page.locator('[data-program-planning-decision]')).toContainText('11 weeks');
 await page.locator('#cycle-advanced > summary').click();
 await page.locator('#cycle-customize').check();
 await page.locator('#cycle-accumulation').fill('3');
 await page.locator('#cycle-strength').fill('4');
 await page.locator('#cycle-peak').fill('2');
 await page.locator('#cycle-taper').fill('1');
 await page.locator('#cycle-form button[type="submit"]').click();
 await expect(page.locator('[data-program-planning-decision]')).toContainText('advanced phase overrides');
 await expect(page.locator('#cycle-preview')).toContainText('Accumulation 3 weeks · Strength 4 · Peak 2 · Taper 1');
 await page.locator('#cycle-strength').fill('5');
 await page.locator('#cycle-form button[type="submit"]').click();
 await expect(page.locator('#cycle-error')).toContainText('add up');
});
