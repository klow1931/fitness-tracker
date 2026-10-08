const B=require('../../src/product/phase-builder'),A=require('../../src/product/accessory-programming'),D=require('../../src/product/data-integrity'),{phaseFixture}=require('./phase-builder');
const row={policy:A.POLICY,exerciseId:D.stableExerciseId('Chest-supported Row'),name:'Chest-supported Row',day:0,group:'upper-back',purpose:'hypertrophy',equipment:'dumbbells',equipmentConfirmed:true,mode:'reps',sets:2,weightKg:30,targetRpe:7,minReps:8,maxReps:12};
const args={asOf:'2026-10-06',now:'2026-10-06T12:00:00.000Z',sessionId:'phase:accessory:w3d0',exerciseId:row.exerciseId};
function fixture(){let {state,config}=phaseFixture();state.workouts=[];config.accessories=[row];const t={asOf:'2026-09-24',now:'2026-09-24T12:00:00.000Z'};state=B.save(state,B.prepare(state,config,t),{confirmed:true},{...t,id:'accessory'});state=B.schedule(state,'accessory',t);
 for(const s of state.scheduledSessions.filter(r=>['phase:accessory:w1d0','phase:accessory:w2d0'].includes(r.id))){const v=s.revisions[0],c=v.context;state.workouts.push({id:'log-'+s.id,date:c.date,createdAt:c.date+'T20:00:00.000Z',sessionIntent:{prescription:structuredClone(c.prescription),schedule:{id:s.id,revisionAt:v.recordedAt}},exercises:c.prescription.plannedExercises.map(e=>({...e,sets:e.sets.map(x=>({...x,reps:e.exerciseId===row.exerciseId?12:x.reps,rpe:7}))}))});}
 return state;
}
module.exports={fixture,args,row};
