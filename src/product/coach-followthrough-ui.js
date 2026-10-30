(function(){
 'use strict';
 function open(selection={}){
  const u=LoadnoteReviewedPlanningUI,esc=u.esc,d=u.dialog('coach-followthrough-dialog','Plan and logged results','<div id="coach-followthrough-report"></div>');if(!d)return;
  const host=d.querySelector('#coach-followthrough-report');
  function render(choice){
   let r;try{r=LoadnoteCoachFollowthrough.inspect(data,{asOf:today(),...choice});}catch(e){host.textContent=e.message;return;}
   if(r.status==='ambiguous'){
    host.innerHTML='<p>Choose the exact plan. Its evidence is reviewed separately.</p><div id="followthrough-choices"></div>';
    for(const p of r.candidates){const b=document.createElement('button');b.type='button';b.className='btn-secondary';b.textContent=p.name+' · '+p.linkedLogs+' linked logs · '+p.startDate+'–'+p.endDate;b.style.whiteSpace='normal';b.style.textAlign='left';b.style.maxWidth='100%';b.style.overflowWrap='anywhere';b.onclick=()=>render({programId:p.id,programKind:p.kind});host.querySelector('#followthrough-choices').append(b);}return;
   }
   const review=r.review,weekly=review?.groups,totals=review?.totals,counts=weekly?weekly.reduce((a,g)=>({planned:a.planned+g.plannedSets,compared:a.compared+g.comparedSets,above:a.above+g.aboveCap}),{planned:0,compared:0,above:0}):null;
   const brief=counts?counts.compared+'/'+counts.planned+' sets have comparable effort; '+counts.above+' above cap.':totals?totals.completed+'/'+totals.planned+' sessions linked; '+totals.unconfirmed+' unconfirmed.':r.summary||LoadnoteCoachFollowthrough.explain(r);
   host.innerHTML=(r.program?'<h3>'+esc(r.program.name)+'</h3>':'')+(review?.week?'<p>Week '+review.week+' · '+esc(review.from+'–'+review.through)+'</p>':'')+'<p>'+esc(brief)+'</p>'+(review?.proposal?'<p><b>'+esc(review.proposal.label)+'</b> · '+esc(review.proposal.reason)+'</p>':'')+'<details id="followthrough-evidence"><summary>Evidence, limits and past changes</summary><p>'+esc(LoadnoteCoachFollowthrough.explain(r))+'</p></details>';
   if(!r.program)return;
   const proposal=r.review?.proposal;
   if(proposal?.changes?.length){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Compare the exact proposed future targets';details.append(summary);const box=document.createElement('div');box.innerHTML=LoadnoteWeeklyCoachingUI.previewMarkup(proposal.changes);details.append(box);host.append(details);}
   const b=document.createElement('button');b.type='button';b.className='btn-primary';b.textContent=r.route==='weekly'?'Open the dated Decisions review':r.route==='custom'?'Open this program’s review':'Review this program';
   b.onclick=()=>{d.close();if(r.route==='weekly')LoadnoteWeeklyCoachingUI.open({programId:r.program.id,programKind:r.program.kind,week:r.review.week});else if(r.route==='custom'){showTab('coach');showSubTab('coach','co-programs');window.LoadnoteCustomProgramUI.review(r.program.id);}else{const report=LoadnoteProgramLifecycleUI.currentReport();if(report)LoadnoteProgramLifecycleUI.route(report);}};host.append(b);
  }
  render({programId:selection.programId||null,programKind:selection.programKind||null});
 }
 window.LoadnoteCoachFollowthroughUI={open};
})();
