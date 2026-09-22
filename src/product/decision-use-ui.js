(function(){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(state,{snapshot,decisions,asOf,live}){
  const host=document.getElementById('decision-readiness-card'),M=window.LoadnoteDecisionUseReview;if(!host||!M)return;
  for(const row of Object.values(decisions?.lifts||{})){
   if(row.decisionAllowed)continue;
   const body=host.querySelector(`[data-decision-lift="${row.lift}"] .decision-lift-body`);if(!body)continue;
   const tasks=M.steps(snapshot.lifts[row.lift],row,snapshot.block),section=document.createElement('details');section.className='more-details decision-next-steps';
   section.innerHTML='<summary>Evidence checklist · '+tasks.length+' next steps</summary>'+tasks.map(t=>'<article><h4>'+esc(t.title)+'</h4><p>'+esc(t.detail)+'</p>'+(live?'<button type="button" class="btn-secondary" data-evidence-target="'+t.target+'">Open '+esc({mapping:'lift mappings',block:'training block',history:'workout history',train:'workout logger',evidence:'evidence readiness'}[t.target])+'</button>':'<p>Historical review is read-only. Return to today to work on current records.</p>')+'</article>').join('');
   body.append(section);
   section.onclick=e=>{const b=e.target.closest('[data-evidence-target]');if(!b)return;const target=b.dataset.evidenceTarget;
    if(target==='block'){window.openTrainingBlockEditor?.(snapshot.block?.id);return;}
    if(target==='history'||target==='train'){window.showTab?.('workouts');window.showSubTab?.('workouts',target==='history'?'wo-history':'wo-log');return;}
    const el=host.querySelector(target==='mapping'?'#readiness-mappings':'.decision-evidence-panel');let parent=el;while(parent&&parent!==host){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}el?.scrollIntoView({block:'start'});
   };
  }
  const panel=document.createElement('details');panel.className='more-details';panel.id='weekly-decision-review';
  try{const r=M.weekly(state,{asOf});
   const evidence=rows=>rows.map(row=>{const f=row.followup;return '<article><h4>'+esc(row.snapshot.lift+' · response '+row.createdAt.slice(0,10))+'</h4><p>Suggested: '+esc(row.snapshot.decision)+' · Response: '+esc(row.response)+' · Intended: '+esc(f.intended||'No direction recorded')+'</p><p>Status: '+esc(row.attribution)+(row.outcome?' · follow-up '+esc(row.outcome.date):'')+'</p><p>Saved plan load direction: '+esc(f.planned.direction||'Not comparable')+'</p><p>'+esc(f.planned.reason)+'</p><p>Completed set-load direction: '+esc(f.completed.direction||'Not comparable')+'</p><p>'+esc(f.completed.reason)+'</p><p>Direction agreement: '+esc(f.alignment)+'</p>'+(row.outcome?'<p>Observed capacity change: '+esc(row.outcome.capacityChangePct==null?'Unavailable':row.outcome.capacityChangePct+'%')+' · RPE change: '+esc(row.outcome.rpeChange??'Unavailable')+'</p>':'')+'<p>'+esc(f.note||'No comparable follow-up yet.')+'</p></article>';}).join('')||'<p>No records in this group yet.</p>';
   panel.innerHTML='<summary>Weekly decision review · '+r.counts.recorded+' responses · '+r.counts.observed+' follow-ups</summary><p>'+esc(r.from+' – '+r.asOf)+'</p><p>'+esc(r.note)+'</p><p>'+r.counts.awaiting+' of this week’s responses await an outcome · '+r.counts.unknownDirection+' observed follow-ups have unknown load-direction agreement.</p><details><summary>Responses recorded this week</summary>'+evidence(r.recorded)+'</details><details><summary>Follow-ups observed this week</summary>'+evidence(r.observed)+'</details><p>Load direction is not strength gain. Different set/rep structures stay unclassified; same-day plan timing is uncertain. Plan and completed comparisons do not establish adherence or causation.</p>';
  }catch(e){panel.innerHTML='<summary>Weekly decision review</summary><p>'+esc(e.message)+'</p>';}
  host.querySelector('.decision-review-tools')?.append(panel);
 }
 window.LoadnoteDecisionUseUI={render};
})();
