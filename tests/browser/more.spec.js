const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/https:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net)(\/|$)/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.addStyleTag({content:'.hidden{display:none!important}'});
});
test('Calendar month controls and keyboard day selection',async({page})=>{
 await page.evaluate(()=>showTab('calendar'));
 await expect(page.locator('#calendar-grid button')).toHaveCount(42);
 const old=await page.locator('#cal-month-label').textContent();await page.getByRole('button',{name:'Next month',exact:true}).click();
 expect(await page.locator('#cal-month-label').textContent()).not.toBe(old);
 await page.locator('#calendar-grid button').nth(10).focus();await page.keyboard.press('Enter');
 await expect(page.locator('#calendar-grid button[aria-pressed="true"]')).toHaveCount(1);
 await page.getByRole('button',{name:'Log workout this day'}).click();await expect(page.locator('#exercise-rows')).toBeVisible();
});
test('PR entry and record cards remain usable',async({page})=>{
 await page.evaluate(()=>showTab('prs'));
 await page.locator('#pr-exercise').fill('Bench Press');await page.locator('#pr-weight').fill('100');await page.getByRole('button',{name:'Save PR',exact:true}).click();
 await expect(page.locator('#pr-list')).toContainText('Bench Press');
 page.once('dialog',d=>d.accept());await page.locator('#pr-list').getByRole('button',{name:'Delete'}).click();await expect(page.locator('#pr-list')).toContainText('No personal records');
});
test('Photo journal comparison and safe notes',async({page})=>{
 await page.evaluate(()=>{data.progressPhotos=[{id:1,date:'2026-09-01',tag:'front',note:'<img src=x> Check-in',dataUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6qS8AAAAASUVORK5CYII='}];showTab('photos');});
 await expect(page.locator('#photos-grid .photo-card')).toHaveCount(1);await expect(page.locator('#photos-grid img')).toHaveCount(1);
 await expect(page.locator('#photo-compare')).toBeVisible();await expect(page.locator('#photo-compare-a-view img')).toHaveCount(1);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete photo'}).click();await expect(page.locator('#photos-grid')).toContainText('No progress photos');
});
test('Tools groups preserve calculators and backup controls',async({page})=>{
 await page.evaluate(()=>showTab('tools'));
 await page.locator('#orm-weight').fill('100');await page.locator('#orm-reps').fill('5');await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await expect(page.locator('#orm-result')).not.toBeEmpty();
 await page.locator('#tools-rpe > summary').click();await expect(page.locator('#rpe-1rm')).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON backup',exact:true}).click();expect((await download).suggestedFilename()).toMatch(/json$/);
 await page.locator('#tools-about > summary').click();await expect(page.locator('#tools-about')).toContainText('Chart.js');
});
test('More pages fit the viewport in light and dark modes',async({page})=>{
 for(const dark of [false,true])for(const panel of ['calendar','prs','photos','tools']){
   await page.evaluate(({panel,dark})=>{data.dark=dark;applyDark();showTab(panel);},{panel,dark});
   await expect(page.locator('#panel-'+panel+' > header h1')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),panel).toBe(true);
 }
});
