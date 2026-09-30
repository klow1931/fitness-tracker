const {test,expect}=require('playwright/test');
const {phaseFixture}=require('../fixtures/phase-builder');

test.use({serviceWorkers:'allow'});

test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-09-24T12:00:00.000Z')});
 await page.goto('/');
 await expect(page.locator('.ex-name')).toHaveCount(1);
 await page.evaluate(seed=>{
   data=normalizeDataShape({...data,...seed.state});
   const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
   const phase=LoadnotePhaseBuilder.prepare(data,seed.config,args);
   data=LoadnotePhaseBuilder.save(data,phase,{confirmed:true,notes:'Viewer source'},{...args,id:'viewer-base'});
   const source=data.phasePrograms.find(p=>p.id==='viewer-base');
   const event=(()=>{const d=new Date(source.config.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7*7+5);return d.toISOString().slice(0,10);})();
   const meet=LoadnoteMeetCycle.prepare(data,source,{version:1,meetDate:event,eventType:'mock'},args);
   data=LoadnoteMeetCycle.save(data,meet,{confirmed:true,notes:'Viewer cycle'},{...args,id:'viewer-cycle'});
   data=LoadnoteMeetCycle.schedule(data,'viewer-cycle',{...args,now:'2026-09-24T13:00:00.000Z'});
   saveData(data);
   showTab('dashboard');
   renderDashboard();
 },phaseFixture());
});

test('current program opens a mobile weekly workout viewer with targets and prescription reasons',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const card=page.locator('#program-lifecycle-home');
 await expect(card).toBeVisible();
 await expect(card).toContainText(/mock-meet cycle/i);
 await card.getByRole('button',{name:'View workouts'}).click();
 const dialog=page.locator('#program-workout-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('CURRENT PROGRAM');
 await expect(dialog).toContainText('Week 1 — Accumulation');
 await expect(dialog.locator('[data-program-week]')).toHaveCount(8);
 await expect(dialog).toContainText('Mock meet');
 const first=dialog.locator('[data-program-session]').first();
 await first.locator('summary').click();
 await expect(first).toContainText('Competition Bench Press');
 await expect(first).toContainText('% TM');
 await expect(first).toContainText('RPE 7');
 await expect(first).toContainText('Why:');
 await expect(first).toContainText('Competition-lift practice');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Calendar shows the same future scheduled prescription before the workout is performed',async({page})=>{
 const info=await page.evaluate(()=>({
   date:data.meetCycles[0].sessions[0].date,
   workoutCount:data.workouts.filter(w=>w.date===data.meetCycles[0].sessions[0].date).length
 }));
 expect(info.workoutCount).toBe(0);
 await page.evaluate(day=>{
   showTab('calendar');
   calCursor=new Date(day+'T12:00:00');
   calSelectedDate=day;
   renderCalendar();
 },info.date);
 const cell=page.locator('#calendar-grid .cal-cell').filter({hasText:String(Number(info.date.slice(-2)))});
 await expect(page.locator('#calendar-grid .cal-cell.has-planned')).toHaveCount(1);
 await expect(page.locator('#cal-day-detail')).toContainText('PLANNED');
 await expect(page.locator('#cal-day-detail')).toContainText('Competition Bench Press');
 await expect(page.locator('#cal-day-detail')).toContainText('% TM');
 await expect(page.locator('#cal-day-detail')).toContainText('RPE 7');
 await expect(page.locator('#cal-day-detail')).toContainText('Competition-lift practice');
 expect(await page.evaluate(day=>data.workouts.some(w=>w.date===day),info.date)).toBe(false);
});
