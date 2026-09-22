/* v2.7: explicit next steps and observational weekly review; never applies a decision. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./training-blocks'),require('./decision-readiness'),require('./decision-performance'),require('./session-intent'));
 else root.LoadnoteDecisionUseReview=factory(root.LoadnoteBlocks,root.LoadnoteReadiness,root.LoadnoteDecisionPerformance,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Blocks,Readiness,Performance,Intent){
 'use strict';
 function steps(readiness,decision,block){
  const result=[],add=(id,title,detail,target)=>result.push({id,title,detail,target}),m=readiness?.metrics;
  if(!m)return [{id:'unavailable',title:'Review evidence',detail:'Evidence diagnostics are unavailable.',target:'evidence'}];
  const primary=(readiness.relatedExercises||[]).filter(e=>e.role==='competition');
  if(primary.length!==1)add('mapping','Confirm the competition lift','Save exactly one competition exercise for this lift. Keep variations separately mapped.','mapping');
  if(!block)add('block','Add training context','Create a block covering the training dates and confirm its purpose.','block');
  else if(block.dataCompleteness!=='complete')add('coverage','Review history coverage','Finish missing entries, then mark the block complete only if all sessions are present. Gaps are not missed workouts.','block');
  if(decision.blockContext?.conflicts?.length)add('context','Resolve block fields',decision.blockContext.conflicts.join(' '),'block');
  if(m.capacityDays<3)add('capacity','Collect usable performance evidence',`${m.capacityDays} / 3 capacity-evidence days recorded. Log actual load, reps and RPE during planned training; do not raise effort just to unlock a decision. Submaximal singles remain observations.`,'history');
  if(m.sets&&m.rpeCoverage<0.5)add('rpe','Record actual effort','Add RPE when known. Leave uncertain historical values blank rather than guessing.','history');
  if(!m.prescription?.prescribedSessions||m.prescription.prescriptionCoverage<50)add('plan','Capture upcoming planned work','Use the logger’s plan capture before performing upcoming sessions. Completed workouts are not substitutes for missing plans.','train');
  if(m.prescription?.unexplainedModifiedSessions)add('deviation','Explain changed sessions','Review the saved session intent and add the reason if you know why training changed.','history');
  if(!decision.decisionAllowed&&!result.length)add('remaining','Review the remaining limitation',decision.watchNext||decision.reason,'evidence');
  return result;
 }
 const sets=(w,id,planned)=>{
  const rows=(planned?w?.sessionIntent?.prescription?.plannedExercises:w?.exercises)||[];
  return rows.filter(e=>e.exerciseId===id&&e.type!=='cardio'&&e.trackBy!=='duration').flatMap(e=>e.sets||[]);
 };
 function direction(a,b){
  if(!a.length||a.length!==b.length||a.some((s,i)=>!Number.isInteger(s.reps)||s.reps<=0||s.reps!==b[i].reps||!Number.isFinite(s.weight)||!Number.isFinite(b[i].weight)||s.weight<=0||b[i].weight<=0))return {direction:null,reason:'Not comparable: missing loads or different set/rep structures.'};
  const differences=b.map((s,i)=>s.weight-a[i].weight),up=differences.some(d=>d>0.02),down=differences.some(d=>d<-.02);
  return up&&down?{direction:null,reason:'Not comparable: some set loads increased and others decreased.'}:{direction:up?'increase':down?'reduce':'hold',reason:'Same exercise identity and ordered set/rep structure; 0.02 kg rounding tolerance.'};
 }
 function followup(row,workouts){
  const baseline=row.snapshot.evidence?.at(-1),out=row.outcome,chosen=row.chosenDirection;
  if(row.attribution!=='attributed'||!out||!baseline?.exerciseId||baseline.exerciseId!==out.exerciseId)return {intended:chosen,planned:{direction:null,reason:'No uniquely attributed follow-up with matching identity.'},completed:{direction:null,reason:'No uniquely attributed follow-up with matching identity.'},alignment:'unknown'};
  const before=workouts.find(w=>String(w.id)===String(baseline.workoutId)),after=workouts.find(w=>String(w.id)===String(out.workoutId)),id=out.exerciseId;
  const completed=direction(sets(before,id,false),sets(after,id,false));
  let planned=direction(sets(before,id,true),sets(after,id,true));
  const p=after?.sessionIntent?.prescription,prior=before?.sessionIntent?.prescription;
  if(!p?.capturedAt||!prior?.capturedAt||p.capturedAt<row.updatedAt||Intent.planTiming(p,after.date,after.sessionIntent?.timing)!=='before-training'||Intent.planTiming(prior,before.date,before.sessionIntent?.timing)!=='before-training')planned={direction:null,reason:'Plan timing unavailable: need original plans captured before training, with the follow-up plan captured after the response. Same-day plans need an explicit recorded start. Revisions do not replace the original plan.'};
  return {intended:chosen,planned,completed,alignment:!chosen||!completed.direction?'unknown':chosen===completed.direction?'same-direction':'different-direction',note:'Direction agreement is descriptive, not proof that advice was followed or caused performance change. Comparisons use saved sets as of the report date, which may include corrections.'};
 }
 function weekly(state,{asOf}={}){
  if(!Blocks.date(asOf))throw Error('Choose a valid review date.');
  const end=asOf+'T23:59:59.999Z',d=new Date(asOf+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));const from=d.toISOString().slice(0,10);
  const view={...state,workouts:Readiness.workoutsAt(state,asOf,end,false).workouts,decisionEvents:(state.decisionEvents||[]).filter(e=>e.updatedAt<=end)};
  const report=Performance.analyze(view,{asOf});
  const rows=report.rows.map(row=>({...row,followup:followup(row,view.workouts)}));
  const recorded=rows.filter(r=>r.createdAt.slice(0,10)>=from),observed=rows.filter(r=>r.attribution==='attributed'&&r.outcome.date>=from);
  return {version:1,readOnly:true,from,asOf,recorded,observed,counts:{recorded:recorded.length,observed:observed.length,awaiting:recorded.filter(r=>r.attribution==='awaiting-outcome').length,unknownDirection:observed.filter(r=>r.followup.alignment==='unknown').length},note:'Responses recorded this week and uniquely attributed follow-ups observed this week are separate groups; they may overlap. No recommendation or athlete data is changed. Future-edited feedback is withheld because its earlier response cannot be reconstructed.'};
 }
 return {steps,direction,followup,weekly};
});
