/* v2.23: dated competition-lift estimated-capacity context, never a prescription. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./phase-builder'),require('./decision-readiness'),require('./schedule'));
  else root.LoadnoteLiftPerformance=factory(root.LoadnoteCore,root.LoadnotePhaseBuilder,root.LoadnoteReadiness,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Phase,Readiness,Schedule){
  'use strict';
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const round=n=>Math.round(n*100)/100;
  const median=values=>{const v=[...values].sort((a,b)=>a-b);return (v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2;};
  function compare(state,raw,{asOf,now=new Date().toISOString()}={}){
    if(!Schedule.date(asOf)||typeof now!=='string'||!Number.isFinite(Date.parse(now))||new Date(now).toISOString()!==now)throw Error('Choose valid analysis dates');
    const c=Phase.config(raw),cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',start=move(asOf,-27);
    const view=Readiness.workoutsAt(state,asOf,cutoff,false),workouts=view.workouts.filter(w=>w.date>=start&&w.date<=asOf),lifts={};
    for(const lift of Phase.LIFTS){
      const main=c.lifts[lift],byDay=new Map(),counts={loggedSets:0,eligibleSets:0,excludedSets:0};
      for(const workout of workouts)for(const exercise of workout.exercises||[]){
        if(exercise.exerciseId!==main.exerciseId||exercise.type==='cardio'||exercise.trackBy==='duration')continue;
        for(const set of exercise.sets||[]){
          if(!Number.isFinite(set.weight)||set.weight<=0||!Number.isInteger(set.reps)||set.reps<1)continue;
          counts.loggedSets++;
          const result=Core.capacityEvidence(set.weight,set.reps,set.rpe);
          if(result.estimate==null){counts.excludedSets++;continue;}
          counts.eligibleSets++;
          const item={date:workout.date,estimatedCapacityKg:result.estimate,reps:set.reps,rpe:Number(set.rpe)};
          if(!byDay.has(item.date)||item.estimatedCapacityKg>byDay.get(item.date).estimatedCapacityKg)byDay.set(item.date,item);
        }
      }
      const days=[...byDay.values()].sort((a,b)=>a.date.localeCompare(b.date));
      const enough=days.length>=4&&days.at(-1).date>=move(days[0].date,14);
      const early=enough?days.slice(0,2):[],late=enough?days.slice(-2):[];
      const baseline=enough?median(early.map(d=>d.estimatedCapacityKg)):null,latest=enough?median(late.map(d=>d.estimatedCapacityKg)):null;
      const changePct=enough&&baseline>0?round((latest/baseline-1)*100):null;
      const direction=changePct==null?'insufficient-evidence':changePct<=-3?'lower-estimate':changePct>=2?'higher-estimate':'similar-estimate';
      const reasons=[];
      if(!enough)reasons.push('At least four distinct competition-lift capacity-evidence dates spanning 14 days are needed to compare early and late observations.');
      else reasons.push('Compares median estimated capacity from the first two and last two eligible dates, not a measured max or confirmed training response.');
      if(counts.excludedSets)reasons.push(counts.excludedSets+' competition-lift set(s) were excluded from estimated-capacity comparison because RPE/reps do not meet the existing evidence rules.');
      if(direction==='lower-estimate')reasons.push('Recent estimated capacity is at least 3% below the early-window estimate. Review execution, planned effort and recovery context before changing training.');
      if(direction==='higher-estimate')reasons.push('Recent estimated capacity is at least 2% above the early-window estimate. This does not automatically justify adding sets or load.');
      if(direction==='similar-estimate')reasons.push('The observed estimate difference does not cross this review’s directional thresholds; it is not proof of a plateau.');
      lifts[lift]={exerciseId:main.exerciseId,name:main.name,direction,evidenceDays:days.length,firstDate:days[0]?.date||null,lastDate:days.at(-1)?.date||null,baselineEstimateKg:baseline==null?null:round(baseline),latestEstimateKg:latest==null?null:round(latest),changePct,counts,reasons};
    }
    const warnings=['Only the explicitly selected competition exercise is included; variation sets never establish competition-lift estimated capacity.','These are descriptive estimates from logged submaximal work, not causal program evaluations, medical fatigue measurements, or authorizations to change a training plan.'];
    if(view.legacyTimestampCount)warnings.push('Some workouts have no creation timestamp, so their historical knowledge date cannot be established.');
    return {version:1,asOf,from:start,through:asOf,lifts,warnings};
  }
  return {compare};
});
