/* v2.71 — consumer-facing post-session adaptive handoff. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const displayWeight=kg=>{
  const n=Number(kg);if(!Number.isFinite(n))return '';
  try{return Math.round(toDisplay(n)*100)/100+' '+unitLabel();}catch{return Math.round(n*100)/100+' kg';}
 };
 function setText(set,trackBy){
  const amount=trackBy==='duration'?(Number(set?.duration)||0)+' sec':(Number(set?.reps)||0)+' reps';
  const parts=[];
  if(Object.hasOwn(set||{},'weight'))parts.push(displayWeight(set.weight));
  parts.push(amount);
  if(Number(set?.targetRpe)>=1&&Number(set.targetRpe)<=10)parts.push('target RPE '+set.targetRpe);
  return parts.join(' · ');
 }
 function compactSets(sets,trackBy){
  const rows=(sets||[]).map(s=>setText(s,trackBy)),out=[];
  for(const row of rows){
   const last=out.at(-1);
   if(last?.text===row)last.count++;
   else out.push({text:row,count:1});
  }
  return out.map(x=>x.text+(x.count>1?' · '+x.count+' sets':'')).join(' / ')||'No sets';
 }
 function performanceHtml(p){
  if(!p?.comparison)return '<p class="adaptive-handoff-evidence">No comparable planned-work snapshot was available for this workout.</p>';
  const c=p.comparison,parts=[c.completedSets+'/'+c.plannedSets+' planned sets represented',c.exactRate+'% matched captured load/reps'];
  if(p.comparableRpeSets)parts.push('target RPE '+p.averageTargetRpe+' · actual RPE '+p.averageActualRpe+' across '+p.comparableRpeSets+' paired set'+(p.comparableRpeSets===1?'':'s'));
  const exercises=(p.exercises||[]).filter(x=>x.comparableRpeSets).map(x=>'<li><b>'+esc(x.name)+'</b><span>Target '+esc(x.averageTargetRpe)+' · Actual '+esc(x.averageActualRpe)+' · '+x.comparableRpeSets+' paired set'+(x.comparableRpeSets===1?'':'s')+'</span></li>').join('');
  return '<p class="adaptive-handoff-evidence"><b>Plan vs actual:</b> '+parts.map(esc).join(' · ')+'</p>'+(exercises?'<details class="adaptive-handoff-rpe"><summary>RPE evidence by exercise</summary><ul>'+exercises+'</ul></details>':'');
 }
 function changesHtml(report){
  if(report.status!=='updated'||!report.changes?.length)return '';
  const rows=report.changes.map(x=>'<article class="adaptive-handoff-change"><h4>'+esc(x.name)+'</h4><div><span>Before</span><b>'+esc(compactSets(x.before,x.trackBy))+'</b></div><div><span>Now</span><b>'+esc(compactSets(x.after,x.trackBy))+'</b></div></article>').join('');
  const explanation=window.LoadnoteAdaptationExplanationUI?.render?.(report.adaptation,{summary:'Why did this change?'})||'';
  return '<div class="adaptive-handoff-changes"><h4>Accepted prescription change</h4>'+rows+explanation+'</div>';
 }
 function actionLabel(report){
  const kind=report?.lifecycle?.nextAction?.kind;
  if(kind==='review-week')return 'Review week';
  if(kind==='review-phase')return 'Review phase';
  return 'Review';
 }
 function render(report){
  if(!report)return '';
  const statusClass='adaptive-handoff-status-'+report.status;
  const next=report.next?'<p class="adaptive-handoff-next"><b>Next:</b> '+esc(report.next.date)+' · '+esc(report.next.name)+'</p>':'';
  const review=report.status==='review-available'?'<button type="button" class="btn-primary" data-adaptive-review>'+esc(actionLabel(report))+'</button>':'';
  const view=report.next?'<button type="button" class="'+(review?'btn-secondary':'btn-primary')+'" data-adaptive-next>View next workout</button>':'';
  const reason=report.lifecycle?.nextAction?.kind==='resolve-overdue'?report.reason:report.status==='review-available'?'No future prescription changes until you review and approve a supported choice.':report.status==='updated'?'Your approved changes are shown below.':report.status==='no-next'?'Saved to history. Schedule your next session when ready.':'Saved to history. Your next targets stay as scheduled.';
  return '<section class="adaptive-handoff '+statusClass+'" data-adaptive-handoff><div class="adaptive-handoff-head"><div><p class="eyebrow">NEXT STEP</p><h3>'+esc(report.label)+'</h3></div><span class="badge">'+esc(report.status==='updated'?'Updated':report.status==='review-available'?'Review':report.status==='unchanged'?'Unchanged':'Saved')+'</span></div>'+
   '<p class="adaptive-handoff-reason">'+esc(reason)+'</p>'+next+'<div class="adaptive-handoff-actions">'+review+view+'<button type="button" class="btn-secondary" data-adaptive-done>Done</button></div>'+changesHtml(report)+'<details class="session-result-evidence"><summary>Training evidence</summary><p>'+esc(report.reason)+'</p>'+performanceHtml(report.performance)+'<p class="more-hint">'+esc(report.notice)+'</p></details></section>';
 }
 function bind(host,report,state){
  if(!host||!report)return;
  host.querySelector('[data-adaptive-review]')?.addEventListener('click',()=>window.LoadnoteProgramLifecycleUI?.route?.(report.lifecycle));
  host.querySelector('[data-adaptive-next]')?.addEventListener('click',()=>{
   let program=null;
   try{program=window.LoadnoteProgramLifecycle?.programs(state||data)?.find(p=>report.next?.id?.startsWith(p.prefix))||null;}catch{}
   if(program&&window.LoadnoteProgramWorkoutViewerUI?.open){window.LoadnoteProgramWorkoutViewerUI.open(program.id,report.next.id);return;}
   showTab('calendar');setTimeout(()=>{if(typeof selectCalDay==='function'&&report.next?.date)selectCalDay(report.next.date);},30);
  });
  host.querySelector('[data-adaptive-done]')?.addEventListener('click',()=>showTab('dashboard'));
 }
 window.LoadnoteAdaptiveHandoffUI={render,bind,performanceHtml,changesHtml};
})();
