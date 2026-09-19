/* v2.5: read-only Decision Performance view. */
(function(){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 const title={squat:'Squat',bench:'Bench',deadlift:'Deadlift',increase:'Increase',hold:'Hold',reduce:'Reduce','insufficient-evidence':'Insufficient evidence',accept:'Accepted',modify:'Modified',ignore:'Ignored'};
 const display=n=>n==null?'Not available':String(n)+'%';
 const signed=n=>n==null?'Not available':(n>0?'+':'')+n;
 let selected='all';
 function markup(report,scope){
   const rows=scope==='all'?report.rows:report.rows.filter(r=>r.snapshot.lift===scope),s=scope==='all'?report.summary:report.lifts[scope];
   const metrics=[
     ['Feedback recorded',s.count],
     ['Accepted',s.responses.accept+' · '+display(s.acceptanceRate)],
     ['Modified',s.responses.modify+' · '+display(s.modificationRate)],
     ['Ignored',s.responses.ignore+' · '+display(s.ignoreRate)],
     ['Unique follow-ups',s.uniqueObserved+' / '+s.count],
     ['Outcome coverage',display(s.outcomeCoverage)],
     ['Comparable coverage',display(s.eligibleOutcomeCoverage)]
   ];
   return `<p class="more-hint">Observational only: these are recorded intentions and subsequent exposures, not proof a choice caused a result.</p>
     <p class="decision-performance-status"><b>${({'collecting':'Collecting feedback','early-pattern':'Early pattern','reviewable-history':'Reviewable history'})[s.evidenceStatus]}</b> · ${s.uniqueObserved} uniquely attributed follow-up${s.uniqueObserved===1?'':'s'}.</p>
     <div class="decision-performance-metrics">${metrics.map(([label,value])=>`<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('')}</div>
     <p class="more-hint">Follow-ups: ${s.pending} awaiting · ${s.expired} beyond ${report.horizonDays}-day window · ${s.missingBaseline} missing baseline · ${s.lateResponse} response after follow-up · ${s.overlapping} overlapping, excluded from independent outcome totals. Each lift/workout is counted once. Comparable coverage excludes overlapping events, missing baselines, and responses entered on/after the observed workout date.</p>
     <div class="decision-performance-response">${['accept','modify','ignore'].map(key=>{const d=s.byResponse[key];return `<div><b>${title[key]} · ${d.observed} unique / ${s.responses[key]} recorded</b><span>Mean capacity: ${d.observed?signed(d.meanCapacityChangePct)+'%':'—'} · Mean RPE change: ${d.observed?signed(d.meanRpeChange):'—'}</span><small>${d.outcomes.improved} improved · ${d.outcomes.stable} stable · ${d.outcomes.declined} declined</small></div>`;}).join('')}</div>
     <details class="more-details"><summary>Recorded choice vs recommendation</summary><p class="more-hint">A Modify response records intended direction, not a verified training prescription or proof it was followed.</p>${Object.entries(s.overridePatterns).length?Object.entries(s.overridePatterns).map(([k,p])=>`<p><b>${esc(k)}</b> · ${p.recorded} recorded · ${p.observed} unique observed (${p.improved} improved / ${p.stable} stable / ${p.declined} declined) · ${p.pending} awaiting · ${p.expired} beyond window · ${p.overlapping} overlapping · ${p.missingBaseline} missing baseline · ${p.lateResponse} late response</p>`).join(''):'<p>No directional overrides recorded yet.</p>'}</details>
     <details class="more-details"><summary>Audit decision and workout evidence · ${rows.length}</summary><div class="decision-performance-rows">${rows.map(row=>{
      const o=row.outcome,when=row.snapshot.asOf,choice=row.chosenDirection?title[row.chosenDirection]:'No direction recorded';
      const status={'attributed':'Unique follow-up','overlapping':'Overlapping · excluded','awaiting-outcome':'Awaiting follow-up','window-ended':'Window ended','missing-baseline':'Missing baseline · outcome unavailable','late-response':'Response saved after workout · excluded'}[row.attribution];
      return `<article><div class="decision-performance-row-heading"><b>${esc(title[row.snapshot.lift]||row.snapshot.lift)} · ${esc(when)}</b><small>${esc(status)}</small></div><p>Recommended: ${esc(title[row.snapshot.decision]||row.snapshot.decision)} · ${esc(title[row.response])} · Intended: ${esc(choice)}</p><p>${o?`Next exposure ${esc(o.date)} · capacity ${signed(o.capacityChangePct)}% · RPE change ${signed(o.rpeChange)}`:row.attribution==='missing-baseline'?'No eligible baseline capacity and saved exercise identity; outcome cannot be compared.':'No usable next exposure in the observation window.'}</p><details><summary>Evidence and original recommendation</summary><p>${esc(row.snapshot.reason)}</p><p>Next exposure guidance: ${esc(row.snapshot.nextExposure)}</p><small>Baseline: ${esc(row.snapshot.evidence?.at(-1)?.date||'unknown')} · ${esc(row.snapshot.evidence?.at(-1)?.workoutId||'no workout ID')}</small>${o?`<p><small>Observed workout ID: ${esc(o.workoutId)} · Exercise ID: ${esc(o.exerciseId)}</small></p><button type="button" class="btn-secondary" data-performance-workout-date="${esc(o.date)}" data-performance-workout-id="${esc(o.workoutId)}">View exact workout in Train</button>`:''}</details></article>`;
     }).join('')||'<p>No recorded responses for this lift yet.</p>'}</div></details>`;
 }
 function render(state){
   const host=document.getElementById('decision-performance-report'),model=window.LoadnoteDecisionPerformance;
   if(!host||!model)return;
   let report;try{report=model.analyze(state,{asOf:window.today?.()||new Date().toISOString().slice(0,10)});}catch(error){host.textContent=error.message;return;}
   host.innerHTML=`<label class="decision-performance-filter">Lift<select id="decision-performance-lift" class="input"><option value="all">All lifts</option>${model.LIFTS.map(lift=>`<option value="${lift}" ${selected===lift?'selected':''}>${title[lift]}</option>`).join('')}</select></label><div id="decision-performance-body">${markup(report,selected)}</div>`;
   host.querySelector('#decision-performance-lift')?.addEventListener('change',event=>{selected=event.target.value;const body=host.querySelector('#decision-performance-body');if(body)body.innerHTML=markup(report,selected);});
   host.onclick=event=>{
     const button=event.target.closest('[data-performance-workout-date]');if(!button)return;
     const date=button.dataset.performanceWorkoutDate;
     window.showTab?.('workouts');window.showSubTab?.('workouts','wo-history');
     const from=document.getElementById('history-from'),to=document.getElementById('history-to'),search=document.getElementById('history-search');
     if(search)search.value='';if(from)from.value=date;if(to)to.value=date;
     window.renderWorkoutHistory?.();
     const workoutId=button.dataset.performanceWorkoutId,card=[...document.querySelectorAll('#workout-history [data-hist-id]')].find(node=>node.dataset.histId===workoutId);
     if(card){card.classList.add('decision-evidence-target');card.querySelector('details')?.setAttribute('open','');card.scrollIntoView({block:'center'});}else{
       const region=document.getElementById('workout-history');region?.scrollIntoView({block:'start'});
       window.showToast?.('Workout is no longer available in the current training history.','info');
     }
   };
 }
 window.LoadnoteDecisionPerformanceUI={render};
})();
