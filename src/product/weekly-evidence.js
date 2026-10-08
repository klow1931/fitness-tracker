/* Exact, read-only comparisons shared by weekly reviews and approved-change follow-ups. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./session-intent'));else root.LoadnoteWeeklyEvidence=factory(root.LoadnoteIntent);})(typeof globalThis!=='undefined'?globalThis:this,function(I){
 'use strict';const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>JSON.parse(JSON.stringify(x));
 const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 function compare(record,revision,logs,exercise,{asOf,cutoff}){
  const r={planned:copy(exercise),actual:null,plannedSets:exercise.sets?.length||0,completedSets:0,comparedSets:0,aboveCap:0,status:'unknown',gaps:[]};
  if(!revision||!record){r.gaps.push('The saved Calendar revision is missing.');return r;}
  if(logs.length>1){r.gaps.push('Multiple logs are linked to this session.');return r;}
  const w=logs[0],current=record.revisions.filter(v=>v.recordedAt<=cutoff).at(-1);
  if(!w){r.status=current?.context.status==='skipped'?'skipped':current?.context.status==='cancelled'?'cancelled':current?.recordedAt!==revision.recordedAt?'superseded':revision.context.date>asOf?'waiting':'missing';return r;}
  const actuals=(w.exercises||[]).filter(e=>e.exerciseId===exercise.exerciseId);r.actual=actuals.length===1?copy(actuals[0]):null;
  const visible=record.revisions.filter(v=>v.recordedAt<=w.createdAt).at(-1);let link=false;
  try{link=stamp(w.createdAt)&&w.createdAt<=cutoff&&w.createdAt>=w.date+'T00:00:00.000Z'&&w.date===revision.context.date&&w.sessionIntent?.schedule?.revisionAt===revision.recordedAt&&visible?.recordedAt===revision.recordedAt&&same(I.prescription(w.sessionIntent.prescription),revision.context.prescription)&&I.planTiming(revision.context.prescription,w.date,w.sessionIntent.timing)==='before-training'&&(w.sessionIntent.deviationReason||'none')==='none';}catch{}
  if(!link){r.gaps.push('The log does not match the exact approved date, revision and before-training plan.');return r;}
  const actual=r.actual;
  if(!actual||actual.type==='cardio'||actual.trackBy==='duration'||exercise.trackBy==='duration'||actual.loadConvention&&actual.loadConvention!==exercise.loadConvention||!Array.isArray(actual.sets)||actual.sets.length!==r.plannedSets){r.gaps.push('Movement, tracking, load convention or set count differs.');return r;}
  r.completedSets=actual.sets.filter(s=>s&&Number.isFinite(s.weight)&&s.weight>=0&&Number.isInteger(s.reps)&&s.reps>0).length;
  for(let i=0;i<exercise.sets.length;i++){
   const p=exercise.sets[i],a=actual.sets[i];
   if(!a||!Number.isFinite(a.weight)||!Number.isFinite(p.weight)||Math.abs(a.weight-p.weight)>.02||!Number.isInteger(a.reps)||!(a.reps>0)||(p.minReps!=null?(a.reps<p.minReps||a.reps>p.maxReps):a.reps!==p.reps)){r.gaps.push('Recorded load or reps differ from the approved target.');continue;}
   if(!Number.isFinite(a.rpe)||a.rpe<1||a.rpe>10||!Number.isFinite(p.targetRpe)){r.gaps.push('Actual effort or its approved cap is unknown.');continue;}
   r.comparedSets++;if(a.rpe>p.targetRpe)r.aboveCap++;
  }
  r.gaps=[...new Set(r.gaps)];r.status=r.comparedSets===r.plannedSets&&r.plannedSets>0?(r.aboveCap?'above':'within'):'unknown';return r;
 }
 return {compare,stamp};
});
