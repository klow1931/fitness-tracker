const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v2.60 onboarding leads into reusable training setup and Profile stays compact',async({page})=>{
 await expect(page.locator('#onboarding-card')).toBeVisible();
 await expect(page.locator('#onboarding-card')).toContainText('Set up Loadnote');
 await page.getByRole('button',{name:/Set up your training/}).click();
 await expect(page.locator('#panel-profile')).toBeVisible();
 await expect(page.locator('#profile-training-setup')).toContainText('Training setup not completed');

 await page.locator('#profile-edit-training').click();
 await expect(page.locator('#programming-profile-dialog')).toBeVisible();
 await page.locator('#programming-profile-dialog button[type="submit"]').click();
 await expect(page.locator('#programming-profile-dialog')).not.toBeVisible();
 await expect(page.locator('#profile-training-setup')).toContainText('General powerlifting');
 await expect(page.locator('#profile-training-setup')).toContainText('Mon, Wed, Fri');
 await expect(page.locator('#profile-training-setup')).toContainText('0/3 competition lifts confirmed');
 await page.locator('#profile-lift-mapping').click();
 await expect(page.locator('#panel-coach')).toBeVisible();
 await expect(page.locator('#decision-readiness-card .decision-review-tools')).toHaveAttribute('open','');
 await expect(page.locator('#decision-readiness-card .decision-review-tools > details', {hasText:'Exercise roles & relationships'})).toHaveAttribute('open','');
 await page.evaluate(()=>showTab('profile'));

 await page.locator('[data-profile-unit="lb"]').click();
 expect(await page.evaluate(()=>data.unit)).toBe('lb');
 await expect(page.locator('[data-profile-unit="lb"]')).toHaveAttribute('aria-pressed','true');

 await page.locator('#profile-more').getByRole('button',{name:/Food/}).click();
 await expect(page.locator('#panel-nutrition')).toBeVisible();
});

test('v2.60 Profile owns account and secondary destinations instead of Tools',async({page})=>{
 await page.evaluate(()=>showTab('profile'));
 await expect(page.locator('#profile-account-card #account-status')).toHaveCount(1);
 await expect(page.locator('#profile-more')).toContainText('Calendar');
 await expect(page.locator('#profile-more')).toContainText('Food');
 await expect(page.locator('#profile-more')).toContainText('Measurements');
 await expect(page.locator('#profile-more')).toContainText('Photos');
 await expect(page.locator('#profile-more')).toContainText('Tools & data');
 expect(await page.locator('#panel-tools #account-status').count()).toBe(0);
 expect(await page.locator('#mobile-more-sheet').count()).toBe(0);
});
