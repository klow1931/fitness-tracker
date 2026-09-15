/* Read-only Training Review alongside Strength Progress. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kg=v=>v==null?'Not enough data':toDisplay(v)+' '+unitLabel();
  const pct=v=>v==null?'Not enough data':v+'%';
  const trend=v=>v?esc(kg(v.start)+' → '+kg(v.end)+' ('+(v.percent>0?'+':'')+v.percent+'%) · '+v.firstDate+' to '+v.lastDate+' · '+v.days+' evidence days'):'Not enough data — needs 3 distinct days within one training context.';
  const sets=(rows,planned)=>rows.length?rows.map(s=>esc(kg(s.weight)+' × '+s.reps+(planned?(s.targetRpe==null?'':' @ target '+s.targetRpe):(s.rpe==null?' · RPE missing':' @ '+s.rpe)))).join('<br>'):'Not recorded';
  function render(){
    const host=document.getElementById('training-review');if(!host||!window.LoadnoteReview)return;
    if(!host.querySelector('#review-as-of')){
      host.innerHTML='<h2>Training Review</h2><p>What was planned, what happened, and what the evidence supports.</p><div class="training-review-controls"><label>Analyze through<input id="review-as-of" class="input" type="date"></label><label>Performance range<select id="review-weeks" class="input"><option value="1">1 week</option><option value="4">4 weeks</option><option value="12" selected>12 weeks</option></select></label><label>Training block<select id="review-block" class="input"><option value="">Rolling date range</option></select></label><label>Evidence mode<select id="review-mode" class="input"><option value="corrected">Current-corrected history</option><option value="recorded">Historical as-recorded</option></select></label><button id="review-refresh" class="btn-secondary" type="button">Refresh review</button></div><p id="review-error" role="alert"></p><div id="training-review-results"></div>';
      host.querySelector('#review-as-of').value=today();
      host.querySelectorAll('input,select').forEach(el=>el.onchange=render);
      host.querySelector('#review-refresh').onclick=render;
    }
    const error=host.querySelector('#review-error'),results=host.querySelector('#training-review-results');error.textContent='';
    try{
      const asOf=host.querySelector('#review-as-of').value;if(asOf>today())throw Error('Choose today or an earlier analysis date.');
      const blockSelect=host.querySelector('#review-block'),chosen=blockSelect.value,corrected=host.querySelector('#review-mode').value==='corrected';
      const available=LoadnoteBlocks.list(data.trainingBlocks||[],corrected?undefined:asOf+'T23:59:59.999Z').filter(b=>b.startDate<=asOf);
      blockSelect.innerHTML='<option value="">Rolling date range</option>'+available.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name+' · '+b.startDate+' – '+(b.endDate||'ongoing'))+'</option>').join('');
      if(chosen&&!available.some(b=>b.id===chosen)){blockSelect.add(new Option('Selected block unavailable in this mode/date',chosen));}
      blockSelect.value=chosen;host.querySelector('#review-weeks').disabled=!!chosen;
      const r=LoadnoteReview.review(data,{asOf,weeks:Number(host.querySelector('#review-weeks').value),retrospective:corrected,blockId:chosen||undefined});
      const week=r.week,c=week.counts;
      results.innerHTML='<p class="review-mode-note">'+esc(r.mode==='current-corrected'?'Current-corrected: uses today’s corrected workout and block context, excluding workouts after the analysis date.':'Historical as-recorded: reconstructs retained workout history and withholds later block context.')+'</p>'+
        '<h3>Week of '+esc(week.from)+' – '+esc(week.to)+'</h3><p>'+c.completed+' completed · '+c.skipped+' explicitly skipped · '+c.unconfirmed+' unconfirmed · '+c.cancelled+' cancelled · '+c.scheduled+' scheduled</p>'+
        '<p>'+week.rescheduled+' sessions moved into/within this week · '+week.loggedWorkouts+' workouts logged this week ('+week.unlinkedWorkouts+' without a schedule link).</p>'+
        '<p>Resolved-session adherence: '+pct(week.adherence)+' ('+c.completed+'/'+week.resolved+'). '+esc(week.definition)+'</p>'+
        '<p class="review-mode-note">Schedule uses revisions known by the analysis date in both modes. Completion counts follow planned dates; logged-workout counts follow actual dates. Moved-out sessions are not failures.</p>'+
        '<details><summary>Weekly session evidence ('+week.sessions.length+')</summary>'+
        (week.sessions.map(s=>'<p>'+esc(s.date+' · '+s.name+' · '+s.state+(s.reason?' · '+s.reason:'')+(s.retrospective?' · Retrospective plan':'')+(s.lateChange?' · Late change':''))+'</p>').join('')||'<p>No scheduled sessions known for this week.</p>')+'</details>'+
        '<h3>Performance review · '+esc(r.from)+' – '+esc(r.through)+'</h3><p>'+r.workoutCount+' logged workouts'+(r.selectedBlock?' in '+esc(r.selectedBlock.name):'')+'. Planned-set completion: '+pct(r.execution.setCompletionRate)+'. This is separate from scheduled-session adherence.</p>'+
        '<p class="review-context-note">'+esc(r.interpretation)+'</p>'+
        r.blocks.map(b=>'<p>'+esc(b.name+' · '+(LoadnoteBlocks.types[b.blockType]||b.blockType)+' · '+LoadnoteBlocks.strategies[b.loadStrategy]+' · '+LoadnoteBlocks.intents[b.progressionIntent]+(b.primaryGoal?' · Goal: '+b.primaryGoal:''))+'</p>').join('')+
        r.warnings.map(w=>'<p class="review-context-note">'+esc(w)+'</p>').join('')+
        '<p class="review-mode-note">Trends use the highest value per day and compare first/last evidence days, not a fitted growth rate. Capacity uses positive load, 2–12 reps at actual RPE 6–10, or an observed single at RPE 10. Submaximal singles and low-RPE work stay logged but do not supply capacity estimates. This v1.16 evidence rule can change displayed trends; saved sets and legacy PR calculations are unchanged. Training maxes and known 1RMs never fill missing estimates. Variations stay separate.</p>'+
        (r.exercises.map(e=>'<details class="review-lift"><summary>'+esc(e.name)+' · '+e.capacityDays+' capacity-evidence days</summary><dl><dt>Prescription progression</dt><dd>'+trend(e.prescriptionTrend)+'</dd><dt>Logged-load progression</dt><dd>'+trend(e.loggedLoadTrend)+'</dd><dt>Demonstrated-capacity estimate</dt><dd>'+trend(e.estimatedCapacityTrend)+'</dd></dl><p>'+e.usableSets+' / '+e.actualSets+' logged strength sets usable for capacity estimates.</p>'+
          e.reasons.map(reason=>'<p>'+esc(reason)+'</p>').join('')+'<h4>Supporting sessions</h4>'+
          e.evidence.map(row=>'<article class="review-evidence"><h5>'+esc(row.date+' · Workout '+row.workoutId)+'</h5><p><b>Planned:</b> '+sets(row.plannedSets,true)+'</p><p><b>Actual:</b> '+sets(row.actualSets,false)+'</p><p><b>Set capacity estimates:</b> '+(row.actualSets.length?row.actualSets.map(s=>s.estimatedCapacity==null?esc(s.limitation):esc(kg(s.estimatedCapacity))).join(' / '):'Not enough data')+'</p>'+
            (row.capturedAt?'<p>Plan captured: '+esc(row.capturedAt)+(row.retrospectivePlan?' · Retrospective':'')+'</p>':'')+
            (row.deviationReason!=='none'||row.deviationNotes?'<p>Change context: '+esc((LoadnoteIntent.DEVIATION_REASONS[row.deviationReason]||row.deviationReason)+' · '+row.deviationNotes)+'</p>':'')+'</article>').join('')+'</details>').join('')||'<p>Not enough data — no rep-based strength evidence in this range.</p>')+
        '<p class="review-mode-note">Review only. No loads, programs, workouts or recommendations are changed.</p>';
    }catch(e){results.replaceChildren();error.textContent=e.message;}
  }
  window.renderTrainingReview=render;
})();
