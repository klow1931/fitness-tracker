/* v2.37 — adopt saved user programs and review their bounded weekly adaptations. */
(function(){
 'use strict';let busy=false,preview=null,reviewReport=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 function render(){
  const host=document.getElementById('program-adoption');if(!host||!window.LoadnoteProgramAdoption)return;
  const records=LoadnoteProgramAdoption.validate(data.adoptedPrograms||[]),sources=data.programs||[];
  host.innerHTML='<div class="decision-section-heading"><span class="eyebrow">USE YOUR PROGRAM</span><h3>Adopt an existing program</h3><p>Freeze a saved program as a reviewed baseline so Loadnote can compare what was planned with what you actually do. User-authored structure stays separate from Loadnote-filled execution targets.</p></div>'+
   (sources.length?'<label>Saved program<select id="adoption-source" class="input">'+sources.slice().reverse().map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name||'Saved program')+'</option>').join('')+'</select></label><button type="button" class="btn-primary" id="adoption-open">Review for adoption</button>':'<p>No saved legacy program is available yet. Programs you create in the Program Library can be adopted here.</p>')+
   records.slice().reverse().map(r=>'<details class="more-details" open data-adopted="'+esc(r.id)+'"><summary>'+esc(r.sourceSnapshot.name||'Adopted program')+' · '+r.config.weeks+' weeks · '+(r.scheduledAt?'Scheduled':'Reviewed')+'</summary><p>Start '+esc(r.config.startDate)+' · '+r.sessions.length+' planned sessions · original saved program snapshot retained.</p><p>'+esc(r.warnings.join(' '))+'</p>'+(r.scheduledAt?reviewHtml(r):'<button type="button" class="btn-primary" data-adoption-schedule="'+esc(r.id)+'">Schedule adopted program</button>')+'</details>').join('')+
   '<p id="adoption-status" role="alert"></p>';
  host.querySelector('#adoption-open')?.addEventListener('click',()=>open(sources.find(p=>String(p.id)===host.querySelector('#adoption-source').value)));
  host.querySelectorAll('[data-adoption-schedule]').forEach(b=>b.onclick=()=>schedule(b.dataset.adoptionSchedule));
  host.querySelectorAll('[data-adoption-review]').forEach(b=>b.onclick=()=>analyze(b.dataset.adoptionReview,Number(b.dataset.week)));
 }
 function reviewHtml(r){
   const weeks=[...new Set(r.sessions.map(s=>s.week))].filter(w=>w<r.config.weeks&&r.sessions.filter(s=>s.week===w).every(s=>s.date<=today())&&!(r.weeklyReviews||[]).some(x=>x.week===w));
   if(!weeks.length)return '<p class="more-hint">No completed adopted-program week is awaiting review.</p>';
   const w=weeks[0];return '<button type="button" class="btn-secondary" data-adoption-review="'+esc(r.id)+'" data-week="'+w+'">Review completed week '+w+'</button><div data-adoption-review-output="'+esc(r.id)+'"></div>';
 }
 function open(source){
   if(!source||busy)return;preview=null;
   let dlg=document.getElementById('adoption-dialog');if(!dlg){dlg=document.createElement('dialog');dlg.id='adoption-dialog';dlg.className='card schedule-dialog';document.body.append(dlg);}
   const count=source.days?.length||0,defs=LoadnoteProgramAdoption.defaults[count]||Array.from({length:count},(_,i)=>i%7);
   dlg.innerHTML='<form id="adoption-form"><h2>Adopt '+esc(source.name||'saved program')+'</h2><p>Loadnote will preserve the saved program text, then create a structured execution baseline only after you review it.</p>'+
    '<label>Start date<input class="input" type="date" id="adoption-start" value="'+today()+'"></label>'+
    '<label>Program length<input class="input" type="number" id="adoption-weeks" min="1" max="52" value="12"></label>'+
    '<label>Default RPE cap when the program does not specify one<input class="input" type="number" id="adoption-rpe" min="1" max="10" step="0.5" value="8"></label>'+
    '<label class="cycle-check"><input type="checkbox" id="adoption-loads" checked> Use the most recent pre-program logged load as an execution target when available. This is marked as Loadnote-filled, not user-authored.</label>'+
    '<div><b>Training days</b>'+source.days.map((d,i)=>'<label>'+esc(d.day||('Day '+(i+1)))+'<select class="input" data-adoption-weekday="'+i+'">'+dayNames.map((n,k)=>'<option value="'+k+'" '+(k===defs[i]?'selected':'')+'>'+n+'</option>').join('')+'</select></label>').join('')+'</div>'+
    '<button class="btn-primary" type="submit">Preview adopted baseline</button><div id="adoption-preview"></div><p id="adoption-error" role="alert"></p><button type="button" class="btn-secondary" id="adoption-close">Close</button></form>';
   const form=dlg.querySelector('#adoption-form'),out=dlg.querySelector('#adoption-preview'),error=dlg.querySelector('#adoption-error');
   form.onsubmit=e=>{e.preventDefault();try{
     const weekdays=[...dlg.querySelectorAll('[data-adoption-weekday]')].map(s=>Number(s.value));
     preview=LoadnoteProgramAdoption.prepare(data,source.id,{startDate:dlg.querySelector('#adoption-start').value,weeks:Number(dlg.querySelector('#adoption-weeks').value),weekdays,defaultTargetRpe:Number(dlg.querySelector('#adoption-rpe').value),inferLoads:dlg.querySelector('#adoption-loads').checked});
     const sample=preview.sessions.slice(0,Math.min(count*2,preview.sessions.length));
     out.innerHTML='<h3>Review baseline</h3><p>'+preview.sessions.length+' sessions · '+preview.config.weeks+' weeks. Nothing is scheduled yet.</p>'+preview.warnings.map(w=>'<p class="more-hint">'+esc(w)+'</p>').join('')+
      '<details class="more-details" open><summary>First two weeks</summary>'+sample.map(s=>'<article><b>'+esc(s.date)+' · '+esc(s.name)+'</b>'+s.exercises.map(ex=>'<p>'+esc(ex.name)+' · '+ex.sets.length+' × '+ex.sets[0].reps+(Object.hasOwn(ex.sets[0],"weight")?' · '+toDisplay(ex.sets[0].weight)+' '+unitLabel():' · load unspecified')+' · RPE cap '+ex.sets[0].targetRpe+' <small>('+(ex.loadSource==='recent-log'?'Loadnote-filled from recent log':ex.loadSource==='unspecified'?'load unspecified':esc(ex.loadSource))+', '+(ex.rpeSource==='adoption-default'?'athlete-approved adoption default':esc(ex.rpeSource))+')</small></p>').join('')+'</article>').join('')+'</details>'+
      '<label>Adoption notes<textarea class="input" id="adoption-notes" maxlength="1000"></textarea></label><label class="cycle-check"><input type="checkbox" id="adoption-confirm"> I reviewed the original program snapshot, dates, exercise targets, inferred loads and default RPE caps.</label><button type="button" class="btn-primary" id="adoption-save">Save adopted baseline</button>';
     out.querySelector('#adoption-save').onclick=async()=>{if(busy)return;busy=true;try{const next=LoadnoteProgramAdoption.save(data,preview,{confirmed:out.querySelector('#adoption-confirm').checked,notes:out.querySelector('#adoption-notes').value});clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();dlg.close();render();showToast('Adopted program baseline saved','success');}catch(err){error.textContent=err.message;}finally{busy=false;}};
     error.textContent='';
   }catch(err){preview=null;out.replaceChildren();error.textContent=err.message;}};
   dlg.querySelector('#adoption-close').onclick=()=>dlg.close();dlg.showModal();
 }
 async function schedule(id){
   if(busy||!confirm('Schedule this reviewed adopted program? Existing Calendar sessions will not be replaced.'))return;busy=true;
   try{const next=LoadnoteProgramAdoption.schedule(data,id);clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();window.renderSchedule?.();render();showToast('Adopted program scheduled','success');}
   catch(e){document.getElementById('adoption-status').textContent=e.message;}finally{busy=false;}
 }
 function analyze(id,week){
   const host=document.querySelector('[data-adoption-review-output="'+CSS.escape(id)+'"]');if(!host)return;
   try{reviewReport=LoadnoteProgramAdoption.analyzeWeek(data,{programId:id,week,asOf:today()});const rows=Object.entries(reviewReport.findings);
    host.innerHTML='<div class="cycle-controller-summary"><p><b>Week '+week+' → '+reviewReport.nextWeek+'</b></p>'+rows.map(([k,f])=>'<label class="cycle-review-choice"><b>'+esc(f.name)+'</b><small>'+f.comparableRpeSets+' comparable RPE sets · '+f.aboveCap+' above cap · '+f.completedExposures+'/'+f.plannedExposures+' exposures linked</small><select class="input" data-adopt-choice="'+esc(k)+'"><option value="keep">Keep original next-week plan</option>'+(f.canReduceOne?'<option value="reduce-one">One fewer set per matching next-week exposure</option>':'')+'</select><small>'+esc(f.canReduceOne?'Bounded reduction is supported for athlete review.':f.reasons.join(' '))+'</small></label>').join('')+
     '<details class="more-details"><summary>Safeguards</summary>'+reviewReport.notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</details><label>Review notes<textarea class="input" id="adopt-review-notes" maxlength="1000"></textarea></label><label class="cycle-check"><input type="checkbox" id="adopt-review-confirm"> I reviewed these next-week choices.</label><button type="button" class="btn-primary" id="adopt-review-save">Approve review</button><p role="alert" id="adopt-review-error"></p>';
    host.querySelector('#adopt-review-save').onclick=async()=>{if(busy)return;busy=true;try{const choices={};host.querySelectorAll('[data-adopt-choice]').forEach(s=>choices[s.dataset.adoptChoice]=s.value);const next=LoadnoteProgramAdoption.applyWeekReview(data,reviewReport,choices,{confirmed:host.querySelector('#adopt-review-confirm').checked,notes:host.querySelector('#adopt-review-notes').value});clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();window.renderSchedule?.();render();showToast('Adopted-program review approved','success');}catch(e){host.querySelector('#adopt-review-error').textContent=e.message;}finally{busy=false;}};
   }catch(e){host.innerHTML='<p role="alert">'+esc(e.message)+'</p>';}
 }
 window.renderProgramAdoption=render;
})();
