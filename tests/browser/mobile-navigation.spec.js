const {test,expect}=require('playwright/test');
test.beforeEach(async({page},info)=>{
 test.skip(info.project.name==='desktop-chromium','Bottom navigation is mobile-only');
 await page.addInitScript(()=>{
  const viewport=new EventTarget();Object.assign(viewport,{width:390,height:844,scale:1,offsetTop:0,offsetLeft:0});
  Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
  window.resizeVisualViewport=values=>{Object.assign(viewport,values);viewport.dispatchEvent(new Event('resize'));};
 });
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
test('browser chrome, zoom and repeated navigation cannot strand the bottom menu',async({page})=>{
 const nav=page.locator('#mobile-nav');
 await page.evaluate(()=>resizeVisualViewport({height:550}));await expect(nav).toBeVisible();
 for(let n=0;n<3;n++)for(const name of ['Train','Coach','Profile','Home','Progress']){
  await nav.getByRole('button',{name,exact:true}).click();await expect(nav).toBeVisible();
 }
 await page.evaluate(()=>{resizeVisualViewport({width:844,height:390});window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('pageshow'));});await expect(nav).toBeVisible();
 await nav.getByRole('button',{name:'Train',exact:true}).click();
 await page.locator('.ex-name').focus();await page.evaluate(()=>resizeVisualViewport({width:390,height:400,scale:1.5}));await expect(nav).toBeVisible();
});
test('keyboard hides controls only during editable focus and restores them after blur or navigation',async({page})=>{
 const nav=page.locator('#mobile-nav');await nav.getByRole('button',{name:'Train',exact:true}).click();
 await page.locator('.ex-name').focus();await page.evaluate(()=>resizeVisualViewport({height:500}));await expect(nav).toBeHidden();
 await page.locator('.ex-name').evaluate(e=>e.blur());await expect(nav).toBeVisible();
 // The keyboard's close animation may not have restored the viewport yet.
 await nav.getByRole('button',{name:'Coach',exact:true}).click();await expect(nav).toBeVisible();
 await page.evaluate(()=>{document.body.classList.add('mobile-keyboard-open');window.dispatchEvent(new Event('pageshow'));});await expect(nav).toBeVisible();
 await page.evaluate(()=>{document.body.classList.add('mobile-keyboard-open');document.dispatchEvent(new Event('visibilitychange'));});await expect(nav).toBeVisible();
 await nav.getByRole('button',{name:'Train',exact:true}).click();await page.locator('.ex-name').focus();
 await page.evaluate(()=>resizeVisualViewport({height:480}));await expect(nav).toBeHidden();
 await page.evaluate(()=>showTab('profile'));await expect(nav).toBeVisible();
});
