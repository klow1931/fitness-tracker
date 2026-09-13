(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const aliases=document.getElementById('exercise-alias-tools'),recovery=document.getElementById('recovery-snapshots');if(!window.LoadnoteIntegrity)return;
  if(aliases){
   const catalog=data.exerciseCatalog||[],options=catalog.map(e=>`<option value="${esc(e.id)}">${esc(e.name)}${e.aliases.length?' · '+esc(e.aliases.join(', ')):''}</option>`).join('');
   aliases.innerHTML=catalog.length<2?'<p>Exercise identities will appear after you log or import workouts.</p>':`<p>${catalog.length} stable exercise identities. Compact spelling variants are linked automatically; merge other aliases here without rewriting workout history.</p><div class="block-fields"><label>Alias / duplicate<select id="exercise-alias-source" class="input">${options}</select></label><label>Canonical exercise<select id="exercise-alias-target" class="input">${options}</select></label></div><button type="button" id="merge-exercise-alias" class="btn-secondary">Merge identities</button><p class="more-hint">Example: merge “Adduction Machine” into “Hip Adduction.” Original labels remain in saved workouts, while analysis uses one identity.</p>`;
   document.getElementById('merge-exercise-alias')?.addEventListener('click',merge);
  }
  if(recovery){const snapshots=(data.recoverySnapshots||[]).slice().reverse();recovery.innerHTML=snapshots.length?snapshots.map(s=>`<article><p><b>${esc(s.label)}</b> · ${esc(new Date(s.createdAt).toLocaleString())}</p><button type="button" class="btn-secondary" data-restore-snapshot="${esc(s.id)}">Restore</button></article>`).join(''):'<p>No automatic recovery snapshots yet. Loadnote creates one before imports and identity merges.</p>';recovery.querySelectorAll('[data-restore-snapshot]').forEach(button=>button.addEventListener('click',()=>restore(button.dataset.restoreSnapshot)));}
 }
 async function merge(){
  const source=document.getElementById('exercise-alias-source')?.value,target=document.getElementById('exercise-alias-target')?.value;if(!source||!target)return;if(source===target)return showToast('Choose two different exercise identities.','error');
  const sourceName=data.exerciseCatalog.find(e=>e.id===source)?.name,targetName=data.exerciseCatalog.find(e=>e.id===target)?.name;if(!confirm(`Treat “${sourceName}” as an alias of “${targetName}”? Workout labels will be preserved.`))return;
  let next;try{next=LoadnoteIntegrity.mergeExercises(data,source,target);next=LoadnoteIntegrity.addRecoverySnapshot(next,data,'Before exercise identity merge');clearTimeout(saveTimer);await persistNow(next);}catch(error){showToast('Could not merge exercises: '+error.message,'error');return;}
  data=next;invalidateViews();render();renderDashboard();renderWorkoutHistory();showToast('Exercise identities merged · historical labels preserved','success');
 }
 async function restore(id){
  if(!confirm('Restore this recovery snapshot? A snapshot of your current data will be kept so this can be reversed.'))return;let next;
  try{const restored=LoadnoteIntegrity.restoreRecoverySnapshot(data,id);restored.trainingBlocks=LoadnoteBlocks.validate(restored.trainingBlocks||[]);next=normalizeDataShape(restored);next=LoadnoteIntegrity.addRecoverySnapshot(next,data,'Before recovery restore');clearTimeout(saveTimer);await persistNow(next);}catch(error){showToast('Could not restore snapshot: '+error.message,'error');return;}
  data=next;invalidateViews();render();showTab('dashboard');updateBackupBanner();showToast('Recovery snapshot restored','success');
 }
 window.renderDataIntegrityTools=render;
})();
