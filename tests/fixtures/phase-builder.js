const {fixture}=require('./program-review'),Profile=require('../../src/product/programming-profile'),Roles=require('../../src/product/decision-readiness');
function phaseFixture(){
  const state=fixture();state.phasePrograms=[];state.scheduledSessions=[];state.programmingProfiles=Profile.save([],{goal:'strength',experience:'intermediate',consistency:'consistent',availableDays:[0,1,2,3,4,5],sessionMinutes:90,equipment:['barbell','plates','rack','bench'],preferredExerciseIds:['ss'],avoidedExerciseIds:[],priorities:'Athlete-selected practice',notes:''},{id:'profile',now:'2026-09-23T10:00:00.000Z'});
  state.exerciseCatalog.push({id:'ss',name:'Safety Bar Squat'});state.exerciseRoles=Roles.upsert(state.exerciseRoles,{exerciseId:'ss',role:'close-variation',competitionLift:'squat'},{id:'ss-role',now:'2026-09-23T10:00:00.000Z'});
  const main=state.reviewedPrograms[0].config.lifts;
  const config={version:1,name:'Phased strength',startDate:'2026-09-28',days:[0,2,4],sessionMinutes:90,incrementKg:2.5,phases:[{type:'accumulation',weeks:3},{type:'strength',weeks:3},{type:'deload',weeks:1}],lifts:{
    squat:{...main.squat,sets:3,stepPct:1,variation:{exerciseId:'ss',name:'Safety Bar Squat',trainingMaxKg:120},variationEquipmentConfirmed:true,exposures:[{day:0,role:'primary',format:'top-backoff'},{day:2,role:'variation',format:'straight'}]},
    bench:{...main.bench,sets:3,stepPct:0,exposures:[{day:0,role:'primary',format:'straight'},{day:2,role:'light',format:'top-backoff'},{day:4,role:'light',format:'straight'}]},
    deadlift:{...main.deadlift,sets:2,stepPct:2,exposures:[{day:4,role:'primary',format:'top-backoff'}]}}};
  return {state,config};
}
module.exports={phaseFixture};
