(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const history=rows=>rows.slice(-10).map(r=>'<p>'+esc(r.date+' · '+r.name+' · '+(r.type==='cardio'?r.duration+' min':r.sets.map(s=>toDisplay(s.weight||0)+' '+unitLabel()+' × '+(r.trackBy==='duration'?s.duration+'s':s.reps)).join(' / ')))+'</p>').join('')||'<p>No recorded sessions.</p>';
 function render(){
  const host=document.getElementById('history-cleanup');if(!host||!window.LoadnoteCleanup)return;
  const r=LoadnoteCleanup.inspect(data,{asOf:today()});
  host.innerHTML='<summary>History cleanup &amp; coverage</summary><p>Current recorded history only. Suggestions are not diagnoses or automatic corrections. Intentional drop sets may be flagged; no flags does not guarantee error-free data.</p><h3>Entries to check ('+r.flags.length+')</h3>'+
   (r.flags.map(f=>'<article><p>'+esc(f.date+' · '+f.exercise+' · set '+f.setNumber+' · '+f.loads.map(w=>toDisplay(w)+' '+unitLabel()).join(' → '))+'</p><p>'+esc(f.reason)+'</p><button type="button" class="btn-secondary" data-clean-edit="'+esc(f.workoutId)+'">Review workout entry</button></article>').join('')||'<p>No middle-set load anomalies found.</p>')+
   '<h3>Possible exercise aliases ('+r.aliases.length+')</h3><p>Compare movement, equipment and load conventions before merging. Names alone do not establish equivalence.</p>'+
   r.aliases.map((a,i)=>'<details><summary>'+esc(a.left.name+' / '+a.right.name)+'</summary><div class="cleanup-columns"><section><h4>'+esc(a.left.name)+'</h4>'+history(a.leftHistory)+'</section><section><h4>'+esc(a.right.name)+'</h4>'+history(a.rightHistory)+'</section></div><p>Latest 10 entries per identity. Original workout labels remain unchanged if merged.</p><button type="button" class="btn-secondary" data-clean-alias="'+i+'">Review merge in Tools</button></details>').join('')+
   '<h3>Training-block coverage</h3><p>Completeness is athlete-confirmed, not inferred from gaps. Unlogged dates are unknown, not missed workouts.</p>'+
   r.blocks.map(b=>'<article><h4>'+esc(b.name)+'</h4><p>'+esc(b.start+' – '+b.end)+' · '+b.workoutCount+' workouts on '+b.days+' dates.</p><p>'+esc(b.first?'Recorded span: '+b.first+' – '+b.last:'No workouts recorded in this block.')+'</p><p>Athlete-confirmed coverage: '+esc(b.coverage)+'.</p><button type="button" class="btn-secondary" data-clean-block="'+esc(b.id)+'">Review block coverage</button></article>').join('');
  host.querySelectorAll('[data-clean-edit]').forEach(b=>b.onclick=()=>editWorkout(b.dataset.cleanEdit));
  host.querySelectorAll('[data-clean-block]').forEach(b=>b.onclick=()=>window.openTrainingBlockEditor(b.dataset.cleanBlock));
  host.querySelectorAll('[data-clean-alias]').forEach(b=>b.onclick=()=>{const a=r.aliases[Number(b.dataset.cleanAlias)];showTab('tools');renderDataIntegrityTools();document.getElementById('exercise-alias-source').value=a.left.id;document.getElementById('exercise-alias-target').value=a.right.id;document.getElementById('exercise-alias-tools').scrollIntoView({block:'start'});});
 }
 window.renderHistoryCleanup=render;
})();
