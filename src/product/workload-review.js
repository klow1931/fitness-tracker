/* v2.22: explainable, independent lift workload review before a NEW phase proposal. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./phase-builder'),require('./lift-workload'));
  else root.LoadnoteWorkloadReview=factory(root.LoadnotePhaseBuilder,root.LoadnoteLiftWorkload);
})(typeof globalThis!=='undefined'?globalThis:this,function(Phase,Workload){
  'use strict';
  const LIFTS=Phase.LIFTS,copy=x=>JSON.parse(JSON.stringify(x));
  function assess(report,raw){
    const c=Phase.config(raw);
    if(!report||report.version!==1||!report.lifts)throw Error('Generate a fresh workload comparison first');
    const findings={};
    for(const lift of LIFTS){
      const row=report.lifts[lift],settings=c.lifts[lift];
      if(!row||row.exerciseId!==settings.exerciseId||row.variationExerciseId!==(settings.variation?.exerciseId||null)||row.firstWeekPlan.totalSets!==settings.sets*settings.exposures.length)throw Error('Workload evidence no longer matches this proposal; regenerate before reviewing');
      const observed=row.observedWeeks,dated=observed.filter(w=>w.validSets>0),completeWeeks=dated.length===4&&observed.every(w=>w.sessions>0),rpeOK=row.rpeCoverage!==null&&row.rpeCoverage>=.75;
      const planned=row.firstWeekPlan.totalSets,average=row.weeklyAverage.sets,above=average>0&&planned>average*1.25,minimum=settings.sets>2;
      const reasons=[];
      if(!completeWeeks)reasons.push('Not all four recent weeks contain matching dated work; missing logs do not establish low workload tolerance.');
      if(!rpeOK)reasons.push('RPE is missing on more than one quarter of valid matching sets; effort evidence is incomplete.');
      if(!above)reasons.push('The proposed first-week sets are not more than 25% above the four-week logged weekly average.');
      if(!minimum)reasons.push('The phase builder requires at least two sets per lift exposure.');
      const reductionAvailable=completeWeeks&&rpeOK&&above&&minimum;
      const action=reductionAvailable?'review-reduction':'keep-or-gather';
      findings[lift]={
        exerciseId:settings.exerciseId,name:settings.name,action,reductionAvailable,plannedWeeklySets:planned,observedWeeklyAverage:average,
        existingSetsPerExposure:settings.sets,optionalSetsPerExposure:reductionAvailable?settings.sets-1:null,
        optionalFirstWeekSets:reductionAvailable?planned-settings.exposures.length:null,
        reasons:reductionAvailable?[`First-week ${planned} sets exceed the logged ${average} weekly average by over 25% across four observed weeks. Review whether a smaller starting dose fits the athlete's constraints; this is not a proven safe limit.`]:reasons
      };
    }
    return {version:1,asOf:report.asOf,findings,disclaimer:'No automatic volume increases, fatigue diagnoses, or changes to stored workouts, approved phase plans or Calendar. Reducing one set changes every non-deload exposure of that lift in a NEW proposal and must be regenerated and reviewed.'};
  }
  function apply(review,raw,choices){
    const c=Phase.config(raw),next=copy(c),changes={};
    if(!review?.findings||!choices||typeof choices!=='object'||Array.isArray(choices)||Object.keys(choices).some(k=>!LIFTS.includes(k)))throw Error('Choose an independent action for each lift');
    for(const lift of LIFTS){
      const finding=review.findings[lift],choice=choices[lift];
      if(!finding||finding.exerciseId!==c.lifts[lift].exerciseId||finding.existingSetsPerExposure!==c.lifts[lift].sets)throw Error('Programming context changed; review again');
      if(!['keep','reduce-one'].includes(choice))throw Error('Explicitly choose keep or reduce one set per lift');
      if(choice==='reduce-one'){
        if(!finding.reductionAvailable||finding.optionalSetsPerExposure!==c.lifts[lift].sets-1)throw Error('This lift has no supported optional reduction in the current review');
        next.lifts[lift].sets-=1;
        changes[lift]={from:c.lifts[lift].sets,to:next.lifts[lift].sets,reason:finding.reasons[0]};
      }
    }
    const built=Phase.build(next);
    return {config:built.config,changes,affectedWeeks:built.weekly.length,disclaimer:'Changes are only a newly generated draft. Review every week and separately confirm before saving; no stored program or workout is edited.'};
  }
  return {assess,apply};
});
