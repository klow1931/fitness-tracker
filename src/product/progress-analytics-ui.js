/* v2.78 — Progress Stories: strength, consistency, milestones and recent changes first. */
(function(){
 'use strict';
 let activeView='strength',storyWeeks=12,selectedMovementKey='';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const displayKg=value=>value==null?'—':Math.round(toDisplay(value)*10)/10+' '+unitLabel();
 const displayVolume=value=>value==null?'—':Math.round(toDisplay(value)*10)/10+' '+unitLabel()+'·reps';
 const pct=value=>value==null?'—':value+'%';
 const signed=value=>Number(value)>0?'+'+value:String(value);
 const signedWeight=value=>Number(value)>0?'+'+displayKg(value):displayKg(value);
 const fmtDate=value=>{try{return typeof formatDate==='function'?formatDate(value):value;}catch{return value;}};
 function statusTone(status){return status==='higher'?'Higher':status==='lower'?'Lower':status==='similar'?'Stable evidence':'More data';}
 function bestSet(row){
  if(!row)return 'No eligible recent set';
  return displayKg(row.weight)+' × '+row.reps+(row.rpe==null?' · RPE missing':' @ RPE '+row.rpe)+' · '+fmtDate(row.date);
 }
 function directionLine(story){
  const d=story.direction;if(!d)return 'Not enough comparable evidence';
  if(['higher','lower','similar'].includes(d.status))return d.label+' · '+signedWeight(d.deltaKg)+' ('+signed(d.deltaPct)+'%)';
  return d.label;
 }
 function summaryStrengthLine(row){
  if(['higher','lower','similar'].includes(row.status))return displayKg(row.startKg)+' → '+displayKg(row.endKg)+' · '+signed(row.deltaPct)+'%';
  return row.baselineDays+' start / '+row.recentDays+' recent demonstrated-capacity day'+(row.recentDays===1?'':'s');
 }
 function actionLabel(action){return ({keep:'Kept plan','increase-load':'Load increased','reduce-load':'Load reduced','reduce-one':'Set removed','reduce-sets':'Sets reduced','progress':'Load progressed','add-set':'Set added'}[action]||String(action||'Review decision').replaceAll('-',' '));}
 function programHtml(program){
  if(!program)return '<article class="progress-story-program"><div><span>Current program</span><b>No reviewed program selected</b><small>Logged training can still build your progress story.</small></div></article>';
  const p=program.progress||{},phase=p.phaseLabel?(p.phaseLabel+(p.phaseWeek?' '+p.phaseWeek:'')):'Program';
  const status=program.status==='upcoming'?'Starts '+fmtDate(program.startDate):program.status==='closure'||program.status==='handoff'?'Program complete':'Week '+p.week+' of '+p.totalWeeks+' · '+phase;
  const execution=program.resolved?program.counts.completed+'/'+program.resolved+' resolved sessions completed · '+pct(program.adherence)+' adherence':'No resolved sessions yet';
  return '<article class="progress-story-program"><div><span>Current program</span><b>'+esc(program.name)+'</b><small>'+esc(status)+'</small></div><div class="progress-story-program-meta"><b>'+esc(execution)+'</b><small>'+program.reviewCount+' accepted review'+(program.reviewCount===1?'':'s')+' · '+program.changedReviewCount+' changed future training</small></div></article>';
 }
 function strengthStoryHtml(report){
  const rows=report.summary?.strength||[];
  const content=rows.length?rows.map(row=>'<article class="progress-story-mini"><div><span>'+esc(row.label)+'</span><b>'+esc(statusTone(row.status))+'</b><small>'+esc(summaryStrengthLine(row))+'</small></div><div class="progress-story-mini-side"><button type="button" class="btn-secondary text-sm" data-progress-open-exercise="'+esc(row.name)+'">Details</button></div></article>').join(''):
   '<p class="more-hint">Log comparable rep-based strength work to build strength stories. Loadnote will not manufacture a trend from missing evidence.</p>';
  return '<section class="progress-story-summary-section" data-progress-summary="strength"><div class="progress-story-section-head"><div><p class="eyebrow">Strength</p><h3>What is changing?</h3><p>RPE-aware demonstrated-capacity evidence, with sparse data left unresolved.</p></div></div><div class="progress-story-movement-list">'+content+'</div></section>';
 }
 function consistencyStoryHtml(report){
  const c=report.summary?.consistency||{};
  let body='';
  if(c.mode==='scheduled'){
   body='<article class="progress-story-adherence-card"><div class="progress-story-counts"><div><b>'+c.counts.completed+'</b><span>Completed</span></div><div><b>'+c.counts.skipped+'</b><span>Skipped</span></div><div><b>'+c.counts.unconfirmed+'</b><span>Unresolved</span></div><div><b>'+c.counts.cancelled+'</b><span>Cancelled</span></div></div><p><b>'+pct(c.adherence)+' resolved-session adherence</b> · '+c.counts.completed+' of '+c.resolved+' resolved sessions completed.</p><p class="more-hint">Unresolved and cancelled sessions are not counted as failures.</p></article>';
  }else{
   body='<article class="progress-story-adherence-card"><p><b>'+Number(c.sessions||0)+' logged session'+(Number(c.sessions||0)===1?'':'s')+' in the last 4 weeks</b></p><p>'+Number(c.sessionsPerWeek||0)+' sessions/week from saved training.</p><p class="more-hint">No scheduled sessions fall in this window, so Loadnote does not invent an adherence percentage.</p></article>';
  }
  return '<section class="progress-story-summary-section" data-progress-summary="consistency"><div class="progress-story-section-head"><div><p class="eyebrow">Consistency</p><h3>Are you completing the plan?</h3><p>Completed, skipped, unresolved and cancelled sessions stay meaningfully separate.</p></div></div>'+body+'</section>';
 }
 function milestoneHtml(report){
  const rows=report.summary?.milestones||[];
  const body=rows.length?'<div class="progress-story-review-list">'+rows.map(row=>{
   if(row.type==='capacity-high')return '<article><div><span>'+esc(fmtDate(row.date))+' · '+esc(row.label)+'</span><b>'+esc(row.headline)+'</b></div><p>'+esc(displayKg(row.valueKg)+' vs previous '+displayKg(row.previousKg)+' · '+signed(row.deltaPct)+'%')+'</p><p class="more-hint">'+esc(row.detail)+'</p></article>';
   return '<article><div><span>Recent 4 weeks</span><b>'+esc(row.headline)+'</b></div><p>'+esc(row.detail)+'</p></article>';
  }).join('')+'</div>':'<article class="progress-story-adherence-card"><p><b>No milestone claimed yet.</b></p><p class="more-hint">Loadnote waits for enough comparable evidence instead of turning ordinary training into achievement spam.</p></article>';
  return '<section class="progress-story-summary-section" data-progress-summary="milestones"><div class="progress-story-section-head"><div><p class="eyebrow">Milestones</p><h3>What stands out?</h3><p>Only bounded claims supported by the selected training window.</p></div></div>'+body+'</section>';
 }
 function changesStoryHtml(report){
  const changes=report.summary?.changes||{rows:[]};
  let body='';
  if(changes.rows?.length){
   body='<div class="progress-story-review-list">'+changes.rows.map(row=>'<article><div><span>'+esc(fmtDate(row.date))+' · '+esc(row.sourceLabel)+'</span><b>'+esc(row.name)+' · '+esc(actionLabel(row.action))+'</b></div><p>'+esc(row.why)+'</p>'+(row.evidence?.length?'<details><summary>Evidence</summary><p class="more-hint">'+row.evidence.map(esc).join(' · ')+'</p></details>':'')+'</article>').join('')+'</div>';
  }else if(changes.latestReview){
   body='<article class="progress-story-adherence-card"><p><b>Latest accepted review kept the plan.</b></p><p>'+esc(fmtDate(changes.latestReview.date)+' · '+changes.latestReview.sourceLabel)+'</p><p class="more-hint">No changed prescription is being presented as a change.</p></article>';
  }else body='<article class="progress-story-adherence-card"><p><b>No accepted programming changes in this window.</b></p><p class="more-hint">When a reviewed adjustment is accepted, Loadnote will show what changed and the stored reason here.</p></article>';
  return '<section class="progress-story-summary-section" data-progress-summary="changes"><div class="progress-story-section-head"><div><p class="eyebrow">Recent changes</p><h3>What did Loadnote change?</h3><p>Accepted programming decisions from stored review history—not inferred causality.</p></div></div>'+body+'</section>';
 }
 function summaryHtml(report){
  return '<div class="progress-story-head"><div><p class="eyebrow">YOUR PROGRESS</p><h2>What your training is doing.</h2><p>Strength, consistency, milestones and recent programming changes from evidence you actually logged.</p></div><label>Story window<select class="input" data-progress-window><option value="8">8 weeks</option><option value="12">12 weeks</option><option value="24">24 weeks</option></select></label></div>'+
   '<div class="progress-story-overview" data-progress-story-summary>'+strengthStoryHtml(report)+consistencyStoryHtml(report)+milestoneHtml(report)+changesStoryHtml(report)+'</div>'+
   '<p class="more-hint">'+esc(report.summary?.note||'Progress stays descriptive and evidence-backed.')+'</p>';
 }
 function reviewMarkersHtml(story){
  if(!story.reviews.length)return '<p class="more-hint">No accepted '+story.weeks+'-week programming reviews are linked to this movement.</p>';
  return '<div class="progress-story-review-list">'+story.reviews.slice().reverse().map(r=>{
   const label=r.changed?'Prescription changed':'Plan kept';
   return '<article><div><span>'+esc(fmtDate(r.date))+' · '+esc(r.sourceLabel)+'</span><b>'+esc(label)+'</b></div><details><summary>Why?</summary><p>'+esc(r.why)+'</p>'+(r.evidence.length?'<p class="more-hint">'+r.evidence.map(esc).join(' · ')+'</p>':'')+'</details></article>';
  }).join('')+'</div>';
 }
 function movementDetail(story){
  const d=story.direction,recent=story.recent,overall=story.overall;
  const volume=recent.volumeKg?displayVolume(recent.volumeKg):'—';
  return '<article class="progress-story-strength-card">'+
   '<div class="progress-story-strength-head"><div><span>'+esc(story.source==='competition'?'Confirmed competition lift':'Training movement')+'</span><h3>'+esc(story.label||story.name)+'</h3><p>'+esc(directionLine(story))+'</p></div><span class="badge">'+esc(statusTone(d.status))+'</span></div>'+
   '<div class="progress-story-strength-metrics">'+
    '<div><span>Best recent set</span><b>'+esc(bestSet(recent.bestCapacity||recent.bestLoad))+'</b></div>'+
    '<div><span>Recent demonstrated capacity</span><b>'+esc(recent.bestCapacity?displayKg(recent.bestCapacity.capacityKg):'Not enough RPE-aware evidence')+'</b></div>'+
    '<div><span>4-week volume</span><b>'+esc(volume)+'</b></div>'+
    '<div><span>Average logged RPE</span><b>'+(recent.averageRpe==null?'—':esc(recent.averageRpe))+'</b></div>'+
   '</div>'+
   '<div class="progress-story-strength-actions"><button type="button" class="btn-primary text-sm" data-progress-open-exercise="'+esc(story.name)+'">Exercise details</button><span>'+overall.sessions+' session'+(overall.sessions===1?'':'s')+' · '+overall.sets+' sets in '+story.weeks+' weeks</span></div>'+
   '<details class="progress-story-decisions"><summary>Program decisions for this movement ('+story.reviews.length+')</summary>'+reviewMarkersHtml(story)+'</details>'+
   '<p class="more-hint">'+esc(d.note||d.reason||story.notice)+'</p></article>';
 }
 function strengthHtml(report){
  const options=report.movementOptions||[],picker=options.length?'<label class="progress-story-exercise-picker">Explore an exercise<select class="input" data-progress-exercise><option value="">Featured movements</option>'+options.map(x=>'<option value="'+esc(x.key)+'">'+esc(x.name)+' · '+x.sessions+' session'+(x.sessions===1?'':'s')+'</option>').join('')+'</select></label>':'';
  const selected=report.customMovement;
  const content=selected?'<div class="progress-story-strength-list">'+movementDetail(selected)+'</div>':report.movements.length?'<div class="progress-story-strength-list">'+report.movements.map(movementDetail).join('')+'</div>':'<p>No rep-based strength movement has enough recent history to feature yet.</p>';
  return '<div class="progress-story-section-head"><div><h3>Strength evidence</h3><p>Follow individual movements without mixing variations or turning one session into a trend.</p></div>'+picker+'</div>'+content;
 }
 function adherenceHtml(report){
  const plan=report.overview.schedule,p=report.program;
  const recent=plan&&plan.planned?'<article class="progress-story-adherence-card" data-progress-adherence="recent"><h3>Recent 4 weeks</h3><div class="progress-story-counts"><div data-progress-count="completed"><b>'+plan.counts.completed+'</b><span>Completed</span></div><div data-progress-count="skipped"><b>'+plan.counts.skipped+'</b><span>Skipped</span></div><div data-progress-count="unconfirmed"><b>'+plan.counts.unconfirmed+'</b><span>Unresolved</span></div><div data-progress-count="cancelled"><b>'+plan.counts.cancelled+'</b><span>Cancelled</span></div></div><p><b>Resolved-session adherence:</b> '+pct(plan.adherence)+' ('+plan.counts.completed+'/'+plan.resolved+').</p><p class="more-hint">'+esc(plan.definition)+' Unresolved and cancelled sessions are not counted as failures.</p></article>':'<article class="progress-story-adherence-card"><h3>Recent 4 weeks</h3><p>No scheduled sessions fall in this window. Logged workouts still remain in Strength and History.</p></article>';
  const current=p?'<article class="progress-story-adherence-card" data-progress-adherence="program"><h3>'+esc(p.name)+' · program to date</h3><div class="progress-story-counts"><div data-progress-count="completed"><b>'+p.counts.completed+'</b><span>Completed</span></div><div data-progress-count="skipped"><b>'+p.counts.skipped+'</b><span>Skipped</span></div><div data-progress-count="unconfirmed"><b>'+p.counts.unconfirmed+'</b><span>Unresolved</span></div><div data-progress-count="cancelled"><b>'+p.counts.cancelled+'</b><span>Cancelled</span></div></div><p><b>Resolved-session adherence:</b> '+pct(p.adherence)+' ('+p.counts.completed+'/'+p.resolved+').</p><p class="more-hint">'+esc(p.definition)+'</p></article>':'';
  return '<div class="progress-story-section-head"><div><h3>Training consistency</h3><p>What was resolved, what is still open, and what Loadnote deliberately does not count as a failure.</p></div></div><div class="progress-story-adherence-list">'+recent+current+'</div>';
 }
 function decisionsHtml(report){
  const rows=report.decisions.rows;
  if(!rows.length)return '<div class="progress-story-section-head"><div><h3>Programming changes</h3><p>No accepted programming reviews fall inside this '+report.weeks+'-week window.</p></div></div>';
  return '<div class="progress-story-section-head"><div><h3>Programming changes</h3><p>Accepted decisions are shown beside later training, without claiming the decision caused the result.</p></div></div><div class="progress-story-timeline">'+rows.map(r=>{
   const changed=r.changedLifts?'<span class="badge">'+r.changedLifts+' changed</span>':'<span class="badge">Plan kept</span>';
   return '<article><div class="progress-story-timeline-head"><div><span>'+esc(fmtDate(r.date))+'</span><b>'+esc(r.sourceLabel)+'</b></div>'+changed+'</div><div class="progress-story-timeline-lifts">'+r.lifts.map(l=>'<details><summary><b>'+esc(l.name)+'</b><span>'+esc(actionLabel(l.action))+'</span></summary><p>'+esc(l.why)+'</p>'+(l.evidence.length?'<p class="more-hint">'+l.evidence.map(esc).join(' · ')+'</p>':'')+'</details>').join('')+'</div></article>';
  }).join('')+'</div>';
 }
 function bodyHtml(report){
  if(activeView==='adherence')return adherenceHtml(report);
  if(activeView==='decisions')return decisionsHtml(report);
  return strengthHtml(report);
 }
 function ensureExplore(host){
  let details=document.getElementById('progress-explore');
  if(!details){
   details=document.createElement('details');details.id='progress-explore';details.className='card progress-story-explore';
   details.innerHTML='<summary><span><b>Explore Progress</b><small>Exercise evidence, adherence details, programming history, Training Review, records, measurements and photos</small></span></summary><div id="progress-explore-story-details"></div>';
   host.insertAdjacentElement('afterend',details);
   const parent=host.parentElement;
   for(const node of [parent?.querySelector('#progress-overview'),parent?.querySelector('.progress-quick-actions'),parent?.querySelector('#training-review'),parent?.querySelector('.more-columns')])if(node)details.appendChild(node);
  }
  return details;
 }
 function renderExplore(report,details){
  const detailHost=details.querySelector('#progress-explore-story-details');if(!detailHost)return;
  detailHost.innerHTML=programHtml(report.program)+'<div class="progress-story-tabs" role="tablist" aria-label="Progress evidence sections">'+
   [['strength','Strength evidence'],['adherence','Consistency details'],['decisions','Programming changes']].map(([key,label])=>'<button type="button" role="tab" aria-selected="'+String(activeView===key)+'" class="'+(activeView===key?'active':'')+'" data-progress-view="'+key+'">'+label+'</button>').join('')+
   '</div><div class="progress-story-body" data-progress-story-body>'+bodyHtml(report)+'</div><details class="progress-story-method"><summary>How Progress works</summary>'+report.notes.map(x=>'<p>'+esc(x)+'</p>').join('')+'<p>Strength direction compares the first four weeks of the selected story window with the most recent four weeks. At least two demonstrated-capacity days are required in each window before showing direction.</p></details>';
  const exercise=detailHost.querySelector('[data-progress-exercise]');if(exercise){exercise.value=selectedMovementKey;exercise.onchange=()=>{selectedMovementKey=exercise.value;render();};}
  detailHost.querySelectorAll('[data-progress-view]').forEach(button=>button.onclick=()=>{activeView=button.dataset.progressView;render();});
  detailHost.querySelectorAll('[data-progress-open-exercise]').forEach(button=>button.onclick=()=>openExerciseDetail(button.dataset.progressOpenExercise,'reps'));
 }
 function render(){
  const host=document.getElementById('progress-analytics');if(!host||!window.LoadnoteProgressStory)return;
  let report;try{report=window.LoadnoteProgressStory.analyze(data,{asOf:today(),weeks:storyWeeks,movementKey:selectedMovementKey||null});}catch(error){host.innerHTML='<h2>Training progress</h2><p>'+esc(error.message)+'</p>';return;}
  if(selectedMovementKey&&!report.customMovement){selectedMovementKey='';report=window.LoadnoteProgressStory.analyze(data,{asOf:today(),weeks:storyWeeks});}
  host.innerHTML=summaryHtml(report);
  const select=host.querySelector('[data-progress-window]');select.value=String(storyWeeks);select.onchange=()=>{storyWeeks=Number(select.value);render();};
  host.querySelectorAll('[data-progress-open-exercise]').forEach(button=>button.onclick=()=>openExerciseDetail(button.dataset.progressOpenExercise,'reps'));
  const details=ensureExplore(host);renderExplore(report,details);
 }
 window.LoadnoteProgressStoryUI={render,getView:()=>activeView,setView:value=>{if(['strength','adherence','decisions'].includes(value))activeView=value;}};
 window.renderProgressAnalytics=render;
})();