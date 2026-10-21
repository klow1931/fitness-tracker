const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-21T14:00:00.000Z')});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed.state});showTab('coach');showSubTab('coach','co-chat');},phaseFixture());
});
test('v3.78 Coach explains absent approved bench outcomes without changing training data',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 const before=await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phaseReviews:data.phaseReviews,meetCycles:data.meetCycles}));
 await page.locator('#chat-input').fill('What happened after my last bench change?');
 await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-send-btn')).toBeEnabled();
 const reply=page.locator('#chat-messages .assistant').last();
 await expect(reply).toContainText('No eligible athlete-approved bench programming changes');
 const detail=reply.locator('.cc-evidence');
 await expect(detail).toHaveCount(1);
 await expect(detail).not.toHaveAttribute('open','');
 await detail.locator('summary').click();
 await expect(detail).toContainText('Approved bench follow-ups');
 await expect(detail).toContainText('Unobserved changes cannot be graded');
 await expect(reply.getByRole('button',{name:/Approve|Apply|Save target/i})).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,phaseReviews:data.phaseReviews,meetCycles:data.meetCycles}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
