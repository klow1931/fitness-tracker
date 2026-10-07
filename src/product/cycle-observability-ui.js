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
 function recordDetails(e,content=''){
   const env=e.controllerSnapshot?.environment||e.environment;
   return '<details class="cycle-record-details"><summary aria-label="'+esc('Technical details for '+e.label)+'">Technical details</summary><p class="more-hint">These describe the saved record, not the current app version or training readiness.</p><p>'+environmentLine(env)+'</p><p>Recorded '+esc(when(e.at))+'</p>'+content+'</details>';
 }
 function eventCard(e){
   if(e.kind==='starting-program')return '<article class="cycle-journal-event"><h3>'+esc(e.label)+'</h3><p>'+ (e.startingPrescription?'Starting plan and evidence saved.':'Starting evidence was not recorded.')+'</p>'+recordDetails(e,e.startingPrescription?'<p>Starting-prescription evidence and athlete-selected structure were frozen with the reviewed source program.</p>':'<p>No starting-prescription snapshot is available on this source program.</p>')+'</article>';
   if(e.kind==='cycle-reviewed')return '<article class="cycle-journal-event"><h3>'+esc(e.label)+'</h3><p>'+esc(e.weeks)+' weeks · '+esc(e.eventType==='competition'?'competition':'mock meet')+'</p><ul class="cycle-journal-facts"><li>Structure: '+esc(e.planningDecision?(e.planningDecision.mode==='athlete-customized'?'Customized by you':'Calculated by Decisions'):'Not recorded')+'</li><li>Plan checks at review: '+esc(e.qualityGate?String(e.qualityGate.status).toUpperCase():'Not recorded')+'</li></ul>'+recordDetails(e,e.planningDecision?'<p>'+esc(e.planningDecision.summary)+'</p>':'<p>No planning decision was recorded.</p>')+'</article>';
   if(e.kind==='weekly-review')return '<article class="cycle-journal-event" data-cycle-journal-week="'+esc(e.week)+'"><h3>Week '+esc(e.week)+' · '+esc(e.phase)+' → '+esc(e.nextPhase)+'</h3><p>Recorded '+esc(String(e.at).slice(0,10))+' · '+(e.calendarChanges.length?e.calendarChanges.length+' schedule change'+(e.calendarChanges.length===1?'':'s'):'Targets kept')+'</p>'+
     (e.controllerSnapshot?'':'<p>Original recommendation was not recorded.</p>')+
     '<div class="cycle-journal-lifts">'+Object.values(e.lifts).map(l=>'<details class="more-details"><summary>'+esc(l.lift)+' · '+esc(action(l.chosen))+'</summary><p>Recommendation: '+(l.recommended?esc(action(l.recommended)):'Not recorded')+'</p><p>Selected: '+esc(action(l.chosen))+'</p><p>Athlete decision: '+esc(l.athleteDecision==='accepted'?'matched displayed recommendation':l.athleteDecision==='overridden'?'overrode displayed recommendation':'historical recommendation unavailable')+'</p><p>Later evidence: '+outcome(l.outcome)+'</p></details>').join('')+'</div>'+
     (e.notes?'<small>Review note: '+esc(e.notes)+'</small>':'')+recordDetails(e)+'</article>';
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
   host.innerHTML='<details class="card cycle-journal-panel"><summary><b>Cycle journal</b><small>Reviews, choices and follow-ups</small></summary>'+
     '<p class="more-hint">Saved history · read-only. Follow-ups do not prove what caused a change.</p>'+
     (audit.blocking||audit.warnings?'<p class="cycle-journal-warning" role="status">'+esc(auditText)+' · see Technical audit.</p>':'')+
     (error?'<p role="alert">'+esc(error)+'</p>':journal?'<p class="cycle-journal-status">'+(journal.summary.reviews?journal.summary.reviews+' weekly review'+(journal.summary.reviews===1?'':'s')+' saved.':'No weekly reviews saved yet.')+'</p><ol class="cycle-journal-timeline" role="list" aria-label="Saved cycle events">'+journal.events.map(e=>'<li>'+eventCard(e)+'</li>').join('')+'</ol>':'')+
     '<details class="cycle-journal-audit" '+(audit.blocking?'open':'')+'><summary>Technical audit</summary><p>'+esc(auditText)+'. This checks record consistency, not training readiness.</p>'+audit.issues.map(i=>'<p><b>'+esc(i.severity)+'</b> · '+esc(i.detail)+'</p>').join('')+(journal?'<dl class="cycle-audit-counts"><div><dt>Saved weekly reviews</dt><dd>'+journal.summary.reviews+'</dd></div><div><dt>Frozen recommendations</dt><dd>'+journal.summary.controllerSnapshots+'</dd></div><div><dt>Recommendation matches</dt><dd>'+journal.summary.acceptedRecommendations+'</dd></div><div><dt>Athlete overrides</dt><dd>'+journal.summary.overriddenRecommendations+'</dd></div><div><dt>Calendar revisions</dt><dd>'+journal.summary.calendarRevisions+'</dd></div></dl>':'')+'<p>Reconstructed from saved program, review, Calendar, workout, event and transition records. Later outcomes are observational, not causal proof.</p></details>'+
     '</details>';
 }
 window.LoadnoteCycleJournalUI={render};
 window.renderCycleJournal=render;
})();
