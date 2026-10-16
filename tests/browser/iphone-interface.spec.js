const {test,expect}=require('playwright/test');
test.use({viewport:{width:390,height:844}});
test.beforeEach(async({page})=>{await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('.ex-name')).toHaveCount(1);});
async function gap(a,b){const first=await a.boundingBox(),second=await b.boundingBox();expect(second.y-(first.y+first.height)).toBeGreaterThanOrEqual(8);}
async function fits(locator){expect(await locator.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);}
test('iPhone preferences have separate full-width guide actions',async({page},info)=>{
 await page.evaluate(()=>showTab('profile'));
 const replay=page.locator('#profile-replay-guide'),start=page.locator('#profile-starting-choices');
 await replay.scrollIntoViewIfNeeded();await gap(replay,start);await fits(page.locator('#profile-preferences'));
 await page.screenshot({path:info.outputPath('iphone-preferences.png')});
 await replay.click();await expect(page.locator('#beginner-workout-guide')).toBeVisible();
});
test('empty weekly schedule stays concise and its dialog buttons have room',async({page},info)=>{
 await page.locator('#home-week-plan > summary').click();
 const week=page.locator('#week-plan');await expect(week).not.toContainText('0 completed');await expect(week.locator('.schedule-completion')).toHaveCount(0);
 await week.locator('[data-new-session]').click();
 const dialog=page.locator('#schedule-dialog');await expect(dialog).toBeVisible();
 await gap(page.locator('#schedule-open-logger'),page.locator('#schedule-cancel'));await fits(dialog);
 await page.screenshot({path:info.outputPath('iphone-scheduling-dialog.png')});
 await page.locator('#schedule-cancel').click();await expect(dialog).not.toBeVisible();
});
test('Training plan omits Why and daily brief actions stack on iPhone',async({page},info)=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
 const card=page.locator('#decision-action-center .program-lifecycle-empty');
 await expect(card.locator('summary')).toHaveCount(0);await expect(card.locator('[data-lifecycle-action]')).toBeVisible();
 const actions=page.locator('#smart-coach-brief .smart-coach-actions > button');
 await actions.first().scrollIntoViewIfNeeded();await gap(actions.nth(0),actions.nth(1));
 await gap(actions.nth(1),actions.nth(2));await fits(page.locator('#smart-coach-brief'));
 await page.screenshot({path:info.outputPath('iphone-coach.png')});
});
test('safe area and enlarged text fit a narrow installed web app',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await page.evaluate(()=>{document.documentElement.style.setProperty('--loadnote-safe-top','59px');document.documentElement.style.fontSize='20px';});
 expect(await page.locator('.app-shell').evaluate(el=>parseFloat(getComputedStyle(el).paddingTop))).toBeGreaterThanOrEqual(79);
 await page.evaluate(()=>showTab('profile'));await fits(page.locator('#profile-preferences'));
 await gap(page.locator('#profile-replay-guide'),page.locator('#profile-starting-choices'));
 await page.evaluate(()=>LoadnoteScheduleUI.open());await fits(page.locator('#schedule-dialog'));
 await gap(page.locator('#schedule-open-logger'),page.locator('#schedule-cancel'));
});
