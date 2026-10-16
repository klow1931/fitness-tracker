const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
});
async function destination(page,id,focused){
 await expect(page.locator('#'+id)).toBeInViewport({ratio:0.1});
 await expect(page.locator(focused)).toBeFocused();
 // Pending navigation restoration must not undo the destination scroll.
 await page.waitForTimeout(400);
 await expect(page.locator('#'+id)).toBeInViewport({ratio:0.1});
}
test('daily brief opens the planner and check-in, including repeated taps',async({page})=>{
 const before=await page.evaluate(()=>JSON.stringify(data));
 for(let i=0;i<2;i++){
  await page.locator('#smart-coach-brief').getByRole('button',{name:'Choose a training plan',exact:true}).click();
  await destination(page,'programming-workspace','#programming-workspace-primary');
  await page.locator('#smart-coach-brief').getByRole('button',{name:'Add an athlete check-in',exact:true}).click();
  await destination(page,'coaching-week-form','#coaching-sleep');
 }
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('check-in route preserves unsaved answers and reveals collapsed review',async({page})=>{
 await page.evaluate(()=>LoadnoteSmartCoachUI.route({kind:'check-in'}));
 await destination(page,'coaching-week-form','#coaching-sleep');
 await page.locator('#coaching-sleep').selectOption('poor');await page.locator('#coaching-notes').fill('Keep my draft');
 await page.evaluate(()=>{document.getElementById('shared-coaching-panel').open=false;LoadnoteSmartCoachUI.route({kind:'check-in'});});
 await destination(page,'coaching-week-form','#coaching-sleep');
 await expect(page.locator('#coaching-sleep')).toHaveValue('poor');await expect(page.locator('#coaching-notes')).toHaveValue('Keep my draft');
});
test('review and proposal actions reveal and focus their destinations',async({page})=>{
 for(const [kind,id,focus] of [['review','shared-coaching-review','#shared-coaching-review'],['proposals','coaching-proposals','#coaching-proposals > summary']]){
  await page.evaluate(kind=>LoadnoteSmartCoachUI.route({kind}),kind);await destination(page,id,focus);
 }
});
test('Home plan shortcut overrides remembered Coach scroll position',async({page})=>{
 await page.evaluate(()=>{window.scrollTo(0,800);showTab('dashboard');LoadnoteTrainingHubUI.plan();});
 await destination(page,'programming-workspace','#programming-workspace-primary');
});
test('check-in leaves historical evidence and opens an editable current form',async({page})=>{
 await page.evaluate(()=>{renderCoachingReview({asOf:'2025-01-01',readOnly:true});LoadnoteSmartCoachUI.route({kind:'check-in'});});
 await destination(page,'coaching-week-form','#coaching-sleep');
 await expect(page.locator('#coaching-week-confirm')).not.toBeChecked();
 await expect(page.locator('#coaching-sleep')).toHaveValue('unknown');
});
test('Companion plan action closes the overlay and reveals the planner',async({page})=>{
 await page.evaluate(()=>{showSubTab('coach','co-chat');LoadnoteCoachCompanionUI.open();LoadnoteSmartCoachUI.attach(document.getElementById('cc-messages'),{actions:[{kind:'programming',label:'Choose a training plan'}]});});
 await page.locator('#cc-messages').getByRole('button',{name:'Choose a training plan',exact:true}).click();
 await expect(page.locator('#coach-companion-panel')).not.toBeVisible();
 await destination(page,'programming-workspace','#programming-workspace-primary');
});
test('ordinary tab navigation still restores the remembered scroll position',async({page})=>{
 const position=await page.evaluate(()=>{window.scrollTo(0,600);const y=window.scrollY;showTab('dashboard');showTab('coach');return y;});
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(position);
});
test.describe('local training day',()=>{
 test.use({timezoneId:'America/New_York'});
 test('evening brief and logger use the local date after UTC midnight',async({page})=>{
  await page.clock.install({time:new Date('2026-10-16T00:31:00Z')});
  await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('.ex-name')).toHaveCount(1);
  expect(await page.evaluate(()=>today())).toBe('2026-10-15');
  await expect(page.locator('#wo-date')).toHaveValue('2026-10-15');
  await page.evaluate(()=>{showTab('coach');showSubTab('coach','co-programs');});
  await expect(page.locator('#smart-coach-brief .eyebrow')).toContainText('2026-10-15');
  await page.clock.setSystemTime(new Date('2026-10-16T04:01:00Z'));
  expect(await page.evaluate(()=>today())).toBe('2026-10-16');
 });
});
