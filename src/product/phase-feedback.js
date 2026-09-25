/* v2.25: explainable feedback from an accepted phase review to the existing next-phase review. Read-only. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./phase-builder'),require('./schedule'));
  else root.LoadnotePhaseFeedback=factory(root.LoadnotePhaseBuilder,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Builder,Schedule){
  'use strict';
  const LIFTS=Builder.LIFTS;
  const slug=x=>String(x||'');
  function assess(outcomes,{programId,phase,asOf,currentReview=null}={}){
    if(!outcomes||outcomes.version!==1||!Schedule.date(asOf)||asOf!==outcomes.asOf)throw Error('Generate a fresh, dated outcome comparison first');
    if(typeof programId!=='string'||!programId||!Builder.TYPES.includes(phase))throw Error('Choose the next phase and program to review');
    if(currentReview&&(currentReview.programId!==programId||currentReview.phase!==phase||currentReview.asOf!==asOf))throw Error('The next-phase review does not match the feedback date and program');
    const prior=outcomes.reviews.find(r=>r.programId===programId&&r.nextPhase===phase&&r.acceptedAt<=outcomes.cutoff);
    const findings={};
    for(const lift of LIFTS){
      const f=prior?.findings[lift],next=currentReview?.findings?.[lift]||null,notes=[];
      let status='no-prior-review';
      if(!prior){
        notes.push('No accepted prior-phase decision leads into this phase. Use the normal phase review and its current evidence.');
      }else if(prior.through&&asOf<prior.through){
        status='await-completion';
        notes.push('This follow-up phase has not reached its final scheduled day. Do not interpret incomplete exposure coverage as a training response.');
      }else if(!f||f.status!=='observed-follow-up'){
        status='gather-comparable-evidence';
        notes.push('Not enough comparable approved next-phase sessions and dated competition-lift estimates to evaluate the previous choice. Missing or altered work cannot establish a favorable or unfavorable response.');
      }else if(f.aboveCap>0){
        status='review-effort';
        notes.push(f.aboveCap+' of '+f.matched+' matched sessions exceeded at least one approved RPE cap; examine individual sessions and the current phase review before considering progression.');
      }else if(f.observedChangePct!=null&&f.observedChangePct<=-3){
        status='review-performance';
        notes.push('The observed competition-lift estimated-capacity comparison was at least 3% lower. Check training conditions and current phase evidence; a prior adjustment cannot be identified as the cause.');
      }else{
        status='review-current-phase';
        notes.push('Comparable next-phase work was logged within its RPE caps. Review this phase with the existing progression rules; the observation does not authorize extra load or sets.');
      }
      if(f){
        notes.unshift('Previous athlete-approved choice: '+slug(f.choice)+'. Original reason: '+slug(f.why));
        notes.push('Observed follow-up: '+f.completed+'/'+f.expected+' linked workouts, '+f.matched+'/'+f.expected+' exactly comparable, '+f.withinCap+' within RPE caps.');
        if(f.observedChangePct!=null)notes.push('Competition-lift estimated-capacity difference: '+f.observedChangePct+'%. This is descriptive and does not establish causation.');
      }
      if(next){
        notes.push('The existing '+slug(next.policy||currentReview.policy)+' phase-review rule independently reports '+slug(next.decision)+': '+slug(next.reason));
        notes.push('Only the current phase-review preview and explicit athlete approval can change future Calendar prescriptions.');
      }
      findings[lift]={name:next?.name||f?.name||lift,exerciseId:next?.exerciseId||f?.exerciseId||null,previousChoice:f?.choice||null,status,previousReviewId:prior?.reviewId||null,followupMatched:f?.matched??null,followupExpected:f?.expected??null,followupChangePct:f?.observedChangePct??null,currentRule:next?.decision||null,notes};
    }
    return {version:1,asOf,programId,phase,previousReviewId:prior?.reviewId||null,findings,notice:'The feedback loop explains prior decisions and subsequent observations. It is not a causal estimator or a second programming engine; existing phase-review eligibility and athlete approval remain mandatory.'};
  }
  return {assess};
});
