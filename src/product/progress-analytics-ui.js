/* v2.72 — compact Progress story: overview, strength, adherence and program decisions. */
(function(){
 'use strict';
 let activeView='overview',storyWeeks=12;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const displayKg=value=>value==null?'—':Math.round(toDisplay(value)*10)/10+' '+unitLabel();
 const pct=value=>value==null?'—':value+'%';
 const signed=value=>Number(value)>0?'+'+value:String(value);
 const fmtDate=value=>{try{return typeof formatDate==='function'?formatDate(value):value;}catch{return value;}};
 function statusTone(status){return status==='higher'?'Higher':status==='lower'?'Lower':status==='similar'?'Similar':'More data';}
 function bestSet(row){
  if(!row)return 'No eligible recent set';
  return displayKg(row.weight)+' × '+row.reps+(row.rpe==null?' · RPE missing':' @ RPE '+row.rpe)+' · '+fmtDate(row.date);
 }
 function directionLine(story){
  const d=story.direction;if(!d)return 'Not enough comparable evidence';
  if(['higher','lower','similar'].includes(d.status))return d.label+' · '+signed(displayKg(d.deltaKg))+' ('+signed(d.deltaPct)+'%)';
  return d.label;
 }
 function programHtml(program){
  if(!program)return '<article class="progress-story-program"><div><span>Current program</span><b>No reviewed program selected</b><small>Logged training can still build your progress story.</small></div></article>';
  const p=program.progress||{},phase=p.phaseLabel?(p.phaseLabel+(p.phaseWeek?' '+p.phaseWeek:'')):'Program';
  const status=program.status==='upcoming'?'Starts '+fmtDate(program.startDate):program.status==='closure'||program.status==='handoff'?'Program complete':'Week '+p.week+' of '+p.totalWeeks+' · '+phase;
  const execution=program.resolved?program.counts.completed+'/'+program.resolved+' resolved sessions completed · '+pct(program.adherence)+' adherence':'No resolved sessions yet';
  return '<article class="progress-story-program"><div><span>Current program</span><b>'+esc(program.name)+'</b><small>'+esc(status)+'</small></div><div class="progress-story-program-meta"><b>'+esc(execution)+'</b><small>'+program.reviewCount+' accepted review'+(program.reviewCount===1?'':'s')+' · '+program.changedReviewCount+' changed future training</small></div></article>';
 }
 function movementMini(story){
  const d=story.direction,change=['higher','lower','similar'].includes(d.status)?signed(d.deltaPct)+'%':'—';
  return '<article class="progress-story-mini" data-progress-movement="'+esc(story.key)+'"><div><span>'+esc(story.label||story.name)+'</span><b>'+esc(statusTone(d.status))+'</b><small>'+esc(directionLine(story))+'</small></div><div class="progress-story-mini-side"><b>'+esc(change)+'</b><button type="button" class="btn-secondary text-sm" data-progress-open-exercise="'+esc(story.name)+'">Details</button></div></article>';
 }
 function overviewHtml(report){
  const o=report.overview,plan=o.schedule;
  const adherence=plan&&plan.resolved?plan.adherence:null;
  const movements=report.movements.length?report.movements.map(movementMini).join(''):'<p class="more-hint">Log rep-based strength work to build movement stories.</p>';
  return '<div class="progress-story-overview">'+
   '<div class="progress-story-metrics">'+
    '<article><span>Sessions · 4 weeks</span><b>'+o.recent.sessions+'</b><small>'+o.recent.sessionsPerWeek+'/week</small></article>'+
    '<article><span>Strength sets</span><b>'+o.recent.strengthSets+'</b><small>'+o.recent.rpeSets+' include valid RPE</small></article>'+
    '<article><span>Plan adherence</span><b>'+pct(adherence)+'</b><small>'+(plan&&plan.resolved?plan.counts.completed+'/'+plan.resolved+' resolved sessions':'No resolved scheduled sessions')+'</small></article>'+
    '<article><span>RPE coverage</span><b>'+pct(o.recent.rpeCoverage)+'</b><small>Logged strength sets</small></article>'+
   '</div>'+programHtml(report.program)+
   '<div class="progress-story-section-head"><div><h3>Strength direction</h3><p>Start-of-window vs recent demonstrated-capacity evidence.</p></div></div>'+
   '<div class="progress-story-movement-list">'+movements+'</div>'+
   '<p class="more-hint">More training is not automatically better. Direction uses RPE-aware performance evidence and stays descriptive rather than turning training into a score.</p></div>';
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
  const volume=recent.volumeKg?displayKg(recent.volumeKg):'—';
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
  return '<div class="progress-story-section-head"><div><h3>Strength</h3><p>Follow individual movements without mixing variations or turning one session into a trend.</p></div></div>'+
   (report.movements.length?'<div class="progress-story-strength-list">'+report.movements.map(movementDetail).join('')+'</div>':'<p>No rep-based strength movement has enough recent history to feature yet.</p>');
 }
 function adherenceHtml(report){
  const plan=report.overview.schedule,p=report.program;
  const recent=plan&&plan.planned?'<article class="progress-story-adherence-card" data-progress-adherence="recent"><h3>Recent 4 weeks</h3><div class="progress-story-counts"><div data-progress-count="completed"><b>'+plan.counts.completed+'</b><span>Completed</span></div><div data-progress-count="skipped"><b>'+plan.counts.skipped+'</b><span>Skipped</span></div><div data-progress-count="unconfirmed"><b>'+plan.counts.unconfirmed+'</b><span>Unresolved</span></div><div data-progress-count="cancelled"><b>'+plan.counts.cancelled+'</b><span>Cancelled</span></div></div><p><b>Resolved-session adherence:</b> '+pct(plan.adherence)+' ('+plan.counts.completed+'/'+plan.resolved+').</p><p class="more-hint">'+esc(plan.definition)+' Unresolved and cancelled sessions are not counted as failures.</p></article>':
   '<article class="progress-story-adherence-card"><h3>Recent 4 weeks</h3><p>No scheduled sessions fall in this window. Logged workouts still remain in Strength and History.</p></article>';
  const current=p?'<article class="progress-story-adherence-card" data-progress-adherence="program"><h3>'+esc(p.name)+' · program to date</h3><div class="progress-story-counts"><div data-progress-count="completed"><b>'+p.counts.completed+'</b><span>Completed</span></div><div data-progress-count="skipped"><b>'+p.counts.skipped+'</b><span>Skipped</span></div><div data-progress-count="unconfirmed"><b>'+p.counts.unconfirmed+'</b><span>Unresolved</span></div><div data-progress-count="cancelled"><b>'+p.counts.cancelled+'</b><span>Cancelled</span></div></div><p><b>Resolved-session adherence:</b> '+pct(p.adherence)+' ('+p.counts.completed+'/'+p.resolved+').</p><p class="more-hint">'+esc(p.definition)+'</p></article>':'';
  return '<div class="progress-story-section-head"><div><h3>Adherence</h3><p>What was resolved, what is still open, and what Loadnote deliberately does not count as a failure.</p></div></div><div class="progress-story-adherence-list">'+recent+current+'</div>';
 }
 function actionLabel(action){return ({keep:'Kept plan','increase-load':'Load increased','reduce-load':'Load reduced','reduce-one':'Set removed','reduce-sets':'Sets reduced','progress':'Load progressed','add-set':'Set added'}[action]||String(action||'Review decision').replaceAll('-',' '));}
 function decisionsHtml(report){
  const rows=report.decisions.rows;
  if(!rows.length)return '<div class="progress-story-section-head"><div><h3>Program history</h3><p>No accepted programming reviews fall inside this '+report.weeks+'-week window.</p></div></div>';
  return '<div class="progress-story-section-head"><div><h3>Program history</h3><p>Accepted decisions are shown beside later training, without claiming the decision caused the result.</p></div></div><div class="progress-story-timeline">'+rows.map(r=>{
   const changed=r.changedLifts?'<span class="badge">'+r.changedLifts+' changed</span>':'<span class="badge">Plan kept</span>';
   return '<article><div class="progress-story-timeline-head"><div><span>'+esc(fmtDate(r.date))+'</span><b>'+esc(r.sourceLabel)+'</b></div>'+changed+'</div><div class="progress-story-timeline-lifts">'+r.lifts.map(l=>'<details><summary><b>'+esc(l.name)+'</b><span>'+esc(actionLabel(l.action))+'</span></summary><p>'+esc(l.why)+'</p>'+(l.evidence.length?'<p class="more-hint">'+l.evidence.map(esc).join(' · ')+'</p>':'')+'</details>').join('')+'</div></article>';
  }).join('')+'</div>';
 }
 function bodyHtml(report){
  if(activeView==='strength')return strengthHtml(report);
  if(activeView==='adherence')return adherenceHtml(report);
  if(activeView==='decisions')return decisionsHtml(report);
  return overviewHtml(report);
 }
 function render(){
  const host=document.getElementById('progress-analytics');if(!host||!window.LoadnoteProgressStory)return;
  let report;try{report=window.LoadnoteProgressStory.analyze(data,{asOf:today(),weeks:storyWeeks});}catch(error){host.innerHTML='<h2>Training progress</h2><p>'+esc(error.message)+'</p>';return;}
  host.innerHTML='<div class="progress-story-head"><div><p class="eyebrow">PROGRESS STORY</p><h2>What your training is doing.</h2><p>Strength, adherence, and program decisions from the evidence you actually logged.</p></div><label>Window<select class="input" data-progress-window><option value="8">8 weeks</option><option value="12">12 weeks</option><option value="24">24 weeks</option></select></label></div>'+
   '<div class="progress-story-tabs" role="tablist" aria-label="Progress sections">'+
    [['overview','Overview'],['strength','Strength'],['adherence','Adherence'],['decisions','Program history']].map(([key,label])=>'<button type="button" role="tab" aria-selected="'+String(activeView===key)+'" class="'+(activeView===key?'active':'')+'" data-progress-view="'+key+'">'+label+'</button>').join('')+
   '</div><div class="progress-story-body" data-progress-story-body>'+bodyHtml(report)+'</div>'+
   '<details class="progress-story-method"><summary>How Progress works</summary>'+report.notes.map(x=>'<p>'+esc(x)+'</p>').join('')+'<p>Strength stories compare the first four weeks of the selected window with the most recent four weeks. At least two demonstrated-capacity days are required in each window before showing direction.</p></details>';
  const select=host.querySelector('[data-progress-window]');select.value=String(storyWeeks);select.onchange=()=>{storyWeeks=Number(select.value);render();};
  host.querySelectorAll('[data-progress-view]').forEach(button=>button.onclick=()=>{activeView=button.dataset.progressView;render();});
  host.querySelectorAll('[data-progress-open-exercise]').forEach(button=>button.onclick=()=>openExerciseDetail(button.dataset.progressOpenExercise,'reps'));
 }
 window.LoadnoteProgressStoryUI={render,getView:()=>activeView,setView:value=>{if(['overview','strength','adherence','decisions'].includes(value))activeView=value;}};
 window.renderProgressAnalytics=render;
})();