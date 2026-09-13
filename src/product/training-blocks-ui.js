(function(){
 'use strict';
 const B=()=>window.LoadnoteBlocks;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let editing=null,opened=null,formUnit='kg',busy=false;
 const labels=(object,value)=>Object.entries(object).map(([k,v])=>`<option value="${esc(k)}" ${k===value?'selected':''}>${esc(v)}</option>`).join('');
 function render(){
  const host=document.getElementById('training-blocks');if(!host||!B())return;
  const blocks=B().list(data.trainingBlocks||[]),current=B().at(data.trainingBlocks||[],today(),{retrospective:true});
  host.innerHTML=`<summary><b>Training Block Context</b> · ${esc(current?.name||'No current block')}</summary><p>Describe the intent behind your training. Historical workouts inherit context by date.</p><button type="button" class="btn-secondary" data-block-create>Create block</button><div class="block-list">${blocks.map(b=>`<article><b>${esc(b.name)}</b><p>${esc(b.startDate)} – ${esc(b.endDate||'Open ended')} · ${esc(B().types[b.blockType]||b.blockType)} · ${esc(B().strategies[b.loadStrategy])}</p><p>Goal: ${esc(b.primaryGoal||'Not specified')}</p><button type="button" class="btn-secondary" data-block-edit="${esc(b.id)}">Edit</button> <button type="button" class="btn-secondary" data-block-view="${esc(b.id)}">View analysis</button> <button type="button" class="btn-secondary" data-block-delete="${esc(b.id)}">Delete</button></article>`).join('')||'<p>No blocks yet. You can add context after importing historical workouts.</p>'}</div><div id="block-analysis" role="status"></div>`;
  host.querySelector('[data-block-create]').onclick=()=>open();
  host.querySelectorAll('[data-block-edit]').forEach(el=>el.onclick=()=>open(el.dataset.blockEdit));
  host.querySelectorAll('[data-block-view]').forEach(el=>el.onclick=()=>analysis(el.dataset.blockView));
  host.querySelectorAll('[data-block-delete]').forEach(el=>el.onclick=()=>destroy(el.dataset.blockDelete));
 }
 function analysis(id){const a=B().analyze(data.trainingBlocks||[],data.workouts,id,{asOf:today(),retrospective:true});const el=document.getElementById('block-analysis');if(!a){el.textContent='Not enough data: this block has not started.';return;}
  const val=x=>x==null?'Not enough data':esc(x),trend=t=>t?`${val(t.start)} → ${val(t.end)} ${unitLabel()} (${t.percent>0?'+':''}${t.percent}%)`:'Not enough data (3 distinct days required)';
  const display=t=>t&&({...t,start:toDisplay(t.start),end:toDisplay(t.end)});
  el.innerHTML=`<h3>${esc(a.block.name)} · retrospective analysis</h3><p>${esc(a.interpretation)}</p><p>${a.workoutCount} workouts · ${a.durationDays} days · Volume ${a.totalVolume==null?'Not enough data':toDisplay(a.totalVolume)+' '+unitLabel()+'·reps'} · Average RPE ${val(a.averageRPE)}</p><p>Training days/week: ${val(a.frequencyPerWeek)}. Adherence, completion, prescribed intensity and block PRs: Not enough data.</p>${a.exercises.map(e=>`<article><b>${esc(e.name)}</b><p>Logged load: ${trend(display(e.loggedLoadTrend))}</p><p>RPE-aware estimated capacity: ${trend(display(e.estimatedCapacityTrend))}</p></article>`).join('')}<p>Logged load is not a recorded prescription. Estimates require load, reps (1–12) and RPE (6–10); no estimates come from training maxes or known 1RMs.</p>`;
 }
 function addBenchmark(field,value={}){
  const row=document.createElement('div');row.className='block-benchmark';
  const load=value.kg==null?'':(formUnit==='lb'?Math.round(value.kg*KG_TO_LB*100)/100:value.kg);
  row.innerHTML=`<label>Exercise<input class="input" data-exercise value="${esc(value.exercise)}" required maxlength="120"></label><label>Load (${formUnit})<input class="input" data-load type="number" min="0.01" step="any" value="${esc(load)}" required></label><label>Known on<input class="input" data-observed type="date" value="${esc(value.observedOn||document.getElementById('block-start').value)}" required></label><button type="button" class="btn-secondary">Remove</button>`;
  row.querySelector('button').onclick=()=>row.remove();document.getElementById(field).append(row);
 }
 function open(id){
  const b=B().list(data.trainingBlocks||[]).find(b=>b.id===id)||{};editing=id||null;opened=JSON.stringify(data.trainingBlocks||[]);formUnit=currentUnit();
  let dialog=document.getElementById('block-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='block-dialog';dialog.className='block-dialog card';document.body.append(dialog);}
  dialog.innerHTML=`<form id="block-form"><h2>${id?'Edit':'Create'} training block</h2><p>Training maxes are programming choices. Known 1RMs are athlete-reported benchmarks, not calculated capacity.</p><div class="block-fields"><label>Name<input id="block-name" class="input" required maxlength="120" value="${esc(b.name)}"></label><label>Start date<input id="block-start" class="input" type="date" required value="${esc(b.startDate||today())}"></label><label>End date (optional)<input id="block-end" class="input" type="date" value="${esc(b.endDate)}"></label><label>Block type<select id="block-type" class="input">${labels({...B().types,...(b.blockType&&!B().types[b.blockType]?{[b.blockType]:b.blockType}:{})},b.blockType||'general')}</select></label><label>Primary goal<input id="block-goal" class="input" maxlength="300" list="block-goals" value="${esc(b.primaryGoal)}"></label><datalist id="block-goals"><option value="Rebuild strength and work capacity"><option value="Build muscle"><option value="Develop strength"><option value="Prepare for competition"><option value="Recover"></datalist><label>Load strategy<select id="block-strategy" class="input">${labels(B().strategies,b.loadStrategy||'unknown')}</select></label><label>Progression intent<select id="block-intent" class="input">${labels(B().intents,b.progressionIntent||'unknown')}</select></label></div><label>Progression notes<textarea id="block-progression-notes" class="input" maxlength="2000">${esc(b.progressionNotes)}</textarea></label><details><summary>Optional training maxes and known 1RMs (${formUnit})</summary><h3>Training maxes</h3><div id="block-maxes"></div><button type="button" class="btn-secondary" id="block-add-max">Add training max</button><h3>Known / recent 1RMs</h3><div id="block-known"></div><button type="button" class="btn-secondary" id="block-add-known">Add known 1RM</button></details><label>Notes<textarea id="block-notes" class="input" maxlength="2000">${esc(b.notes)}</textarea></label><p id="block-error" role="alert"></p><button type="submit" class="btn-primary">Save block</button> <button type="button" class="btn-secondary" id="block-cancel">Cancel</button></form>`;
  for(const r of b.trainingMaxes||[])addBenchmark('block-maxes',r);for(const r of b.known1RMs||[])addBenchmark('block-known',r);
  document.getElementById('block-add-max').onclick=()=>addBenchmark('block-maxes');document.getElementById('block-add-known').onclick=()=>addBenchmark('block-known');document.getElementById('block-cancel').onclick=()=>dialog.close();document.getElementById('block-form').onsubmit=save;
  dialog.oncancel=e=>{if(busy)e.preventDefault();};dialog.showModal();
 }
 async function commit(blocks){const next={...data,trainingBlocks:blocks};clearTimeout(saveTimer);await persistNow(next);data.trainingBlocks=blocks;invalidateViews();render();}
 async function save(event){event.preventDefault();if(busy)return;busy=true;const form=event.target,buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  try{
   if(JSON.stringify(data.trainingBlocks||[])!==opened)throw Error('Blocks changed while editing. Cancel and reopen.');
   const value=id=>document.getElementById(id).value;
   const rows=id=>[...document.querySelectorAll('#'+id+' .block-benchmark')].map(row=>({exercise:row.querySelector('[data-exercise]').value,kg:Number(row.querySelector('[data-load]').value)/(formUnit==='lb'?KG_TO_LB:1),observedOn:row.querySelector('[data-observed]').value}));
   const blocks=B().upsert(data.trainingBlocks||[],{name:value('block-name'),startDate:value('block-start'),endDate:value('block-end'),blockType:value('block-type'),primaryGoal:value('block-goal'),loadStrategy:value('block-strategy'),progressionIntent:value('block-intent'),progressionNotes:value('block-progression-notes'),notes:value('block-notes'),trainingMaxes:rows('block-maxes'),known1RMs:rows('block-known')},{id:editing});
   await commit(blocks);document.getElementById('block-dialog').close();showToast('Training block saved on this device','success');
  }catch(error){document.getElementById('block-error').textContent=error.message;}finally{busy=false;buttons.forEach(b=>b.disabled=false);}
 }
 async function destroy(id){if(busy||!confirm('Delete this training block? Workouts will be preserved. Block revisions remain in backups for historical analysis.'))return;busy=true;try{await commit(B().remove(data.trainingBlocks||[],id));}catch(error){showToast('Could not delete block: '+error.message,'error');}finally{busy=false;}}
 window.renderTrainingBlocks=render;
})();
