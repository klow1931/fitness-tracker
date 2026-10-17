const {test,expect}=require('playwright/test'),{fixture}=require('../fixtures/weekly-coaching');
test('Phase 3 Progress highlights and offline plateau answer use the same logged history',async({page})=>{
 await page.clock.install({time:new Date('2026-09-28T18:00:00Z')});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 const before=await page.evaluate(()=>{
  const today='2026-09-28';
  data.workouts=[['s1','2026-07-10',100],['s2','2026-07-24',100],['r1','2026-09-07',100],['r2','2026-09-21',100]].map(([id,date,weight])=>({
   id,date,createdAt:date+'T20:00:00.000Z',
   exercises:[{type:'strength',trackBy:'reps',exerciseId:'b',name:'Competition Bench',sets:[{weight,reps:5,rpe:8}]}]
  }));
  data.exerciseCatalog=[{id:'b',name:'Competition Bench'}];
  data.exerciseRoles=LoadnoteReadiness.replace([],[{exerciseId:'b',role:'competition',competitionLift:'bench'}],{now:'2026-07-01T00:00:00.000Z',createId:()=> 'role-b'});
  data.scheduledSessions=[];data.phasePrograms=[];data.meetCycles=[];data.phaseReviews=[];
  invalidateViews();showTab('prs');return JSON.stringify(data);
 });
 await expect(page.locator('#progress-analytics .progress3-highlights')).toContainText('Workouts logged');
 await expect(page.locator('#progress-analytics .progress3-highlights')).toContainText('Sets with RPE');
 await expect(page.locator('#progress-analytics .progress3-highlights article').first().locator('strong')).toHaveText('2');
 const reply=await page.evaluate(()=>LoadnoteCoachConversation.answer(data,'Why has my bench stalled?',{asOf:'2026-09-28',unit:'lb'}));
 expect(reply.source).toBe('Offline Coach · corrected training trends');
 expect(reply.text).toContain('does not prove a physiological plateau');
 expect(reply.text).toContain('lb');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
test('Phase 3 weekly observations stay read-only and route to existing Decisions review',async({page})=>{
 await page.clock.install({time:new Date('2026-10-04T19:00:00Z')});
 await page.goto('/');await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 const before=await page.evaluate(s=>{
  data=normalizeDataShape({...data,...s,unit:'kg'});showTab('coach');showSubTab('coach','co-programs');
  return JSON.stringify(data);
 },fixture());
 await page.getByRole('button',{name:'Review my week',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Weekly review',exact:true});
 await expect(dialog).toContainText('What stood out this week?');
 await expect(dialog).toContainText('Effort above target');
 await expect(dialog).toContainText('Next review step');
 const q=await page.evaluate(()=>LoadnoteCoachConversation.answer(data,'What stood out this week?',{asOf:today()}));
 expect(q.readOnly).toBe(true);expect(q.text).toContain('Effort above target');
 expect(await page.evaluate(()=>JSON.stringify(data))).toBe(before);
});
