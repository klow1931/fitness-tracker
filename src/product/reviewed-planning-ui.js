/* Shared dialog and durable commit helpers for athlete-reviewed planning. */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function dialog(id,title,body){if(document.getElementById(id)?.open)return null;document.getElementById(id)?.remove();const d=document.createElement('dialog');d.id=id;d.className='card schedule-dialog adaptive-session-dialog';d.innerHTML='<div class="adaptive-dialog-header"><h2>'+esc(title)+'</h2><button type="button" data-review-close class="btn-secondary">Close</button></div><div class="adaptive-dialog-body">'+body+'<p data-review-error role="alert"></p></div>';d.dataset.busy='false';document.body.append(d);d.querySelector('[data-review-close]').onclick=()=>d.close();d.oncancel=e=>{if(d.dataset.busy==='true')e.preventDefault();};d.onclose=()=>d.remove();d.showModal();return d;}
 function error(d,e){d.querySelector('[data-review-error]').textContent=e?.message||String(e||'');}
 async function save(d,build){if(d.dataset.busy==='true')return false;d.dataset.busy='true';d.querySelectorAll('button,input,select,textarea').forEach(x=>x.disabled=true);try{const next=build();clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();window.renderProfileHub?.();window.renderProgrammingProfile?.();window.renderProgrammingWorkspace?.();window.renderProgramLifecycle?.();window.renderCoachingReview?.();window.LoadnoteCoachCompanionUI?.refresh?.();return true;}catch(e){error(d,e);return false;}finally{d.dataset.busy='false';d.querySelectorAll('button,input,select,textarea').forEach(x=>x.disabled=false);}}
 const drafts=()=>!!(loggerHasContent()||readLoggerDraft()||window.LoadnoteSportPlannerUI?.hasDraft?.());
 const options=(rows,id)=>rows.map(r=>'<option value="'+esc(r.id)+'" '+(id===r.id?'selected':'')+'>'+esc(r.name)+'</option>').join('');
 const describe=e=>e.name+' · '+(e.type==='cardio'?e.duration+' min':(e.sets||[]).map(s=>toDisplay(s.weight)+' '+unitLabel()+' × '+s.reps+' @'+s.targetRpe).join(' / '));
 window.LoadnoteReviewedPlanningUI={esc,dialog,error,save,drafts,options,describe};
})();
