/* Loadnote v2.66 — read-only cycle journal and decision audit UI. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const action=x=>({'keep':'Keep','reduce-one':'−1 set','reduce-load':'−1 load increment','increase-load':'+1 load increment'}[x]||'Unknown');
 const when=x=>x?String(x).replace('T',' ').replace('.000Z','Z'):'—';
 function outcome(row){
   if(!row)return 'No outcome link';
   if(row.status==='observed')return row.capacityKg!=null?esc(row.date)+' · '+esc(toDisplay(row.capacityKg))+' '+esc(unitLabel())+' estimated capacity'+(row.averageRpe!=null?' · avg RPE '+esc(row.averageRpe):''):esc(row.date)+' · linked workout, no usable RPE-capacity estimate';
   if(row.status==='awaiting')return 'Awaiting the next matching competition-lift exposure';
   if(row.status==='unobserved')return 'Next matching exposure passed without one unique linked workout';
   return esc(row.reason||'Outcome unavailable');
 }
 function environmentLine(env){
   if(!env)return 'Legacy record · release environment was not frozen';
   return 'Loadnote '+esc(env.releaseVersion)+' · schema '+esc(env.schemaVersion)+(env.policies&&Object.keys(env.policies).length?' · '+Object.entries(env.policies).map(([k,v])=>esc(k)+': '+esc(v)).join(' · '):'');
 }
 function eventCard(e){
   if(e.kind==='starting-program')return '<article class="cycle-journal-event"><b>'+esc(e.label)+'</b><p>'+environmentLine(e.environment)+'</p>'+(e.startingPrescription?'<small>Starting-prescription evidence and athlete-selected structure were frozen with the reviewed source program.</small>':'<small>No starting-prescription snapshot is available on this source program.</small>')+'</article>';
   if(e.kind==='cycle-reviewed')return '<article class="cycle-journal-event"><b>'+esc(e.label)+'</b><p>'+esc(e.weeks)+' weeks · '+esc(e.eventType==='competition'?'competition':'mock meet')+'</p><p>Program quality gate: <b>'+esc(e.qualityGate?String(e.qualityGate.status).toUpperCase():'LEGACY / NOT RECORDED')+'</b></p><small>'+environmentLine(e.environment)+'</small></article>';
   if(e.kind==='weekly-review')return '<article class="cycle-journal-event" data-cycle-journal-week="'+esc(e.week)+'"><b>Week '+esc(e.week)+' · '+esc(e.phase)+' → '+esc(e.nextPhase)+'</b><p>Saved '+esc(when(e.at))+' · '+e.calendarChanges.length+' Calendar revision'+(e.calendarChanges.length===1?'':'s')+'</p>'+
     (e.controllerSnapshot?'<small>'+environmentLine(e.controllerSnapshot.environment)+'</small>':'<small>Legacy review · controller recommendation was not frozen.</small>')+
     '<div class="cycle-journal-lifts">'+Object.values(e.lifts).map(l=>'<details class="more-details"><summary>'+esc(l.lift)+' · '+(l.recommended?esc(action(l.recommended))+' recommended · ':'')+esc(action(l.chosen))+' chosen</summary><p>Athlete decision: '+esc(l.athleteDecision==='accepted'?'matched displayed recommendation':l.athleteDecision==='overridden'?'overrode displayed recommendation':'historical recommendation unavailable')+'</p><p>Later evidence: '+outcome(l.outcome)+'</p></details>').join('')+'</div>'+
     (e.notes?'<small>Review note: '+esc(e.notes)+'</small>':'')+'</article>';
   if(e.kind==='event-result'){const r=e.result,bests=Object.entries(r.bestKg||{}).map(([lift,kg])=>lift+': '+(kg==null?'—':toDisplay(kg)+' '+unitLabel())).join(' · ');return '<article class="cycle-journal-event"><b>'+esc(e.label)+'</b><p>'+esc(bests)+'</p><p>Total: '+(r.totalKg==null?'not available':esc(toDisplay(r.totalKg))+' '+esc(unitLabel()))+'</p></article>';}
   if(e.kind==='transition')return '<article class="cycle-journal-event"><b>'+esc(e.label)+'</b><p>'+esc(e.schedule?.completed??0)+' / '+esc(e.schedule?.expected??0)+' sessions completed · adherence '+(e.schedule?.adherence==null?'unavailable':esc(e.schedule.adherence)+'%')+'</p></article>';
   return '';
 }
 function render(){
   const host=document.getElementById('cycle-journal');if(!host)return;
   const day=today(),cycles=(data.meetCycles||[]).filter(c=>c.scheduledAt),active=cycles.filter(c=>c.config?.startDate<=day&&c.config?.meetDate>=day).sort((a,b)=>String(b.config.startDate).localeCompare(String(a.config.startDate)))[0],upcoming=cycles.filter(c=>c.config?.startDate>day).sort((a,b)=>String(a.config.startDate).localeCompare(String(b.config.startDate)))[0],ended=cycles.filter(c=>c.config?.meetDate<day).sort((a,b)=>String(b.config.meetDate).localeCompare(String(a.config.meetDate)))[0],selected=active||upcoming||ended;
   if(!selected){host.replaceChildren();return;}
   let audit;try{audit=LoadnoteCycleObservability.audit(data,{cycleId:selected.id,asOf:today()});}catch(e){host.innerHTML='<p role="alert">'+esc(e.message)+'</p>';return;}
   let journal=null,error='';try{journal=LoadnoteCycleObservability.timeline(data,{cycleId:selected.id,asOf:today()});}catch(e){error=e.message;}
   const auditText=audit.blocking?audit.blocking+' blocking decision-audit issue'+(audit.blocking===1?'':'s'):audit.warnings?audit.warnings+' legacy/audit warning'+(audit.warnings===1?'':'s'):'Decision audit clean';
   host.innerHTML='<details class="card cycle-journal-panel"><summary><b>Cycle journal</b><small>What Loadnote knew, recommended, you chose, and what followed</small></summary>'+
     '<p class="more-hint">Read-only reconstruction from saved program, review, Calendar, workout, event and transition records. Later outcomes are observational, not causal proof.</p>'+
     '<p><b>'+esc(auditText)+'</b></p>'+
     (audit.issues.length?'<details class="more-details"><summary>Decision-data audit</summary>'+audit.issues.map(i=>'<p><b>'+esc(i.severity)+'</b> · '+esc(i.detail)+'</p>').join('')+'</details>':'')+
     (error?'<p role="alert">'+esc(error)+'</p>':journal?'<p>'+journal.summary.reviews+' saved weekly reviews · '+journal.summary.controllerSnapshots+' frozen controller snapshots · '+journal.summary.acceptedRecommendations+' recommendation matches · '+journal.summary.overriddenRecommendations+' athlete overrides · '+journal.summary.calendarRevisions+' Calendar revisions.</p>'+journal.events.map(eventCard).join(''):'')+
     '</details>';
 }
 window.LoadnoteCycleJournalUI={render};
 window.renderCycleJournal=render;
})();