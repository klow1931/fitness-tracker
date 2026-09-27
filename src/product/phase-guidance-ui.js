/* v2.31 — compact phase-aware Decisions card and drill-down; no training edits. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const status={completed:'Logged + linked',skipped:'Explicitly skipped',cancelled:'Cancelled',unconfirmed:'Unconfirmed',upcoming:'Upcoming',unknown:'Needs review'};
 function render(report){
   if(!report)return '';
   const sums=report.summary,part=report.phaseFocus,eventLabel=report.eventType==='competition'?(report.eventName||'Competition meet'):'Mock meet';
   const next=report.next?'Next: '+report.next.date+' · '+report.next.name:(report.phase==='mock-meet'||report.phase==='meet')?'No programmed attempts; '+eventLabel+' date '+report.meetDate+'.':'No further scheduled cycle workout in the current view.';
   return `<div class="card phase-guidance-card" data-phase-guidance data-phase="${esc(report.phase)}">
     <div class="phase-guidance-head"><div><span class="eyebrow">${esc(report.eventType==='competition'?'COMPETITION MEET CYCLE':'MOCK-MEET CYCLE')} · ${esc(report.status)}</span><h3>${esc(report.cycleName)} · ${report.totalWeeks} weeks</h3></div><span class="phase-guidance-chip">Week ${report.week} / ${report.totalWeeks}</span></div>
     <p class="phase-guidance-phase">${esc(report.phaseLabel)} · phase week ${report.phaseWeek} of ${report.phaseWeeks}</p>
     <p class="phase-guidance-focus">${esc(part[0])}</p>
     <p class="phase-guidance-next">${esc(next)}</p>
     <p class="phase-guidance-meta">${esc(eventLabel)}: ${esc(report.meetDate)} · Current-week review: ${esc(report.nextReview)} · Phase ends: ${esc(report.phaseEnd)}</p>
     <details class="more-details phase-guidance-detail"><summary>Why this phase? · lift-by-lift evidence</summary>
       <p>${esc(part[1])}</p><p>${sums.completed} linked session(s) · ${sums.unconfirmed} unconfirmed · ${sums.skipped} explicitly skipped · ${sums.cancelled} cancelled · ${sums.unknown} need review · ${sums.revised} Calendar revisions. Planned sessions this week: ${sums.planned}.</p>
       ${Object.values(report.lifts).map(l=>`<article data-phase-lift="${esc(l.lift)}"><h4>${esc(l.name)}</h4><p>Original: ${l.plannedSets} working sets / ${l.plannedExposures} exposure(s). Linked logs: ${l.validActualSets} valid sets across ${l.loggedExposures} exposure(s); ${l.completedSets} of ${l.plannedSets} original planned-set slots have matching exercise identity and valid work, not necessarily matching load/reps.</p><p>${l.rpeSets} logged valid RPE values · ${l.comparableRpeSets} directly comparable sets · ${l.aboveCap} above original cap · ${l.unmatchedSets} sets not comparable to their original targets.</p></article>`).join('')}
       <details class="more-details"><summary>Session status &amp; original schedule</summary>${report.details.map(s=>`<p>${esc(s.date)} · ${esc(s.name)} · ${esc(status[s.status]||s.status)}${s.revisionChanged?' · revised Calendar entry':''}</p>`).join('')||'<p>No programmed training sessions this week.</p>'}</details>
       <details class="more-details"><summary>Evidence limitations</summary><ul>${report.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></details>
       <p class="more-hint">${esc(report.notice)}</p>
     </details>
     <div id="cycle-week-review"></div>
     <div id="cycle-response"></div>
     <button class="btn-primary" type="button" id="decision-cycle-cta">Open original cycle</button>
   </div>`;
 }
 window.LoadnotePhaseGuidanceUI={render};
})();
