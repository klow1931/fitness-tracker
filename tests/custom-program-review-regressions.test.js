const assert=require('node:assert/strict');
const Import=require('../src/product/custom-program-import');
const Custom=require('../src/product/custom-program');
const Coach=require('../src/product/custom-program-coach');
const Weekly=require('../src/product/custom-program-weekly-review');
const Schedule=require('../src/product/schedule');
const Intent=require('../src/product/session-intent');
const Core=require('../src/core/loadnote-core');

for(const target of ['3x8-12 @ 100 kg','3x8–12 @ 100 kg','3x8 to 12 @ 100 kg','3x8+ @ 100 kg','3x8.5 @ 100 kg','4x5 @ -100 kg','4x5 @ 75% RPE 8','4x5 @ 75 percent RPE 8','4x5 @ 80–100 kg'])
 assert.throws(()=>Import.plainText('Week 1\nMonday\nSquat '+target),/Line 3:.*explicit fixed/,target);
const parsed=Import.plainText('Week 1\nMonday\nBench 1x5 @ 100 kg RPE 8 rest 90s; Pause each rep for two seconds\nWeek 2\nMonday\nBench 1x5 @ 102.5 kg RPE 8 rest 2 minutes').rows;
assert.equal(parsed[0].notes,'Pause each rep for two seconds');
assert.equal(parsed[0].rest,'90');assert.equal(parsed[1].rest,'120');
let state=Core.normalizeState({});
state=Custom.save(state,Custom.build(state,{name:'Demo block',weeks:2,startDate:'2026-10-12',unit:'kg',rows:parsed}),{id:'demo',confirmed:true,now:'2026-10-10T10:00:00.000Z'});
state=Custom.schedule(state,'demo',{now:'2026-10-11T10:00:00.000Z'});
const scheduled=Schedule.list(state.scheduledSessions)[0];
assert.equal(scheduled.prescription.plannedExercises[0].notes,parsed[0].notes);
assert.deepEqual(Intent.prescription(Intent.prescription(scheduled.prescription)),scheduled.prescription);
const originalPlan=JSON.stringify(state.customPrograms),originalCalendar=JSON.stringify(state.scheduledSessions);
const workout={id:'logged',date:scheduled.date,createdAt:'2026-10-12T18:00:00.000Z',sessionIntent:{schedule:{id:scheduled.id,revisionAt:scheduled.revisionAt},prescription:scheduled.prescription},exercises:scheduled.prescription.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({reps:s.reps,weight:s.weight,rpe:9}))}))};
state={...state,workouts:[workout]};
assert.equal(Core.normalizeState(state).scheduledSessions[0].revisions[0].context.prescription.plannedExercises[0].notes,parsed[0].notes);
assert.equal(Coach.answer(state,'What is my next custom program workout?',{asOf:'2026-10-12'}).evidence[0].date,'2026-10-19');
assert.match(Coach.answer(state,'What is my custom program workout today?',{asOf:'2026-10-12'}).text,/already logged/);
// A later-recorded workout cannot change the answer at an earlier review date.
assert.equal(Coach.answer({...state,workouts:[{...workout,createdAt:'2026-10-13T18:00:00.000Z'}]},'What is my next custom program workout?',{asOf:'2026-10-12'}).evidence[0].date,'2026-10-12');
const legacy={...workout};delete legacy.createdAt;
assert.equal(Coach.answer({...state,workouts:[legacy]},'What is my next custom program workout?',{asOf:'2026-10-12'}).evidence[0].date,'2026-10-19');
const report=Weekly.inspect(state,'demo',{asOf:'2026-10-19',now:'2026-10-19T18:00:00.000Z'});
assert.equal(report.totals.aboveCap,1);
assert(report.observations.some(o=>o.label==='Review effort targets'));
assert.doesNotMatch(Weekly.explain(report),/logs are within/);
const within=Weekly.inspect({...state,workouts:[{...workout,exercises:workout.exercises.map(e=>({...e,sets:e.sets.map(s=>({...s,rpe:8}))}))}]},'demo',{asOf:'2026-10-19',now:'2026-10-19T18:00:00.000Z'});
assert.match(Weekly.explain(within),/logs are within/);
assert.equal(JSON.stringify(state.customPrograms),originalPlan);assert.equal(JSON.stringify(state.scheduledSessions),originalCalendar);
console.log('Program import fidelity, single above-cap feedback, completed-session routing and cue preservation passed');
