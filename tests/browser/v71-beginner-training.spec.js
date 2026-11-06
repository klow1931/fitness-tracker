const {test,expect}=require('playwright/test');
test.use({timezoneId:'America/New_York'});
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-11-06T01:30:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
async function makePlan(page){
 await page.locator('[data-beginner-entry=help]').click();await page.locator('#starter-preview-btn').click();
 await page.locator('#starter-confirm').check();await page.locator('#starter-save').click();
 await expect(page.locator('#starter-step')).toContainText('Plan saved');
}
async function logOne(page,rpe=''){
 await page.locator('.ex-name').first().fill('Goblet Squat');
 await page.locator('.set-weight').first().fill('10');await page.locator('.set-reps').first().fill('8');
 if(rpe)await page.locator('.set-rpe').first().fill(rpe);
 await page.locator('[data-quick-complete]').first().click();
 await expect(page.locator('.set-done-check').first()).toBeChecked();
 await expect(page.locator('[data-cockpit-start]')).toHaveCount(0);
 await page.locator('[data-cockpit-review]').click();await page.locator('#confirm-workout-save').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
}
test('evening saved plan opens immediately, survives reload and loads actual blank fields',async({page})=>{
 await makePlan(page);await page.locator('#starter-open-saved').click();
 await expect(page.locator('#starter-saved-dialog')).toBeVisible();await expect(page.locator('#starter-saved-preview')).toContainText('Leg Press');
 const id=await page.evaluate(()=>data.customPrograms[0].id);await page.locator('#starter-saved-close').click();
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.locator('[data-first-week-action]').click();await expect(page.locator('#starter-saved-plan')).toHaveValue(id);
 await page.locator('#starter-saved-load').click();await expect(page.locator('.ex-name').first()).toHaveValue('Leg Press');
 await expect(page.locator('.set-weight').first()).toHaveValue('');await expect(page.locator('.set-done-check').first()).not.toBeChecked();
 expect(await page.evaluate(()=>data.workouts.length+data.scheduledSessions.length)).toBe(0);
});
test('first set has reversible options, one finish path and an optional-effort save',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();
 await expect(page.locator('[data-workout-action=last-weights]').first()).toBeHidden();
 await page.locator('.beginner-exercise-options summary').click();
 await expect(page.locator('[data-workout-action=last-weights]').first()).toBeVisible();
 await page.locator('.beginner-exercise-options summary').click();
 await logOne(page);
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].rpe)).toBeFalsy();
 await expect(page.locator('#workout-recap')).toContainText('Workout saved. Nice work.');
 await expect(page.locator('#workout-recap>.beginner-recap-details')).not.toHaveAttribute('open');
 await page.locator('#tab-prs:visible, #mobile-nav [data-tab="prs"]:visible').click();await expect(page.locator('#progress-analytics')).toContainText('1 workout saved in the last 7 days');
 await expect(page.locator('#progress-analytics')).not.toContainText('demonstrated-capacity');
 await expect(page.locator('#progress-explore')).toBeVisible();
 await page.locator('#tab-dashboard:visible, #mobile-nav [data-tab="dashboard"]:visible').click();await page.locator('#simple-show-all').click();
 await page.locator('#tab-prs:visible, #mobile-nav [data-tab="prs"]:visible').click();await expect(page.locator('[data-progress-window]')).toBeVisible();
});
test('Complete set retains typed actual effort and weight units',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();await page.evaluate(()=>setUnit('lb'));
 await logOne(page,'8');
 const set=await page.evaluate(()=>data.workouts[0].exercises[0].sets[0]);expect(set.rpe).toBe(8);expect(set.weight).toBe(4.54);
});
test('beginner Coach foregrounds saved plan; optional tools and direct questions stay reachable',async({page})=>{
 await makePlan(page);await page.locator('#starter-close').click();
 await page.locator('#tab-coach:visible, #mobile-nav [data-tab="coach"]:visible').click();await page.getByRole('tab',{name:'Your program',exact:true}).click();
 await expect(page.locator('#beginner-coach-plan')).toContainText('My first get into a routine plan');
 await expect(page.locator('#decision-readiness-card')).toBeHidden();
 await page.locator('#beginner-coach-plan [data-beginner-coach-tools]').click();await expect(page.locator('#decision-readiness-card')).toBeVisible();
 await page.locator('#beginner-coach-plan [data-beginner-coach-plan]').click();await expect(page.locator('#starter-saved-dialog')).toBeVisible();await page.locator('#starter-saved-close').click();
 await page.getByRole('tab',{name:'Ask Coach',exact:true}).click();await page.locator('#chat-input').fill("What is RPE? I'm new to lifting.");await page.locator('#chat-send-btn').click();
 await expect(page.locator('#chat-messages .assistant').last()).toContainText('two more reps');
});
test('narrow and enlarged-text first workout has reachable options and no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>document.documentElement.style.fontSize='20px');
 await page.locator('.ex-name').first().fill('Goblet Squat');await page.locator('.set-reps').first().fill('8');await page.locator('.set-weight').first().fill('10');
 await expect(page.locator('[data-quick-complete]').first()).toBeVisible();
 await expect(page.locator('#training-cockpit')).toHaveCSS('position','static');
 expect(await page.locator('#beginner-workout-guide').evaluate(el=>!!(el.compareDocumentPosition(document.getElementById('exercise-rows'))&Node.DOCUMENT_POSITION_PRECEDING))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('[data-cockpit-options]').click();await expect(page.locator('[data-workout-action=track-duration]').first()).toBeVisible();
});
