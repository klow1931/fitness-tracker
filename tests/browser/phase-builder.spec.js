const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.use({serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-09-24T12:00:00Z')});await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-programs');renderPhaseBuilder();},phaseFixture().state);await page.locator('#phase-builder-panel > summary').click();});
async function preview(page){await page.locator('#phase-new').click();for(const [i,l]of ['squat','bench','deadlift'].entries()){await page.locator('.phase-lift > summary').nth(i).click();await page.locator('#phase-'+l+'-tm').fill(String([160,120,220][i]));}await page.locator('#phase-dialog button[type="submit"]').click();await expect(page.locator('#phase-preview')).toContainText('7 weeks · 21 sessions');}
test('reviewed phase plan survives offline and schedules without rewriting history or draft',async({page,context})=>{
 await page.evaluate(()=>{document.querySelector('.ex-name').value='Preserve my draft';saveLoggerDraft();});const draft=await page.evaluate(()=>localStorage.getItem(LOGGER_DRAFT_KEY)),history=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.reviewedPrograms}));
 await preview(page);await page.locator('#phase-save').click();await expect(page.locator('#phase-error')).toContainText('Review every phase');await page.locator('#phase-confirm').check();await page.locator('#phase-save').click();await expect(page.locator('#phase-dialog')).not.toBeVisible();expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(1);expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem(LOGGER_DRAFT_KEY))).toBe(draft);
 expect(await page.evaluate(()=>JSON.stringify(normalizeDataShape(JSON.parse(JSON.stringify(data))).phasePrograms)===JSON.stringify(data.phasePrograms))).toBe(true);
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');renderPhaseBuilder();document.getElementById('phase-builder-panel').open=true;});
 await page.locator('#phase-builder > details > summary').click();page.once('dialog',d=>d.accept());await page.locator('[data-phase-schedule]').click();await expect.poll(()=>page.evaluate(()=>data.scheduledSessions.length)).toBe(21);expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,programs:data.reviewedPrograms}))).toBe(history);const restored=JSON.parse(await page.evaluate(()=>localStorage.getItem(LOGGER_DRAFT_KEY))),original=JSON.parse(draft);expect(restored.updatedAt).toBeGreaterThanOrEqual(original.updatedAt);delete restored.updatedAt;delete original.updatedAt;expect(restored).toEqual(original);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('changed inputs invalidate previews, time limits block plans and failed writes preserve data',async({page})=>{
 await preview(page);await page.locator('#phase-minutes').fill('30');await expect(page.locator('#phase-preview')).toBeEmpty();await page.locator('#phase-dialog button[type="submit"]').click();await expect(page.locator('#phase-error')).toContainText('needs about');await page.locator('#phase-minutes').fill('90');await page.locator('#phase-dialog button[type="submit"]').click();await page.locator('#phase-confirm').check();await page.evaluate(()=>{persistNow=async()=>{throw Error('Storage full');};});await page.locator('#phase-save').click();await expect(page.locator('#phase-error')).toContainText('Storage full');expect(await page.evaluate(()=>data.phasePrograms.length)).toBe(0);expect(await page.evaluate(()=>data.scheduledSessions.length)).toBe(0);expect(await page.evaluate(()=>document.getElementById('phase-dialog').scrollWidth<=document.getElementById('phase-dialog').clientWidth+1)).toBe(true);
});

test('meet preparation timeline previews from a reviewed phase without scheduling or editing workouts',async({page})=>{
 const baseline=await page.evaluate(config=>{const proposal=LoadnotePhaseBuilder.prepare(data,config,{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'});data=LoadnotePhaseBuilder.save(data,proposal,{confirmed:true,notes:'Reviewed for timeline'},{asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z',id:'meet-preview'});renderPhaseBuilder();return JSON.stringify({workouts:data.workouts,sessions:data.scheduledSessions,programs:data.phasePrograms});},phaseFixture().config);
 await page.locator('#phase-builder > details > summary').click();
 await page.locator('[data-meet-panel] > summary').click();
 await page.locator('[data-meet-date]').fill('2026-12-19');
 await page.locator('[data-meet-preview]').click();
 await expect(page.locator('[data-meet-result]')).toContainText('2026-11-23');
 await expect(page.locator('[data-meet-result]')).toContainText('taper');
 await page.locator('[data-meet-date]').fill('2026-11-28');
 await page.locator('[data-meet-preview]').click();
 await expect(page.locator('[data-meet-result]')).toContainText('overlaps');
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,sessions:data.scheduledSessions,programs:data.phasePrograms}))).toBe(baseline);
});
