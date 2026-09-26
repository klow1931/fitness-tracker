/* v2.35 — actual nine-attempt logging for mock and competition meets. */
(function(){
 'use strict';
 let busy=false;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label={made:'Made',missed:'Missed',passed:'Passed',unrecorded:'Not recorded'};
 const lifts=['squat','bench','deadlift'];
 const unit=()=>unitLabel();
 function render(){
  const host=document.getElementById('meet-cycle');if(!host)return;
  let cycles;try{cycles=(window.LoadnoteMeetResult||LoadnoteMockMeet).validate(data);}catch(error){const out=document.createElement('p');out.setAttribute('role','alert');out.textContent=error.message;host.append(out);return;}
  for(const cycle of cycles){
   const card=[...host.querySelectorAll('[data-cycle]')].find(el=>el.dataset.cycle===cycle.id);if(!card||!cycle.scheduledAt)continue;
   card.querySelector('[data-meet-result]')?.remove();card.querySelector('[data-mock-meet]')?.remove();
   const wrap=document.createElement('div');wrap.dataset.meetResult=cycle.id;wrap.dataset.mockMeet=cycle.id;
   const report=(window.LoadnoteMeetResult||LoadnoteMockMeet).inspect(data,{cycleId:cycle.id,asOf:today()});
   if(!report)continue;
   const eligible=today()>=cycle.config.meetDate,type=report.eventType,eventLabel=report.eventLabel;
   const summary=report.resultRecorded?'Results recorded · '+(report.totalKg==null?'incomplete total':toDisplay(report.totalKg)+' '+unit()+' total'):'Results not recorded';
   wrap.innerHTML='<details class="more-details mock-meet-results" data-event-kind="'+esc(type)+'"><summary>'+esc(eventLabel)+' · '+esc(summary)+'</summary>'+
    '<p>Event type: <b>'+(type==='competition'?'Competition meet':'Mock meet')+'</b> · date: '+esc(cycle.config.meetDate)+'. Enter actual attempts, not proposed openers or estimated maxes.</p>'+
    (type==='competition'?'<p class="more-hint">Competition entries are athlete-entered records. Loadnote does not verify official federation results or placing.</p>':'<p class="more-hint">Mock-meet results remain training outcomes and are kept distinct from competition meets.</p>')+
    (!eligible?'<p>Attempt recording opens on the event date. Your original cycle stays unchanged.</p>':
     '<div class="mock-meet-lifts">'+lifts.map(lift=>{
       const row=report.lifts[lift];
       return '<section class="mock-meet-lift" data-meet-lift="'+lift+'"><h4>'+esc(row.name)+'</h4>'+
        row.attempts.map((attempt,i)=>'<div class="mock-meet-attempt"><label>Attempt '+(i+1)+' · '+esc(unit())+'<input class="input" type="number" inputmode="decimal" min="0" max="'+(unit()==='kg'?'1000':'2204.62')+'" step="any" data-meet-weight="'+lift+'-'+i+'" value="'+(attempt.weightKg==null?'':toDisplay(attempt.weightKg))+'"></label>'+
        '<label>Result<select class="input" data-meet-status="'+lift+'-'+i+'">'+Object.entries(label).map(([value,name])=>'<option value="'+value+'"'+(value===attempt.status?' selected':'')+'>'+name+'</option>').join('')+'</select></label></div>').join('')+
       '<p class="mock-meet-best">'+(row.bestKg==null?'No made attempt recorded':'Best made: '+toDisplay(row.bestKg)+' '+unit())+'</p></section>';
     }).join('')+'</div>'+
     '<label class="mock-meet-note">Event notes<textarea id="meet-notes-'+esc(cycle.id)+'" class="input" maxlength="1000" placeholder="Execution, equipment, judging notes, or anything to review afterward">'+esc(report.notes)+'</textarea></label>'+
     '<label class="mock-meet-confirm"><input type="checkbox" data-meet-confirm> I checked these actual attempt outcomes and loads.</label>'+
     '<button type="button" class="btn-primary" data-meet-save>'+(report.resultRecorded?'Save corrected results':'Save '+(type==='competition'?'competition':'mock-meet')+' results')+'</button><p role="alert" data-meet-error></p>')+
     (report.resultRecorded?'<p class="mock-meet-total">'+(report.totalKg==null?'No full three-lift total yet':'Recorded three-lift total: '+toDisplay(report.totalKg)+' '+unit())+'</p><p>Saved '+esc(report.revisionAt)+' · corrections retain prior revisions.</p>':'')+
     (eligible&&report.phaseContext?'<details class="more-details mock-meet-recap"><summary>Post-cycle training recap</summary><p>'+report.phaseContext.completedWeeks+' / '+report.phaseContext.totalWeeks+' fully elapsed program weeks; training and event results remain separate.</p>'+
       report.phaseContext.phases.map(p=>'<article><b>'+esc(p.phase)+' · '+p.weekCount+' weeks</b><p>'+p.linkedSessions+' linked / '+p.plannedSessions+' planned sessions · '+p.unconfirmedSessions+' unconfirmed · '+p.explicitSkips+' explicitly skipped</p>'+
        lifts.map(l=>'<p>'+esc(report.lifts[l].name)+': '+p.lifts[l].loggedSets+' valid logged / '+p.lifts[l].originalSets+' original sets · '+p.lifts[l].capacityDates+' capacity-evidence dates'+(p.lifts[l].observedChangePct==null?' (no within-phase comparison)':' · observed estimated-capacity difference '+p.lifts[l].observedChangePct+'%')+'</p>').join('')+'</article>').join('')+
       '<p>'+esc(report.notice)+'</p></details>':'')+'</details>';
   card.append(wrap);
   if(!eligible)continue;
   wrap.querySelectorAll('[data-meet-status]').forEach(select=>select.addEventListener('change',()=>{
    const load=wrap.querySelector('[data-meet-weight="'+select.dataset.meetStatus+'"]'),needs=select.value==='made'||select.value==='missed';
    load.disabled=!needs;if(!needs)load.value='';
   }));
   wrap.querySelectorAll('[data-meet-status]').forEach(select=>select.dispatchEvent(new Event('change')));
   wrap.querySelector('[data-meet-save]').onclick=async()=>{
    if(busy)return;
    const error=wrap.querySelector('[data-meet-error]');error.textContent='';
    const attempts=Object.fromEntries(lifts.map(lift=>[lift,[0,1,2].map(i=>{
     const status=wrap.querySelector('[data-meet-status="'+lift+'-'+i+'"]').value,val=wrap.querySelector('[data-meet-weight="'+lift+'-'+i+'"]').value;
     return {status,weightKg:status==='made'||status==='missed'?(val===''?null:Math.round(toStorage(Number(val))*100)/100):null};
    })]));
    busy=true;
    try{
     const next=(window.LoadnoteMeetResult||LoadnoteMockMeet).save(data,cycle.id,{date:cycle.config.meetDate,attempts,notes:wrap.querySelector('#meet-notes-'+CSS.escape(cycle.id)).value},{confirmed:wrap.querySelector('[data-meet-confirm]').checked,expectedRevision:report.revisionAt});
     clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();window.renderMeetCycle?.();window.renderPhaseReview?.();showToast((type==='competition'?'Competition':'Mock-meet')+' results saved','success');
     const refreshed=[...document.querySelectorAll('[data-cycle]')].find(el=>el.dataset.cycle===cycle.id);if(refreshed)refreshed.open=true;
    }catch(e){error.textContent=e.message;}finally{busy=false;}
   };
  }
 }
 window.renderMockMeet=render;
 window.renderMeetResult=render;
})();
