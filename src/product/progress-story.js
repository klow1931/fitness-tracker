/* v2.72 — read-only training progress stories.
 * Turns saved training, schedule execution and accepted review history into a
 * compact narrative without creating a new training score or adaptation policy.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(
  require('../core/loadnote-core'),require('./schedule'),require('./decision-readiness'),
  require('./progress-analytics'),require('./program-lifecycle'),require('./adaptation-explanation')
 );
 else root.LoadnoteProgressStory=factory(
  root.LoadnoteCore,root.LoadnoteSchedule,root.LoadnoteReadiness,
  root.LoadnoteProgressAnalytics,root.LoadnoteProgramLifecycle,root.LoadnoteAdaptationExplanation
 );
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Schedule,Readiness,Analytics,Lifecycle,Explanation){
 'use strict';
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const finite=x=>Number.isFinite(Number(x))?Number(x):null;
 const validRpe=x=>Number.isFinite(Number(x))&&Number(x)>=1&&Number(x)<=10;
 const strength=e=>e?.type!=='cardio'&&e?.trackBy!=='duration';
 const nameKey=x=>String(x||'').trim().toLowerCase();
 function matches(exercise,marker){
  if(!strength(exercise))return false;
  if(marker?.exerciseId)return exercise.exerciseId===marker.exerciseId;
  return nameKey(exercise?.name)===nameKey(marker?.name);
 }
 function setEvidence(set,date,workoutId){
  const weight=finite(set?.weight),reps=Number(set?.reps);
  if(!(weight>0&&Number.isInteger(reps)&&reps>0))return null;
  const capacity=Core.capacityEvidence(weight,reps,set?.rpe);
  return {date,workoutId:String(workoutId),weight,reps,rpe:validRpe(set?.rpe)?Number(set.rpe):null,capacityKg:capacity.estimate??null,volumeKg:Core.round(weight*reps,2)};
 }
 function exerciseEvidence(workouts,marker){
  const days=new Map();
  for(const workout of workouts||[])for(const exercise of workout.exercises||[])if(matches(exercise,marker)){
   const day=days.get(workout.date)||{date:workout.date,workoutIds:new Set(),sets:[],volumeKg:0,rpeTotal:0,rpeSets:0,bestCapacity:null,bestLoad:null};
   day.workoutIds.add(String(workout.id));
   for(const set of exercise.sets||[]){
    const row=setEvidence(set,workout.date,workout.id);if(!row)continue;
    day.sets.push(row);day.volumeKg+=row.volumeKg;
    if(row.rpe!=null){day.rpeTotal+=row.rpe;day.rpeSets++;}
    if(!day.bestLoad||row.weight>day.bestLoad.weight||(row.weight===day.bestLoad.weight&&row.reps>day.bestLoad.reps))day.bestLoad=row;
    if(row.capacityKg!=null&&(!day.bestCapacity||row.capacityKg>day.bestCapacity.capacityKg))day.bestCapacity=row;
   }
   days.set(workout.date,day);
  }
  return [...days.values()].filter(x=>x.sets.length).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({
   date:x.date,workoutIds:[...x.workoutIds],sets:x.sets,volumeKg:Core.round(x.volumeKg,1),
   averageRpe:x.rpeSets?Core.round(x.rpeTotal/x.rpeSets,1):null,rpeSets:x.rpeSets,
   bestCapacity:x.bestCapacity,bestLoad:x.bestLoad
  }));
 }
 function windowSummary(days,from,to){
  const rows=(days||[]).filter(x=>x.date>=from&&x.date<=to),sets=rows.flatMap(x=>x.sets||[]);
  const capacity=rows.map(x=>x.bestCapacity).filter(Boolean),loads=rows.map(x=>x.bestLoad).filter(Boolean);
  const rpeSets=sets.filter(s=>s.rpe!=null),volumeKg=Core.round(rows.reduce((n,x)=>n+Number(x.volumeKg||0),0),1);
  const bestCapacity=capacity.sort((a,b)=>b.capacityKg-a.capacityKg)[0]||null,bestLoad=loads.sort((a,b)=>b.weight-a.weight||b.reps-a.reps)[0]||null;
  return {from,to,sessions:rows.length,sets:sets.length,capacityDays:capacity.length,bestCapacity,bestLoad,volumeKg,
   averageRpe:rpeSets.length?Core.round(rpeSets.reduce((n,x)=>n+x.rpe,0)/rpeSets.length,1):null,rpeSets:rpeSets.length};
 }
 function direction(baseline,recent){
  if(!baseline?.bestCapacity||!recent?.bestCapacity)return {status:'insufficient',label:'Not enough comparable evidence',reason:'Both start and recent windows need RPE-aware demonstrated-capacity evidence.'};
  if(baseline.capacityDays<2||recent.capacityDays<2)return {status:'sparse',label:'More evidence needed',reason:'At least two demonstrated-capacity days are required in both the start and recent windows.'};
  const start=baseline.bestCapacity.capacityKg,end=recent.bestCapacity.capacityKg,deltaKg=Core.round(end-start,1),deltaPct=start>0?Core.round(deltaKg/start*100,1):null;
  const status=deltaPct>=1?'higher':deltaPct<=-1?'lower':'similar';
  const label=status==='higher'?'Recent evidence is higher':status==='lower'?'Recent evidence is lower':'Recent evidence is similar';
  return {status,label,deltaKg,deltaPct,startKg:start,endKg:end,
   note:'Compares the best RPE-aware demonstrated-capacity estimate in the start and recent windows. It is not a tested 1RM or proof that a programming change caused the difference.'};
 }
 function reviewMarkers(state,marker,from,to){
  if(!Explanation?.accepted)return [];
  const rows=[];
  for(const item of Explanation.accepted(state)||[]){
   const date=String(item.review?.createdAt||'').slice(0,10);if(!Schedule.date(date)||date<from||date>to)continue;
   for(const lift of item.explanation?.lifts||[]){
    const relevant=marker?.lift?lift.lift===marker.lift:nameKey(lift.name)===nameKey(marker?.name);
    if(!relevant)continue;
    rows.push({date,reviewId:item.review.id,sourceLabel:item.explanation.sourceLabel,lift:lift.lift,name:lift.name,action:lift.action,changed:!!lift.changed,why:lift.why,evidence:copy(lift.evidence||[]),impact:copy(lift.impact||{})});
   }
  }
  return rows.sort((a,b)=>a.date.localeCompare(b.date)||String(a.reviewId).localeCompare(String(b.reviewId)));
 }
 function movementStory(state,marker,{asOf,weeks=12}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid progress story date.');
  const span=Math.max(8,Math.min(52,Number(weeks)||12)),from=move(asOf,-span*7+1);
  const workouts=(state?.workouts||[]).filter(w=>Schedule.date(w?.date)&&w.date>=from&&w.date<=asOf);
  const days=exerciseEvidence(workouts,marker);
  const baselineTo=move(from,27),recentFrom=move(asOf,-27);
  const baseline=windowSummary(days,from,baselineTo),recent=windowSummary(days,recentFrom,asOf);
  const overall=windowSummary(days,from,asOf),trend=direction(baseline,recent),reviews=reviewMarkers(state,marker,from,asOf);
  return {...copy(marker),from,to:asOf,weeks:span,days,baseline,recent,overall,direction:trend,reviews,
   latest:days.at(-1)||null,notice:'Performance direction is descriptive. Loadnote does not treat volume, RPE, or an estimated capacity change as a diagnosis or proof that a program caused the result.'};
 }
 function movementOptions(state,{asOf,weeks=12}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid movement range date.');
  const span=Math.max(8,Math.min(52,Number(weeks)||12)),from=move(asOf,-span*7+1),rows=new Map();
  for(const workout of state?.workouts||[]){
   if(!Schedule.date(workout?.date)||workout.date<from||workout.date>asOf)continue;
   const seen=new Set();
   for(const exercise of workout.exercises||[]){
    if(!strength(exercise)||exercise.trackBy==='duration')continue;
    const usable=(exercise.sets||[]).some(s=>finite(s?.weight)>0&&Number.isInteger(Number(s?.reps))&&Number(s.reps)>0);if(!usable)continue;
    const key=exercise.exerciseId?'id:'+exercise.exerciseId:'name:'+nameKey(exercise.name);if(seen.has(key))continue;seen.add(key);
    const row=rows.get(key)||{key,exerciseId:exercise.exerciseId||null,name:exercise.name||'Strength exercise',label:exercise.name||'Strength exercise',source:'exercise',lift:null,sessions:0,lastDate:''};
    row.sessions++;if(workout.date>row.lastDate){row.lastDate=workout.date;row.name=exercise.name||row.name;row.label=row.name;}rows.set(key,row);
   }
  }
  const roles=Readiness.list(state?.exerciseRoles||[]),competition=new Map();
  for(const role of roles)if(role.role==='competition'&&role.competitionLift)competition.set(role.exerciseId,role.competitionLift);
  return [...rows.values()].map(row=>row.exerciseId&&competition.has(row.exerciseId)?{...row,lift:competition.get(row.exerciseId),source:'competition'}:row)
   .sort((a,b)=>b.sessions-a.sessions||b.lastDate.localeCompare(a.lastDate)||a.name.localeCompare(b.name));
 }
 function selectedProgram(state,asOf){
  try{
   const chosen=Lifecycle.select(state,asOf);if(chosen.status!=='selected'||!chosen.program)return null;
   const p=chosen.program,progress=Lifecycle.progress(p,asOf),to=asOf<p.startDate?p.startDate:asOf>p.endDate?p.endDate:asOf;
   const rows=Schedule.rows(state?.scheduledSessions||[],state?.workouts||[],{asOf}).filter(x=>x.id.startsWith(p.prefix)&&x.date>=p.startDate&&x.date<=to);
   const counts={completed:0,skipped:0,cancelled:0,unconfirmed:0,scheduled:0};
   for(const row of rows)if(Object.hasOwn(counts,row.state))counts[row.state]++;
   const resolved=counts.completed+counts.skipped,adherence=resolved?Core.round(counts.completed/resolved*100,1):null;
   let reviewCount=0,changedReviewCount=0;
   if(p.kind==='meet-cycle'){
    for(const r of p.record.weeklyReviews||[]){if(String(r.createdAt||'').slice(0,10)<=asOf){reviewCount++;if(Object.values(r.choices||{}).some(x=>x!=='keep'))changedReviewCount++;}}
   }else{
    for(const r of state?.phaseReviews||[]){if(r.programId===p.id&&String(r.createdAt||'').slice(0,10)<=asOf){reviewCount++;if(Object.values(r.choices||{}).some(x=>x!=='keep'))changedReviewCount++;}}
   }
   return {kind:p.kind,id:p.id,name:p.name,startDate:p.startDate,endDate:p.endDate,status:chosen.selection,progress,counts,resolved,adherence,reviewCount,changedReviewCount,eventType:p.eventType||null,eventDate:p.eventDate||null,
    definition:'Completed / (completed + explicitly skipped). Unconfirmed, upcoming and cancelled sessions are not counted as failures.'};
  }catch{return null;}
 }
 function decisionTimeline(state,{asOf,weeks=12}={}){
  const span=Math.max(8,Math.min(52,Number(weeks)||12)),from=move(asOf,-span*7+1),rows=[];
  if(!Explanation?.accepted)return {from,to:asOf,rows};
  for(const item of Explanation.accepted(state)||[]){
   const date=String(item.review?.createdAt||'').slice(0,10);if(!Schedule.date(date)||date<from||date>asOf)continue;
   const lifts=(item.explanation?.lifts||[]).map(l=>({lift:l.lift,name:l.name,action:l.action,changed:!!l.changed,why:l.why,evidence:copy(l.evidence||[]),impact:copy(l.impact||{})}));
   rows.push({date,reviewId:item.review.id,sourceLabel:item.explanation.sourceLabel,lifts,changedLifts:lifts.filter(x=>x.changed).length});
  }
  return {from,to:asOf,rows:rows.sort((a,b)=>b.date.localeCompare(a.date)||String(b.reviewId).localeCompare(String(a.reviewId)))};
 }
 function analyze(state,{asOf,weeks=12,movementKey=null}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid progress story date.');
  const snapshot=Analytics.analyze(state,{asOf}),markers=snapshot.markers.map(m=>movementStory(state,m,{asOf,weeks})),options=movementOptions(state,{asOf,weeks});
  const selected=movementKey?options.find(x=>x.key===movementKey)||null:null;
  const existing=selected?markers.find(x=>x.key===selected.key)||null:null,customMovement=selected?(existing||movementStory(state,selected,{asOf,weeks})):null;
  return {version:1,asOf,weeks,overview:snapshot,program:selectedProgram(state,asOf),movements:markers,movementOptions:options,customMovement,decisions:decisionTimeline(state,{asOf,weeks}),
   notes:['Progress is descriptive evidence, not a readiness score.','Unresolved scheduled sessions are not treated as failures.','Accepted programming changes are shown from stored review history; Loadnote does not infer that a change caused a later performance result.']};
 }
 return {analyze,movementStory,movementOptions,exerciseEvidence,windowSummary,direction,reviewMarkers,selectedProgram,decisionTimeline};
});