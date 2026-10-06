const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('workouts'));
});
test('logger names include exercise, set, measure and current units without changing loads',async({page})=>{
 await page.locator('.ex-name').fill('Competition Bench');await page.locator('.set-weight').fill('100');await page.locator('.set-reps').fill('5');
 await expect(page.locator('.set-weight')).toHaveAccessibleName('Competition Bench · Set 1 · Load in kilograms');
 await page.evaluate(()=>addSetToContainer(document.querySelector('.sets-container'),{weight:110,reps:3,rpe:8}));
 await expect(page.locator('.set-weight').last()).toHaveAccessibleName('Competition Bench · Set 2 · Load in kilograms');
 await page.evaluate(()=>setUnit('lb'));await expect(page.locator('.set-weight').first()).toHaveAccessibleName('Competition Bench · Set 1 · Load in pounds');
 await expect(page.locator('#unit-lb')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>toStorage(Number(document.querySelector('.set-weight').value)))).toBeCloseTo(100,1);
 await page.evaluate(()=>addExerciseRow({name:'Cycling',type:'cardio'}));
 const cardio=page.locator('#exercise-rows > div').last();
 await expect(cardio).toHaveClass(/training-collapsed/);
 await cardio.getByRole('button',{name:'Show sets',exact:true}).click();
 await expect(cardio.locator('.cardio-duration')).toBeVisible();
 await expect(cardio.locator('.cardio-duration')).toHaveAccessibleName('Exercise 2 · Cardio duration in minutes');await expect(cardio.locator('.cardio-hr')).toHaveAttribute('inputmode','numeric');
});
test('validation explains and associates an invalid field until correction',async({page})=>{
 await page.locator('.ex-name').fill('Bench');await page.locator('.set-reps').fill('5');await page.locator('.set-weight').fill('100');await page.locator('.set-rpe').fill('11');
 expect(await page.evaluate(()=>validateWorkoutForm())).toBe(false);
 await expect(page.locator('#logger-validation-error')).toBeVisible();await expect(page.locator('#logger-validation-error')).toContainText('between 1 and 10');
 await expect(page.locator('.set-rpe')).toHaveAttribute('aria-invalid','true');await expect(page.locator('.set-rpe')).toHaveAttribute('aria-describedby',/logger-validation-error/);await expect(page.locator('.set-rpe')).toBeFocused();
 await page.locator('.set-rpe').fill('8');await expect(page.locator('#logger-validation-error')).toBeHidden();expect(await page.evaluate(()=>validateWorkoutForm())).toBe(true);
});
test('section tabs support arrows and Home/End with linked panels and one tab stop',async({page})=>{
 const tabs=page.locator('#panel-workouts [role="tablist"] [role="tab"]');await tabs.first().focus();await tabs.first().press('ArrowRight');await expect(tabs.nth(1)).toBeFocused();await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');await expect(page.locator('#section-panel-workouts-wo-history')).toBeVisible();
 await tabs.nth(1).press('End');await expect(tabs.last()).toBeFocused();await tabs.last().press('Home');await expect(tabs.first()).toBeFocused();
 expect(await tabs.evaluateAll(nodes=>nodes.filter(node=>node.tabIndex===0).length)).toBe(1);
});
test('small viewport keeps logger controls usable with reduced motion and keyboard skip link',async({page})=>{
 await page.setViewportSize({width:320,height:640});await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{document.documentElement.style.fontSize='20px';window.refreshGymFloorUI();});
 const remove=page.locator('#exercise-rows [data-workout-action="remove-set"]');const box=await remove.boundingBox();
 // DOM rectangles can subtract large fractional offsets to 43.999755px.
 // Compare at hundredth-pixel precision while retaining the 44px minimum.
 expect(Math.round(box.width*100)/100).toBeGreaterThanOrEqual(44);expect(Math.round(box.height*100)/100).toBeGreaterThanOrEqual(44);
 const input=page.locator('.set-weight');expect(await input.evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
 await page.locator('.skip-link').focus();await expect(page.locator('.skip-link')).toBeInViewport();await page.locator('.skip-link').press('Enter');await expect(page.locator('#panel-workouts')).toBeFocused();
 expect(await page.locator('#panel-workouts').evaluate(node=>getComputedStyle(node).animationName)).toBe('none');
});
