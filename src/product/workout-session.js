(function(root,factory){
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.LoadnoteSession=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const key=value=>String(value || '').trim().toLowerCase();
  const same=(a,b)=>String(a)===String(b);
  const clone=value=>JSON.parse(JSON.stringify(value));
  function findPerformance(workouts,name,eligible=()=>true){
    for(const w of workouts || [])for(const exercise of w.exercises || []){
      if(key(exercise.name)===key(name) && eligible(exercise,w))return {date:w.date,exercise};
    }
    return null;
  }
  function previous(workouts,name,date,excludeId,type='strength',trackBy='reps') {
    const candidates=(workouts || []).map((w,index)=>({w,index})).filter(({w})=>!same(w.id,excludeId) && w.date<=date)
      .sort((a,b)=>b.w.date.localeCompare(a.w.date)||b.index-a.index);
    return findPerformance(candidates.map(c=>c.w),name,e=>(e.type || 'strength')===type &&
      (type==='cardio' || (e.trackBy || ((e.sets || []).some(s=>s.duration>0 && !(s.reps>0))?'duration':'reps'))===trackBy));
  }
  function fromDraft(draft,id,options={}){
    const factor=draft.unit==='lb'?1/2.2046226218:1;
    const exercises=[];
    for(const row of draft.rows){
      const name=String(row.name || '').trim();if(!name)continue;
      if(row.type==='cardio'){
        const duration=Number(row.duration)||0,distance=Number(row.distance)||0;
        if(options.template || duration>0 || distance>0){const e={name,type:'cardio',duration,distance,distanceUnit:row.distanceUnit || 'km',sets:[]};if(Number(row.avgHr)>0)e.avgHr=Number(row.avgHr);exercises.push(e);}
      }else{
        const trackBy=row.trackBy==='duration'?'duration':'reps',measure=trackBy==='duration'?'duration':'reps';
        const sets=(row.sets || []).filter(s=>Number(s[measure])>0).map(s=>{
          const weight=(Number(s.weight)||0)*factor;
          const set={[measure]:Number(s[measure]),weight:options.template && draft.unit!=='lb'?weight:Math.round(weight*100)/100};
          if(!options.template && s.rpe!=='' && Number(s.rpe)>=1 && Number(s.rpe)<=10)set.rpe=Number(s.rpe);
          return set;
        });
        if(sets.length)exercises.push({name,type:'strength',trackBy,sets});
      }
    }
    return {id,date:draft.date,notes:String(draft.notes || '').trim(),exercises};
  }
  function reconcilePRs(prs,workouts,estimate,createId){
    const old=new Map((prs || []).map(p=>[key(p.exercise),p]));
    // Preserve manual and older unclassified PRs as independent benchmarks.
    const anchors=new Map();
    for(const p of prs || []){const anchor=p.source==='workout'?p.baselinePR:p;if(anchor)anchors.set(key(anchor.exercise),clone(anchor));}
    const best=new Map();
    for(const w of workouts)for(const e of w.exercises || []){
      if(e.type==='cardio')continue;
      for(const s of e.sets || [])if(s.reps>0){
        const score=estimate(s.weight,s.reps),k=key(e.name);
        if(!best.has(k) || score>best.get(k).estimated1RM)best.set(k,{exercise:e.name,weight:s.weight,reps:s.reps,date:w.date,estimated1RM:score,source:'workout',sourceWorkoutId:w.id});
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
  function apply(state,workout,edit,program,estimate,createId){
    const next=clone(state),list=next.workouts || [];
    if(edit){
      const index=list.findIndex(w=>same(w.id,edit.id));
      if(index<0)throw Error('This workout was deleted. Cancel this edit and start a new workout.');
      if(JSON.stringify(list[index])!==JSON.stringify(edit.original))throw Error('This workout changed since you opened it. Cancel this edit and open it again from History.');
      list[index]={...list[index],date:workout.date,notes:workout.notes,exercises:clone(workout.exercises),updatedAt:new Date().toISOString()};
    }else{
      if(list.some(w=>same(w.id,workout.id)))throw Error('This workout has already been saved.');
      const entry=clone(workout);
      if(program){
        Object.assign(entry,{programId:program.programId,programDayIndex:program.dayIndex,programDayName:program.dayName});
        for(const [from,to] of [['week','programWeek'],['blockIndex','programBlockIndex'],['decision','programDecision']])if(program[from]!=null)entry[to]=program[from];
      }
      list.push(entry);
    }
    next.workouts=list.sort((a,b)=>b.date.localeCompare(a.date));
    next.prs=reconcilePRs(next.prs,list,estimate,createId);
    return next;
  }
  function remove(state,id,estimate,createId){
    if(!(state.workouts||[]).some(w=>same(w.id,id)))throw Error('Workout not found.');
    const next=clone(state);next.workouts=next.workouts.filter(w=>!same(w.id,id));
    next.prs=reconcilePRs(next.prs,next.workouts,estimate,createId);return next;
  }
  return {previous,findPerformance,fromDraft,apply,reconcilePRs,remove};
});
