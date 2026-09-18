/* Loadnote v2 decision engine — deterministic, read-only, evidence-backed. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./training-blocks'),require('./decision-readiness'));
  else root.LoadnoteDecisionEngine=factory(root.LoadnoteCore,root.LoadnoteBlocks,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Blocks,Readiness){
  'use strict';
  if(!Core||!Blocks||!Readiness)throw Error('Loadnote decision engine dependencies are required');
  const VERSION=4;
  const DEFAULT_POLICY=Object.freeze({
    maxEvidenceAgeDays:28,
    intervalTolerancePct:0.5,
    rpeRiseGuard:1.5,
    reduceTrendPct:-3,
    increaseTrendPct:1,
    conservativeIncreaseTrendPct:2,
    highEffortRpe:9,
    reduceEffortRpe:8.5,
    increaseMaxRpe:8.5
  });
  const MAX_EVIDENCE_AGE_DAYS=DEFAULT_POLICY.maxEvidenceAgeDays;
  function policy(input={}){
    const next={...DEFAULT_POLICY,...(input||{})};
    for(const [key,value] of Object.entries(next))if(!Number.isFinite(Number(value)))throw Error('Invalid decision policy: '+key);
    if(next.maxEvidenceAgeDays<1||next.intervalTolerancePct<0||next.increaseTrendPct<0||next.conservativeIncreaseTrendPct<next.increaseTrendPct)throw Error('Invalid decision policy thresholds.');
    return next;
  }
  const round=(n,d=1)=>Core.round(Number(n)||0,d);
  const daysBetween=(a,b)=>Math.floor((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
  function competitionEvidence(state,lift,asOf,{retrospective=true,knownAt,startDate}={}){
    const end=asOf+'T23:59:59.999Z',cutoff=knownAt&&knownAt<end?knownAt:end;
    const roles=Readiness.list(state.exerciseRoles||[],retrospective?undefined:cutoff);
    const ids=new Set(roles.filter(r=>r.role==='competition'&&r.competitionLift===lift).map(r=>r.exerciseId));
    const replay=Readiness.workoutsAt(state,asOf,cutoff,retrospective);
    const byDay=new Map();
    for(const workout of replay.workouts){
      if(startDate&&workout.date<startDate)continue;
      for(const exercise of workout.exercises||[]){
        if(!ids.has(exercise.exerciseId)||exercise.type==='cardio'||exercise.trackBy==='duration')continue;
        for(const set of exercise.sets||[]){
          const ev=Core.capacityEvidence(set.weight,set.reps,set.rpe);
          if(ev.estimate==null)continue;
          const row={workoutId:String(workout.id),date:workout.date,exerciseId:exercise.exerciseId,weight:Number(set.weight),reps:Number(set.reps),rpe:Number(set.rpe),estimatedCapacity:ev.estimate};
          if(!byDay.has(workout.date)||row.estimatedCapacity>byDay.get(workout.date).estimatedCapacity)byDay.set(workout.date,row);
        }
      }
    }
    return [...byDay.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  function decisionForLift(state,lift,options={}){
    const asOf=options.asOf;
    if(!Blocks.date(asOf))throw Error('An explicit analysis date is required.');
    const retrospective=options.retrospective!==false;
    const P=policy(options.policy);
    const readinessSnapshot=Readiness.snapshot(state,{asOf,knownAt:options.knownAt,retrospective});
    const readiness=readinessSnapshot.lifts[lift];
    if(!readiness)throw Error('Unknown competition lift.');
    const evidence=competitionEvidence(state,lift,asOf,{retrospective,knownAt:options.knownAt,startDate:readinessSnapshot.windowStart});
    const base={version:VERSION,lift,label:readiness.label,asOf,mode:retrospective?'current-corrected':'as-recorded',readiness:readiness.status,decision:'insufficient-evidence',decisionAllowed:false,reason:'',nextExposure:'Collect more evidence before making a directional training change.',watchNext:'Complete a fresh, well-mapped competition-lift exposure with usable load, reps and RPE.',evidenceWindowStart:readinessSnapshot.windowStart,evidence:evidence.slice(-3),signals:[]};
    if(readiness.status!=='ready'){
      base.reason=readiness.reasons[0]||'Decision readiness requirements are not met.';
      base.nextExposure='Keep the current plan unchanged by this model until the missing readiness evidence is resolved.';
      base.watchNext=readiness.reasons[0]||'Add enough current, mapped evidence for Decision Readiness to become ready.';
      base.signals=readiness.reasons.slice();
      return base;
    }
    if(evidence.length<3){
      base.reason='At least three capacity-evidence days are required before making a training decision.';
      base.nextExposure='Keep the current plan unchanged by this model while another usable exposure is collected.';
      base.watchNext='Reach at least three distinct capacity-evidence days in the active analysis window.';
      return base;
    }
    const recent=evidence.slice(-3),first=recent[0],last=recent[2];
    const trend=first.estimatedCapacity>0?(last.estimatedCapacity-first.estimatedCapacity)/first.estimatedCapacity*100:0;
    const intervalTrends=recent.slice(1).map((row,i)=>(row.estimatedCapacity-recent[i].estimatedCapacity)/recent[i].estimatedCapacity*100);
    const nonDecliningIntervals=intervalTrends.filter(value=>value>=-P.intervalTolerancePct).length;
    const nonIncreasingIntervals=intervalTrends.filter(value=>value<=P.intervalTolerancePct).length;
    const avgRpe=recent.reduce((s,row)=>s+row.rpe,0)/recent.length;
    const latestRpe=last.rpe;
    const rpeChange=latestRpe-first.rpe;
    const evidenceAgeDays=daysBetween(last.date,asOf);
    const block=readinessSnapshot.block;
    const conservative=!!block&&(block.loadStrategy==='conservative'||block.blockType==='return-reentry'||block.progressionIntent==='return-ramp');
    base.signals=[
      `Three-exposure capacity trend: ${trend>=0?'+':''}${round(trend)}%.`,
      `Exposure-to-exposure direction: ${intervalTrends.map(v=>(v>=0?'+':'')+round(v)+'%').join(', ')}.`,
      `Recent evidence-set average RPE: ${round(avgRpe)}; first-to-latest RPE change: ${rpeChange>=0?'+':''}${round(rpeChange)}.`,
      `Latest usable evidence is ${evidenceAgeDays} day${evidenceAgeDays===1?'':'s'} old.`,
      conservative?'Current block context is intentionally conservative.':'Current block does not carry a conservative-return guard.'
    ];
    if(evidenceAgeDays>P.maxEvidenceAgeDays){
      base.reason=`Latest usable competition-lift evidence is ${evidenceAgeDays} days old. A directional recommendation is withheld until fresher evidence is available.`;
      base.nextExposure='Use the planned session as a fresh evidence opportunity rather than changing direction from stale data.';
      base.watchNext='Record a new usable competition-lift exposure; freshness is restored once current evidence enters the window.';
      return base;
    }
    base.decisionAllowed=true;
    if(trend<=P.reduceTrendPct&&latestRpe>=P.reduceEffortRpe&&nonIncreasingIntervals===2){
      base.decision='reduce';
      base.reason='Demonstrated capacity declined across the last three usable exposures while the latest evidence set was high effort.';
      base.nextExposure='Use a lower-stress next exposure or reduce the planned loading direction rather than pushing progression.';
      base.watchNext='Look for capacity to stabilize or rebound at lower effort before resuming progression.';
    }else if(trend<0||latestRpe>=P.highEffortRpe||rpeChange>=P.rpeRiseGuard){
      base.decision='hold';
      base.reason=rpeChange>=P.rpeRiseGuard?'Recent capacity does not justify an increase because effort rose sharply across the same evidence window.':'Recent evidence does not support increasing the next exposure: capacity is flat/down or the latest evidence set is already high effort.';
      base.nextExposure='Keep the current loading direction instead of adding a new progression step.';
      base.watchNext=rpeChange>=1.5?'Watch whether effort settles at the same or better demonstrated capacity.':'Watch for a clearer capacity improvement at controlled effort before increasing.';
    }else if(conservative&&trend<P.conservativeIncreaseTrendPct){
      base.decision='hold';
      base.reason='Performance is stable, but the block is intentionally conservative and the evidence does not justify accelerating its progression.';
      base.nextExposure='Stay with the conservative block progression rather than accelerating the planned loading direction.';
      base.watchNext='Require a clearer improvement in demonstrated capacity at controlled effort before accelerating.';
    }else if(trend>=P.increaseTrendPct&&avgRpe<=P.increaseMaxRpe&&latestRpe<=P.increaseMaxRpe&&nonDecliningIntervals===2){
      base.decision='increase';
      base.reason=conservative?'Demonstrated capacity improved across recent exposures at controlled effort; a conservative progression is supported without treating planned load increases as strength gains.':'Demonstrated capacity improved across recent exposures while effort remained controlled.';
      base.nextExposure=conservative?'A modest progression is supported if it fits the conservative block plan; do not treat this as a new tested max.':'A modest progression is supported if it fits the current program; exact loading remains a programming choice.';
      base.watchNext='Confirm the next exposure maintains controlled effort without reversing the recent capacity direction.';
    }else{
      base.decision='hold';
      base.reason=trend>=P.increaseTrendPct&&nonDecliningIntervals<2
        ?'Overall capacity is higher, but the exposure-to-exposure pattern is inconsistent. Hold until the direction is confirmed.'
        :'The evidence supports continuing the current progression without a directional load change.';
      base.nextExposure='Keep the current loading direction and use the next exposure to confirm the trend.';
      base.watchNext=trend>=1&&nonDecliningIntervals<2?'Watch for a second consecutive non-declining exposure before progressing.':'Watch for a clear capacity rise at controlled effort before changing direction.';
    }
    return base;
  }
  function snapshot(state,options={}){
    const asOf=options.asOf;
    if(!Blocks.date(asOf))throw Error('An explicit analysis date is required.');
    const lifts={};
    for(const lift of Object.keys(Readiness.LIFTS))lifts[lift]=decisionForLift(state,lift,options);
    return {version:VERSION,asOf,mode:options.retrospective===false?'as-recorded':'current-corrected',readOnly:true,automaticChanges:false,policy:policy(options.policy),lifts};
  }
  return {VERSION,DEFAULT_POLICY,MAX_EVIDENCE_AGE_DAYS,policy,competitionEvidence,decisionForLift,snapshot};
});
