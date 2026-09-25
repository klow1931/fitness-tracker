/* v2.30 — review, save and explicitly schedule a configurable mock-meet cycle. */
(function(){
 'use strict';
 let busy=false,preview=null,asOf='',chosenSource=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const load=s=>toDisplay(s.weight)+' '+unitLabel()+' × '+s.reps+' · RPE cap '+s.targetRpe;
 function previewHtml(p){
  return '<h3>Review all '+p.config.weeks+' weeks</h3><p>'+p.sessions.length+' scheduled workout proposals · mock meet '+esc(p.config.meetDate)+' (not automatically prescribed attempts).</p>'+
   '<p>Accumulation '+p.config.accumulationWeeks+' weeks · Strength '+p.config.strengthWeeks+' · Peak '+p.config.peakWeeks+' · Taper '+p.config.taperWeeks+' · Mock meet 1.</p>'+
   '<details class="more-details"><summary>Quality warnings · '+p.warnings.length+'</summary><ul>'+p.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul></details>'+
   p.weekly.map(w=>'<details class="more-details" data-cycle-week="'+w.week+'"><summary>Week '+w.week+' / '+p.config.weeks+' · '+esc(w.phase)+' · '+w.sessionCount+' sessions</summary><p>'+esc(w.startDate)+' – '+esc(w.endDate)+'</p>'+
     (w.meetDate?'<p><b>Mock meet '+esc(w.meetDate)+'.</b> No attempts or competition-day training are inferred. Record actual results as a workout.</p>':'')+
     p.sessions.filter(s=>s.week===w.week).map(s=>'<article><b>'+esc(s.date)+' · '+esc(s.name)+'</b> · ~'+s.estimatedMinutes+' min'+s.exercises.map(e=>'<p>'+esc(e.name)+': '+e.sets.map(load).join(' / ')+'</p>').join('')+'</article>').join('')+
     '<p>'+Object.entries(w.lifts).map(([lift,l])=>esc(lift)+': '+l.exposures+' exposures / '+l.sets+' planned sets').join(' · ')+'</p></details>').join('')+
   '<label>Review notes<textarea class="input" id="cycle-notes" maxlength="1000" placeholder="Anything you want to remember when reviewing this cycle"></textarea></label>'+
   '<label class="cycle-check"><input type="checkbox" id="cycle-confirm"> I reviewed the complete original program, training maxes, peak, taper, dates, and mock-meet limitations.</label>'+
   '<button type="button" class="btn-primary" id="cycle-save">Save original cycle</button><p class="more-hint">Save first; scheduling is a separate athlete-approved action. Future edits must not overwrite completed workouts.</p>';
 }
 function render(){
  const host=document.getElementById('meet-cycle');if(!host)return;
  const sources=LoadnotePhaseBuilder.validate(data.phasePrograms||[]);
  let records;try{records=LoadnoteMeetCycle.validate(data.meetCycles||[]);}catch(error){host.innerHTML='<p role="alert">'+esc(error.message)+'</p>';return;}
  host.innerHTML='<div class="decision-section-heading"><span class="eyebrow">FLEXIBLE CYCLE</span><h3>Mock-meet programming</h3><p>Build 7–52 weeks from reviewed lift setup. 8, 12, 16 and 20 weeks are presets, not fixed limits.</p></div>'+
    (sources.length?'<label>Reviewed lift setup<select id="cycle-source" class="input">'+sources.slice().reverse().map(p=>'<option value="'+esc(p.id)+'">'+esc(p.config.name)+' · '+esc(p.config.startDate)+'</option>').join('')+'</select></label><button id="cycle-new" type="button" class="btn-primary">Build a mock-meet cycle</button>':'<p>First create and save a phase-based proposal above to confirm competition-lift identities, working sets, training maxes and exposure days. The proposal is used as lift setup; no workouts are scheduled by creating it.</p>')+
    records.slice().reverse().map(r=>'<details class="more-details" data-cycle="'+esc(r.id)+'"><summary>'+esc(r.sourceProgram.config.name)+' · '+r.config.weeks+' weeks · '+(r.scheduledAt?'Scheduled':'Reviewed')+'</summary><p>Start '+esc(r.config.startDate)+' · mock meet '+esc(r.config.meetDate)+'</p><p>Accumulation '+r.config.accumulationWeeks+' · Strength '+r.config.strengthWeeks+' · Peak '+r.config.peakWeeks+' · Taper '+r.config.taperWeeks+' · Meet 1</p><p>Approved '+esc(r.createdAt)+'. Original program preserved for future comparisons.</p><details class="more-details"><summary>Original weekly outline</summary>'+r.weekly.map(w=>'<p>Week '+w.week+': '+esc(w.phase)+' · '+w.sessionCount+' workout(s)'+(w.meetDate?' · mock meet '+esc(w.meetDate):'')+'</p>').join('')+'</details>'+(r.scheduledAt?'<p>Open workouts from Calendar. Future changes must be approved separately.</p>':'<button type="button" class="btn-primary" data-cycle-schedule="'+esc(r.id)+'">Schedule reviewed workouts</button>')+'</details>').join('')+
    '<p id="cycle-status" role="alert"></p>';
  host.querySelector('#cycle-new')?.addEventListener('click',()=>open(sources.find(p=>p.id===host.querySelector('#cycle-source').value)));
  host.querySelectorAll('[data-cycle-schedule]').forEach(b=>b.addEventListener('click',()=>schedule(b.dataset.cycleSchedule)));
  window.renderMockMeet?.();
 }
 function open(source){
  if(!source||busy)return;chosenSource=source;preview=null;
  let dlg=document.getElementById('cycle-dialog');if(!dlg){dlg=document.createElement('dialog');dlg.id='cycle-dialog';dlg.className='card schedule-dialog';document.body.append(dlg);}
  const start=source.config.startDate;
  dlg.innerHTML='<form id="cycle-form"><h2>Build your mock-meet cycle</h2><p>Using reviewed lift setup: '+esc(source.config.name)+'. Start: '+esc(start)+'. Current work and approved source remain unchanged.</p>'+
   '<label>Program length (weeks, includes meet week)<input class="input" type="number" id="cycle-weeks" min="7" max="52" step="1" value="12"></label>'+
   '<div class="cycle-presets" role="group" aria-label="Program length presets">'+[8,12,16,20].map(w=>'<button class="btn-secondary" data-cycle-preset="'+w+'" type="button">'+w+' weeks</button>').join('')+'</div>'+
   '<label>Peak duration (weeks)<select class="input" id="cycle-peak"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4</option></select></label>'+
   '<label>Taper duration (weeks)<select class="input" id="cycle-taper"><option value="1" selected>1</option><option value="2">2</option></select></label>'+
   '<label>Mock meet (Saturday or Sunday of the final week)<input class="input" id="cycle-meet-date" type="date"></label>'+
   '<p class="more-hint">Remaining weeks split between accumulation and strength; each gets at least two weeks. Beyond six weeks in a phase, the last supported loading target holds rather than automatically increasing indefinitely.</p>'+
   '<button class="btn-primary" type="submit">Preview every week</button><div id="cycle-preview"></div><p id="cycle-error" role="alert"></p><button type="button" id="cycle-close" class="btn-secondary">Close</button></form>';
  const length=dlg.querySelector('#cycle-weeks'),meet=dlg.querySelector('#cycle-meet-date'),output=dlg.querySelector('#cycle-preview'),error=dlg.querySelector('#cycle-error');
  const recalc=()=>meet.value=move(start,(Number(length.value)-1)*7+5);
  recalc();
  const invalidate=()=>{preview=null;output.replaceChildren();error.textContent='';};
  length.addEventListener('input',()=>{recalc();invalidate();});
  meet.addEventListener('input',invalidate);
  dlg.querySelector('#cycle-peak').addEventListener('change',invalidate);dlg.querySelector('#cycle-taper').addEventListener('change',invalidate);
  dlg.querySelectorAll('[data-cycle-preset]').forEach(button=>button.onclick=()=>{length.value=button.dataset.cyclePreset;recalc();invalidate();});
  dlg.querySelector('#cycle-form').onsubmit=e=>{e.preventDefault();if(busy)return;try{
   asOf=today();
   const args={version:1,weeks:Number(length.value),peakWeeks:Number(dlg.querySelector('#cycle-peak').value),taperWeeks:Number(dlg.querySelector('#cycle-taper').value),meetDate:meet.value};
   preview=LoadnoteMeetCycle.prepare(data,source,args,{asOf});
   output.innerHTML=previewHtml(preview);output.querySelector('#cycle-save').onclick=save;error.textContent='';
  }catch(err){preview=null;output.replaceChildren();error.textContent=err.message;}};
  async function save(){
   if(busy||!preview)return;busy=true;try{
     const next=LoadnoteMeetCycle.save(data,preview,{confirmed:dlg.querySelector('#cycle-confirm').checked,notes:dlg.querySelector('#cycle-notes').value},{asOf:today()});
     clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();render();window.renderSchedule?.();dlg.close();showToast('Original mock-meet cycle saved · schedule separately','success');
   }catch(err){error.textContent=err.message;}finally{busy=false;}
  }
  dlg.querySelector('#cycle-close').onclick=()=>{if(!busy)dlg.close();};
  dlg.oncancel=e=>{if(busy)e.preventDefault();};dlg.showModal();
 }
 async function schedule(id){
  if(busy||!confirm('Schedule all reviewed mock-meet cycle workouts? No existing Calendar sessions will be replaced. Mock-meet attempts are not selected.'))return;
  busy=true;const host=document.getElementById('meet-cycle');try{
   const next=LoadnoteMeetCycle.schedule(data,id,{asOf:today()});clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();render();window.renderSchedule?.();showToast('Reviewed mock-meet cycle scheduled','success');
  }catch(err){host.querySelector('#cycle-status').textContent=err.message;}finally{busy=false;}
 }
 window.renderMeetCycle=render;
})();
