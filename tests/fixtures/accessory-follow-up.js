const R=require('../../src/product/accessory-review'),S=require('../../src/product/schedule'),F=require('./accessory-review');
const args={asOf:'2026-10-12',now:'2026-10-12T22:00:00.000Z'};
function fixture({logged=true}={}){let state=F.fixture();const report=R.analyze(state,F.args),request={equipmentConfirmed:true,noCurrentConcerns:true,loadConvention:'per-hand',weightKg:31};state=R.approve(state,R.preview(state,report,request,F.args),{...F.args,confirmed:true});
 const session=S.list(state.scheduledSessions).find(s=>s.id===F.args.sessionId);
 if(logged)state.workouts.push({id:'after-accessory-review',date:session.date,createdAt:session.date+'T20:00:00.000Z',sessionIntent:{prescription:structuredClone(session.prescription),schedule:{id:session.id,revisionAt:session.revisionAt}},exercises:session.prescription.plannedExercises.map(e=>({...e,sets:e.sets.map(s=>({...s,reps:e.exerciseId===F.row.exerciseId?10:s.reps,rpe:7}))}))});
 return state;
}
module.exports={fixture,args,reviewArgs:F.args,row:F.row};
