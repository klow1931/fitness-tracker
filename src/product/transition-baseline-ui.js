/* v2.42 — transition baseline review inside saved phase-program cards. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./transition-baseline'));
 else root.LoadnoteTransitionBaselineUI=factory(root.LoadnoteTransitionBaseline);
})(typeof globalThis!=='undefined'?globalThis:this,function(Transition){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const displayKg=kg=>typeof toDisplay==='function'?toDisplay(kg):Math.round(Number(kg)*10)/10;
 const unit=()=>typeof unitLabel==='function'?unitLabel():'kg';
 function summary(s){
   return '<div class="cycle-controller-summary"><p><b>Frozen transition baseline</b> · '+esc(s.asOf)+' · '+s.schedule.completed+'/'+s.schedule.expected+' scheduled sessions completed'+(s.schedule.adherence==null?'':' · '+s.schedule.adherence+'% resolved-session adherence')+'</p>'+
    Transition.LIFTS.map(l=>{const x=s.lifts[l];return '<p><b>'+esc(x.name)+'</b>'+(x.targetKg?' · target '+displayKg(x.targetKg)+' '+unit():'')+(x.currentReference?' · transition reference '+displayKg(x.currentReference.kg)+' '+unit():' · transition reference unavailable')+(x.changePct==null?'':' · block reference change '+(x.changePct>0?'+':'')+x.changePct+'%')+'<br><small>Selected TM '+displayKg(x.selectedTrainingMaxKg)+' '+unit()+' · last 28d '+x.recent28d.sessions+' sessions / '+x.recent28d.sets+' sets'+(x.recent28d.averageRpe==null?'':' · avg RPE '+x.recent28d.averageRpe)+'</small></p>';}).join('')+
    '<p class="more-hint">Saved once as evidence of the handoff. It does not rewrite workouts, goals, training maxes or the reviewed program.</p></div>';
 }
 function card(program,state,asOf){
   if(!program?.scheduledAt)return '';
   const saved=Transition.validate(state?.transitionSnapshots||[]).find(x=>x.programId===program.id);
   if(saved)return '<details class="more-details" data-transition-card="'+esc(program.id)+'"><summary>Transition baseline · saved '+esc(saved.asOf)+'</summary>'+summary(saved)+'<p>Review note: '+esc(saved.review.notes||'No note')+'</p></details>';
   const end=Transition.endDate(program);if(!end)return '';
   if(!asOf||asOf<end)return '<details class="more-details" data-transition-card="'+esc(program.id)+'"><summary>Transition baseline · available after '+esc(end)+'</summary><p class="more-hint">Finish the reviewed sequence first. Missed or unconfirmed sessions will remain visible in the handoff evidence.</p></details>';
   return '<details class="more-details" data-transition-card="'+esc(program.id)+'"><summary>Transition baseline · ready to review</summary><p>Freeze goals, competition-lift evidence, selected training maxes, recent workload/RPE, adherence and phase-review history at this program handoff.</p><button type="button" class="btn-secondary" data-transition-review="'+esc(program.id)+'">Review transition baseline</button><div data-transition-result role="status"></div></details>';
 }
 function previewHtml(r){
   return summary({...r,review:{notes:''}})+'<ul>'+r.notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul><label>Transition note<textarea class="input" data-transition-note maxlength="1000"></textarea></label><label><input type="checkbox" data-transition-confirm> I reviewed this handoff evidence and want to freeze it as the baseline for the next block.</label><button type="button" class="btn-primary" data-transition-save="'+esc(r.programId)+'">Save transition baseline</button>';
 }
 function bind(host){
   host?.querySelectorAll('[data-transition-review]').forEach(button=>button.onclick=()=>{
     const output=button.closest('[data-transition-card]').querySelector('[data-transition-result]');
     try{const report=Transition.preview(data,{programId:button.dataset.transitionReview,asOf:today()});output._transitionReport=report;output.innerHTML=previewHtml(report);bindSave(output);}catch(e){output.textContent=e.message;}
   });
 }
 function bindSave(output){
   const button=output.querySelector('[data-transition-save]');if(!button)return;
   button.onclick=async()=>{
     const confirmed=output.querySelector('[data-transition-confirm]').checked,note=output.querySelector('[data-transition-note]').value;
     try{const next=Transition.save(data,output._transitionReport,{confirmed,notes:note},{now:new Date().toISOString()});clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();renderPhaseBuilder();showToast('Transition baseline saved','success');}
     catch(e){output.setAttribute('role','alert');const err=document.createElement('p');err.textContent=e.message;output.append(err);}
   };
 }
 return {card,bind,summary};
});
