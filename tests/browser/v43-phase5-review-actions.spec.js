const {test,expect}=require('playwright/test');

test('Phase 5 long-term Coach offers the actual athlete-authored program review without writing history',async({page})=>{
 await page.clock.install({time:new Date('2026-11-15T20:00:00.000Z')});
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
 const before=await page.evaluate(()=>{
  const state={...data,exerciseCatalog:[{id:'bench',name:'Competition Bench',aliases:[]}],
   customPrograms:[],phasePrograms:[],meetCycles:[],hypertrophyPrograms:[],sportPrograms:[],
   scheduledSessions:[],workouts:[],phaseReviews:[]};
  const rows=[{week:1,day:'Monday',exercise:'Competition Bench',sets:3,reps:5,weight:100,unit:'kg',rpe:7},
   {week:2,day:'Monday',exercise:'Competition Bench',sets:3,reps:5,weight:102.5,unit:'kg',rpe:8}];
  let saved=LoadnoteCustomProgram.save(state,LoadnoteCustomProgram.build(state,{
   name:'Athlete Bench Plan',weeks:2,startDate:'2026-11-02',rows,unit:'kg'
  }),{confirmed:true,now:'2026-10-28T12:00:00.000Z',id:'phase5-custom'});
  saved=LoadnoteCustomProgram.schedule(saved,'phase5-custom',{now:'2026-10-29T12:00:00.000Z'});
  for(const session of LoadnoteSchedule.list(saved.scheduledSessions)){
   saved.scheduledSessions=LoadnoteSchedule.change(saved.scheduledSessions,session.id,
    {status:'skipped',reason:'Explicitly not performed'},session.date+'T19:00:00.000Z');
  }
  data=normalizeDataShape(saved);
  const life=LoadnoteProgramLifecycle.inspect(data,{asOf:'2026-11-15'});
  if(life.nextAction.kind!=='review-custom')throw Error('Fixture did not reach the official review-custom action');
  showTab('coach');showSubTab('coach','co-programs');LoadnoteProgramLifecycleUI.coach();
  window.phase5CustomRouted=false;
  const render=LoadnoteCustomProgramUI.render;
  LoadnoteCustomProgramUI.render=function(...args){window.phase5CustomRouted=true;return render.apply(this,args);};
  return JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,customPrograms:data.customPrograms});
 });
 const details=page.locator('#phase5-coaching');
 await expect(details).toBeVisible();
 await expect(details.locator('summary').first()).toContainText('Week 2 of 2');
 await details.locator('summary').first().click();
 await expect(details).toContainText('Review your custom program');
 const review=details.locator('[data-longitudinal-review]');
 await expect(review).toHaveText('Open next review');
 await review.click();
 expect(await page.evaluate(()=>window.phase5CustomRouted)).toBe(true);
 expect(await page.evaluate(()=>JSON.stringify({workouts:data.workouts,scheduledSessions:data.scheduledSessions,customPrograms:data.customPrograms}))).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
