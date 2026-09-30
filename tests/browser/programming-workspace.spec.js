const {test,expect}=require('playwright/test'),{phaseFixture}=require('../fixtures/phase-builder');
test.use({serviceWorkers:'allow'});

test.beforeEach(async({page})=>{
  await page.clock.install({time:new Date('2026-09-29T22:00:00Z')});
  await page.goto('/');
  await expect(page.locator('.ex-name')).toHaveCount(1);
  await page.evaluate(seed=>{
    data=normalizeDataShape({...data,...seed});
    showTab('coach');showSubTab('coach','co-programs');
    renderProgrammingProfile();renderPowerliftingBuilder();renderPhaseBuilder();renderProgramAdoption();renderProgrammingWorkspace();
  },phaseFixture().state);
});

test('program planner shows one primary path and keeps alternate builders collapsed',async({page})=>{
  const planner=page.locator('#programming-workspace');
  await expect(planner).toContainText('Build your next training cycle');
  await expect(planner.locator('#programming-workspace-primary')).toHaveText('Open program designer');
  await expect(page.locator('#programming-tools-panel')).not.toHaveAttribute('open','');
  await expect(page.locator('#phase-builder-panel')).not.toBeVisible();
  await expect(page.locator('#reviewed-builder-panel')).not.toBeVisible();
  await planner.locator('#programming-workspace-tools').click();
  await expect(page.locator('#programming-tools-panel')).toHaveAttribute('open','');
  await expect(page.locator('#programming-tools-panel')).toContainText('Quick 4-week return block');
  await expect(page.locator('#programming-tools-panel')).toContainText('Program designer');
  await expect(page.locator('#programming-tools-panel')).toContainText('Adopt an existing program');
});

test('program designer accepts a Sunday intent and aligns the actual program week to Monday',async({page})=>{
  await page.locator('#programming-workspace-primary').click();
  const dialog=page.locator('#phase-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Program designer');
  await page.locator('#phase-start').fill('2026-10-11');
  for(const [i,lift] of ['squat','bench','deadlift'].entries()){
    await page.locator('.phase-lift > summary').nth(i).click();
    await page.locator('#phase-'+lift+'-tm').fill(String([160,120,220][i]));
  }
  await dialog.locator('button[type="submit"]').click();
  await expect(page.locator('#phase-start')).toHaveValue('2026-10-12');
  await expect(page.locator('#phase-preview')).toContainText('Review the complete sequence');
  await expect(page.locator('#phase-error')).toBeEmpty();
});

test('meet profile uses one guided meet-prep path and treats profile event date as a default',async({page})=>{
  await page.evaluate(()=>{
    const p=LoadnoteProgrammingProfile.current(data.programmingProfiles).context;
    data.programmingProfiles=LoadnoteProgrammingProfile.save([],{...p,goal:'meet',eventDate:'2026-12-26'},{id:'meet-ui',now:'2026-09-28T12:00:00.000Z'});
    renderProgrammingProfile();renderPhaseBuilder();renderProgrammingWorkspace();
  });
  const planner=page.locator('#programming-workspace');
  await expect(planner).toContainText('Build your meet-prep cycle');
  await expect(planner).toContainText('event 2026-12-26');
  await expect(planner.locator('#programming-workspace-primary')).toHaveText('Start meet-prep setup');
  await planner.locator('#programming-workspace-primary').click();
  await expect(page.locator('#phase-dialog')).toContainText('save this setup and continue directly into the full event timeline');
  await expect(page.locator('#phase-dialog')).toContainText('does not need to end on your profile event date');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
