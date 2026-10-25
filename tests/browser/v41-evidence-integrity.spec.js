const {test,expect}=require('playwright/test');

test.beforeEach(async({page})=>{
 await page.goto('/');
 await expect(page.locator('#exercise-rows .ex-name')).toHaveCount(1);
});

test('v4.1 recap excludes RPE from changed loads and reports unknown actual effort',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
  data.unit='kg';updateUnitToggle();
  const plan=LoadnoteIntent.createPrescription([{
   exerciseId:'bench',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
    {weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8},{weight:100,reps:5,targetRpe:8}
   ]
  }],{type:'manual'},'2026-10-01T12:00:00.000Z');
  const workout={id:'v41',date:'2026-10-02',createdAt:'2026-10-02T18:00:00.000Z',
   sessionIntent:{prescription:plan},
   exercises:[{exerciseId:'bench',name:'Competition Bench',type:'strength',trackBy:'reps',sets:[
    {weight:105,reps:5,rpe:10},{weight:100,reps:5,rpe:7.5},{weight:100,reps:5,rpe:null}
   ]}]};
  data.workouts=[workout];data.scheduledSessions=[];
  showTab('workouts');document.getElementById('workout-recap').hidden=false;
  LoadnoteTrainingContinuityUI.renderRecap(workout,data,{asOf:'2026-10-02'});
 });
 const card=page.locator('.adaptive-handoff');
 await expect(card).toBeVisible();
 const evidence=card.locator('.session-result-evidence');
 await evidence.getByText('Training evidence',{exact:true}).click();
 await expect(evidence).toContainText('target RPE 8 · actual RPE 7.5 across 1 matched set');
 await expect(evidence).toContainText('1 planned RPE set not comparable');
 await expect(evidence).toContainText('1 matched set with unknown actual RPE');
 await expect(evidence).not.toContainText('actual RPE 10');
 await expect(card.locator('[data-adaptive-learning]')).toContainText('Other work was changed');
 expect(await page.evaluate(()=>data.workouts.length)).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('v4.1 zero bodyweight weight remains valid, while absent performed load is not counted',async({page})=>{
 const result=await page.evaluate(()=>{
  const plan=LoadnoteIntent.createPrescription([{exerciseId:'bw',name:'Bodyweight Squat',type:'strength',sets:[{weight:0,reps:12,targetRpe:7}]}],{type:'manual'},'2026-10-01T12:00:00.000Z');
  const workout={id:'bw',date:'2026-10-02',sessionIntent:{prescription:plan},exercises:[{exerciseId:'bw',name:'Bodyweight Squat',type:'strength',sets:[{weight:0,reps:12,rpe:7}]}]};
  const present={exact:LoadnoteIntent.compare(workout).exactSets,paired:LoadnoteAdaptiveHandoff.performance(workout).comparableRpeSets};
  workout.exercises[0].sets[0].weight=null;
  const missing={exact:LoadnoteIntent.compare(workout).exactSets,paired:LoadnoteAdaptiveHandoff.performance(workout).comparableRpeSets};
  return {present,missing};
 });
 expect(result).toEqual({present:{exact:1,paired:1},missing:{exact:0,paired:0}});
});
