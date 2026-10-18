const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');
const Phase=require('../../src/product/phase-builder');
const setup=phaseFixture(),args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
let state=Phase.save(setup.state,Phase.prepare(setup.state,setup.config,args),{confirmed:true},{...args,id:'phase5-browser'});
state=Phase.schedule(state,'phase5-browser',{...args,now:'2026-09-24T13:00:00.000Z'});
test('Phase 5 shows long-term context and exact next action without changing scheduled training',async({page,context})=>{
 await page.clock.install({time:new Date('2026-09-28T18:00:00Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 const before=await page.evaluate(seed=>{data=normalizeDataShape({...data,...seed});showTab('coach');showSubTab('coach','co-programs');LoadnoteProgramLifecycleUI.coach();return JSON.stringify(data);},state);
 const details=page.locator('#phase5-coaching');
 await expect(details).toBeVisible();
 await expect(details.locator('summary')).toContainText('Week 1 of 7');
 await details.locator('summary').click();
 await expect(details).toContainText('Phased strength');
 await expect(details).toContainText('Next scheduled');
 await expect(details).toContainText('approved changes have exact follow-up');
 await expect(details).toContainText('explicit athlete settings');
 await context.setOffline(true);
 const questions=['Where am I in my program?','What have we learned from my program changes?','What do you remember about my training?','Should my next workout adapt?'];
 const reports=await page.evaluate(items=>items.map(q=>LoadnoteCoachConversation.answer(data,q,{asOf:'2026-09-28',now:'2026-09-28T18:00:00.000Z'})),questions);
 for(const result of reports){expect(result.source).toBe('Offline Coach · longitudinal training');expect(result.readOnly).toBe(true);}
 expect(reports[0].text).toContain('week 1 of 7');
 expect(reports[2].text).toContain('Saved training setup');
 expect(reports[3].text).toContain('athlete approval');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('Phase 5 unknown history does not manufacture coaching memory or a load adjustment',async({page})=>{
 await page.clock.install({time:new Date('2026-09-22T12:00:00Z')});
 await page.goto('/');await expect(page.locator('.ex-name')).toHaveCount(1);
 const facts=await page.evaluate(()=>{
   const s=normalizeDataShape({...data,phasePrograms:[],meetCycles:[],programmingProfiles:[],workouts:[],scheduledSessions:[],phaseReviews:[]});
   return {memory:LoadnoteLongitudinalCoach.answer(s,'What do you remember about my training?',{asOf:'2026-09-22',now:'2026-09-22T12:00:00.000Z'}),
     next:LoadnoteLongitudinalCoach.answer(s,'Should my next workout adapt?',{asOf:'2026-09-22',now:'2026-09-22T12:00:00.000Z'})};
 });
 expect(facts.memory.text).toContain('no confirmed saved training setup');
 expect(facts.next.text).toContain('Choose your next training plan');
 expect(facts.memory.readOnly).toBe(true);
});
