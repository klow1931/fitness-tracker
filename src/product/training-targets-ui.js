/* v2.26: on-demand context; no writes to the logger or Calendar. */
(function(){
  'use strict';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const weight=kg=>toDisplay(kg)+' '+unitLabel();
  const planned=s=>s.duration?s.duration+' sec':s.reps+' reps';
  const targets=e=>(e.sets||[]).map(s=>weight(s.weightKg)+' × '+planned(s)+(s.targetRpe==null?'':' · RPE cap '+s.targetRpe)).join(' / ');
  const previous=p=>p.sets.map(s=>weight(s.weightKg)+' × '+s.reps+(s.rpe==null?' · RPE not logged':' @ RPE '+s.rpe)).join(' / ');
  function contents(report){
    return '<p>'+esc(report.notice)+'</p>'+(report.phaseReview?'<p><b>Approved '+esc(report.phaseReview.phase)+' phase review</b> · '+esc(report.phaseReview.approvedAt)+'</p>'+report.phaseReview.choices.map(c=>'<p>'+esc(c.lift)+' · '+esc(c.choice)+': '+esc(c.reason)+'</p>').join(''):'<p>No approved phase adjustment changed this session. The current Calendar prescription remains the training target.</p>')+
      report.exercises.map(e=>'<article><b>'+esc(e.name)+'</b><p>Today’s approved target: '+esc(targets(e)||'Non-strength target; see planned work.')+'</p>'+(e.previous?'<p>Previous logged ('+esc(e.previous.date)+'): '+esc(previous(e.previous))+'</p>':'<p>No earlier exact-identity strength exposure available.</p>')+(e.approvedChange?'<p>Approved change: '+e.approvedChange.beforeSets+' → '+e.approvedChange.afterSets+' sets; first planned load '+(e.approvedChange.beforeFirstWeightKg==null?'not recorded':esc(weight(e.approvedChange.beforeFirstWeightKg)))+' → '+(e.approvedChange.afterFirstWeightKg==null?'not recorded':esc(weight(e.approvedChange.afterFirstWeightKg)))+'.</p>':'')+'</article>').join('');
  }
  function current(){
    const host=document.getElementById('workout-plan-context'),body=document.getElementById('workout-plan-context-body');if(!host||!body)return;
    const link=typeof pendingScheduledSession!=='undefined'?pendingScheduledSession:null;
    if(!link||typeof workoutEdit!=='undefined'&&workoutEdit){host.hidden=true;host.open=false;body.replaceChildren();return;}
    host.hidden=false;host.querySelector('summary').textContent='Why this workout? · approved targets & last performance';if(!host.open)return;
    try{
      const report=LoadnoteTrainingTargets.inspect(data,link.id,{asOf:today()});
      if(report.revisionAt!==link.revisionAt||pendingPrescription&&JSON.stringify(pendingPrescription)!==JSON.stringify(LoadnoteSchedule.list(data.scheduledSessions||[]).find(s=>s.id===link.id)?.prescription)){host.hidden=true;body.replaceChildren();return;}
      host.hidden=false;host.querySelector('summary').textContent='Why this workout? · '+report.exercises.length+' planned exercises';
      if(host.open){const signature=JSON.stringify({report,unit:currentUnit()});if(body._signature!==signature){body.innerHTML=contents(report);body._signature=signature;}}
    }catch(err){host.hidden=false;host.querySelector('summary').textContent='Why this workout?';body.textContent='Context unavailable: '+err.message;}
  }
  function preview(host,id){
    try{const report=LoadnoteTrainingTargets.inspect(data,id,{asOf:today()});host.innerHTML=contents(report);}
    catch(err){host.textContent='Training context unavailable: '+err.message;}
  }
  window.LoadnoteTrainingTargetsUI={current,preview};
  document.addEventListener('toggle',event=>{if(event.target?.id==='workout-plan-context'&&event.target.open)current()},true);
})();
