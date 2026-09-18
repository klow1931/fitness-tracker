/* Loadnote v2 decision engine — deterministic, read-only, evidence-backed. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./training-blocks'),require('./decision-readiness'));
  else root.LoadnoteDecisionEngine=factory(root.LoadnoteCore,root.LoadnoteBlocks,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Blocks,Readiness){
  'use strict';
  if(!Core||!Blocks||!Readiness)throw Error('Loadnote decision engine dependencies are required');
  const VERSION=1;
  const round=(n,d=1)=>Core.round(Number(n)||0,d);
  function competitionEvidence(state,lift,asOf,{retrospective=true,knownAt}={}){
    const end=asOf+'T23:59:59.999Z',cutoff=knownAt&&knownAt<end?knownAt:end;
    const roles=Readiness.list(state.exerciseRoles||[],retrospective?undefined:cutoff);
    const ids=new Set(roles.filter(r=>r.role==='competition'&&r.competitionLift===lift).map(r=>r.exerciseId));
    const replay=Readiness.workoutsAt(state,asOf,cutoff,retrospective);
    const byDay=new Map();
    for(const workout of replay.workouts){
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
    const readiness=Readiness.snapshot(state,{asOf,knownAt:options.knownAt,retrospective}).lifts[lift];
    if(!readiness)throw Error('Unknown competition lift.');
    const evidence=competitionEvidence(state,lift,asOf,{retrospective,knownAt:options.knownAt});
    const base={version:VERSION,lift,label:readiness.label,asOf,mode:retrospective?'current-corrected':'as-recorded',readiness:readiness.status,decision:'insufficient-evidence',decisionAllowed:false,reason:'',evidence:evidence.slice(-3),signals:[]};
    if(readiness.status!=='ready'){
      base.reason=readiness.reasons[0]||'Decision readiness requirements are not met.';
      base.signals=readiness.reasons.slice();
      return base;
    }
    if(evidence.length<3){
      base.reason='At least three capacity-evidence days are required before making a training decision.';
      return base;
    }
    const recent=evidence.slice(-3),first=recent[0],last=recent[2];
    const trend=first.estimatedCapacity>0?(last.estimatedCapacity-first.estimatedCapacity)/first.estimatedCapacity*100:0;
    const avgRpe=recent.reduce((s,row)=>s+row.rpe,0)/recent.length;
    const latestRpe=last.rpe;
    const block=Readiness.snapshot(state,{asOf,knownAt:options.knownAt,retrospective}).block;
    const conservative=!!block&&(block.loadStrategy==='conservative'||block.blockType==='return-reentry'||block.progressionIntent==='return-ramp');
    base.signals=[
      `Three-exposure capacity trend: ${trend>=0?'+':''}${round(trend)}%.`,
      `Recent evidence-set average RPE: ${round(avgRpe)}.`,
      conservative?'Current block context is intentionally conservative.':'Current block does not carry a conservative-return guard.'
    ];
    base.decisionAllowed=true;
    if(trend<=-3&&latestRpe>=8.5){
      base.decision='reduce';
      base.reason='Demonstrated capacity declined across the last three usable exposures while the latest evidence set was high effort.';
    }else if(trend<0||latestRpe>=9){
      base.decision='hold';
      base.reason='Recent evidence does not support increasing the next exposure: capacity is flat/down or the latest evidence set is already high effort.';
    }else if(conservative&&trend<2){
      base.decision='hold';
      base.reason='Performance is stable, but the block is intentionally conservative and the evidence does not justify accelerating its progression.';
    }else if(trend>=1&&avgRpe<=8.5&&latestRpe<=8.5){
      base.decision='increase';
      base.reason=conservative?'Demonstrated capacity improved across recent exposures at controlled effort; a conservative progression is supported without treating planned load increases as strength gains.':'Demonstrated capacity improved across recent exposures while effort remained controlled.';
    }else{
      base.decision='hold';
      base.reason='The evidence supports continuing the current progression without a directional load change.';
    }
    return base;
  }
  function snapshot(state,options={}){
    const asOf=options.asOf;
    if(!Blocks.date(asOf))throw Error('An explicit analysis date is required.');
    const lifts={};
    for(const lift of Object.keys(Readiness.LIFTS))lifts[lift]=decisionForLift(state,lift,options);
    return {version:VERSION,asOf,mode:options.retrospective===false?'as-recorded':'current-corrected',readOnly:true,automaticChanges:false,lifts};
  }
  return {VERSION,competitionEvidence,decisionForLift,snapshot};
});
