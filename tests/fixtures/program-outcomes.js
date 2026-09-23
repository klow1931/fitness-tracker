const {fixture}=require('./program-review'),Review=require('../../src/product/program-review');
function outcomesFixture(){
  let state=fixture();const args={programId:'p',week:1,asOf:'2026-09-13',now:'2026-09-13T22:00:00.000Z',recovery:{sleep:'usual',fatigue:'usual',soreness:'usual',discomfort:'none'}};
  state=Review.apply(state,Review.analyze(state,args),{squat:'reduce',bench:'keep',deadlift:'keep'},{confirmed:true,asOf:args.asOf,now:args.now});
  for(const s of state.scheduledSessions.slice(3,6)){
    const v=s.revisions.at(-1),c=v.context;
    state.workouts.push({id:'follow-'+s.id,date:c.date,createdAt:c.date+'T20:00:00.000Z',sessionIntent:{prescription:structuredClone(c.prescription),schedule:{id:s.id,revisionAt:v.recordedAt}},exercises:c.prescription.plannedExercises.map(e=>({...e,sets:e.sets.map(x=>({...x,rpe:x.targetRpe}))}))});
  }
  return state;
}
module.exports={outcomesFixture};
