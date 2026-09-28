/* v2.53 — compact progress snapshot UI. */
(function(){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const signed=value=>Number(value)>0?'+'+value:String(value);
  const kg=value=>value==null?'—':toDisplay(value)+' '+unitLabel();
  function deltaLabel(value,noun){
    if(!Number(value))return 'same as previous 4 weeks';
    return signed(value)+' '+noun+(Math.abs(value)===1?'':'s')+' vs previous 4 weeks';
  }
  function setText(row){
    if(!row)return 'No eligible set';
    return kg(row.weight)+' × '+row.reps+(row.rpe==null?' · RPE missing':' @ RPE '+row.rpe)+' · '+row.date;
  }
  function capacityText(row){
    if(!row)return 'Not enough RPE-aware evidence';
    return kg(row.kg)+' estimate · '+kg(row.weight)+' × '+row.reps+' @ RPE '+row.rpe+' · '+row.date;
  }
  function markerHtml(marker){
    let compare='';
    if(marker.comparison.status==='comparable')compare='<p class="progress-analytics-change"><b>4-week best estimate change:</b> '+esc(signed(toDisplay(marker.comparison.deltaKg))+' '+unitLabel()+' ('+signed(marker.comparison.deltaPct)+'%)')+'</p>';
    else compare='<p class="more-hint">'+esc(marker.comparison.reason)+'</p>';
    return '<article class="progress-analytics-lift" data-progress-marker="'+esc(marker.key)+'"><div class="progress-analytics-lift-head"><div><b>'+esc(marker.label)+'</b><small>'+esc(marker.source==='competition'?'Confirmed competition lift':'Most-trained movement')+'</small></div><button type="button" class="btn-secondary text-sm" data-progress-open-exercise="'+esc(marker.name)+'">Details</button></div>'+
      '<p><b>Recent best demonstrated-capacity estimate:</b> '+esc(capacityText(marker.recent.bestCapacity))+'</p>'+
      '<p><b>Previous 4 weeks:</b> '+esc(capacityText(marker.prior.bestCapacity))+'</p>'+compare+
      '<p class="more-hint">Recent evidence: '+marker.recent.sessions+' session'+(marker.recent.sessions===1?'':'s')+' · '+marker.recent.capacityDays+' capacity-evidence day'+(marker.recent.capacityDays===1?'':'s')+'. Heaviest recent logged set: '+esc(setText(marker.recent.bestLoad))+'.</p></article>';
  }
  function render(){
    const host=document.getElementById('progress-analytics');if(!host||!window.LoadnoteProgressAnalytics)return;
    let report;try{report=window.LoadnoteProgressAnalytics.analyze(data,{asOf:today()});}catch(error){host.innerHTML='<h2>Training progress</h2><p>'+esc(error.message)+'</p>';return;}
    const plan=report.schedule;
    const planHtml=plan&&plan.planned?'<div class="progress-analytics-plan"><h3>Plan execution · recent 4 weeks</h3><p><b>'+plan.counts.completed+' completed</b> · '+plan.counts.skipped+' explicitly skipped · '+plan.counts.unconfirmed+' unresolved · '+plan.counts.cancelled+' cancelled</p><p class="more-hint">Resolved-session adherence: '+(plan.adherence==null?'—':plan.adherence+'%')+' ('+plan.counts.completed+'/'+plan.resolved+'). Unresolved and cancelled sessions are not counted in that percentage.</p></div>':
      '<div class="progress-analytics-plan"><h3>Plan execution</h3><p class="more-hint">No scheduled sessions fall in the recent 4-week window. Logged training is still summarized below.</p></div>';
    const markerHtmlAll=report.markers.length?report.markers.map(markerHtml).join(''):'<p>No rep-based strength exercise has enough recent history to feature yet.</p>';
    host.innerHTML='<div class="progress-analytics-head"><div><p class="eyebrow">LAST 4 WEEKS VS PREVIOUS 4</p><h2>Training progress</h2><p>Useful trends from what you actually logged—not a readiness score.</p></div></div>'+
      '<div class="progress-analytics-metrics">'+
      '<article><span>Sessions</span><b>'+report.recent.sessions+'</b><small>'+esc(deltaLabel(report.deltas.sessions,'session'))+' · '+report.recent.sessionsPerWeek+'/week</small></article>'+
      '<article><span>Strength sets</span><b>'+report.recent.strengthSets+'</b><small>'+esc(deltaLabel(report.deltas.strengthSets,'set'))+'</small></article>'+
      '<article><span>RPE coverage</span><b>'+(report.recent.rpeCoverage==null?'—':report.recent.rpeCoverage+'%')+'</b><small>'+report.recent.rpeSets+'/'+report.recent.strengthSets+' logged strength sets include valid RPE</small></article>'+
      '</div>'+planHtml+
      '<div class="progress-analytics-lifts"><h3>Performance evidence</h3><p class="more-hint">Showing '+esc(report.markerMode)+'. Capacity estimates require eligible load/reps/RPE evidence; sparse windows do not get a change percentage.</p>'+markerHtmlAll+'</div>'+
      '<details class="progress-analytics-method"><summary>How these analytics work</summary>'+report.notes.map(note=>'<p>'+esc(note)+'</p>').join('')+'<p>Recent window: '+esc(report.recentRange.from)+' – '+esc(report.recentRange.to)+' · Previous window: '+esc(report.priorRange.from)+' – '+esc(report.priorRange.to)+'.</p></details>';
    host.querySelectorAll('[data-progress-open-exercise]').forEach(button=>button.addEventListener('click',()=>openExerciseDetail(button.dataset.progressOpenExercise,'reps')));
  }
  window.renderProgressAnalytics=render;
})();
