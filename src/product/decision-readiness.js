(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./training-blocks'));
  else root.LoadnoteReadiness=factory(root.LoadnoteCore,root.LoadnoteBlocks);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Blocks){
  'use strict';
  if(!Core||!Blocks)throw Error('Loadnote readiness dependencies are required');
  const ROLES={competition:'Competition lift','close-variation':'Close variation',supplemental:'Supplemental movement',assistance:'Assistance movement','isolation-rehab':'Isolation / rehabilitation',conditioning:'Conditioning'};
  const LIFTS={squat:'Squat',bench:'Bench Press',deadlift:'Deadlift'};
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
  const date=value=>Blocks.date(value);
  const text=(value,max=300)=>String(value||'').trim().replace(/\s+/g,' ').slice(0,max);
  const endOfDay=day=>day+'T23:59:59.999Z';
  const dayBefore=(day,n)=>{const value=new Date(day+'T00:00:00.000Z');value.setUTCDate(value.getUTCDate()-n);return value.toISOString().slice(0,10);};
  function context(input){
    const exerciseId=text(input?.exerciseId,160),role=input?.role,competitionLift=input?.competitionLift||null,notes=text(input?.notes,500);
    if(!exerciseId||!Object.hasOwn(ROLES,role))throw Error('Choose an exercise role.');
    if(['competition','close-variation'].includes(role)&&!Object.hasOwn(LIFTS,competitionLift))throw Error('Competition lifts and close variations need a squat, bench or deadlift relationship.');
    return {exerciseId,role,competitionLift:['competition','close-variation'].includes(role)?competitionLift:null,notes};
  }
  function visible(record,knownAt){const revisions=(record.revisions||[]).filter(r=>!knownAt||r.recordedAt<=knownAt),last=revisions.at(-1);return last?.context?{id:record.id,...clone(last.context),createdAt:record.createdAt,updatedAt:last.recordedAt}:null;}
  function list(records,knownAt){return (records||[]).map(record=>visible(record,knownAt)).filter(Boolean).sort((a,b)=>a.exerciseId.localeCompare(b.exerciseId));}
  function validate(records){
    if(!Array.isArray(records)||records.length>2000)throw Error('Invalid exercise role history.');
    const copy=clone(records),ids=new Set(),exerciseIds=new Set();
    for(const record of copy){
      if(!record||typeof record.id!=='string'||!record.id||ids.has(record.id)||!iso(record.createdAt)||!iso(record.updatedAt)||!Array.isArray(record.revisions)||!record.revisions.length)throw Error('Invalid exercise role record.');
      ids.add(record.id);let previous='';
      for(const revision of record.revisions){if(!revision||!iso(revision.recordedAt)||revision.recordedAt<=previous||revision.recordedAt<record.createdAt)throw Error('Invalid exercise role revision time.');if(revision.context!==null)revision.context=context(revision.context);previous=revision.recordedAt;}
      if(record.revisions[0].recordedAt!==record.createdAt||record.updatedAt!==previous)throw Error('Invalid exercise role timestamps.');
      const current=visible(record);if(current){if(exerciseIds.has(current.exerciseId))throw Error('An exercise can only have one current role.');exerciseIds.add(current.exerciseId);}
    }
    return copy;
  }
  function upsert(records,input,{now=new Date().toISOString(),id}={}){
    if(!iso(now))throw Error('Invalid exercise role time.');const next=validate(records||[]),value=context(input);let record=next.find(row=>visible(row)?.exerciseId===value.exerciseId);
    if(record){if(now<=record.updatedAt)throw Error('Exercise role was changed at a later time.');const current=visible(record);if(JSON.stringify(context(current))===JSON.stringify(value))return next;record.revisions.push({recordedAt:now,context:value});record.updatedAt=now;}
    else next.push({id:String(id||Core.createId()),createdAt:now,updatedAt:now,revisions:[{recordedAt:now,context:value}]});
    return validate(next);
  }
  function remove(records,exerciseId,{now=new Date().toISOString()}={}){
    if(!iso(now))throw Error('Invalid exercise role time.');const next=validate(records||[]),record=next.find(row=>visible(row)?.exerciseId===String(exerciseId));if(!record)return next;if(now<=record.updatedAt)throw Error('Exercise role was changed at a later time.');record.revisions.push({recordedAt:now,context:null});record.updatedAt=now;return validate(next);
  }
  function replace(records,inputs,{now=new Date().toISOString(),createId=()=>Core.createId()}={}){
    if(!iso(now))throw Error('Invalid exercise role time.');let next=validate(records||[]);const desired=new Map((inputs||[]).map(value=>{const normalized=context(value);return [normalized.exerciseId,normalized];}));
    for(const current of list(next))if(!desired.has(current.exerciseId))next=remove(next,current.exerciseId,{now});
    for(const value of desired.values())next=upsert(next,value,{now,id:createId()});
    return validate(next);
  }
  function suggestion(label){
    const name=text(label,160).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    if(['squat','back squat','barbell squat','competition squat'].includes(name))return {role:'competition',competitionLift:'squat'};
    if(['bench','bench press','barbell bench','barbell bench press','competition bench'].includes(name))return {role:'competition',competitionLift:'bench'};
    if(['deadlift','barbell deadlift','competition deadlift'].includes(name))return {role:'competition',competitionLift:'deadlift'};
    if(/(safety bar|ssb|front squat|pause.*squat|box squat)/.test(name))return {role:'close-variation',competitionLift:'squat'};
    if(/(close grip|incline|spoto|pause.*bench|board press)/.test(name))return {role:'close-variation',competitionLift:'bench'};
    if(/(romanian|rdl|deficit|pause.*deadlift|block pull|rack pull)/.test(name))return {role:'close-variation',competitionLift:'deadlift'};
    return null;
  }
  function cutoff(asOf,knownAt,retrospective){const end=endOfDay(asOf);if(retrospective)return null;if(knownAt&&!iso(knownAt))throw Error('Invalid knowledge cutoff.');return knownAt&&knownAt<end?knownAt:end;}
  function workoutsAt(state,asOf,knowledgeCutoff,retrospective){
    const map=new Map((state.workouts||[]).map(workout=>[String(workout.id),clone(workout)]));
    if(!retrospective&&knowledgeCutoff){
      const revisions=(state.workoutRevisions||[]).filter(row=>iso(row.recordedAt)&&row.recordedAt>knowledgeCutoff).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt));
      for(const revision of revisions){const id=String(revision.workoutId);if(revision.before)map.set(id,clone(revision.before));else map.delete(id);}
    }
    const candidates=[...map.values()].filter(workout=>date(workout.date)&&workout.date<=asOf);
    const legacyTimestampCount=candidates.filter(workout=>!iso(workout.createdAt)).length;
    const workouts=candidates.filter(workout=>retrospective||!iso(workout.createdAt)||workout.createdAt<=knowledgeCutoff).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
    return {workouts,legacyTimestampCount};
  }
  function mappedBenchmark(rows,ids,catalog){
    const names=new Set((catalog||[]).filter(entry=>ids.has(entry.id)).flatMap(entry=>[entry.name,...(entry.aliases||[])]).map(value=>String(value).trim().toLowerCase()));
    return (rows||[]).filter(row=>row.exerciseId&&ids.has(row.exerciseId)||names.has(String(row.exercise||'').trim().toLowerCase())).sort((a,b)=>a.observedOn.localeCompare(b.observedOn)).at(-1)||null;
  }
  function performance(workouts,ids,startDate){
    const sessions=new Map(),sets=[];
    for(const workout of workouts){if(workout.date<startDate)continue;for(const exercise of workout.exercises||[]){if(!ids.has(exercise.exerciseId)||exercise.type==='cardio'||exercise.trackBy==='duration')continue;for(const set of exercise.sets||[]){const weight=Number(set.weight),reps=Number(set.reps),rpe=Number(set.rpe);if(!(weight>0&&Number.isInteger(reps)&&reps>=1&&reps<=12))continue;const row={date:workout.date,weight,reps,rpe:Number.isFinite(rpe)?rpe:null,estimatedCapacity:rpe>=6&&rpe<=10?Core.estimated1RM(weight,reps,rpe):null};sets.push(row);if(!sessions.has(workout.date))sessions.set(workout.date,[]);sessions.get(workout.date).push(row);}}}
    const days=[...sessions.keys()].sort(),eligible=sets.length,rpeSets=sets.filter(row=>row.estimatedCapacity!==null),capacityByDay=days.map(day=>({date:day,value:Math.max(...sessions.get(day).map(row=>row.estimatedCapacity).filter(Number.isFinite))})).filter(row=>Number.isFinite(row.value));
    const latestDay=days.at(-1),latestSets=latestDay?sessions.get(latestDay):[],bestLoad=sets.length?sets.reduce((best,row)=>row.weight>best.weight?row:best,sets[0]):null,bestCapacity=rpeSets.length?rpeSets.reduce((best,row)=>row.estimatedCapacity>best.estimatedCapacity?row:best,rpeSets[0]):null;
    return {sessions:days.length,sets:eligible,rpeSets:rpeSets.length,hardSets:rpeSets.filter(row=>row.rpe>=7).length,rpeCoverage:eligible?Core.round(rpeSets.length/eligible,2):null,firstDate:days[0]||null,latestDate:latestDay||null,latestLoggedLoad:latestSets.length?Math.max(...latestSets.map(row=>row.weight)):null,bestLoggedLoad:bestLoad?.weight||null,baselineEstimatedCapacity:capacityByDay[0]?.value||null,baselineCapacityDate:capacityByDay[0]?.date||null,latestEstimatedCapacity:capacityByDay.at(-1)?.value||null,latestCapacityDate:capacityByDay.at(-1)?.date||null,bestEstimatedCapacity:bestCapacity?.estimatedCapacity||null,capacityDays:capacityByDay.length};
  }
  function snapshot(state,{asOf,knownAt,retrospective=false}={}){
    if(!date(asOf))throw Error('An explicit analysis date is required.');const knowledgeCutoff=cutoff(asOf,knownAt,retrospective),workoutView=workoutsAt(state,asOf,knowledgeCutoff,retrospective),mappings=list(state.exerciseRoles||[],knowledgeCutoff||undefined),catalog=state.exerciseCatalog||[];
    const block=Blocks.at(state.trainingBlocks||[],asOf,{knownAt:knowledgeCutoff||undefined,retrospective}),windowStart=block?.startDate||dayBefore(asOf,83),windowWorkouts=workoutView.workouts.filter(workout=>workout.date>=windowStart);
    const profile=state.athleteProfile||{},results={};
    for(const [lift,label] of Object.entries(LIFTS)){
      const related=mappings.filter(row=>row.competitionLift===lift),primary=related.filter(row=>row.role==='competition'),primaryIds=new Set(primary.map(row=>row.exerciseId)),variationIds=new Set(related.filter(row=>row.role==='close-variation').map(row=>row.exerciseId)),metrics=performance(windowWorkouts,primaryIds,windowStart),variationMetrics=performance(windowWorkouts,variationIds,windowStart),reasons=[];
      if(!primary.length)reasons.push('Confirm which exercise is the competition '+label.toLowerCase()+'.');
      if(primary.length>1)reasons.push('Only one current competition '+label.toLowerCase()+' should be mapped.');
      if(metrics.sessions<3)reasons.push(metrics.sessions?'Fewer than three matching sessions are available.':'No matching sessions are available in this analysis window.');
      if(metrics.sets&&metrics.rpeCoverage<0.5)reasons.push('Fewer than half of eligible sets include usable RPE 6–10.');
      if(!block)reasons.push('No training block is active on this date.');
      else if(block.dataCompleteness!=='complete')reasons.push('The active block workout history is '+block.dataCompleteness+'.');
      if(!retrospective&&workoutView.legacyTimestampCount)reasons.push('Legacy workouts lack saved-at timestamps, so strict point-in-time replay is incomplete.');
      const status=!primary.length||!metrics.sessions?'not-ready':reasons.length?'limited':'ready';
      const durationDays=Math.floor((Date.parse(asOf)-Date.parse(windowStart))/86400000)+1;
      results[lift]={lift,label,status,reasons,competitionExercise:primary[0]?catalog.find(entry=>entry.id===primary[0].exerciseId)?.name||primary[0].exerciseId:null,relatedExercises:related.map(row=>({exerciseId:row.exerciseId,name:catalog.find(entry=>entry.id===row.exerciseId)?.name||row.exerciseId,role:row.role})),metrics:{...metrics,variationSessions:variationMetrics.sessions,observedHardSetsPerWeek:durationDays>=7?Core.round(metrics.hardSets/durationDays*7,1):null},evidence:{trainingMax:mappedBenchmark(block?.trainingMaxes,primaryIds,catalog),known1RM:mappedBenchmark(block?.known1RMs,primaryIds,catalog),profileBenchmark:Number(profile[lift])>0?{kg:Number(profile[lift]),source:'legacy athlete profile'}:null,baselineEstimatedCapacity:metrics.baselineEstimatedCapacity==null?null:{kg:metrics.baselineEstimatedCapacity,date:metrics.baselineCapacityDate,source:'first RPE-aware competition-lift performance'},estimatedCapacity:metrics.latestEstimatedCapacity==null?null:{kg:metrics.latestEstimatedCapacity,date:metrics.latestCapacityDate,source:'latest RPE-aware competition-lift performance'},loggedLoad:metrics.latestLoggedLoad==null?null:{kg:metrics.latestLoggedLoad,date:metrics.latestDate,source:'logged competition-lift working load'}},interpretation:block&&(block.loadStrategy==='conservative'||block.blockType==='return-reentry'||block.progressionIntent==='return-ramp')?'Planned load increases in this block are not equivalent to strength gains.':null};
    }
    return {version:1,asOf,mode:retrospective?'current-corrected':'as-recorded',knowledgeCutoff,windowStart,block,workoutCount:windowWorkouts.length,legacyTimestampCount:workoutView.legacyTimestampCount,lifts:results,decisionAllowed:false};
  }
  return {ROLES,LIFTS,context,validate,list,upsert,remove,replace,suggestion,workoutsAt,snapshot};
});
