const {test,expect}=require('playwright/test');
const {fixture}=require('../fixtures/program-review');
test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T15:00:00.000Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
});
async function ask(page,text){
 await page.locator('#cc-input').fill(text);await page.locator('#cc-form button[type="submit"]').click();
 await expect(page.locator('#cc-form button[type="submit"]')).toBeEnabled();
 return page.locator('#cc-messages .assistant').last();
}
test('v3.81 Coach connects educational guidance to verified setup and training without writes',async({page})=>{
 await page.setViewportSize({width:390,height:780});
 await page.evaluate(seed=>{
  data=normalizeDataShape({...data,...seed});
  data.programmingProfiles=LoadnoteProgrammingProfile.save([],{
   goal:'strength',experience:'beginner',consistency:'returning',availableDays:[0,2,4],sessionMinutes:60,
   equipment:['barbell','plates','rack','bench'],preferredExerciseIds:[],avoidedExerciseIds:[],priorities:'',notes:''
  },{id:'test-v381',now:'2026-09-20T12:00:00.000Z'});
 },fixture());
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('#coach-companion-launcher').click();
 await ask(page,'Explain training frequency');
 const reply=await ask(page,'How does that apply for me?');
 await expect(reply).toContainText('For your training:');
 await expect(reply).toContainText('3 available day(s) per week and 60 minutes per session');
 await expect(reply).toContainText('Your logs show');
 await expect(reply).toContainText('not verified adherence');
 const expectedCards=await page.evaluate(()=>LoadnoteProgressStory.selectedProgram(data,'2026-09-24')?3:2);
 await expect(reply.locator('.cc-evidence article')).toHaveCount(expectedCards);
 await expect(reply.locator('.cc-evidence')).not.toHaveAttribute('open','');
 await reply.locator('.cc-evidence summary').click();
 await expect(reply.locator('.cc-evidence')).toContainText('Recent logged training');
 const references=reply.locator('details').filter({hasText:'Sources and coverage'});
 await expect(references).toHaveCount(1);
 await references.locator('summary').click();
 await expect(references.locator('a')).not.toHaveCount(0);
 await expect(page.locator('#chat-messages .assistant').last()).toContainText('For your training:');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('v3.81 no prior education topic asks for context instead of inventing personal guidance',async({page})=>{
 await page.locator('#coach-companion-launcher').click();
 const reply=await ask(page,'How does that apply for me?');
 await expect(reply).toContainText('Which training principle would you like to connect to your own training?');
 await expect(reply.locator('.cc-evidence')).toHaveCount(0);
});
