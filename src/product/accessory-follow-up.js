/* Read-only outcomes from exact approved accessory Calendar revisions. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./session-intent'),require('./schedule'),require('./accessory-review'),require('./coach-support'));
 else root.LoadnoteAccessoryFollowUp=factory(root.LoadnoteIntent,root.LoadnoteSchedule,root.LoadnoteAccessoryReview,root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(I,S,R,Support){
 'use strict';const clone=x=>x==null?null:JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const LABELS={waiting:'Scheduled',missing:'No linked log',superseded:'Target changed',skipped:'Skipped',cancelled:'Cancelled',unknown:'Needs review',within:'Within range',top:'Top of range',below:'Below range',outside:'Outside rep range',above:'Above effort cap'};
 const NOTICE='Current corrected logs describe what followed an approved target, not what caused it. Actual equipment is not remeasured; missing effort stays unknown. Follow-ups do not change targets or authorize another increase.';
 function changed(before,after){
  const a=before.prescription.plannedExercises,b=after.prescription.plannedExercises;
  if(a.length!==b.length)return null;
  const changes=b.map((e,i)=>same(e,a[i])?null:{before:a[i],approved:e}).filter(Boolean);if(changes.length!==1)return null;
  const c=changes[0],x=c.before,y=c.approved;
  if(x.exerciseId!==y.exerciseId||x.name!==y.name||x.type!=='strength'||y.type!=='strength'||x.trackBy!=='reps'||y.trackBy!=='reps'||!x.sets?.length||x.sets.length!==y.sets?.length||!['total','per-hand','stack','added'].includes(y.loadConvention))return null;
  const restored=clone(y);if(x.loadConvention===undefined)delete restored.loadConvention;else restored.loadConvention=x.loadConvention;
  restored.sets.forEach((s,i)=>s.weight=x.sets[i].weight);
  if(!same(restored,x)||!x.sets.every(s=>s.weight===x.sets[0].weight)||!y.sets.every(s=>s.weight===y.sets[0].weight&&Number.isInteger(s.minReps)&&Number.isInteger(s.maxReps)&&s.minReps>=6&&s.maxReps<=20&&s.minReps<=s.maxReps&&Number.isFinite(s.targetRpe)&&s.targetRpe>=6&&s.targetRpe<=8)||!(x.sets[0].weight>0&&y.sets[0].weight>0)||x.sets[0].weight===y.sets[0].weight||Math.abs(y.sets[0].weight-x.sets[0].weight)>x.sets[0].weight*.05+.00001)return null;
  const normalized=clone(after);normalized.reason=before.reason;normalized.prescription=clone(before.prescription);if(!same(normalized,before))return null;
  return c;
 }
 function inspect(state,{asOf,now=new Date().toISOString()}={}){
  if(!S.date(asOf)||!stamp(now)||asOf>now.slice(0,10))throw Error('Choose a current or earlier follow-up date');
  const records=S.validate(state.scheduledSessions||[]),rows=[];
  for(const record of records){const visible=record.revisions.filter(v=>v.recordedAt<=now);
   for(let index=1;index<visible.length;index++){
    const revision=visible[index],prior=visible[index-1],context=revision.context;
    if(!context.reason.startsWith('Accessory review v1:'))continue;
    const change=changed(prior.context,context);let source=null;
    try{source=R.origin(state,{id:record.id,...context});}catch{/* Missing or invalid source cannot establish an accessory role. */}
    const original=source?.source?.exercises.filter(e=>e.role==='accessory'&&e.exerciseId===change?.approved.exerciseId&&e.name===change.approved.name)||[];
    const logs=(state.workouts||[]).filter(w=>w.sessionIntent?.schedule?.id===record.id&&w.date<=asOf&&(!w.createdAt||w.createdAt<=now));
    const log=logs.length===1?logs[0]:null,actuals=log?.exercises?.filter(e=>e.exerciseId===change?.approved.exerciseId)||[],actual=actuals.length===1?actuals[0]:null;
    const gaps=[],latest=visible.at(-1),row={sessionId:record.id,revisionAt:revision.recordedAt,date:context.date,name:change?.approved.name||'Accessory change',exerciseId:change?.approved.exerciseId||null,before:clone(change?.before),approved:clone(change?.approved),actual:clone(actual),workoutId:log?.id??null,loggedDate:log?.date??null,status:'unknown',gaps,effortSets:0,plannedSets:change?.approved.sets.length||0};
    const validChange=!!(change&&original.length===1&&source?.program.scheduledAt&&['accumulation','strength'].includes(source.source.phase)&&context.status==='scheduled'&&context.prescription.capturedAt===revision.recordedAt&&context.date>=revision.recordedAt.slice(0,10));
    if(!validChange)gaps.push('The saved revision or reviewed accessory source cannot be verified.');
    if(logs.length>1)gaps.push('More than one workout is linked to this session.');
    let validLink=false;
    try{validLink=!!(log&&stamp(log.createdAt)&&log.createdAt>=log.date+'T00:00:00.000Z'&&log.date===context.date&&log.sessionIntent.schedule.revisionAt===revision.recordedAt&&same(I.prescription(log.sessionIntent.prescription),context.prescription)&&I.planTiming(context.prescription,log.date,log.sessionIntent.timing)==='before-training'&&(log.sessionIntent.deviationReason||'none')==='none');}catch{/* Unknown timing or links remain unknown. */}
    if(log&&!validLink)gaps.push('The workout does not match this approved revision, date and before-training plan.');
    if(log&&validLink){
     if(!actual||actual.name!==change?.approved.name||actual.type!=='strength'||actual.trackBy==='duration'||!Array.isArray(actual.sets)||actual.sets.length!==row.plannedSets||actual.sets.some(s=>!s||typeof s!=='object')||actual.loadConvention&&actual.loadConvention!==change.approved.loadConvention)gaps.push('The movement, tracking, load convention or set count changed.');
     else {
      row.effortSets=actual.sets.filter(s=>Number.isFinite(s.rpe)&&s.rpe>=1&&s.rpe<=10).length;
      if(actual.sets.some((s,i)=>!Number.isFinite(s.weight)||Math.abs(s.weight-change.approved.sets[i].weight)>.01||!Number.isInteger(s.reps)||s.reps<=0||s.reps>100))gaps.push('Load or rep records are missing or differ from the approved load.');
      if(row.effortSets!==row.plannedSets)gaps.push('Actual effort is missing or invalid for at least one set.');
     }
    }
    if(!gaps.length&&log){const sets=actual.sets,plan=change.approved.sets;
     row.status=sets.some((s,i)=>s.rpe>plan[i].targetRpe)?'above':sets.some((s,i)=>s.reps>plan[i].maxReps)?'outside':sets.some((s,i)=>s.reps<plan[i].minReps)?'below':sets.every((s,i)=>s.reps===plan[i].maxReps)?'top':'within';
    }else if(!gaps.length&&!logs.length){row.status=latest!==revision?'superseded':context.date>asOf?'waiting':'missing';if(latest.context.status==='skipped')row.status='skipped';if(latest.context.status==='cancelled')row.status='cancelled';}
    row.laterRevision=latest!==revision;row.label=LABELS[row.status];
    row.nextStep=['within','top'].includes(row.status)?'Keep the next scheduled target. One exposure does not authorize another increase.':['above','below','outside'].includes(row.status)?'Review the logged effort and rep targets before changing future work.':row.status==='waiting'?'Log the scheduled exposure, including actual effort.':row.status==='missing'?'Check Calendar or link the correct log; completion is not assumed.':'Review the plan or evidence gaps; no new target is inferred.';
    rows.push(row);
   }
  }
  return {asOf,rows:rows.sort((a,b)=>b.date.localeCompare(a.date)||b.revisionAt.localeCompare(a.revisionAt)||a.sessionId.localeCompare(b.sessionId)),notice:NOTICE};
 }
 function answer(state,question,{asOf,unit='kg',history=[],now}={}){
  const q=String(question||'');if(Support.health(q)||!(/\b(accessor\w*|approved (change|target)|progression history)\b/i.test(q)&&/\b(follow|recap|result|outcome|how|history|what happened|work|after)\w*\b/i.test(q)))return null;
  const report=inspect(state,{asOf,now}),words=x=>' '+String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' ';
  const named=report.rows.filter(r=>words(q).includes(words(r.name))),rows=named.length?named:report.rows;
  const reply={source:'Shared coaching · accessory follow-up',readOnly:true,evidence:[report],actions:[{kind:'accessory-follow-up',label:'See accessory follow-ups',...(named.length?{sessionId:named[0].sessionId,revisionAt:named[0].revisionAt}:{})}]};
  if(!rows.length)return {...reply,text:'No approved accessory changes are saved yet. Review a next target first; follow-ups will describe its linked log without changing your plan.'};
  const describe=e=>e?e.sets.length+' sets · '+Math.round(e.sets[0].weight*(unit==='lb'?2.2046226218:1)*100)/100+' '+unit:'unverified';
  const summaries=rows.slice(0,3).map(r=>r.name+' ('+r.date+'): '+r.label+'. Previous '+describe(r.before)+'; approved '+describe(r.approved)+'. '+(Array.isArray(r.actual?.sets)?'Recorded '+r.actual.sets.map(s=>(s?.reps??'unknown')+' reps @ '+(s?.rpe??'unknown')+' RPE').join(', ')+'. ':'')+(r.gaps[0]||r.nextStep));
  return {...reply,text:summaries.join('\n\n')+'\n\n'+NOTICE,followUps:['Review my accessory progression']};
 }
 return {LABELS,NOTICE,inspect,answer};
});
