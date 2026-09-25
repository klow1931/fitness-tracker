const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
});
test('Decisions prioritizes plan, compact lift summaries, grouped programs and evidence action',async({page})=>{
 const labels=await page.locator('#panel-coach .section-tab').allTextContents();
 expect(labels.map(s=>s.trim())).toEqual(['Overview','Insights','Coach','Goals']);
 const positions=await page.evaluate(()=>['decision-action-center','decision-readiness-card','phase-review-panel','programming-profile-panel','program-outcomes-panel'].map(id=>document.getElementById(id)?.getBoundingClientRect().top));
 expect(positions.every((p,i)=>i===0||p>positions[i-1])).toBe(true);
 await expect(page.locator('.decision-title')).toContainText('TRAINING DECISIONS');
 await expect(page.locator('.decision-title')).not.toContainText('v2.7');
 const lift=page.locator('[data-decision-lift]').first();
 await expect(lift).toBeVisible();
 await expect(lift.locator('.decision-full-reason')).not.toBeVisible();
 await expect(lift.locator('.readiness-status')).toHaveText(/Needs data|Review/);
 await lift.locator('summary').first().click();
 await expect(lift.locator('.decision-lift-body')).toBeVisible();
 await expect(page.locator('.decision-evidence-help')).toBeVisible();
 await page.locator('.decision-evidence-help > summary').click();
 await expect(page.locator('#decision-open-logger')).toBeVisible();
 await page.locator('#decision-open-logger').click();
 await expect(page.locator('[data-panel="workouts"][data-sub="wo-log"]')).toBeVisible();
});
test('Decisions cards fit a small iPhone in light and dark modes without hiding programming tools',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 for(const dark of [false,true]){
  await page.evaluate(dark=>{data.dark=dark;applyDark();},dark);
  await expect(page.locator('#phase-review-panel')).toBeVisible();
  await expect(page.locator('#programming-profile-panel')).toBeVisible();
  await expect(page.locator('#phase-builder-panel')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const panels=await page.locator('#panel-coach .decision-workspace > details.card > summary,#panel-coach .decision-build-tools > details.card > summary').evaluateAll(nodes=>nodes.map(el=>({heading:getComputedStyle(el.querySelector('b')).display,detail:getComputedStyle(el.querySelector('small')).display,right:el.getBoundingClientRect().right})));
  expect(panels.every(row=>row.heading==='block'&&row.detail==='block'&&row.right<=376)).toBe(true);
  const status=await page.locator('[data-decision-lift]').first().locator('.readiness-status').evaluate(el=>({color:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}));
  expect(status.color).not.toBe(status.bg);
 }
});
