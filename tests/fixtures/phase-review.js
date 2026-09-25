const {phaseFixture}=require('./phase-builder'),B=require('../../src/product/phase-builder');
function fixture(){
  let {state,config}=phaseFixture();state.workouts=[];state.reviewedPrograms=[];state.phaseReviews=[];
  config.lifts.bench.exposures.forEach(e=>e.format='straight');
  const args={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};
  state=B.save(state,B.prepare(state,config,args),{confirmed:true},{...args,id:'ph'});state=B.schedule(state,'ph',args);
  for(const s of state.scheduledSessions.slice(0,9)){
    const v=s.revisions[0],c=v.context;
    state.workouts.push({id:'workout-'+s.id,date:c.date,createdAt:c.date+'T20:00:00.000Z',sessionIntent:{prescription:structuredClone(c.prescription),schedule:{id:s.id,revisionAt:v.recordedAt}},exercises:c.prescription.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({...s,rpe:s.targetRpe+(e.exerciseId==='s'||e.exerciseId==='ss'?1:0)}))}))});
  }
  return state;
}
const args={programId:'ph',phase:'accumulation',asOf:'2026-10-18',now:'2026-10-18T22:00:00.000Z',recovery:{sleep:'usual',fatigue:'usual',soreness:'usual',discomfort:'none'}};
module.exports={fixture,args};
