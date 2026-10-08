const {phaseFixture}=require('./phase-builder'),Phase=require('../../src/product/phase-builder'),Cycle=require('../../src/product/meet-cycle'),Review=require('../../src/product/cycle-review'),Controller=require('../../src/product/cycle-adaptive-controller'),Observability=require('../../src/product/cycle-observability');
const args={asOf:'2026-10-04',now:'2026-10-04T19:00:00.000Z'},keep={squat:'keep',bench:'keep',deadlift:'keep'};
function fixture({logged=true,above=true,approved=false}={}){
 let {state,config}=phaseFixture();state.workouts=[];const setup={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
 state=Phase.save(state,Phase.prepare(state,config,setup),{confirmed:true},{...setup,id:'setup'});
 const cycle=Cycle.prepare(state,state.phasePrograms[0],{version:1,weeks:12,peakWeeks:2,taperWeeks:1,meetDate:'2026-12-19'},setup);
 state=Cycle.save(state,cycle,{confirmed:true},{...setup,id:'weekly'});state=Cycle.schedule(state,'weekly',setup);
 if(logged)logWeek(state,1,{above});
 if(approved){const report=Review.analyze(state,{...args,cycleId:'weekly',week:1}),controller=Controller.recommendFromReports(report,null,null),controllerSnapshot=Observability.captureController({report,controller,response:null,learningSummary:null,generatedAt:args.now});state=Review.apply(state,report,{...keep,squat:'reduce-one'},{...args,confirmed:true,id:'weekly-review',controllerSnapshot});}
 return state;
}
function logWeek(state,week,{above=false}={}){for(const source of state.meetCycles[0].sessions.filter(s=>s.week===week)){
 const record=state.scheduledSessions.find(r=>r.id==='meet:weekly:'+source.key),revision=record.revisions.at(-1),plan=revision.context.prescription;
 state.workouts.push({id:'weekly-log-'+source.key,date:revision.context.date,createdAt:revision.context.date+'T18:00:00.000Z',sessionIntent:{prescription:structuredClone(plan),schedule:{id:record.id,revisionAt:revision.recordedAt}},exercises:plan.plannedExercises.map(e=>({...e,sets:e.sets.map((s,i)=>({...s,rpe:above&&e.exerciseId==='s'&&i<2?s.targetRpe+1:s.targetRpe}))}))});
}return state;}
module.exports={fixture,args,keep,logWeek};
