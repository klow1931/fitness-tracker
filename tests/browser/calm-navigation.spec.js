const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v2.76 keeps primary navigation global and moves preferences to Profile',async({page})=>{
 expect(await page.locator('.desktop-tabs > button').allTextContents()).toEqual(['Home','Train','Progress','Coach','Profile']);
 await expect(page.locator('#dark-toggle')).toBeHidden();
 await expect(page.locator('#gym-mode-btn')).toBeHidden();
 await expect(page.locator('#unit-kg').locator('..')).toBeHidden();
 await page.evaluate(()=>showTab('profile'));
 await expect(page.locator('#profile-preferences')).toContainText('How Loadnote feels');
 await expect(page.locator('[data-profile-unit="kg"]')).toBeVisible();
 await expect(page.locator('#profile-gym-mode')).toBeVisible();
 await expect(page.locator('#profile-theme')).toBeVisible();
 await expect(page.locator('#profile-more').getByRole('heading',{name:'More tools',exact:true})).toBeVisible();
 await expect(page.locator('#profile-more [data-profile-tab]')).toHaveCount(5);
 const release=await page.evaluate(()=>window.LoadnoteCore.RELEASE_VERSION);
 await expect(page.locator('#app-version')).toContainText('v'+release);
});

test('v2.76 Home defaults to training and keeps secondary evidence behind disclosure',async({page})=>{
 await page.evaluate(()=>showTab('dashboard'));
 await expect(page.locator('#today-training')).toBeVisible();
 await expect(page.locator('#calm-home-secondary')).toHaveCount(1);
 await expect(page.locator('#home-details')).not.toHaveAttribute('open','');
 await expect(page.locator('#home-details > summary')).toContainText('Training insights & history');
 await expect(page.locator('#start-here-card')).toHaveAttribute('data-calm-hidden','true');
 await expect(page.locator('#stat-protein').locator('..')).toHaveAttribute('data-calm-hidden','true');
 await expect(page.locator('#nutritionChart').locator('..')).toHaveAttribute('data-calm-hidden','true');
 const food=page.locator('#home-empty button').filter({hasText:'Log food'});
 await expect(food).toHaveAttribute('data-calm-hidden','true');
 const demo=page.locator('#home-empty button').filter({hasText:'Preview with demo data'});
 await expect(demo).toHaveAttribute('data-calm-hidden','true');
});

test('v2.76 keeps legacy programming reachable but one level deeper',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
 const programming=page.locator('.coach-programming-details');
 await programming.locator(':scope > summary').click();
 const advanced=page.locator('.calm-advanced-programming');
 await expect(advanced).toHaveCount(1);
 await expect(advanced).not.toHaveAttribute('open','');
 await advanced.locator(':scope > summary').click();
 await expect(advanced).toContainText('Legacy generator selection');
 await expect(advanced).toContainText('Legacy program library');
});
