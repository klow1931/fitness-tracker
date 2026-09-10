const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.route(/assets\/chart\.umd\.js$/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{window.Chart=class{destroy(){}update(){}};});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 await page.addStyleTag({content:'.hidden{display:none!important}'});
});
test('Workout actions stay in document flow in both gym modes',async({page})=>{
 for(const gym of [false,true]){
  await page.evaluate(gym=>{data.gymMode=gym;applyGymMode();showTab('workouts');showSubTab('workouts','wo-log');},gym);
  await expect(page.locator('#workout-actions')).toHaveCSS('position','static');
  await expect(page.locator('#sticky-save-bar')).toHaveCount(0);
  const position=()=>page.locator('#workout-actions').evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
  const before=await position();await page.evaluate(()=>window.scrollTo(0,300));
  expect(Math.abs(await position()-before)).toBeLessThan(1);
  await page.locator('#workout-actions [data-workout-action="rest-90"]').click();
  await expect(page.locator('#rest-pause')).toBeEnabled();
  await page.locator('#rest-pause').click();await expect(page.locator('#rest-pause')).toHaveText('Resume');
  await page.locator('#workout-actions [data-workout-action="stop-rest"]').click();
 }
});
test('Coach quick links have readable contrast in light and night modes',async({page})=>{
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-chat');});
 const links=page.locator('#coach-quick-links button');await expect(links).toHaveCount(11);
 for(const dark of [false,true]){
  await page.evaluate(dark=>document.body.classList.toggle('dark',dark),dark);
  for(const hover of [false,true]){
   if(hover)await links.first().hover();
   const ratios=await links.evaluateAll(buttons=>{
    const lum=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(v=>{const c=Number(v)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
    return buttons.map(b=>{const s=getComputedStyle(b),a=lum(s.color),c=lum(s.backgroundColor);return (Math.max(a,c)+.05)/(Math.min(a,c)+.05);});
   });
   for(const ratio of ratios)expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
 }
 await page.evaluate(()=>{window.askSuggestion=q=>{window.testSuggestion=q;};});
 await links.first().click();expect(await page.evaluate(()=>window.testSuggestion)).toBe('How should I progress my lifts?');
});
