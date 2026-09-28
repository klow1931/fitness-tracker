(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const aliases=document.getElementById('exercise-alias-tools'),recovery=document.getElementById('recovery-snapshots'),health=document.getElementById('training-data-health');if(!window.LoadnoteIntegrity)return;
  if(aliases){
   const catalog=data.exerciseCatalog||[],options=catalog.map(e=>`<option value="${esc(e.id)}">${esc(e.name)}${e.aliases.length?' · '+esc(e.aliases.join(', ')):''}</option>`).join('');
   aliases.innerHTML=catalog.length<2?'<p>Exercise identities will appear after you log or import workouts.</p>':`<p>${catalog.length} stable exercise identities. Compact spelling variants are linked automatically; merge other aliases here without rewriting workout history.</p><div class="block-fields"><label>Alias / duplicate<select id="exercise-alias-source" class="input">${options}</select></label><label>Canonical exercise<select id="exercise-alias-target" class="input">${options}</select></label></div><button type="button" id="merge-exercise-alias" class="btn-secondary">Merge identities</button><p class="more-hint">Example: merge “Adduction Machine” into “Hip Adduction.” Original labels remain in saved workouts, while analysis uses one identity.</p>`;
   document.getElementById('merge-exercise-alias')?.addEventListener('click',merge);
  }
  if(recovery){const snapshots=(data.recoverySnapshots||[]).slice().reverse();recovery.innerHTML=snapshots.length?snapshots.map(s=>`<article><p><b>${esc(s.label)}</b> · ${esc(new Date(s.createdAt).toLocaleString())} · ${s.fingerprint?'integrity fingerprint saved':'legacy snapshot'}</p><button type="button" class="btn-secondary" data-restore-snapshot="${esc(s.id)}">Restore</button></article>`).join(''):'<p>No automatic recovery snapshots yet. Loadnote creates one before imports and identity merges.</p>';recovery.querySelectorAll('[data-restore-snapshot]').forEach(button=>button.addEventListener('click',()=>restore(button.dataset.restoreSnapshot)));}
  if(health){
   const reliability=LoadnoteIntegrity.auditReliability(data),report=reliability.training,current=report.current,history=report.history,relationships=reliability.relationships,issues=current.issues.slice(0,8),linkIssues=relationships.issues.slice(0,8);
   const status=reliability.status==='clean'?'Current training data and record links passed the integrity audit.':reliability.blocking?'Review current training-data or record-link issues before relying on adaptive evidence.':'Current training records are usable, with revision-history warnings to review.';
   const issueHtml=issues.length?'<ul>'+issues.map(i=>`<li><b>${esc(i.date||'Unknown date')} · ${esc(i.exercise||'Exercise')}</b> · set ${esc(i.setIndex)} — ${esc(i.detail)}</li>`).join('')+'</ul>':'<p>No current load/RPE integrity issues detected by this audit.</p>';
   const linkHtml=linkIssues.length?'<ul>'+linkIssues.map(i=>`<li><b>${i.severity==='blocking'?'Blocking':'History warning'}:</b> ${esc(i.detail)}</li>`).join('')+'</ul>':'<p>Workout, Calendar and planned-work references are internally consistent.</p>';
   health.innerHTML=`<p><b>${esc(status)}</b></p><p>Strength sets: ${current.strengthSets} · usable RPE coverage: ${current.rpeCoverage==null?'—':current.rpeCoverage+'%'} · missing RPE: ${current.missingRpe} · invalid RPE: ${current.invalidRpe} · suspicious loads: ${current.suspiciousLoads}.</p>${issueHtml}<h4>Record-link integrity</h4><p>${relationships.counts.linkedWorkouts} linked workout${relationships.counts.linkedWorkouts===1?'':'s'} · ${relationships.counts.scheduledSessions} Calendar session${relationships.counts.scheduledSessions===1?'':'s'} · ${relationships.blocking} blocking issue${relationships.blocking===1?'':'s'} · ${relationships.warnings} history warning${relationships.warnings===1?'':'s'}.</p>${linkHtml}<p class="more-hint">Historical suspicious loads: ${history.suspiciousLoads}. Corrected revisions remain audit history and are not treated as the current workout record. Revision-history warnings reduce audit/undo confidence but do not replace current workouts.</p>`;
  }
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
