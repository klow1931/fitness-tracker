/* v2.5: read-only Decision Performance view. */
(function(){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 const title={squat:'Squat',bench:'Bench',deadlift:'Deadlift',increase:'Increase',hold:'Hold',reduce:'Reduce','insufficient-evidence':'Insufficient evidence',accept:'Accepted',modify:'Modified',ignore:'Ignored'};
 const display=n=>n==null?'Not available':String(n)+'%';
 const signed=n=>n==null?'Not available':(n>0?'+':'')+n;
 let selected='all';
 function contextMarkup(state,scope){
   const model=window.LoadnoteDecisionContextAnalysis;if(!model)return '';
   try{const report=model.analyze(state,{asOf:window.today()}),groups=report.cohorts.filter(g=>scope==='all'||g.lift===scope);
    return `<details class="more-details" id="context-comparisons"><summary>Comparable training contexts</summary><p>${esc(report.note)}</p><p>At least three uniquely attributed follow-ups per response and context are required for a mean. Not enough data is not a negative outcome. Prescribed-load increases alone are not strength gains.</p>${groups.map(g=>`<article><h4>${esc(title[g.lift])} · ${esc(g.context?g.context.phase+' / '+g.context.loadStrategy+' / '+g.context.progressionIntent:'Context unavailable')}</h4><p>Exercise ID: ${esc(g.exerciseId)} · ${g.included} included / ${g.recorded} recorded</p>${Object.entries(g.byResponse).map(([response,s])=>`<p>${esc(title[response])}: ${s.count} follow-ups · ${s.meanCapacityChangePct==null?'Not enough data':'Mean observed capacity change: '+signed(s.meanCapacityChangePct)+'%'}</p>`).join('')}<p>Exclusions: ${esc(Object.entries(g.excluded).map(([reason,n])=>reason+': '+n).join(' · ')||'None')}</p><details><summary>Included and excluded evidence</summary>${g.rows.map(r=>`<p>${esc(r.snapshot.asOf+' · '+r.contextStatus+' · '+r.id)}${r.outcome?` <button type="button" class="btn-secondary" data-performance-workout-date="${esc(r.outcome.date)}" data-performance-workout-id="${esc(r.outcome.workoutId)}">View exact workout in Train</button>`:''}</p>`).join('')}</details></article>`).join('')||'<p>No feedback with recorded context yet. Older feedback remains available in the audit; context is never backfilled from current settings.</p>'}</details><details class="more-details" id="policy-experiment"><summary>Historical rule comparison — experimental</summary><p>Compare current rules with a more cautious progression threshold (+1 percentage point). No live rules change. Uses the last 84 days, as-recorded evidence, and outcomes available through today.</p><label>Lift<select id="comparison-lift" class="input">${['squat','bench','deadlift'].map(l=>`<option value="${l}" ${scope===l?'selected':''}>${title[l]}</option>`).join('')}</select></label><button type="button" class="btn-secondary" data-context-compare>Run read-only comparison</button><div id="comparison-result" role="status"></div></details>`;
   }catch(e){return '<p>'+esc(e.message)+'</p>';}
 }
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
   host.innerHTML=`<label class="decision-performance-filter">Lift<select id="decision-performance-lift" class="input"><option value="all">All lifts</option>${model.LIFTS.map(lift=>`<option value="${lift}" ${selected===lift?'selected':''}>${title[lift]}</option>`).join('')}</select></label><div id="decision-performance-body">${markup(report,selected)+contextMarkup(state,selected)}</div>`;
   host.querySelector('#decision-performance-lift')?.addEventListener('change',event=>{selected=event.target.value;const body=host.querySelector('#decision-performance-body');if(body)body.innerHTML=markup(report,selected)+contextMarkup(state,selected);});
   host.onclick=event=>{
     if(event.target.closest('[data-context-compare]')){const result=host.querySelector('#comparison-result');try{const r=LoadnoteDecisionContextAnalysis.compare(state,{asOf:window.today(),lift:host.querySelector('#comparison-lift').value});result.innerHTML='<p>'+esc(r.note)+'</p><p>'+r.rows.length+' replay dates · '+r.changed+' changed directions</p><p>Current / candidate abstentions: '+r.current.counts['insufficient-evidence']+' / '+r.proposed.counts['insufficient-evidence']+'</p><p>Current / candidate increases: '+r.current.counts.increase+' / '+r.proposed.counts.increase+'</p><p>'+(!r.rows.length?'Not enough data for historical comparison.':'Directional differences are not proof of better outcomes.')+'</p><details><summary>Replay dates and decisions</summary>'+r.rows.map(row=>'<p>'+esc(row.date+' · '+row.current+' → '+row.candidate+' · outcome '+(row.outcomeDate||'unavailable'))+'</p>').join('')+'</details>';}catch(e){result.textContent=e.message;}return;}
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
