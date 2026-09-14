(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LoadnoteIntent=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SESSION_ROLES={
    unspecified:'Not specified',
    'heavy-exposure':'Heavy exposure',
    volume:'Volume',
    technique:'Technique / skill',
    recovery:'Recovery',
    testing:'Testing',
    deload:'Deload',
    mixed:'Mixed session'
  };
  const DEVIATION_REASONS={
    none:'No deviation noted',
    fatigue:'Fatigue / readiness',
    pain:'Pain or discomfort',
    time:'Time constraint',
    equipment:'Equipment unavailable',
    autoregulation:'Intentional autoregulation',
    'plan-change':'Programming change',
    other:'Other'
  };
  const SOURCE_TYPES=['manual','template','program','repeated-workout'];
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const text=(value,max=300)=>String(value||'').trim().replace(/\s+/g,' ').slice(0,max);
  const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
  const key=exercise=>exercise?.exerciseId?'id:'+String(exercise.exerciseId):'name:'+text(exercise?.name,160).toLowerCase();
  function plannedSet(raw,trackBy){
    const measure=trackBy==='duration'?'duration':'reps',amount=Number(raw?.[measure]);
    if(!(amount>0)||measure==='reps'&&!Number.isInteger(amount))return null;
    const set={[measure]:amount,weight:Math.round(Math.max(0,Number(raw?.weight)||0)*100)/100};
    const target=Number(raw?.targetRpe??raw?.rpe);
    if(target>=1&&target<=10)set.targetRpe=target;
    return set;
  }
  function plannedExercise(raw){
    const name=text(raw?.name,160);if(!name)return null;
    if(raw.type==='cardio'){
      const duration=Math.max(0,Number(raw.duration)||0),distance=Math.max(0,Number(raw.distance)||0);
      if(!(duration>0||distance>0))return null;
      const row={name,type:'cardio',duration,distance,distanceUnit:['km','mi','m'].includes(raw.distanceUnit)?raw.distanceUnit:'km'};
      if(raw.exerciseId)row.exerciseId=String(raw.exerciseId);if(Number(raw.avgHr)>0)row.targetAvgHr=Number(raw.avgHr);return row;
    }
    const trackBy=raw.trackBy==='duration'?'duration':'reps',sets=(raw.sets||[]).map(set=>plannedSet(set,trackBy)).filter(Boolean);
    if(!sets.length)return null;const row={name,type:'strength',trackBy,sets};if(raw.exerciseId)row.exerciseId=String(raw.exerciseId);return row;
  }
  function source(raw){
    const type=SOURCE_TYPES.includes(raw?.type)?raw.type:'manual',result={type};
    if(text(raw?.referenceId,160))result.referenceId=text(raw.referenceId,160);
    if(text(raw?.label,160))result.label=text(raw.label,160);
    return result;
  }
  function createPrescription(exercises,sourceInput={type:'manual'},capturedAt=new Date().toISOString()){
    if(!iso(capturedAt))throw Error('Invalid planned-work capture time.');
    const plannedExercises=(exercises||[]).map(plannedExercise).filter(Boolean);
    if(!plannedExercises.length)return null;
    if(plannedExercises.length>100||plannedExercises.reduce((n,e)=>n+(e.type==='cardio'?1:e.sets.length),0)>500)throw Error('Planned work is too large.');
    return {version:1,capturedAt,source:source(sourceInput),plannedExercises};
  }
  function prescription(raw){
    if(raw==null)return null;if(!raw||raw.version!==1||!iso(raw.capturedAt)||!Array.isArray(raw.plannedExercises))throw Error('Invalid planned-work snapshot.');
    if(!SOURCE_TYPES.includes(raw.source?.type)||raw.plannedExercises.some(exercise=>!plannedExercise(exercise)))throw Error('Invalid planned-work snapshot.');
    const normalized=createPrescription(raw.plannedExercises,raw.source,raw.capturedAt);if(!normalized)throw Error('Planned work must include at least one exercise.');return normalized;
  }
  function context(raw){
    if(raw==null)return null;if(!raw||typeof raw!=='object')throw Error('Invalid session intent.');
    if(raw.role!=null&&!Object.hasOwn(SESSION_ROLES,raw.role))throw Error('Invalid session role.');
    if(raw.deviationReason!=null&&!Object.hasOwn(DEVIATION_REASONS,raw.deviationReason))throw Error('Invalid session deviation reason.');
    const role=Object.hasOwn(SESSION_ROLES,raw.role)?raw.role:'unspecified',goal=text(raw.goal,300),deviationReason=Object.hasOwn(DEVIATION_REASONS,raw.deviationReason)?raw.deviationReason:'none',deviationNotes=text(raw.deviationNotes,500),plan=prescription(raw.prescription);
    if(role==='unspecified'&&!goal&&!plan&&deviationReason==='none'&&!deviationNotes)return null;
    return {version:1,role,goal,prescription:plan,deviationReason,deviationNotes};
  }
  function validateState(input){
    const state=clone(input)||{};
    for(const workout of state.workouts||[])if(workout.sessionIntent!=null)workout.sessionIntent=context(workout.sessionIntent);
    for(const revision of state.workoutRevisions||[])for(const field of ['before','after'])if(revision?.[field]?.sessionIntent!=null)revision[field].sessionIntent=context(revision[field].sessionIntent);
    return state;
  }
  function comparableSets(exercise){
    if(exercise?.type==='cardio')return Number(exercise.duration)>0||Number(exercise.distance)>0?[exercise]:[];
    const measure=exercise?.trackBy==='duration'?'duration':'reps';return (exercise?.sets||[]).filter(set=>Number(set[measure])>0);
  }
  function sameSet(planned,actual,trackBy){
    const measure=trackBy==='duration'?'duration':'reps';
    return Number(planned?.[measure])===Number(actual?.[measure])&&Math.abs((Number(planned?.weight)||0)-(Number(actual?.weight)||0))<=0.01;
  }
  function compare(workout,exerciseIds){
    const plan=workout?.sessionIntent?.prescription;if(!plan)return null;const ids=exerciseIds?new Set(exerciseIds):null,actualByKey=new Map();
    for(const exercise of workout.exercises||[])if(!ids||exercise.exerciseId&&ids.has(exercise.exerciseId)){actualByKey.set(key(exercise),exercise);actualByKey.set('name:'+text(exercise.name,160).toLowerCase(),exercise);}
    let plannedSets=0,completedSets=0,exactSets=0,targetRpeTotal=0,targetRpeSets=0;
    for(const planned of plan.plannedExercises){
      if(ids&&(!planned.exerciseId||!ids.has(planned.exerciseId)))continue;
      const expected=comparableSets(planned),actual=comparableSets(actualByKey.get(key(planned))||actualByKey.get('name:'+text(planned.name,160).toLowerCase()));plannedSets+=expected.length;completedSets+=Math.min(expected.length,actual.length);for(const set of expected)if(Number(set.targetRpe)>=1&&Number(set.targetRpe)<=10){targetRpeTotal+=Number(set.targetRpe);targetRpeSets++;}
      if(planned.type==='cardio'){if(actual.length&&Number(actual[0].duration||0)>=Number(planned.duration||0)&&Number(actual[0].distance||0)>=Number(planned.distance||0))exactSets++;}
      else for(let i=0;i<Math.min(expected.length,actual.length);i++)if(sameSet(expected[i],actual[i],planned.trackBy))exactSets++;
    }
    if(!plannedSets)return null;const completionRate=Math.round(completedSets/plannedSets*1000)/10,exactRate=Math.round(exactSets/plannedSets*1000)/10;
    return {plannedSets,completedSets,exactSets,completionRate,exactRate,targetRpeTotal,targetRpeSets,averageTargetRpe:targetRpeSets?Math.round(targetRpeTotal/targetRpeSets*10)/10:null,status:exactSets===plannedSets?'as-planned':completedSets===0?'not-completed':'modified',deviationReason:workout.sessionIntent.deviationReason||'none',hasExplanation:(workout.sessionIntent.deviationReason||'none')!=='none'||!!workout.sessionIntent.deviationNotes};
  }
  function summarize(workouts,exerciseIds){
    const rows=(workouts||[]).map(workout=>compare(workout,exerciseIds)).filter(Boolean),plannedSets=rows.reduce((n,row)=>n+row.plannedSets,0),completedSets=rows.reduce((n,row)=>n+row.completedSets,0),exactSets=rows.reduce((n,row)=>n+row.exactSets,0),modified=rows.filter(row=>row.status!=='as-planned').length,targetRpeSets=rows.reduce((n,row)=>n+row.targetRpeSets,0),targetRpeTotal=rows.reduce((n,row)=>n+row.targetRpeTotal,0);
    return {prescribedSessions:rows.length,plannedSets,completedSets,exactSets,prescriptionCoverage:rows.length&&workouts?.length?Math.round(rows.length/workouts.length*1000)/10:null,setCompletionRate:plannedSets?Math.round(completedSets/plannedSets*1000)/10:null,exactCompletionRate:plannedSets?Math.round(exactSets/plannedSets*1000)/10:null,targetRpeCoverage:plannedSets?Math.round(targetRpeSets/plannedSets*1000)/10:null,averageTargetRpe:targetRpeSets?Math.round(targetRpeTotal/targetRpeSets*10)/10:null,modifiedSessions:modified,unexplainedModifiedSessions:rows.filter(row=>row.status!=='as-planned'&&!row.hasExplanation).length};
  }
  return {SESSION_ROLES,DEVIATION_REASONS,createPrescription,prescription,context,validateState,compare,summarize};
});
