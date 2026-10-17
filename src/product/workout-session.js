(function(root,factory){
  if(typeof module==='object' && module.exports) module.exports=factory(require('./data-integrity'),require('./session-intent'),require('./schedule'));
  else root.LoadnoteSession=factory(root.LoadnoteIntegrity,root.LoadnoteIntent,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Integrity,Intent,Schedule){
  'use strict';
  const key=value=>String(value || '').trim().toLowerCase();
  const same=(a,b)=>String(a)===String(b);
  const clone=value=>JSON.parse(JSON.stringify(value));
  function comparable(value){const copy=clone(value);for(const exercise of copy?.exercises||[])delete exercise.exerciseId;for(const exercise of copy?.sessionIntent?.prescription?.plannedExercises||[])delete exercise.exerciseId;return JSON.stringify(copy);}
  // User-facing historical fills must never silently cross confirmed exercise IDs.
  // Legacy name-only records remain usable only when no ID-backed performance exists.
  function catalogIdentity(catalog,name){
    const query=key(name),ids=new Set();
    for(const entry of catalog||[])if([entry?.name,...(entry?.aliases||[])].some(label=>key(label)===query)&&entry?.id)ids.add(String(entry.id));
    return {exerciseId:ids.size===1?[...ids][0]:null,ambiguous:ids.size>1};
  }
  function findPerformance(workouts,name,eligible=()=>true,exerciseId,{asOf=null,excludeId=null}={}){
    const query=key(name),identity=exerciseId==null?null:String(exerciseId);
    if(!query&&!identity)return null;
    // Saved list ordering and date ordering may differ after imports or corrections.
    const candidates=(Array.isArray(workouts)?workouts:[]).map((w,index)=>({w,index}))
      .filter(({w})=>w&&typeof w.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(w.date)&&(!asOf||w.date<=asOf)&&(excludeId==null||!same(w.id,excludeId)))
      .sort((a,b)=>b.w.date.localeCompare(a.w.date)||b.index-a.index);
    const available=candidates.flatMap(({w})=>(w.exercises||[]).filter(e=>eligible(e,w)).map(exercise=>({date:w.date,exercise})));
    const exactName=e=>query&&key(e?.name)===query;
    if(identity){
      const known=available.find(x=>x.exercise.exerciseId!=null&&same(x.exercise.exerciseId,identity));
      if(known)return known;
      // Do not borrow from an explicitly different ID, even if labels match.
      return available.find(x=>x.exercise.exerciseId==null&&exactName(x.exercise))||null;
    }
    const named=available.filter(x=>exactName(x.exercise)),ids=new Set(named.map(x=>x.exercise.exerciseId).filter(x=>x!=null).map(String));
    if(ids.size>1)return null; // Unresolved identity: do not offer a possibly wrong previous load.
    return named[0]||null;
  }
  function previous(workouts,name,date,excludeId,type='strength',trackBy='reps',exerciseId){
    return findPerformance(workouts,name,e=>(e.type||'strength')===type&&
      (type==='cardio'||(e.trackBy||((e.sets||[]).some(s=>s.duration>0&&!(s.reps>0))?'duration':'reps'))===trackBy),
      exerciseId,{asOf:date,excludeId});
  }
  function fromDraft(draft,id,options={}){
    const factor=draft.unit==='lb'?1/2.2046226218:1;
    const exercises=[];
    // A loaded prescription is a target, not proof of performed work. Edits
    // already contain saved actuals; template capture intentionally retains targets.
    const completedOnly=!!draft.sessionIntent?.prescription && !draft.edit && !options.template;
    for(const row of draft.rows){
      const name=String(row.name || '').trim();if(!name)continue;
      if(row.type==='cardio'){
        if(completedOnly && !row.cardioDone)continue;
        const duration=Number(row.duration)||0,distance=Number(row.distance)||0;
        if(options.template || duration>0 || distance>0){const e={name,type:'cardio',duration,distance,distanceUnit:row.distanceUnit || 'km',sets:[]};if(Number(row.avgHr)>0)e.avgHr=Number(row.avgHr);exercises.push(e);}
      }else{
        const trackBy=row.trackBy==='duration'?'duration':'reps',measure=trackBy==='duration'?'duration':'reps';
        const sets=(row.sets || []).filter(s=>Number(s[measure])>0 && (!completedOnly || s.done===true)).map(s=>{
          const weight=(Number(s.weight)||0)*factor;
          const set={[measure]:Number(s[measure]),weight:options.template && draft.unit!=='lb'?weight:Math.round(weight*100)/100};
          if(!options.template && s.rpe!=='' && Number(s.rpe)>=1 && Number(s.rpe)<=10)set.rpe=Number(s.rpe);
          return set;
        });
        if(sets.length)exercises.push({name,type:'strength',trackBy,sets});
      }
    }
    const workout={id,date:draft.date,notes:String(draft.notes || '').trim(),exercises},intent=Intent?.context(draft.sessionIntent);
    if(intent)workout.sessionIntent=intent;return workout;
  }
  function reconcilePRs(prs,workouts,estimate,createId){
    const identity=value=>value?.exerciseId?'id:'+value.exerciseId:'name:'+key(value?.exercise||value?.name);
    const old=new Map((prs || []).map(p=>[identity(p),p]));
    // Preserve manual and older unclassified PRs as independent benchmarks.
    const anchors=new Map();
    for(const p of prs || []){const anchor=p.source==='workout'?p.baselinePR:p;if(anchor)anchors.set(identity(anchor),clone(anchor));}
    const best=new Map();
    for(const w of workouts)for(const e of w.exercises || []){
      if(e.type==='cardio')continue;
      for(const s of e.sets || [])if(s.reps>0){
        const score=estimate(s.weight,s.reps),k=identity(e),candidate={exercise:e.name,weight:s.weight,reps:s.reps,date:w.date,estimated1RM:score,source:'workout',sourceWorkoutId:w.id};if(e.exerciseId)candidate.exerciseId=e.exerciseId;
        if(!best.has(k) || score>best.get(k).estimated1RM)best.set(k,candidate);
      }
    }
    const result=[];
    for(const k of new Set([...anchors.keys(),...best.keys()])){
      const anchor=anchors.get(k),candidate=best.get(k);
      if(candidate && (!anchor || candidate.estimated1RM>estimate(anchor.weight,anchor.reps))){
        candidate.id=old.get(k)?.id || createId();if(anchor)candidate.baselinePR=anchor;result.push(candidate);
      }else if(anchor)result.push(anchor);
    }
    return result.sort((a,b)=>a.exercise.localeCompare(b.exercise));
  }
  function apply(state,workout,edit,program,estimate,createId,now=new Date().toISOString()){
    Schedule.checkLink(state,workout,edit);
    const next=clone(state),list=next.workouts || [];
    if(edit){
      const index=list.findIndex(w=>same(w.id,edit.id));
      if(index<0)throw Error('This workout was deleted. Cancel this edit and start a new workout.');
      if(comparable(list[index])!==comparable(edit.original))throw Error('This workout changed since you opened it. Cancel this edit and open it again from History.');
      const before=clone(list[index]),updated={...list[index],date:workout.date,notes:workout.notes,exercises:clone(workout.exercises),updatedAt:now};
      if(workout.sessionIntent)updated.sessionIntent=clone(workout.sessionIntent);else delete updated.sessionIntent;list[index]=updated;
      if(Integrity)next.workoutRevisions=Integrity.appendWorkoutRevision(next.workoutRevisions,before,list[index],{now,id:createId()});
    }else{
      if(list.some(w=>same(w.id,workout.id)))throw Error('This workout has already been saved.');
      const entry={...clone(workout),createdAt:now,updatedAt:now};
      if(program){
        Object.assign(entry,{programId:program.programId,programDayIndex:program.dayIndex,programDayName:program.dayName});
        for(const [from,to] of [['week','programWeek'],['blockIndex','programBlockIndex'],['decision','programDecision']])if(program[from]!=null)entry[to]=program[from];
      }
      list.push(entry);
      if(Integrity)next.workoutRevisions=Integrity.appendWorkoutRevision(next.workoutRevisions,null,entry,{now,id:createId()});
    }
    next.workouts=list.sort((a,b)=>b.date.localeCompare(a.date));
    let result=Integrity?Integrity.normalizeState(next):next;result.prs=reconcilePRs(result.prs,result.workouts,estimate,createId);
    return Integrity?Integrity.normalizeState(result):result;
  }
  function remove(state,id,estimate,createId,now=new Date().toISOString()){
    if(!(state.workouts||[]).some(w=>same(w.id,id)))throw Error('Workout not found.');
    const next=clone(state),before=next.workouts.find(w=>same(w.id,id));next.workouts=next.workouts.filter(w=>!same(w.id,id));
    if(Integrity)next.workoutRevisions=Integrity.appendWorkoutRevision(next.workoutRevisions,before,null,{now,id:createId()});
    let result=Integrity?Integrity.normalizeState(next):next;result.prs=reconcilePRs(result.prs,result.workouts,estimate,createId);return Integrity?Integrity.normalizeState(result):result;
  }
  return {previous,findPerformance,catalogIdentity,fromDraft,apply,reconcilePRs,remove};
});
