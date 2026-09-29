/* Loadnote v2.65 — explicit phase-specific policy for meet-cycle reviews. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LoadnoteCyclePhasePolicy=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const POLICY='cycle-phase-policy-v1';
  const ACTIONS=['keep','reduce-one','reduce-load','increase-load'];
  const TRAINING_PHASES=['accumulation','strength','peaking','taper'];
  const EVENTS=['mock-meet','meet'];

  function policy(phase,nextPhase){
    const base={
      version:1,id:POLICY,phase,nextPhase,
      label:'Preserve the reviewed plan',
      objective:'Keep the reviewed prescription unless phase-appropriate evidence supports a bounded change.',
      allowedActions:['keep'],
      reductionEvidence:'all-matching',
      thresholds:{
        setReductionComparable:2,setReductionAboveCap:2,
        loadReductionComparable:2,loadReductionAboveCap:2,
        increaseCompetitionComparable:4,increaseCompetitionBelowCapHalf:2,increaseCapacityPct:1,
        controllerLoadReductionComparable:3,controllerLoadReductionCapacityPct:-3
      },
      transition:phase!==nextPhase,
      historyScope:'none',
      notes:[]
    };

    if(EVENTS.includes(nextPhase)){
      return {...base,label:'Protect event week',objective:'Do not rewrite event week from training estimates. Record actual results separately.',notes:['Event week has no adaptive training prescription.']};
    }
    if(phase==='taper'||nextPhase==='taper'){
      return {...base,label:'Protect the reviewed taper',objective:'Preserve the intentionally reduced taper prescription; do not add load, volume or a new adaptive dose.',notes:['Taper evidence is intentionally sparse and is not used to escalate or replace the reviewed taper.']};
    }
    if(phase==='peaking'&&nextPhase==='peaking'){
      return {...base,label:'Peak: preserve specificity',objective:'Keep competition-specific exposure intact; only a one-increment downward load correction can be reviewed when the directly comparable peak work itself exceeds plan.',allowedActions:['keep','reduce-load'],reductionEvidence:'competition-only',historyScope:'none',notes:['No load increase or set-count change is offered during peaking.','Peak load reduction can be reviewed from repeated competition-lift RPE-cap exceedance without requiring a multi-week capacity trend.']};
    }
    if(phase==='strength'&&nextPhase==='peaking'){
      return {...base,label:'Strength → peak: protect the transition',objective:'Do not add stress beyond the reviewed peak. A downward load correction may be reviewed only from competition-lift evidence.',allowedActions:['keep','reduce-load'],reductionEvidence:'competition-only',historyScope:'general',notes:['The reviewed peak already changes specificity and workload, so extra upward progression and set edits are withheld at this transition.']};
    }
    if(phase==='strength'&&nextPhase==='strength'){
      return {...base,label:'Strength: protect specific loading',objective:'Use competition-lift execution and within-phase response to make small load decisions while preserving the reviewed structure.',allowedActions:[...ACTIONS],historyScope:'general',notes:['Strength-phase upward progression requires complete competition-lift work, clearly below-cap execution and an improving within-phase capacity comparison.']};
    }
    if(phase==='accumulation'&&nextPhase==='strength'){
      return {...base,label:'Accumulation → strength: preserve the planned jump',objective:'Carry the reviewed phase transition forward unless current effort supports a bounded downward correction; do not stack an extra increase onto the planned strength transition.',allowedActions:['keep','reduce-one','reduce-load'],historyScope:'general',notes:['Upward load progression is withheld because the next phase already contains a planned intensity transition.']};
    }
    if(phase==='accumulation'&&nextPhase==='accumulation'){
      return {...base,label:'Accumulation: protect repeatable volume',objective:'Favor repeatable workload and avoid escalating from easy sessions alone.',allowedActions:[...ACTIONS],historyScope:'general',thresholds:{...base.thresholds,increaseCompetitionComparable:6,increaseCompetitionBelowCapHalf:3,increaseCapacityPct:2},notes:['Accumulation-phase upward progression uses a higher evidence bar than strength: at least six comparable competition-lift sets, at least three clearly below cap, and a +2% within-phase capacity comparison.','Above-cap effort can support a one-set reduction before volume is allowed to drift upward.']};
    }
    return {...base,notes:['No phase-specific adaptive rule is defined for this transition, so the reviewed plan is preserved.']};
  }

  function resolve(input){
    const phase=input?.phase,nextPhase=input?.nextPhase;
    if(!TRAINING_PHASES.includes(phase)||![...TRAINING_PHASES,...EVENTS].includes(nextPhase))return policy(phase,nextPhase);
    return policy(phase,nextPhase);
  }
  function allows(p,action){return !!p&&ACTIONS.includes(action)&&p.allowedActions.includes(action);}
  return {POLICY,ACTIONS,TRAINING_PHASES,EVENTS,resolve,allows};
});