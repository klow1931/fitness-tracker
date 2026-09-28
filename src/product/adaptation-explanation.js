/* v2.50 — deterministic explanations for accepted programming changes. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteAdaptationExplanation=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const LIFTS=['squat','bench','deadlift'];
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const finite=x=>Number.isFinite(Number(x))?Number(x):null;
 function prescription(change,side){
  const row=change?.[side];
  return side==='before'?row?.context?.prescription:row?.context?.prescription;
 }
 function cycleSource(state,review,change){
  const cycle=(state?.meetCycles||[]).find(c=>c.id===review.cycleId);
  if(!cycle)return null;
  const prefix='meet:'+review.cycleId+':',key=String(change?.id||'').startsWith(prefix)?String(change.id).slice(prefix.length):null;
  return key?cycle.sessions?.find(s=>s.key===key)||null:null;
 }
 function idsForLift(state,review,change,lift,kind){
  if(kind==='phase'){
    return Object.entries(review.exerciseLifts||{}).filter(([,value])=>value===lift).map(([id])=>id);
  }
  const source=cycleSource(state,review,change);
  return (source?.exercises||[]).filter(e=>e.lift===lift).map(e=>e.exerciseId).filter(Boolean);
 }
 function changedExercise(before,after){
  if(!before||!after)return true;
  if(before.name!==after.name||before.trackBy!==after.trackBy||before.type!==after.type)return true;
  return JSON.stringify(before.sets||[])!==JSON.stringify(after.sets||[]);
 }
 function impactFor(state,review,lift,kind){
  const changes=[],loadDeltasKg=[];let beforeSets=0,afterSets=0,repsChanged=false;
  for(const change of review.changes||[]){
    const ids=idsForLift(state,review,change,lift,kind);
    if(!ids.length)continue;
    const before=prescription(change,'before')?.plannedExercises||[],after=prescription(change,'after')?.plannedExercises||[];
    let touched=false;
    for(const id of ids){
      const a=before.find(e=>e.exerciseId===id),b=after.find(e=>e.exerciseId===id);
      if(!a&&!b)continue;
      if(!changedExercise(a,b))continue;
      touched=true;beforeSets+=(a?.sets||[]).length;afterSets+=(b?.sets||[]).length;
      const n=Math.min((a?.sets||[]).length,(b?.sets||[]).length);
      for(let i=0;i<n;i++){
        const aw=finite(a.sets[i]?.weight),bw=finite(b.sets[i]?.weight);
        if(aw!=null&&bw!=null&&Math.abs(bw-aw)>.0001)loadDeltasKg.push(Math.round((bw-aw)*100)/100);
        if(Number(a.sets[i]?.reps)!==Number(b.sets[i]?.reps))repsChanged=true;
      }
    }
    if(touched)changes.push(change.id);
  }
  return {sessionIds:changes,sessionCount:changes.length,beforeSets,afterSets,setDelta:afterSets-beforeSets,loadDeltasKg,repsChanged};
 }
 function cycleWhy(review,lift,action){
  const f=review.report?.findings?.[lift]||{};
  if(action==='increase-load')return 'The reviewed competition-lift work met the bounded progression gate, and the athlete approved one program increment higher.';
  if(action==='reduce-load')return 'The reviewed week contained enough directly comparable above-cap effort to make a bounded one-increment load reduction available, and the athlete approved it.';
  if(action==='reduce-one')return 'The reviewed week contained enough directly comparable above-cap effort to make a one-set reduction available, and the athlete approved it.';
  return f.reason||'The athlete reviewed the available evidence and kept the scheduled plan unchanged.';
 }
 function cycleEvidence(review,lift,action){
  const f=review.report?.findings?.[lift]||{},rows=[];
  if(action==='increase-load'){
    rows.push((finite(f.competitionCompletedSets)||0)+'/'+(finite(f.competitionPlannedSets)||0)+' planned competition-lift sets completed');
    rows.push((finite(f.competitionComparableRpeSets)||0)+' directly comparable competition-lift RPE sets');
    rows.push((finite(f.competitionAboveCap)||0)+' comparable competition-lift sets above cap');
    rows.push((finite(f.competitionBelowCapHalf)||0)+' comparable competition-lift sets at least 0.5 RPE below cap');
    if(finite(f.trainingMaxKg)>0)rows.push('one-increment increase remained under the reviewed 85% training-max ceiling');
  }else if(action==='reduce-load'||action==='reduce-one'){
    rows.push((finite(f.comparableRpeSets)||0)+' directly comparable RPE sets');
    rows.push((finite(f.aboveCap)||0)+' comparable sets above the approved RPE cap');
  }else if(f.reason)rows.push(f.reason);
  return rows;
 }
 function phaseWhy(review,lift){
  return review.findings?.[lift]?.reason||'The athlete reviewed the completed phase evidence before accepting this choice.';
 }
 function phaseEvidence(review,lift){
  const f=review.findings?.[lift]||{},rows=[];
  if(Number.isInteger(f.completedSessions)&&Number.isInteger(f.expectedSessions))rows.push(f.completedSessions+'/'+f.expectedSessions+' linked sessions completed');
  if(Number.isInteger(f.comparedSets))rows.push(f.comparedSets+' matched prescribed-versus-performed sets');
  if(Number.isInteger(f.overCapSessions))rows.push(f.overCapSessions+' exposures above the approved effort cap');
  if(Number.isInteger(f.underCapSessions))rows.push(f.underCapSessions+' exposures meeting the effort margin');
  if(finite(f.averageRpe)!=null)rows.push('average logged RPE '+finite(f.averageRpe));
  return rows;
 }
 function explainReview(state,review){
  if(!review||!review.choices)return null;
  const kind=review.programId?'phase':review.cycleId?'cycle':null;if(!kind)return null;
  const lifts=LIFTS.map(lift=>{
    const action=review.choices[lift]||'keep',impact=impactFor(state,review,lift,kind),finding=(kind==='phase'?review.findings?.[lift]:review.report?.findings?.[lift])||{};
    return {lift,name:finding.name||lift,action,changed:action!=='keep'&&impact.sessionCount>0,impact,
      why:kind==='phase'?phaseWhy(review,lift):cycleWhy(review,lift,action),
      evidence:kind==='phase'?phaseEvidence(review,lift):cycleEvidence(review,lift,action)};
  });
  return {version:1,kind,reviewId:review.id,createdAt:review.createdAt,phase:review.phase||null,week:review.week||null,
    sourceLabel:kind==='phase'?(String(review.phase||'phase')+' phase review'):('week '+review.week+' review'),
    lifts,changedLifts:lifts.filter(x=>x.changed),
    notice:'This explains an athlete-approved schedule revision from recorded training evidence. It does not claim causation, recovery status, or a physiological diagnosis.'};
 }
 function accepted(state){
  const out=[];
  for(const r of state?.phaseReviews||[])out.push({review:r,explanation:explainReview(state,r)});
  for(const cycle of state?.meetCycles||[])for(const r of cycle.weeklyReviews||[])out.push({review:r,explanation:explainReview(state,r)});
  return out.filter(x=>x.explanation).sort((a,b)=>String(a.review.createdAt).localeCompare(String(b.review.createdAt)));
 }
 function forSession(state,scheduleId){
  if(!scheduleId)return null;
  const rows=accepted(state).filter(x=>(x.review.changes||[]).some(c=>c.id===scheduleId));
  const row=rows.at(-1);if(!row)return null;
  const lifts=row.explanation.lifts.filter(l=>l.impact.sessionIds.includes(scheduleId)&&l.changed);
  return lifts.length?{...copy(row.explanation),lifts,changedLifts:lifts,scheduleId}:null;
 }
 return {LIFTS,explainReview,accepted,forSession};
});
