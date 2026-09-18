/* Loadnote v2.4 decision feedback — local-first athlete response history. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'));
  else root.LoadnoteDecisionFeedback=factory(root.LoadnoteCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
  'use strict';
  if(!Core)throw Error('Loadnote core is required');
  const VERSION=1;
  const RESPONSES=new Set(['accept','modify','ignore']);
  const DIRECTIONS=new Set(['increase','hold','reduce']);
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
  const text=(v,max=500)=>String(v||'').trim().replace(/\s+/g,' ').slice(0,max);
  const hash=value=>{let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
  function key(decision){
    const evidence=(decision?.evidence||[]).map(row=>[row.workoutId,row.date,row.exerciseId,row.weight,row.reps,row.rpe,row.estimatedCapacity]);
    return [decision?.asOf,decision?.lift,decision?.version,decision?.decision,JSON.stringify(evidence)].join('|');
  }
  function snapshot(decision){
    if(!decision||!decision.asOf||!decision.lift||!decision.decision)throw Error('Decision snapshot is required.');
    return {
      engineVersion:Number(decision.version||0),
      asOf:String(decision.asOf),
      lift:String(decision.lift),
      label:text(decision.label,80),
      mode:String(decision.mode||'current-corrected'),
      readiness:String(decision.readiness||''),
      decision:String(decision.decision),
      decisionAllowed:!!decision.decisionAllowed,
      reason:text(decision.reason,1200),
      nextExposure:text(decision.nextExposure,1200),
      watchNext:text(decision.watchNext,1200),
      evidence:clone((decision.evidence||[]).slice(-3)),
      decisionKey:key(decision)
    };
  }
  function validateEvent(raw){
    if(!raw||typeof raw!=='object'||!raw.id||!iso(raw.createdAt)||!iso(raw.updatedAt)||!RESPONSES.has(raw.response))throw Error('Invalid decision feedback event.');
    if(!raw.snapshot||!raw.snapshot.decisionKey||!raw.snapshot.asOf||!raw.snapshot.lift)throw Error('Invalid decision snapshot.');
    if(raw.response==='modify'&&!DIRECTIONS.has(raw.chosenDirection))throw Error('Modified feedback needs Increase, Hold, or Reduce.');
    if(raw.response!=='modify'&&raw.chosenDirection!==null)throw Error('Only modified feedback can set a chosen direction.');
    return {...clone(raw),note:text(raw.note,500)};
  }
  function list(events){return (Array.isArray(events)?events:[]).map(validateEvent).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||String(b.id).localeCompare(String(a.id)));}
  function find(events,decision){const k=key(decision);return list(events).find(event=>event.snapshot.decisionKey===k)||null;}
  function record(events,decision,{response,chosenDirection=null,note=''},{now=new Date().toISOString(),id}={}){
    if(!iso(now)||!RESPONSES.has(response))throw Error('Choose Accept, Modify, or Ignore.');
    if(response==='modify'&&!DIRECTIONS.has(chosenDirection))throw Error('Choose Increase, Hold, or Reduce for a modification.');
    const snap=snapshot(decision),next=list(events),existing=next.find(event=>event.snapshot.decisionKey===snap.decisionKey);
    const value={
      id:String(existing?.id||id||('decision_'+hash(now+snap.decisionKey))),
      createdAt:existing?.createdAt||now,
      updatedAt:now,
      response,
      chosenDirection:response==='modify'?chosenDirection:null,
      note:text(note,500),
      snapshot:snap
    };
    if(existing){const i=next.findIndex(event=>event.id===existing.id);next[i]=value;}else next.push(value);
    return list(next);
  }
  function capacityFromExercise(exercise,workout){
    if(!exercise||exercise.type==='cardio'||exercise.trackBy==='duration')return null;
    let best=null;
    for(const set of exercise.sets||[]){
      const ev=Core.capacityEvidence(set.weight,set.reps,set.rpe);
      if(ev.estimate==null)continue;
      const row={workoutId:String(workout.id),date:workout.date,exerciseId:exercise.exerciseId||null,weight:Number(set.weight),reps:Number(set.reps),rpe:Number(set.rpe),estimatedCapacity:ev.estimate};
      if(!best||row.estimatedCapacity>best.estimatedCapacity)best=row;
    }
    return best;
  }
  function outcome(state,event,{horizonDays=42}={}){
    const latest=event?.snapshot?.evidence?.at?.(-1);if(!latest)return null;
    const ids=new Set((event.snapshot.evidence||[]).map(row=>row.exerciseId).filter(Boolean));
    if(!ids.size)return null;
    const start=event.snapshot.asOf,d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+horizonDays);const end=d.toISOString().slice(0,10);
    const workouts=(state?.workouts||[]).filter(w=>w.date>start&&w.date<=end).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
    for(const workout of workouts){
      let best=null;
      for(const exercise of workout.exercises||[])if(ids.has(exercise.exerciseId)){const row=capacityFromExercise(exercise,workout);if(row&&(!best||row.estimatedCapacity>best.estimatedCapacity))best=row;}
      if(best){
        const capacityChangePct=latest.estimatedCapacity>0?Core.round((best.estimatedCapacity/latest.estimatedCapacity-1)*100,1):null;
        return {...best,capacityChangePct,rpeChange:Core.round(best.rpe-latest.rpe,1)};
      }
    }
    return null;
  }
  function history(state,{horizonDays=42}={}){
    return list(state?.decisionEvents||[]).map(event=>({...event,outcome:outcome(state,event,{horizonDays})}));
  }
  return {VERSION,RESPONSES,DIRECTIONS,key,snapshot,list,find,record,outcome,history};
});
