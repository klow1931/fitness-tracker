/* Loadnote v2.3 decision backtesting — read-only walk-forward evaluation. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(
    require('../core/loadnote-core'),
    require('./training-blocks'),
    require('./decision-readiness'),
    require('./decision-engine')
  );
  else root.LoadnoteDecisionBacktest=factory(root.LoadnoteCore,root.LoadnoteBlocks,root.LoadnoteReadiness,root.LoadnoteDecisionEngine);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Blocks,Readiness,Decisions){
  'use strict';
  if(!Core||!Blocks||!Readiness||!Decisions)throw Error('Loadnote backtest dependencies are required');
  const VERSION=1;
  const DAY=86400000;
  const endOfDay=day=>day+'T23:59:59.999Z';
  const addDays=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const daysBetween=(a,b)=>Math.floor((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/DAY);
  const round=(n,d=1)=>Core.round(Number(n)||0,d);
  function mappedIdsAt(state,lift,day,retrospective){
    const knownAt=retrospective?undefined:endOfDay(day);
    return new Set(Readiness.list(state.exerciseRoles||[],knownAt)
      .filter(row=>row.role==='competition'&&row.competitionLift===lift).map(row=>row.exerciseId));
  }
  function bestCapacity(exercise,workout){
    let best=null;
    if(exercise.type==='cardio'||exercise.trackBy==='duration')return null;
    for(const set of exercise.sets||[]){
      const ev=Core.capacityEvidence(set.weight,set.reps,set.rpe);
      if(ev.estimate==null)continue;
      const row={workoutId:String(workout.id),date:workout.date,exerciseId:exercise.exerciseId,weight:Number(set.weight),reps:Number(set.reps),rpe:Number(set.rpe),estimatedCapacity:ev.estimate};
      if(!best||row.estimatedCapacity>best.estimatedCapacity)best=row;
    }
    return best;
  }
  function candidateDates(state,lift,{from,to,retrospective=false}={}){
    const dates=[...new Set((state.workouts||[]).map(w=>w.date).filter(Blocks.date))].sort();
    return dates.filter(day=>{
      if(from&&day<from||to&&day>to)return false;
      const ids=mappedIdsAt(state,lift,day,retrospective);
      if(!ids.size)return false;
      const view=Readiness.workoutsAt(state,day,endOfDay(day),retrospective).workouts.filter(w=>w.date===day);
      return view.some(workout=>(workout.exercises||[]).some(ex=>ids.has(ex.exerciseId)&&bestCapacity(ex,workout)));
    });
  }
  function nextOutcome(state,lift,decision,{horizonDays=42,retrospective=false}={}){
    const baseline=decision.evidence?.at?.(-1);
    if(!baseline)return null;
    const ids=mappedIdsAt(state,lift,decision.asOf,retrospective);
    if(!ids.size)return null;
    const end=addDays(decision.asOf,horizonDays);
    const workouts=(state.workouts||[]).filter(w=>Blocks.date(w.date)&&w.date>decision.asOf&&w.date<=end).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
    for(const workout of workouts){
      let best=null;
      for(const ex of workout.exercises||[])if(ids.has(ex.exerciseId)){const row=bestCapacity(ex,workout);if(row&&(!best||row.estimatedCapacity>best.estimatedCapacity))best=row;}
      if(best){
        return {...best,daysAfterDecision:daysBetween(decision.asOf,best.date),capacityChangePct:round((best.estimatedCapacity/baseline.estimatedCapacity-1)*100),rpeChange:round(best.rpe-baseline.rpe)};
      }
    }
    return null;
  }
  function classify(change){
    if(change==null)return 'unobserved';
    if(change>=1)return 'improved';
    if(change<=-1)return 'declined';
    return 'stable';
  }
  function row(state,lift,asOf,options={}){
    const retrospective=options.retrospective===true;
    const knownAt=retrospective?undefined:endOfDay(asOf);
    const decision=Decisions.decisionForLift(state,lift,{asOf,knownAt,retrospective,policy:options.policy});
    const outcome=nextOutcome(state,lift,decision,{horizonDays:options.horizonDays,retrospective});
    return {
      lift,asOf,decision:decision.decision,decisionAllowed:decision.decisionAllowed,reason:decision.reason,
      nextExposure:decision.nextExposure,watchNext:decision.watchNext,readiness:decision.readiness,
      evidence:decision.evidence,outcome,
      outcomeClass:classify(outcome?.capacityChangePct??null)
    };
  }
  function average(rows,decision){
    const values=rows.filter(r=>r.decision===decision&&r.outcome).map(r=>r.outcome.capacityChangePct);
    return values.length?round(values.reduce((a,b)=>a+b,0)/values.length):null;
  }
  function summarize(rows){
    const total=rows.length,counts={increase:0,hold:0,reduce:0,'insufficient-evidence':0};
    rows.forEach(r=>{counts[r.decision]=(counts[r.decision]||0)+1;});
    const observed=rows.filter(r=>r.outcome);
    const increases=observed.filter(r=>r.decision==='increase');
    const reduces=observed.filter(r=>r.decision==='reduce');
    const watched=observed.filter(r=>r.decision==='increase'||r.decision==='hold');
    const stableOrImproved=increases.filter(r=>r.outcome.capacityChangePct>=-0.5);
    const rebound=reduces.filter(r=>r.outcome.capacityChangePct>=0);
    const warningMisses=watched.filter(r=>r.outcome.capacityChangePct<=-3&&r.outcome.rpe>=8.5);
    return {
      totalDecisions:total,
      counts,
      directionalDecisions:counts.increase+counts.hold+counts.reduce,
      abstentionRate:total?round(counts['insufficient-evidence']/total*100):0,
      outcomesObserved:observed.length,
      outcomeCoverage:total?round(observed.length/total*100):0,
      meanNextCapacityChangePct:{
        increase:average(rows,'increase'),hold:average(rows,'hold'),reduce:average(rows,'reduce')
      },
      increaseStableOrImproved:{count:stableOrImproved.length,total:increases.length,rate:increases.length?round(stableOrImproved.length/increases.length*100):null},
      reduceStabilizedOrRebounded:{count:rebound.length,total:reduces.length,rate:reduces.length?round(rebound.length/reduces.length*100):null},
      warningMisses:{count:warningMisses.length,total:watched.length,rate:watched.length?round(warningMisses.length/watched.length*100):null}
    };
  }
  function run(state,{from,to,lifts=Object.keys(Readiness.LIFTS),retrospective=false,horizonDays=42,policy,cutoffs}={}){
    const rows=[];
    for(const lift of lifts){
      const dates=Array.isArray(cutoffs)?[...new Set(cutoffs.filter(Blocks.date))].filter(day=>(!from||day>=from)&&(!to||day<=to)).sort():candidateDates(state,lift,{from,to,retrospective});
      for(const asOf of dates)rows.push(row(state,lift,asOf,{retrospective,horizonDays,policy}));
    }
    rows.sort((a,b)=>a.asOf.localeCompare(b.asOf)||a.lift.localeCompare(b.lift));
    return {version:VERSION,mode:retrospective?'current-corrected':'as-recorded',readOnly:true,horizonDays,cutoffMode:Array.isArray(cutoffs)?'explicit':'exposure-dates',policy:Decisions.policy(policy),rows,summary:summarize(rows)};
  }
  function sensitivity(state,variants,options={}){
    const list=Array.isArray(variants)?variants:[];
    return list.map(item=>{
      const name=String(item?.name||'variant'),policy=Decisions.policy(item?.policy);
      const report=run(state,{...options,policy});
      return {name,policy,summary:report.summary};
    });
  }
  return {VERSION,candidateDates,nextOutcome,row,summarize,run,sensitivity};
});
