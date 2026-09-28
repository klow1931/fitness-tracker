/* v2.39 — deterministic cycle controller with guarded downward and upward load adjustments. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./cycle-review'),require('./cycle-response'),require('./adaptive-outcome-learning'),require('./adaptive-history-guardrail'));
 else root.LoadnoteCycleAdaptiveController=factory(root.LoadnoteCycleReview,root.LoadnoteCycleResponse,root.LoadnoteAdaptiveOutcomeLearning,root.LoadnoteAdaptiveHistoryGuardrail);
})(typeof globalThis!=='undefined'?globalThis:this,function(CycleReview,CycleResponse,OutcomeLearning,HistoryGuardrail){
 'use strict';
 const LIFTS=['squat','bench','deadlift'],POLICY='cycle-adaptive-v3';
 function finite(x){return Number.isFinite(Number(x))?Number(x):null;}
 function recommendFromReports(review,response,learningSummary=null){
  if(!review||!review.findings||!review.eligibility)throw Error('A completed-week cycle review is required');
  const phase=response?.phases?.find(p=>p.phase===review.phase)||null;
  const lifts={},choices={};
  for(const lift of LIFTS){
   const f=review.findings[lift]||{},trend=phase?.lifts?.[lift]||null;
   const change=finite(trend?.observedChangePct),above=Number(f.aboveCap||0),comparable=Number(f.comparableRpeSets||0),competitionComparable=Number(f.competitionComparableRpeSets||0),competitionAbove=Number(f.competitionAboveCap||0),competitionBelow=Number(f.competitionBelowCapHalf||0);
   let action='keep',confidence='low',signal='insufficient-evidence',why='';
   if(review.eligibility[lift]&&f.canReduceLoad&&above>=2&&comparable>=3&&change!=null&&change<=-3){
    action='reduce-load';confidence='high';signal='effort-and-capacity-down';
    why='At least two directly comparable sets exceeded the original RPE caps, at least three comparable sets were logged, and the completed '+review.phase+' phase shows a lower estimated-capacity comparison ('+change+'%). The bounded policy therefore supports reviewing one program load increment lower on matching next-week sets. This does not prove fatigue or causation.';
   }else if(review.eligibility[lift]&&f.canIncreaseLoad&&competitionAbove===0&&competitionComparable>=4&&competitionBelow>=2&&change!=null&&change>=1){
    action='increase-load';confidence='high';signal='completed-below-cap-and-improving';
    why='All planned competition-lift work was completed, at least four sets were directly comparable, none exceeded the approved RPE cap, at least two finished 0.5 RPE or more below it, and the completed '+review.phase+' phase shows an improving estimated-capacity comparison ('+change+'%). The bounded policy therefore supports reviewing one program load increment higher on the matching next-week competition exercise.';
   }else if(review.eligibility[lift]&&f.canReduceOne&&above>=2&&comparable>=2){
    action='reduce-one';confidence=change!=null?'high':'medium';signal='effort-above-plan';
    why='At least two directly comparable sets exceeded the original RPE caps in a resolved completed week, and the bounded review policy permits one fewer set per eligible next-week exposure.';
    if(change!=null&&change<=-3)why+=' The completed '+review.phase+' phase evidence also shows a lower estimated-capacity comparison ('+change+'%), but a one-increment load reduction is unavailable or lacks the stronger evidence threshold.';
    else if(change!=null&&change>=2)why+=' Estimated capacity is higher within the phase ('+change+'%), but that does not erase the current above-cap effort signal.';
   }else if(comparable>=2&&above===0){
    action='keep';confidence=change!=null?'high':'medium';signal='within-plan';
    why='Comparable logged sets stayed within their original RPE caps. Upward progression still requires complete current-week work, clearly below-cap effort, and an improving within-phase capacity comparison.';
   }else if(comparable>=2&&above===1){
    action='keep';confidence='medium';signal='watch';
    why='One comparable set exceeded its original RPE cap. The bounded cycle policy requires at least two before a one-set reduction can be offered.';
   }else{
    action='keep';confidence='low';signal='insufficient-evidence';
    why=f.reason||'There is not enough comparable, resolved prescribed-versus-performed evidence to support changing next week.';
   }
   if(!review.eligibility[lift]&&action!=='keep')action='keep';
   if(!review.eligibility[lift]&&['peak','peaking','taper','mock-meet','meet'].includes(review.nextPhase)){
    signal='phase-guard';confidence='high';
    why='The next phase is '+review.nextPhase+'. The current bounded controller does not alter peak, taper or event-week prescriptions.';
   }
   const guarded=HistoryGuardrail?.apply?HistoryGuardrail.apply({lift,action,confidence,signal,why},learningSummary):{action,confidence,signal,why,history:{state:'unavailable',pattern:null,changed:false,reason:'Learned-history guardrail unavailable.'}};
   action=guarded.action;confidence=guarded.confidence;signal=guarded.signal;why=guarded.why;
   choices[lift]=action;
   lifts[lift]={lift,name:f.name||lift,action,confidence,signal,why,history:guarded.history,comparableRpeSets:comparable,aboveCapSets:above,observedChangePct:change,eligibleForAdjustment:!!review.eligibility[lift],eligibleForSetReduction:!!f.canReduceOne,eligibleForLoadReduction:!!f.canReduceLoad,eligibleForLoadIncrease:!!f.canIncreaseLoad,belowCapHalfSets:Number(f.belowCapHalf||0),competitionComparableRpeSets:competitionComparable,competitionAboveCapSets:competitionAbove,competitionBelowCapHalfSets:competitionBelow,incrementKg:finite(f.incrementKg)};
  }
  return {version:2,policy:POLICY,cycleId:review.cycleId,week:review.week,phase:review.phase,nextPhase:review.nextPhase,nextWeek:review.nextWeek,asOf:review.asOf,choices,lifts,
   summary:Object.values(lifts).some(x=>x.action==='increase-load')?'A guarded one-increment next-week load increase is supported for at least one competition lift.':Object.values(lifts).some(x=>x.action==='reduce-load')?'A bounded one-increment next-week load reduction is supported for at least one lift.':Object.values(lifts).some(x=>x.action==='reduce-one')?'A bounded next-week set reduction is supported for at least one lift.':'Keep the original next-week plan; no supported bounded adjustment is currently justified.',
   notes:['Recommendations are deterministic and first require the live evidence already exposed by the cycle review and response models.','Learned outcome history can support confidence, add caution, or suppress optional upward progression after repeated poor same-lift/same-action follow-up. It cannot create an action, bypass eligibility, or block a current safety-oriented reduction.','A load reduction requires above-cap effort plus a lower within-phase estimated-capacity comparison.','A load increase has a higher bar: complete competition-lift work, at least four comparable sets, zero above-cap sets, at least two sets 0.5 RPE below cap, and an improving within-phase estimated-capacity comparison of at least +1%.','Upward changes affect only the confirmed competition exercise, use one reviewed program increment, and stay under the existing 85% training-max ceiling.','The controller never changes reps, set count during a load change, exercise selection, frequency, event timing or completed training automatically.','Athlete approval through the existing weekly review is still required before any Calendar revision.','Estimated-capacity trends are descriptive training estimates, not measured recovery or a medical signal.']};
 }
 function analyze(state,opts={}){
  const review=CycleReview.analyze(state,opts);
  let response=null;
  try{response=CycleResponse.inspect(state,{cycleId:review.cycleId,asOf:review.asOf,now:opts.now||new Date().toISOString()});}catch(e){response=null;}
  let learningSummary=null;try{learningSummary=OutcomeLearning?.analyze(state,{asOf:review.asOf,now:opts.now||new Date().toISOString()})?.summary||null;}catch(e){learningSummary=null;}
  return recommendFromReports(review,response,learningSummary);
 }
 return {POLICY,recommendFromReports,analyze};
});
