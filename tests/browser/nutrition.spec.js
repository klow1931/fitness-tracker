const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/https:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net)(\/|$)/,route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.addStyleTag({content:'.hidden{display:none!important}'});
 await page.evaluate(()=>showTab('nutrition'));
});
async function quick(page){
 await page.evaluate(()=>{showSubTab('nutrition','nu-add');showFoodMode('manual');});
 await page.locator('#nu-protein').fill('30');await page.locator('#nu-calories').fill('300');
 await page.evaluate(()=>addQuickMacros());
 await expect(page.locator('#nutrition-save-status')).toHaveText('Saved on this device');
 await page.evaluate(()=>showSubTab('nutrition','nu-today'));
}
test('food persists across navigation, refresh, editing and clearing',async({page})=>{
 await quick(page);await expect(page.locator('#tot-cal')).toHaveText('300');
 await expect(page.locator('#tot-sodium')).toHaveText('Unknown');
 await page.reload();await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);await page.evaluate(()=>showTab('nutrition'));
 await page.addStyleTag({content:'.hidden{display:none!important}'});
 await expect(page.locator('#tot-cal')).toHaveText('300');
 page.once('dialog',d=>d.accept('2'));await page.getByRole('button',{name:'Edit portions'}).click();
 await expect(page.locator('#tot-cal')).toHaveText('600');
 await expect(page.locator('#nutrition-save-status')).toHaveText('Saved on this device');
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Clear Day Foods'}).click();
 await expect(page.locator('#nutrition-save-status')).toHaveText('Saved on this device');
 await page.evaluate(()=>loadDayFoods());await expect(page.locator('#tot-foods')).toHaveText('0');
 expect(await page.evaluate(()=>data.nutrition[0].foods)).toHaveLength(0);
});
test('barcode values use one basis and escaped text',async({page})=>{
 await page.route('https://world.openfoodfacts.org/**',r=>r.fulfill({json:{status:1,product:{product_name:'<img src=x onerror=window.injected=1>',serving_size:'30g',nutriments:{'energy-kcal_100g':400,proteins_100g:20,sodium_100g:1.2}}}}));
 await page.evaluate(()=>{showSubTab('nutrition','nu-add');showFoodMode('barcode');});
 await page.locator('#barcode-input').fill('1234567890123');await page.getByRole('button',{name:'Lookup',exact:true}).click();
 await expect(page.locator('#barcode-result')).toContainText('100g');
 await page.locator('#barcode-result').getByRole('button',{name:'Add to Day'}).click();
 await page.locator('#picked-servings').fill('0.3');await page.evaluate(()=>confirmAddFood());
 await expect(page.locator('#nutrition-save-status')).toHaveText('Saved on this device');
 await page.evaluate(()=>showSubTab('nutrition','nu-today'));
 await expect(page.locator('#tot-cal')).toHaveText('120');await expect(page.locator('#tot-sodium')).toHaveText('360mg');
 await expect(page.locator('#day-foods-list img')).toHaveCount(0);expect(await page.evaluate(()=>window.injected)).toBeUndefined();
});
test('legacy totals, recent food, targets and date isolation',async({page})=>{
 await page.evaluate(()=>{data.nutrition=[{date:'2026-01-01',calories:500,protein:40,carbs:50,fat:10}];openNutritionDate('2026-01-01');});
 await expect(page.locator('#tot-cal')).toHaveText('500');
 await page.evaluate(()=>commitNutritionDay());
 await page.evaluate(()=>openNutritionDate('2026-01-02'));await expect(page.locator('#tot-cal')).toHaveText('0');
 page.once('dialog',d=>d.accept('1'));await page.getByRole('button',{name:'Repeat recent food'}).click();
 await expect(page.locator('#tot-cal')).toHaveText('500');
 await page.getByText('My nutrition targets (optional)',{exact:true}).click();
 await page.locator('#nutrition-target-calories').fill('2500');await page.locator('#nutrition-target-protein').fill('160');
 await page.getByRole('button',{name:'Save targets',exact:true}).click();
 await expect(page.locator('#nutrition-target-summary')).toContainText('500 / 2500');
 expect(await page.evaluate(()=>data.nutrition.find(d=>d.date==='2026-01-01').calories)).toBe(500);
});
test('invalid portions rejected and failed persistence is visible',async({page})=>{
 await page.evaluate(()=>{pickFood({name:'Test',calories:100});document.getElementById('picked-servings').value='-2';confirmAddFood();});
 expect(await page.evaluate(()=>dayFoods.length)).toBe(0);
 await page.evaluate(()=>{persistNow=()=>Promise.reject(new Error('Storage full'));});
 await page.evaluate(()=>{pickFood({name:'Test',calories:100});document.getElementById('picked-servings').value='1';confirmAddFood();});
 await expect(page.locator('#nutrition-save-status')).toContainText('Not saved');
 await expect(page.locator('#storage-error-banner')).toBeVisible();
});
