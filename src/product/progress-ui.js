/* Detail and comparison views share the same mode-aware progress model. */
let detailExercise='',detailTracking='reps',exerciseDetailChart=null;
function progressDialog(id,title){
 let dialog=document.getElementById(id);if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id=id;dialog.className='session-review progress-dialog';dialog.setAttribute('aria-label',title);
 document.body.appendChild(dialog);return dialog;
}
function detailSetText(ex){return ex.type==='cardio'?`${ex.duration||0} min · ${ex.distance||0} ${ex.distanceUnit||'km'}`:(ex.sets||[]).map(formatStrengthSet).join(' / ');}
function openExerciseDetail(name,tracking='reps'){
 detailExercise=name;detailTracking=tracking;
 const dialog=progressDialog('exercise-detail','Exercise details');
 dialog.innerHTML='<h2 id="exercise-detail-title"></h2><div class="progress-controls"><label>Range <select id="detail-range" class="input"><option value="4">4 weeks</option><option value="12">12 weeks</option><option value="0" selected>All time</option></select></label><label id="detail-metric-label">Metric <select id="detail-metric" class="input"><option value="load">Heaviest actual set</option><option value="estimate">Estimated 1RM</option></select></label></div><p id="detail-summary"></p><div id="detail-chart-wrap"><canvas id="exercise-detail-chart" height="180" aria-label="Exercise strength trend"></canvas></div><div id="detail-sessions"></div><button type="button" class="btn-secondary" id="close-exercise-detail">Close</button>';
 document.getElementById('exercise-detail-title').textContent=name+' · '+({reps:'Reps',duration:'Timed holds',cardio:'Cardio'}[tracking]||tracking);
 document.getElementById('detail-range').onchange=renderExerciseDetail;document.getElementById('detail-metric').onchange=renderExerciseDetail;
 document.getElementById('close-exercise-detail').onclick=()=>dialog.close();
 if(!dialog.open)dialog.showModal();renderExerciseDetail();
}
function renderExerciseDetail(){
 const weeks=Number(document.getElementById('detail-range').value),metric=document.getElementById('detail-metric').value,end=today();
 const start=new Date(end+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-weeks*7+1);
 const entries=LoadnoteProgress.entries(LoadnoteProgress.filter(data.workouts,{from:weeks?start.toISOString().slice(0,10):'',to:end}),detailExercise,detailTracking);
 const series=LoadnoteProgress.series(data.workouts,detailExercise,{weeks,metric,end},estimated1RM);
 const strength=detailTracking==='reps';document.getElementById('detail-metric-label').hidden=!strength;document.getElementById('detail-chart-wrap').hidden=!strength;
 const note=strength?'Heaviest actual set is logged load, not a tested 1RM. Estimated 1RM is calculated from reps and load.':'Timed holds and cardio are shown separately from rep-based strength estimates.';
 const best=strength&&series.length?` Best ${metric==='load'?'logged load':'estimated 1RM'} in range: ${toDisplay(Math.max(...series.map(p=>p.value)))} ${unitLabel()}.`:'';
 document.getElementById('detail-summary').textContent=(entries.length?`${new Set(entries.map(e=>e.id)).size} sessions in range.`:'No matching sessions in this range.')+best+' '+note;
 if(exerciseDetailChart){exerciseDetailChart.destroy();exerciseDetailChart=null;}
 if(strength&&typeof Chart!=='undefined')exerciseDetailChart=new Chart(document.getElementById('exercise-detail-chart').getContext('2d'),{type:'line',data:{labels:series.map(p=>p.date),datasets:[{label:metric==='load'?'Heaviest actual set ('+unitLabel()+')':'Estimated 1RM ('+unitLabel()+')',data:series.map(p=>toDisplay(p.value)),borderColor:data.dark?'#a5b4fc':'#4f46e5',tension:0}]},options:{animation:!window.matchMedia('(prefers-reduced-motion: reduce)').matches,plugins:chartPluginOptions(false),scales:chartScaleOptions(unitLabel(),true)}});
 const host=document.getElementById('detail-sessions');host.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='Recent matching sessions (up to 20 entries)';host.appendChild(heading);
 for(const e of entries.slice(0,20)){const p=document.createElement('p');p.textContent=e.date+' · '+detailSetText(e.exercise);host.appendChild(p);}
}
function openSessionComparison(id){
 const dialog=progressDialog('session-comparison','Compare workouts');
 dialog.innerHTML='<h2>Compare workouts</h2><div class="progress-controls"><label>Workout A <select id="compare-a" class="input"></select></label><label>Workout B <select id="compare-b" class="input"></select></label></div><p>Matched by exercise name and tracking mode. Unmatched movements stay separate; load changes alone do not establish progress.</p><div id="comparison-results"></div><button type="button" class="btn-secondary" id="close-comparison">Close</button>';
 const list=LoadnoteProgress.filter(data.workouts);
 for(const selectId of ['compare-a','compare-b']){const select=document.getElementById(selectId);for(const [i,w]of list.entries()){const option=document.createElement('option');option.value=String(w.id);option.textContent=`${w.date} · ${w.exercises.map(e=>e.name).join(', ')} · #${i+1}`;select.appendChild(option);}select.onchange=renderSessionComparison;}
 const a=document.getElementById('compare-a'),b=document.getElementById('compare-b');a.value=String(id);if(!a.value&&list.length)a.value=String(list[0].id);b.value=String(list.find(w=>String(w.id)!==a.value)?.id??a.value);
 document.getElementById('close-comparison').onclick=()=>dialog.close();if(!dialog.open)dialog.showModal();renderSessionComparison();
}
function renderSessionComparison(){
 const a=data.workouts.find(w=>String(w.id)===document.getElementById('compare-a').value),b=data.workouts.find(w=>String(w.id)===document.getElementById('compare-b').value),host=document.getElementById('comparison-results');host.replaceChildren();
 if(!a||!b||a.id===b.id){host.textContent='Choose two different saved workouts.';return;}
 const table=document.createElement('table');table.className='session-comparison-table';const header=table.createTHead().insertRow();
 for(const text of ['Exercise / mode','A · '+a.date,'B · '+b.date]){const th=document.createElement('th');th.scope='col';th.textContent=text;header.appendChild(th);}
 const body=table.createTBody();for(const entry of LoadnoteProgress.compare(a,b)){const row=body.insertRow();for(const text of [entry.name+' · '+entry.mode,entry.left.length?entry.left.map(detailSetText).join(' | '):'Not in this workout',entry.right.length?entry.right.map(detailSetText).join(' | '):'Not in this workout'])row.insertCell().textContent=text;}
 host.appendChild(table);
}
