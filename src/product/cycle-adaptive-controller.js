/* v2.38 — deterministic cycle-level adaptive controller with bounded set/load adjustments. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./cycle-review'),require('./cycle-response'));
 else root.LoadnoteCycleAdaptiveController=factory(root.LoadnoteCycleReview,root.LoadnoteCycleResponse);
})(typeof globalThis!=='undefined'?globalThis:this,function(CycleReview,CycleResponse){
 'use strict';
 const LIFTS=['squat','bench','deadlift'],POLICY='cycle-adaptive-v2';
 function finite(x){return Number.isFinite(Number(x))?Number(x):null;}
 function recommendFromReports(review,response){
  if(!review||!review.findings||!review.eligibility)throw Error('A completed-week cycle review is required');
  const phase=response?.phases?.find(p=>p.phase===review.phase)||null;
  const lifts={},choices={};
  for(const lift of LIFTS){
   const f=review.findings[lift]||{},trend=phase?.lifts?.[lift]||null;
   const change=finite(trend?.observedChangePct),above=Number(f.aboveCap||0),comparable=Number(f.comparableRpeSets||0);
   let action='keep',confidence='low',signal='insufficient-evidence',why='';
   if(review.eligibility[lift]&&f.canReduceLoad&&above>=2&&comparable>=3&&change!=null&&change<=-3){
    action='reduce-load';confidence='high';signal='effort-and-capacity-down';
    why='At least two directly comparable sets exceeded the original RPE caps, at least three comparable sets were logged, and the completed '+review.phase+' phase shows a lower estimated-capacity comparison ('+change+'%). The bounded policy therefore supports reviewing one program load increment lower on matching next-week sets. This does not prove fatigue or causation.';
   }else if(review.eligibility[lift]&&f.canReduceOne&&above>=2&&comparable>=2){
    action='reduce-one';confidence=change!=null?'high':'medium';signal='effort-above-plan';
    why='At least two directly comparable sets exceeded the original RPE caps in a resolved completed week, and the bounded review policy permits one fewer set per eligible next-week exposure.';
    if(change!=null&&change<=-3)why+=' The completed '+review.phase+' phase evidence also shows a lower estimated-capacity comparison ('+change+'%), but a one-increment load reduction is unavailable or lacks the stronger evidence threshold.';
    else if(change!=null&&change>=2)why+=' Estimated capacity is higher within the phase ('+change+'%), but that does not erase the current above-cap effort signal.';
   }else if(comparable>=2&&above===0){
    action='keep';confidence=change!=null?'high':'medium';signal='within-plan';
    why='Comparable logged sets stayed within their original RPE caps, so the controller has no supported reason to reduce next-week volume.';
   }else if(comparable>=2&&above===1){
    action='keep';confidence='medium';signal='watch';
    why='One comparable set exceeded its original RPE cap. The bounded cycle policy requires at least two before a one-set reduction can be offered.';
   }else{
    action='keep';confidence='low';signal='insufficient-evidence';
    why=f.reason||'There is not enough comparable, resolved prescribed-versus-performed evidence to support changing next week.';
   }
   if(!review.eligibility[lift]&&action!=='keep')action='keep';
   if(!review.eligibility[lift]&&['peak','taper','mock-meet','meet'].includes(review.nextPhase)){
    signal='phase-guard';confidence='high';
    why='The next phase is '+review.nextPhase+'. The current bounded controller does not alter peak, taper or event-week prescriptions.';
   }
   choices[lift]=action;
   lifts[lift]={lift,name:f.name||lift,action,confidence,signal,why,comparableRpeSets:comparable,aboveCapSets:above,observedChangePct:change,eligibleForReduction:!!review.eligibility[lift],eligibleForSetReduction:!!f.canReduceOne,eligibleForLoadReduction:!!f.canReduceLoad,incrementKg:finite(f.incrementKg)};
  }
  return {version:1,policy:POLICY,cycleId:review.cycleId,week:review.week,phase:review.phase,nextPhase:review.nextPhase,nextWeek:review.nextWeek,asOf:review.asOf,choices,lifts,
   summary:Object.values(lifts).some(x=>x.action==='reduce-load')?'A bounded one-increment next-week load reduction is supported for at least one lift.':Object.values(lifts).some(x=>x.action==='reduce-one')?'A bounded next-week set reduction is supported for at least one lift.':'Keep the original next-week plan; no supported bounded reduction is currently justified.',
   notes:['Recommendations are deterministic and use only evidence already exposed by the cycle review and response models.','A load reduction requires the stronger combination of above-cap effort plus a lower within-phase estimated-capacity comparison; otherwise the controller may only keep or offer the existing one-set reduction.','The controller never increases load, changes reps, changes exercise selection, changes frequency, changes event timing or edits training automatically.','Athlete approval through the existing weekly review is still required before any Calendar revision.','Estimated-capacity trends are descriptive training estimates, not measured recovery or a medical signal.']};
 }
 function analyze(state,opts={}){
  const review=CycleReview.analyze(state,opts);
  let response=null;
  try{response=CycleResponse.inspect(state,{cycleId:review.cycleId,asOf:review.asOf,now:opts.now||new Date().toISOString()});}catch(e){response=null;}
  return recommendFromReports(review,response);
 }
 return {POLICY,recommendFromReports,analyze};
});
