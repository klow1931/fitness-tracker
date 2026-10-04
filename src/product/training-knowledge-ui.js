(function(){
 'use strict';
 const K=()=>window.LoadnoteTrainingKnowledge;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let busy=false;
 function render(){
  const host=document.getElementById('muscle-workload');if(!host||!K())return;
  const report=K().workload(data,{asOf:today()});
  const assigned=new Set();for(const e of data.exerciseCatalog||[]){try{const m=K().mapping(e.muscles);if(m?.mode==='resistance')for(const k of [...m.primary,...m.secondary])assigned.add(k);}catch{}}
  const rows=Object.entries(report.groups).filter(([k])=>assigned.has(k));
  host.innerHTML=`<p>${report.from} – ${report.asOf} · Current corrected history. History completeness unknown.</p><p>Direct sets and indirect exposures are separate counts, not measures of growth or recovery. Actual RPE coverage describes direct sets; missing effort stays unknown.</p><div class="overflow-x-auto"><table><thead><tr><th>Muscle</th><th>Direct sets</th><th>Indirect exposures</th><th>RPE coverage</th><th>RPE 7–10 sets</th></tr></thead><tbody>${rows.map(([k,g])=>`<tr><th>${esc(K().MUSCLES[k])}</th><td>${g.direct}</td><td>${g.indirect}</td><td>${g.effortKnown}/${g.direct}</td><td>${g.nearFailure}</td></tr>`).join('')||'<tr><td colspan="5">Confirm muscle mappings to see workload. Unknown assignments are not zero stimulus.</td></tr>'}</tbody></table></div><p>${report.unmappedSets} unmapped sets · ${report.incompleteSets} incomplete/hold records · ${report.skillSets} technical weightlifting sets · ${report.otherSets} other sets · ${report.excludedSets} excluded sets.</p><button type="button" class="btn-secondary" id="muscle-map-open">Confirm muscle mappings</button><details><summary>Training knowledge & sources</summary>${Object.entries(K().GUIDANCE).map(([k,v])=>`<p><b>${esc(k)}</b>: ${esc(v)}</p>`).join('')}${Object.values(K().SOURCES).map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></p>`).join('')}<p>Counts use confirmed exercise identities, including compounds. Warm-ups and explicitly skipped/uncompleted sets are excluded. Timed holds and invalid rep/load records are reported separately. No workload threshold automatically changes your program.</p></details>`;
  host.querySelector('#muscle-map-open').onclick=open;
  window.LoadnoteMuscleReviewUI?.render(host);
  window.LoadnoteSportTrainingUI?.render(host);
 }
 function open(){
  let dialog=document.getElementById('muscle-map-dialog');if(dialog)dialog.remove();
  dialog=document.createElement('dialog');dialog.id='muscle-map-dialog';dialog.className='card';
  dialog.innerHTML=`<form><h2>Confirm muscle mappings</h2><p>Mappings describe your exercise execution. Suggestions need your review. Olympic lifts should use technical weightlifting mode.</p><label>Exercise<select class="input" id="muscle-exercise">${(data.exerciseCatalog||[]).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('')}</select></label><label>Training mode<select class="input" id="muscle-mode"><option value="resistance">Resistance training</option><option value="weightlifting">Technical weightlifting</option><option value="other">Other / exclude from muscle counts</option></select></label><div id="muscle-choices"></div><button type="button" class="btn-secondary" id="muscle-suggest">Fill suggestion for review</button><p id="muscle-map-status" role="status"></p><button type="submit" class="btn-primary">Save confirmed mapping</button> <button type="button" class="btn-secondary" id="muscle-clear">Clear mapping</button> <button type="button" class="btn-secondary" id="muscle-close">Close</button></form>`;
  document.body.appendChild(dialog);
  const entry=()=>data.exerciseCatalog.find(e=>e.id===dialog.querySelector('#muscle-exercise').value);
  function fill(m){
   dialog.querySelector('#muscle-mode').value=m?.mode||'resistance';
   dialog.querySelector('#muscle-choices').innerHTML=Object.entries(K().MUSCLES).map(([k,label])=>`<label>${esc(label)}<select class="input" data-muscle="${k}"><option value="none">No assigned role</option><option value="primary" ${m?.primary?.includes(k)?'selected':''}>Primary / direct</option><option value="secondary" ${m?.secondary?.includes(k)?'selected':''}>Secondary / indirect</option></select></label>`).join('');
  }
  function load(){let m=null;try{m=K().mapping(entry()?.muscles);}catch{}fill(m);dialog.querySelector('#muscle-map-status').textContent=m?'Saved confirmed mapping':'Unknown until confirmed';}
  dialog.querySelector('#muscle-exercise').onchange=load;load();
  dialog.querySelector('#muscle-suggest').onclick=()=>{const m=K().suggestion(entry()?.name);if(m)fill(m);dialog.querySelector('#muscle-map-status').textContent=m?'Suggestion only — review each assignment before saving':'No reliable suggestion; choose assignments manually';};
  dialog.querySelector('#muscle-close').onclick=()=>dialog.close();
  async function save(clear){
   if(busy)return;busy=true;
   try{
    const id=entry()?.id;if(!id)throw Error('Log an exercise first');
    const primary=[],secondary=[];for(const el of dialog.querySelectorAll('[data-muscle]')){if(el.value==='primary')primary.push(el.dataset.muscle);if(el.value==='secondary')secondary.push(el.dataset.muscle);}
    const m=clear?null:K().mapping({confirmed:true,mode:dialog.querySelector('#muscle-mode').value,primary,secondary});
    let next={...data,exerciseCatalog:data.exerciseCatalog.map(e=>{if(e.id!==id)return e;const copy={...e};if(m)copy.muscles=m;else delete copy.muscles;return copy;})};
    next=LoadnoteIntegrity.addRecoverySnapshot(next,data,'Before muscle mapping change');clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();render();load();showToast('Muscle mapping saved','success');
   }catch(error){dialog.querySelector('#muscle-map-status').textContent=error.message;}finally{busy=false;}
  }
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();void save(false);};dialog.querySelector('#muscle-clear').onclick=()=>void save(true);dialog.showModal();
 }
 window.LoadnoteTrainingKnowledgeUI={render,open};
})();
