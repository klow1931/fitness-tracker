/* Read-only review projection. Session serialization remains the authority for included work. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./workout-session'));
 else root.LoadnoteWorkoutReviewSets=factory(root.LoadnoteSession);
})(typeof globalThis!=='undefined'?globalThis:this,function(Session){
 'use strict';
 function inspect(draft){
  let missingRpe=0,excluded=0;
  const completedOnly=!!draft.sessionIntent?.prescription&&!draft.edit;
  const exercises=draft.rows.flatMap((row,rowIndex)=>{
   const exercise=Session.fromDraft({...draft,rows:[row]},'review').exercises[0];
   if(completedOnly&&String(row.name||'').trim()){
    if(row.type==='cardio'){if(!row.cardioDone&&(Number(row.duration)>0||Number(row.distance)>0))excluded++;}
    else excluded+=(row.sets||[]).filter(s=>Number(s[row.trackBy==='duration'?'duration':'reps'])>0&&s.done!==true).length;
   }
   if(!exercise)return [];
   const sourceSets=(row.sets||[]).map((set,index)=>({set,index})).filter(({set})=>Number(set[row.trackBy==='duration'?'duration':'reps'])>0&&(!completedOnly||set.done===true));
   if(exercise.type!=='cardio')missingRpe+=exercise.sets.filter(s=>s.rpe==null).length;
   return [{rowIndex,exercise,setNumbers:sourceSets.map(s=>s.index+1)}];
  });
  return {exercises,missingRpe,excluded};
 }
 return {inspect};
});
