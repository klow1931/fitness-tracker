const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/https:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net)(\/|$)/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.addStyleTag({content:'.hidden{display:none!important}'});await page.evaluate(()=>showTab('measures'));
});
test('grouped check-in, safe notes, history editing and no horizontal overflow',async({page})=>{
 await expect(page.locator('#measures-empty')).toBeVisible();
 await page.locator('#meas-waist').fill('85');await page.locator('#meas-chest').fill('105');
 await page.getByText('Upper body',{exact:false}).filter({has:page.locator('span')}).first().click();
 await page.locator('#meas-neck').fill('40');
 await page.locator('#meas-notes').fill('<img src=x onerror=window.injected=1> Morning');
 await page.getByRole('button',{name:'Save check-in',exact:true}).click();
 await expect(page.locator('#measure-overview')).toContainText('85cm');
 await expect(page.locator('#measures-history')).toContainText('Neck');
 await expect(page.locator('#measures-history')).toContainText('Morning');
 await expect(page.locator('#measures-history img')).toHaveCount(0);
 await page.getByRole('button',{name:'Edit check-in'}).click();await expect(page.locator('#meas-waist')).toHaveValue('85');
 await page.locator('#meas-waist').fill('84');await page.getByRole('button',{name:'Save check-in',exact:true}).click();
 expect(await page.evaluate(()=>data.measurements.length)).toBe(1);
 await expect(page.locator('#measure-overview')).toContainText('84cm');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 await page.evaluate(()=>{data.dark=true;applyDark();renderMeasures();});
 await expect(page.locator('#measure-overview')).toContainText('84cm');
});
test('unit switch converts entered values and preserves stored centimeters',async({page})=>{
 await page.locator('#meas-waist').fill('101.6');await page.locator('#meas-unit-in').click();
 await expect(page.locator('#meas-waist')).toHaveValue('40');await expect(page.locator('#meas-unit-in')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Save check-in',exact:true}).click();
 expect(await page.evaluate(()=>data.measurements[0].waist)).toBe(101.6);
 await expect(page.locator('#measure-overview')).toContainText('40in');
 await page.locator('#meas-unit-cm').click();await expect(page.locator('#measure-overview')).toContainText('101.6cm');
 await page.locator('#meas-chart-key').selectOption('neck');await expect(page.locator('#meas-delta')).toContainText('No data yet');
});
