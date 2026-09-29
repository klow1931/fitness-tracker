/* v2.65 — deterministic phase-specific cycle controller with learned-history guardrails. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./cycle-review'),require('./cycle-response'),require('./adaptive-history-guardrail'),require('./cycle-phase-policy'));
 else root.LoadnoteCycleAdaptiveController=factory(root.LoadnoteCycleReview,root.LoadnoteCycleResponse,root.LoadnoteAdaptiveHistoryGuardrail,root.LoadnoteCyclePhasePolicy);
})(typeof globalThis!=='undefined'?globalThis:this,function(CycleReview,CycleResponse,HistoryGuardrail,PhasePolicy){
 'use strict';
 const LIFTS=['squat','bench','deadlift'],POLICY='cycle-adaptive-v5';
 function finite(x){if(x===null||x===undefined||x==='')return null;return Number.isFinite(Number(x))?Number(x):null;}
 function recommendFromReports(review,response,learningSummary=null){
  if(!review||!review.findings||!review.eligibility)throw Error('A completed-week cycle review is required');
  const phase=response?.phases?.find(p=>p.phase===review.phase)||null;
  const phasePolicy=PhasePolicy.resolve({phase:review.phase,nextPhase:review.nextPhase});if(review.phasePolicy&&JSON.stringify(review.phasePolicy)!==JSON.stringify(phasePolicy))throw Error('Cycle review phase policy no longer matches the deterministic policy');
  const t=phasePolicy.thresholds||{},lifts={},choices={};
  for(const lift of LIFTS){
   const f=review.findings[lift]||{},trend=phase?.lifts?.[lift]||null;
   const change=finite(trend?.observedChangePct),above=Number(f.aboveCap||0),comparable=Number(f.comparableRpeSets||0),competitionComparable=Number(f.competitionComparableRpeSets||0),competitionAbove=Number(f.competitionAboveCap||0),competitionBelow=Number(f.competitionBelowCapHalf||0),reductionComparable=Number(f.reductionComparableRpeSets??(phasePolicy.reductionEvidence==='competition-only'?competitionComparable:comparable)),reductionAbove=Number(f.reductionAboveCap??(phasePolicy.reductionEvidence==='competition-only'?competitionAbove:above));
   let action='keep',confidence='low',signal='insufficient-evidence',why='';

   if(phasePolicy.allowedActions.length===1&&phasePolicy.allowedActions[0]==='keep'){
    action='keep';confidence='high';signal='phase-guard';
    why=phasePolicy.objective+' The reviewed '+review.nextPhase+' prescription remains unchanged by this adaptive controller.';
   }else if(review.phase==='peaking'&&review.nextPhase==='peaking'){
    if(PhasePolicy.allows(phasePolicy,'reduce-load')&&f.canReduceLoad&&reductionAbove>=Number(t.loadReductionAboveCap||2)&&reductionComparable>=Number(t.loadReductionComparable||2)){
      action='reduce-load';confidence=change!=null&&change<=-3?'high':'medium';signal='peak-effort-above-plan';
      why='Directly comparable competition-lift peak work exceeded its approved RPE cap on at least two sets. Peaking preserves set count and never adds load here, so the bounded phase policy supports reviewing one program increment lower next week. A multi-week capacity decline is not required because peak phases can be too short to produce that comparison.';
    }else{
      action='keep';confidence=reductionComparable>=2?'medium':'low';signal=reductionComparable>=2?'peak-within-plan':'insufficient-evidence';
      why=reductionComparable>=2?'The directly comparable peak work does not meet the phase-specific downward-load threshold. Preserve the reviewed competition-specific exposure.':f.reason||'There is not enough directly comparable peak evidence to support changing next week.';
    }
   }else if(review.phase==='strength'&&review.nextPhase==='peaking'){
    if(PhasePolicy.allows(phasePolicy,'reduce-load')&&f.canReduceLoad&&competitionAbove>=Number(t.loadReductionAboveCap||2)&&competitionComparable>=Number(t.loadReductionComparable||2)&&change!=null&&change<=Number(t.controllerLoadReductionCapacityPct??-3)){
      action='reduce-load';confidence='high';signal='strength-to-peak-caution';
      why='The completed strength work has repeated competition-lift RPE-cap exceedance plus a lower within-phase estimated-capacity comparison ('+change+'%). The phase policy protects the planned peak from extra stress and supports reviewing one program increment lower on the first peak exposure.';
    }else{
      action='keep';confidence=competitionComparable>=2?'medium':'low';signal='transition-guard';
      why='The reviewed peak already changes specificity and workload. Extra upward progression and set edits are withheld at this transition'+(f.canReduceLoad?' unless competition-lift effort and the completed strength-phase capacity comparison both support the bounded downward correction.':'.');
    }
   }else if(PhasePolicy.allows(phasePolicy,'reduce-load')&&review.eligibility[lift]&&f.canReduceLoad&&reductionAbove>=Number(t.loadReductionAboveCap||2)&&reductionComparable>=Number(t.controllerLoadReductionComparable||3)&&change!=null&&change<=Number(t.controllerLoadReductionCapacityPct??-3)){
    action='reduce-load';confidence='high';signal='effort-and-capacity-down';
    why='At least '+Number(t.loadReductionAboveCap||2)+' directly comparable '+(phasePolicy.reductionEvidence==='competition-only'?'competition-lift ':'')+'sets exceeded the original RPE caps, sufficient comparable work was logged, and the completed '+review.phase+' phase shows a lower estimated-capacity comparison ('+change+'%). The '+phasePolicy.label+' policy therefore supports reviewing one program load increment lower next week. This does not prove fatigue or causation.';
   }else if(PhasePolicy.allows(phasePolicy,'increase-load')&&review.eligibility[lift]&&f.canIncreaseLoad&&competitionAbove===0&&competitionComparable>=Number(t.increaseCompetitionComparable||4)&&competitionBelow>=Number(t.increaseCompetitionBelowCapHalf||2)&&change!=null&&change>=Number(t.increaseCapacityPct||1)){
    action='increase-load';confidence='high';signal='completed-below-cap-and-improving';
    why='All planned competition-lift work was completed, at least '+Number(t.increaseCompetitionComparable||4)+' sets were directly comparable, none exceeded the approved RPE cap, at least '+Number(t.increaseCompetitionBelowCapHalf||2)+' finished 0.5 RPE or more below it, and the completed '+review.phase+' phase shows an improving estimated-capacity comparison ('+change+'%). The '+phasePolicy.label+' policy supports reviewing one program load increment higher on the matching next-week competition exercise.';
   }else if(PhasePolicy.allows(phasePolicy,'reduce-one')&&review.eligibility[lift]&&f.canReduceOne&&reductionAbove>=Number(t.setReductionAboveCap||2)&&reductionComparable>=Number(t.setReductionComparable||2)){
    action='reduce-one';confidence=change!=null?'high':'medium';signal='effort-above-plan';
    why='At least '+Number(t.setReductionAboveCap||2)+' directly comparable '+(phasePolicy.reductionEvidence==='competition-only'?'competition-lift ':'')+'sets exceeded the original RPE caps in a resolved completed week, and '+phasePolicy.label+' permits one fewer set per eligible next-week exposure.';
    if(change!=null&&change<=-3)why+=' The completed '+review.phase+' evidence also shows a lower estimated-capacity comparison ('+change+'%), but a one-increment load reduction is unavailable or lacks the stronger evidence threshold.';
    else if(change!=null&&change>=2)why+=' Estimated capacity is higher within the phase ('+change+'%), but that does not erase the current above-cap effort signal.';
   }else if(reductionComparable>=Number(t.setReductionComparable||2)&&reductionAbove===0){
    action='keep';confidence=change!=null?'high':'medium';signal='within-plan';
    why='Comparable logged sets stayed within their original RPE caps. '+phasePolicy.objective+' Upward progression still requires the phase-specific completion, effort and capacity thresholds.';
   }else if(reductionComparable>=2&&reductionAbove===1){
    action='keep';confidence='medium';signal='watch';
    why='One comparable set exceeded its original RPE cap. The '+phasePolicy.label+' policy requires repeated above-cap evidence before a bounded downward adjustment can be offered.';
   }else{
    action='keep';confidence='low';signal='insufficient-evidence';
    why=f.reason||'There is not enough comparable, resolved prescribed-versus-performed evidence to support changing next week.';
   }

   if(!review.eligibility[lift]&&action!=='keep')action='keep';
   let guarded;
   if(phasePolicy.historyScope==='general'&&HistoryGuardrail?.apply)guarded=HistoryGuardrail.apply({lift,action,confidence,signal,why},learningSummary);
   else guarded={action,confidence,signal,why,history:{state:'not-applicable',pattern:null,changed:false,reason:'Learned action history is not used to steer this phase-specific policy.'}};
   action=guarded.action;confidence=guarded.confidence;signal=guarded.signal;why=guarded.why;
   choices[lift]=action;
   lifts[lift]={lift,name:f.name||lift,action,confidence,signal,why,history:guarded.history,phasePolicy:phasePolicy.label,comparableRpeSets:comparable,aboveCapSets:above,reductionComparableRpeSets:reductionComparable,reductionAboveCapSets:reductionAbove,observedChangePct:change,eligibleForAdjustment:!!review.eligibility[lift],eligibleForSetReduction:!!f.canReduceOne,eligibleForLoadReduction:!!f.canReduceLoad,eligibleForLoadIncrease:!!f.canIncreaseLoad,belowCapHalfSets:Number(f.belowCapHalf||0),competitionComparableRpeSets:competitionComparable,competitionAboveCapSets:competitionAbove,competitionBelowCapHalfSets:competitionBelow,incrementKg:finite(f.incrementKg)};
  }
  const values=Object.values(lifts);
  return {version:3,policy:POLICY,cycleId:review.cycleId,week:review.week,phase:review.phase,nextPhase:review.nextPhase,nextWeek:review.nextWeek,asOf:review.asOf,phasePolicy,choices,lifts,
   summary:values.some(x=>x.action==='increase-load')?'A phase-specific one-increment next-week load increase is supported for at least one competition lift.':values.some(x=>x.action==='reduce-load')?'A phase-specific one-increment next-week load reduction is supported for at least one lift.':values.some(x=>x.action==='reduce-one')?'A phase-specific next-week set reduction is supported for at least one lift.':'Keep the reviewed next-week plan under the current '+phasePolicy.label.toLowerCase()+' policy.',
   notes:['Recommendations are deterministic and first require the live evidence already exposed by the cycle review and response models.','Current phase policy: '+phasePolicy.label+'. '+phasePolicy.objective,...phasePolicy.notes,'Accumulation uses a higher upward-progression evidence bar than strength and never increases load merely because work felt easy.','Strength can use the existing guarded one-increment upward progression when competition work is complete, clearly below cap and improving.','Peaking never adds load or volume; only repeated directly comparable competition-lift above-cap effort can support a one-increment downward load review within the peak.','Taper and event-week prescriptions are protected from adaptive escalation or replacement.','Learned outcome history can support confidence, add caution, or suppress optional upward progression only where the phase policy allows general history. It cannot create an action, bypass eligibility, or block a current safety-oriented reduction.','Athlete approval through the existing weekly review is still required before any Calendar revision.','Estimated-capacity trends are descriptive training estimates, not measured recovery or a medical signal.']};
 }
 function analyze(state,opts={}){
  const review=CycleReview.analyze(state,opts);
  let response=null;
  try{response=CycleResponse.inspect(state,{cycleId:review.cycleId,asOf:review.asOf,now:opts.now||new Date().toISOString()});}catch(e){response=null;}
  return recommendFromReports(review,response,opts.learningSummary||null);
 }
 return {POLICY,recommendFromReports,analyze};
});
