const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
test('three paths, opt-in Simple view and Full view survive reload without changing training',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify({profiles:data.programmingProfiles,workouts:data.workouts,roles:data.exerciseRoles}));
 await expect(page.locator('body')).not.toHaveClass(/loadnote-simple-view/);
 await expect(page.locator('[data-beginner-entry]')).toHaveCount(3);
 await page.locator('#beginner-simple-choice').check();await page.locator('[data-beginner-entry=log]').click();
 await expect(page.locator('#workout-log-card')).toBeVisible();await expect(page.locator('#beginner-workout-guide')).toBeInViewport();
 await expect(page.locator('body')).toHaveClass(/loadnote-simple-view/);
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);
 await expect(page.locator('#onboarding-card')).toBeHidden();await expect(page.locator('#home-details')).toBeHidden();
 await page.locator('#simple-show-all').click();await expect(page.locator('#home-details')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify({profiles:data.programmingProfiles,workouts:data.workouts,roles:data.exerciseRoles}))).toBe(before);
 await page.reload();await expect(page.locator('body')).not.toHaveClass(/loadnote-simple-view/);
});
test('existing-program path offers manual entry without requiring profile or maxes',async({page})=>{
 await page.locator('[data-beginner-entry=program]').click();await expect(page.locator('#beginner-existing-program')).toBeVisible();
 await page.getByRole('button',{name:'Enter my session',exact:true}).click();await expect(page.locator('#workout-log-card')).toBeVisible();
 expect(await page.evaluate(()=>data.programmingProfiles.length)).toBe(0);
 await expect(page.locator('.set-rpe').first()).toHaveValue('');
});
test('guided setup keeps unknown experience and opens planning without creating a program',async({page})=>{
 await page.locator('[data-beginner-entry=help]').click();await expect(page.locator('#programming-profile-dialog')).toBeVisible();
 await expect(page.locator('#profile-experience')).toHaveValue('unknown');
 await page.locator('#programming-profile-dialog button[type=submit]').click();
 await expect(page.locator('#programming-workspace')).toBeVisible();
 expect(await page.evaluate(()=>LoadnoteProgrammingProfile.current(data.programmingProfiles).context.experience)).toBe('unknown');
 expect(await page.evaluate(()=>data.scheduledSessions.length+data.workouts.length+data.programs.length)).toBe(0);
});
test('guide next, hide and replay never enter or complete work; narrow screen stays usable',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();const guide=page.locator('#beginner-workout-guide');
 const before=await page.evaluate(()=>{const d=captureLoggerDraft();delete d.updatedAt;return d;});
 for(let i=0;i<3;i++)await guide.locator('[data-guide=next]').click();
 await expect(guide).toContainText('Opening review does not save');
 expect(await page.evaluate(()=>{const d=captureLoggerDraft();delete d.updatedAt;return d;})).toEqual(before);
 await guide.locator('[data-guide=skip]').click();await expect(guide).toBeHidden();
 await page.reload();await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('profile'));await page.locator('#profile-replay-guide').click();await expect(guide).toBeVisible();await expect(guide).toContainText('1. Choose your exercise');
 await page.setViewportSize({width:320,height:844});expect(await guide.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});
test('failed preference write keeps view and entry unchanged',async({page})=>{
 await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='loadnote.experience.v1')throw Error('quota');return window.originalSet.call(this,k,v);};});
 await page.locator('#beginner-simple-choice').check();await page.locator('[data-beginner-entry=log]').click();
 await expect(page.locator('#onboarding-card')).toBeVisible();await expect(page.locator('body')).not.toHaveClass(/loadnote-simple-view/);
 expect(await page.evaluate(()=>LoadnoteBeginnerUI.selected())).toBe(false);
});
test('only a successfully persisted new workout finishes the guide; blank effort stays unknown',async({page})=>{
 await page.locator('[data-beginner-entry=log]').click();
 await page.evaluate(()=>{fillWorkoutForm([{name:'Bench Press',type:'strength',trackBy:'reps',sets:[{weight:40,reps:5,rpe:''}]}],'',false);saveLoggerDraft();reviewWorkout();window.realBeginnerPersist=persistNow;persistNow=async()=>{throw Error('storage unavailable');};});
 await page.locator('[data-workout-action=review-save]').click();await expect(page.locator('#workout-save-status')).toContainText('not saved');
 expect(await page.evaluate(()=>LoadnoteBeginnerExperience.read(localStorage).guide)).toBe('active');expect(await page.evaluate(()=>data.workouts.length)).toBe(0);
 await page.evaluate(()=>{persistNow=window.realBeginnerPersist;});await page.locator('[data-workout-action=review-save]').click();
 await expect.poll(()=>page.evaluate(()=>data.workouts.length)).toBe(1);
 expect(await page.evaluate(()=>LoadnoteBeginnerExperience.read(localStorage).guide)).toBe('complete');
 expect(await page.evaluate(()=>data.workouts[0].exercises[0].sets[0].rpe)).toBeFalsy();
 await expect(page.locator('#beginner-workout-guide')).toBeHidden();
});
