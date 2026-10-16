const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.evaluate(()=>showTab('profile'));
 await expect(page.locator('#profile-appearance')).toBeVisible();
 await page.locator('#profile-appearance > summary').click();
});
test('preset themes and light/dark mode persist without rewriting workout history',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data.workouts));
 await page.locator('[data-appearance-palette="ocean"]').click();
 await expect(page.locator('[data-appearance-palette="ocean"]')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--brand').trim())).toBe('#0369a1');
 await page.locator('[data-appearance-mode="dark"]').click();
 await expect(page.locator('body')).toHaveClass(/dark/);
 await expect(page.locator('#dark-toggle')).toContainText('☀️');
 expect(await page.evaluate(()=>JSON.stringify(data.workouts))).toBe(before);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await expect(page.locator('body')).toHaveClass(/dark/);
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--brand').trim())).toBe('#0369a1');
 await page.locator('#dark-toggle').click();
 await expect(page.locator('body')).not.toHaveClass(/dark/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('loadnote-appearance-v1')));
 expect(saved.mode).toBe('light');
 expect(saved.palette).toBe('ocean');
});
test('system appearance follows live OS changes and reset restores original look',async({page})=>{
 await page.locator('[data-appearance-mode="system"]').click();
 await page.emulateMedia({colorScheme:'dark'});
 await expect(page.locator('body')).toHaveClass(/dark/);
 await page.emulateMedia({colorScheme:'light'});
 await expect(page.locator('body')).not.toHaveClass(/dark/);
 await page.locator('#appearance-reset').click();
 await expect(page.locator('[data-appearance-palette="indigo"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('[data-appearance-mode="light"]')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>localStorage.getItem('loadnote-appearance-v1'))).toBeNull();
});
test('custom color stays legible on a narrow phone without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await page.locator('#appearance-custom-color').evaluate(el=>{el.value='#ffff00';el.dispatchEvent(new Event('change',{bubbles:true}));});
 await expect(page.locator('body')).not.toHaveClass(/dark/);
 const outcome=await page.evaluate(()=>{
  const button=document.querySelector('.appearance-preview-action');
  const styles=getComputedStyle(button),contrast=LoadnoteAppearance.contrast(styles.backgroundColor.startsWith('rgb')?'#'+styles.backgroundColor.match(/\d+/g).slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):getComputedStyle(document.documentElement).getPropertyValue('--brand').trim(),'#ffffff');
  const box=document.querySelector('#profile-appearance').getBoundingClientRect();
  return {ratio:contrast,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,boxOverflow:box.right>innerWidth+1};
 });
 expect(outcome.ratio).toBeGreaterThanOrEqual(4.5);
 expect(outcome.overflow).toBe(false);
 expect(outcome.boxOverflow).toBe(false);
 await expect(page.locator('#appearance-status')).toContainText('saved');
});
