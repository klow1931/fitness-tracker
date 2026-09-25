/* v2.33 — optional per-lift response history in Decisions, never a new decision engine. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=x=>Number.isFinite(x)?x+'%':'Not enough comparable evidence';
 function render(){
  const host=document.getElementById('cycle-response');if(!host)return;
  const selected=(data.meetCycles||[]).filter(c=>c.scheduledAt&&c.config.startDate<=today()).sort((a,b)=>b.config.startDate.localeCompare(a.config.startDate))[0];
  if(!selected){host.replaceChildren();return;}
  let report;try{report=LoadnoteCycleResponse.inspect(data,{cycleId:selected.id,asOf:today()});}catch(e){host.innerHTML='<p role="alert">'+esc(e.message)+'</p>';return;}
  host.innerHTML='<details class="more-details cycle-response-panel"><summary>Training response · '+report.completedWeeks+' of '+report.totalWeeks+' completed weeks</summary><p>Review what was prescribed, linked and logged for each competition lift. Estimates are descriptive; they do not identify the cause of a change.</p>'+
   (!report.phases.length?'<p>No complete training weeks yet. Continue logging linked workouts and RPE.</p>':'')+
   report.phases.map(p=>'<details class="more-details cycle-response-phase" data-response-phase="'+esc(p.phase)+'"><summary>'+esc(p.phase)+' · '+p.weekCount+' complete weeks</summary><p>'+p.linkedSessions+' linked sessions / '+p.plannedSessions+' planned · '+p.unconfirmedSessions+' unconfirmed · '+p.explicitSkips+' explicitly skipped · '+p.changedSessions+' Calendar revisions.</p>'+
    Object.values(p.lifts).map(l=>'<article data-response-lift="'+esc(l.lift)+'"><h4>'+esc(l.name)+'</h4><p>'+l.originalSets+' original sets / '+l.originalExposures+' planned exposures · '+l.loggedSets+' logged valid sets / '+l.linkedExposures+' linked exposures.</p><p>'+l.matchedRpeSets+' directly comparable RPE sets · '+l.aboveCapSets+' above original cap.</p><p>'+l.capacityDates+' eligible competition-lift capacity dates · '+(l.observedChangePct==null?'No within-phase capacity comparison':'Observed estimated-capacity difference: '+number(l.observedChangePct))+'</p>'+l.notes.map(n=>'<small>'+esc(n)+'</small>').join('')+'</article>').join('')+'</details>').join('')+
   '<details class="more-details"><summary>How to interpret these observations</summary>'+report.warnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'<p>'+esc(report.notice)+'</p></details></details>';
 }
 window.renderCycleResponse=render;
})();
