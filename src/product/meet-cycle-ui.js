/* v2.69.2 — meet-cycle review, scheduling and current-program workout access. */
(function(){
 'use strict';
 let busy=false,preview=null,asOf='',chosenSource=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const load=s=>toDisplay(s.weight)+' '+unitLabel()+' × '+s.reps+' · RPE cap '+s.targetRpe;
 const qualityLabel=status=>status==='pass'?'PASS':status==='review'?'REVIEW':'BLOCKING';
 function qualityHtml(g){
  if(!g)return '<div class="cycle-controller-summary"><p><b>Program quality gate:</b> unavailable for this legacy proposal.</p></div>';
  return '<div class="cycle-controller-summary" data-program-quality-gate data-quality-status="'+esc(g.status)+'"><p><b>Program quality gate: '+qualityLabel(g.status)+'</b> · '+esc(g.summary)+'</p><p class="more-hint">Whole-cycle structural review only. It does not diagnose recovery or claim this is an optimal dose.</p>'+
   '<p>'+g.cycle.sessionCount+' workouts · estimated max-session range '+g.cycle.sessionMinutesRange.min+'–'+g.cycle.sessionMinutesRange.max+' min · reviewed budget '+g.cycle.sessionMinutesRange.budget+' min.</p>'+
   '<details class="more-details"><summary>Quality-gate findings · '+g.findings.length+'</summary>'+(g.findings.length?'<ul>'+g.findings.map(f=>'<li><b>'+esc(f.severity.toUpperCase())+'</b> · '+esc(f.message)+'</li>').join('')+'</ul>':'<p>No structural findings require review.</p>')+'</details>'+
   '<details class="more-details"><summary>What the gate checks</summary>'+g.notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</details></div>';
 }
 function weekQuality(p,week){
  const q=p.qualityGate?.weekly?.find(x=>x.week===week.week);if(!q)return '';
  return '<p class="more-hint">Quality preview · max session '+q.maxSessionMinutes+' / '+q.sessionBudgetMinutes+' min · '+Object.entries(q.lifts).map(([lift,l])=>esc(lift)+': '+l.exposures+'× / '+l.sets+' sets'+(l.averagePercent==null?'':' / avg '+l.averagePercent+'% TM')+(l.specificityPct==null?'':' / '+l.specificityPct+'% competition-specific')).join(' · ')+'</p>';
 }
 function loadContext(e){
  if(!Number.isFinite(e.trainingMaxKg)||!Array.isArray(e.sets))return '';
  return '<br><small>Chosen training max: '+toDisplay(e.trainingMaxKg)+' '+unitLabel()+'. Actual rounded loads: '+[...new Set(e.sets.map(s=>Math.round(s.weight/e.trainingMaxKg*1000)/10+'% TM'))].join(' / ')+'. Percentages use this training max, not your 1RM.</small>';
 }
 function specificityHtml(p){
  const lastHeavy=p.sessions.filter(s=>s.phase==='peaking').at(-1),eventWeek=p.weekly.at(-1);
  return '<details class="more-details" open><summary>Training maxes & meet-specific work</summary><p>These are the training maxes you explicitly chose. A training max is not automatically a tested 1RM. If your TM is 90% of 1RM, 80% TM is 72% of 1RM before rounding. Review this calibration before saving.</p>'+Object.entries(p.sourceProgram?.config?.lifts||chosenSource?.config?.lifts||{}).map(([lift,l])=>'<p>'+esc(l.name||lift)+': '+toDisplay(l.trainingMaxKg)+' '+unitLabel()+' chosen TM.</p>').join('')+'<p>Peak and taper use bounded example targets. Inspect the exact competition-lift loads below; the quality gate does not certify optimal meet intensity.</p><p>Last prescribed peak session: '+esc(lastHeavy?.date||'none')+'. Event week '+esc(eventWeek.startDate)+'–'+esc(eventWeek.endDate)+': '+eventWeek.sessionCount+' prescribed training sessions. Meet attempts are recorded separately.</p></details>';
 }
 function fullTimelineHtml(p){
  const t=LoadnoteMeetCycle.timeline(p,data),days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],setup=p.sourceProgram.config;
  return '<section class="cycle-controller-summary" data-meet-full-timeline aria-label="Complete meet-prep timeline"><h3>Complete '+t.totalWeeks+'-week timeline</h3><p>Lift setup is already reviewed. This is the complete requested preparation, not an additional six-week program.</p>'+
   '<p><b>Reviewed training availability:</b> '+esc(setup.days.map(d=>days[d]).join(', '))+' · '+setup.sessionMinutes+' minutes per session · '+t.plannedSessions+' proposed workouts. Chosen training maxes remain those in the reviewed lift setup.</p>'+
   '<ol>'+t.stages.map(stage=>'<li data-meet-stage="'+esc(stage.phase)+'"><b>'+esc(stage.label)+' · '+stage.weeks+' week'+(stage.weeks===1?'':'s')+'</b><span> · weeks '+stage.firstWeek+(stage.lastWeek!==stage.firstWeek?'–'+stage.lastWeek:'')+' · '+esc(stage.startDate)+' to '+esc(stage.endDate)+' · '+stage.sessions+' sessions</span></li>').join('')+'</ol>'+
   '<p><b>Event:</b> '+esc(t.eventDate)+' · '+esc(t.eventType==='competition'?'Competition meet':'Mock meet')+'. Event week has no automatic attempts or training prescription.</p>'+
   (t.conflicts.length?'<p role="status" data-meet-conflicts><b>Calendar conflict review:</b> '+t.conflicts.length+' currently scheduled session(s) fall in the proposed window. Resolve them before scheduling this cycle; Loadnote will not overwrite them.</p>':'<p data-meet-conflicts>No currently scheduled Calendar sessions conflict with the proposed window.</p>')+'</section>';
 }
 function previewHtml(p){
  const type=LoadnoteMeetCycle.eventType(p.config),label=type==='competition'?(p.config.eventName||'Competition meet'):'Mock meet';
  const decision=p.planningDecision;
  return (window.LoadnoteProgramUsabilityUI?.progress('Draft')||'')+(window.LoadnoteProgramUsabilityUI?.overview(p.sessions,p.config)||'')+'<div class="cycle-controller-summary" data-program-planning-decision><p><b>Decisions calculated your prep:</b> '+esc(decision?.summary||p.config.weeks+' weeks')+'</p>'+(decision?'<p class="more-hint">Meet date sets the total timeline. '+esc(decision.mode==='athlete-customized'?'You used advanced phase overrides; Loadnote still verified the date math and structural minimums.':'Accumulation and strength were allocated from frozen program evidence and bounded phase rules.')+'</p><details class="more-details"><summary>Why this structure?</summary>'+decision.reasons.map(r=>'<p>'+esc(r)+'</p>').join('')+'</details>':'')+'</div><h3>Review all '+p.config.weeks+' weeks</h3><p>'+p.sessions.length+' scheduled workout proposals · '+esc(label)+' '+esc(p.config.meetDate)+' (attempts are never automatically prescribed).</p>'+
   '<p>Accumulation '+p.config.accumulationWeeks+' weeks · Strength '+p.config.strengthWeeks+' · Peak '+p.config.peakWeeks+' · Taper '+p.config.taperWeeks+' · '+esc(type==='competition'?'Competition meet 1':'Mock meet 1')+'.</p>'+fullTimelineHtml(p)+
   qualityHtml(p.qualityGate)+specificityHtml(p)+
   '<details class="more-details"><summary>Builder notes · '+p.warnings.length+'</summary><ul>'+p.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul></details>'+
   p.weekly.map(w=>'<details class="more-details" data-cycle-week="'+w.week+'"><summary>Week '+w.week+' / '+p.config.weeks+' · '+esc(w.phase)+' · '+w.sessionCount+' sessions</summary><p>'+esc(w.startDate)+' – '+esc(w.endDate)+'</p>'+
     (w.meetDate?'<p><b>'+esc(label)+' '+esc(w.meetDate)+'.</b> No attempts or meet-day training are inferred. Record actual results separately.</p>':'')+
     p.sessions.filter(s=>s.week===w.week).map(s=>'<article><b>'+esc(s.date)+' · '+esc(s.name)+'</b> · ~'+s.estimatedMinutes+' min'+s.exercises.map(e=>'<p>'+esc(e.name)+': '+esc(window.LoadnoteAccessoriesUI.describe(e))+loadContext(e)+(e.progression?'<br>'+esc(LoadnoteAccessories.explanation(e)):'')+'</p>').join('')+'</article>').join('')+
     '<p>'+Object.entries(w.lifts).map(([lift,l])=>esc(lift)+': '+l.exposures+' exposures / '+l.sets+' planned sets').join(' · ')+'</p>'+weekQuality(p,w)+'</details>').join('')+
   '<label>Review notes<textarea class="input" id="cycle-notes" maxlength="1000" placeholder="Anything you want to remember when reviewing this cycle"></textarea></label>'+
   '<label class="cycle-check"><input type="checkbox" id="cycle-confirm"> I reviewed the complete original program, training maxes, whole-cycle quality gate, peak, taper, event type, date, and attempt-recording limitations.</label>'+
   '<button type="button" class="btn-primary" id="cycle-save"'+(p.qualityGate?.status==='blocking'?' disabled aria-disabled="true"':'')+'>Save original cycle</button><p class="more-hint">'+(p.qualityGate?.status==='blocking'?'Resolve the blocking quality-gate finding before approval.':'Save first; scheduling is a separate athlete-approved action. Future edits must not overwrite completed workouts.')+'</p>';
 }
 function render(){
  const host=document.getElementById('meet-cycle');if(!host)return;
  const sources=LoadnotePhaseBuilder.validate(data.phasePrograms||[]);
  let records;try{records=LoadnoteMeetCycle.validate(data.meetCycles||[]);}catch(error){host.innerHTML='<p role="alert">'+esc(error.message)+'</p>';return;}
  host.innerHTML='<div class="decision-section-heading"><span class="eyebrow">MEET TIMELINE</span><h3>Finish meet preparation</h3><p>Choose the event. Decisions calculates how many prep weeks are actually available, then allocates accumulation, strength, peak and taper before the whole-cycle quality gate runs.</p></div>'+
    (sources.length?'<label>Reviewed lift setup<select id="cycle-source" class="input">'+sources.slice().reverse().map(p=>'<option value="'+esc(p.id)+'">'+esc(p.config.name)+' · '+esc(p.config.startDate)+'</option>').join('')+'</select></label><button id="cycle-new" type="button" class="btn-primary">Build a meet-prep cycle</button>':'<p>No reviewed lift setup is available yet. Use the Program planner to start meet prep; it will bring you here automatically after the lift setup is saved.</p>')+
    records.filter(r=>!r.scheduledAt).map(r=>'<div class="cycle-controller-summary"><p><b>'+esc(r.sourceProgram.config.name)+' · reviewed, not scheduled</b></p><button type="button" class="btn-primary" data-cycle-schedule="'+esc(r.id)+'">Schedule '+r.sessions.length+' workouts</button><p>Review the saved cycle below, then add it to Calendar when ready.</p></div>').join('')+
    records.slice().reverse().map(r=>{const type=LoadnoteMeetCycle.eventType(r.config),event=type==='competition'?(r.config.eventName||'Competition meet'):'Mock meet';return '<details class="more-details" data-cycle="'+esc(r.id)+'" data-event-type="'+esc(type)+'"><summary>'+esc(r.sourceProgram.config.name)+' · '+r.config.weeks+' weeks · '+esc(event)+' · '+esc(window.LoadnoteProgramUsabilityUI?.recordStage(r,'meet')||(r.scheduledAt?'Scheduled':'Reviewed'))+'</summary>'+(window.LoadnoteProgramUsabilityUI?.recordProgress(r,'meet')||'')+'<p>Start '+esc(r.config.startDate)+' · '+esc(event)+' '+esc(r.config.meetDate)+'</p><p>Accumulation '+r.config.accumulationWeeks+' · Strength '+r.config.strengthWeeks+' · Peak '+r.config.peakWeeks+' · Taper '+r.config.taperWeeks+' · Meet 1</p><p>Planning: <b>'+esc(r.planningDecision?(r.planningDecision.mode==='athlete-customized'?'ATHLETE CUSTOMIZED':'DECISIONS CALCULATED'):'LEGACY')+'</b> · Quality gate: <b>'+esc(r.qualityGate?qualityLabel(r.qualityGate.status):'LEGACY')+'</b> · Approved '+esc(r.createdAt)+'. Original program preserved for future comparisons.</p><details class="more-details"><summary>Original weekly outline</summary>'+r.weekly.map(w=>'<p>Week '+w.week+': '+esc(w.phase)+' · '+w.sessionCount+' workout(s)'+(w.meetDate?' · '+esc(event)+' '+esc(w.meetDate):'')+'</p>').join('')+'</details>'+(r.scheduledAt?'<p>This is now your reviewed scheduled training plan. Future changes must be approved separately.</p><button type="button" class="btn-secondary" data-cycle-current="'+esc(r.id)+'">View current program</button>':'<p>Use the Schedule '+r.sessions.length+' workouts action above to add this reviewed cycle to Calendar.</p>')+'</details>'}).join('')+
    '<p id="cycle-status" role="alert"></p>';
  host.querySelector('#cycle-new')?.addEventListener('click',()=>open(sources.find(p=>p.id===host.querySelector('#cycle-source').value)));
  host.querySelectorAll('[data-cycle-schedule]').forEach(b=>b.addEventListener('click',()=>schedule(b.dataset.cycleSchedule)));
  host.querySelectorAll('[data-cycle-current]').forEach(b=>b.addEventListener('click',()=>showCurrentProgram(b.dataset.cycleCurrent)));
  window.renderMockMeet?.();
 }
 function open(source,{request=null}={}){
  if(!source||busy)return;chosenSource=source;preview=null;
  let dlg=document.getElementById('cycle-dialog');if(!dlg){dlg=document.createElement('dialog');dlg.id='cycle-dialog';dlg.className='card schedule-dialog';document.body.append(dlg);}
  const start=source.config.startDate,profile=LoadnoteProgrammingProfile.current(data.programmingProfiles||[]),profileContext=profile?.context||null;
  dlg.innerHTML='<form id="cycle-form"><p class="eyebrow">STEP 2 OF 2 · EVENT & REVIEW</p><h2>Meet-prep timeline</h2><p>Start '+esc(start)+'. Choose your event; Decisions calculates the prep length and phases.</p><p class="more-hint">Reviewed loading style: '+esc(source.config.periodization==='wave'?'Three-week waves':source.config.periodization==='undulating'?'Daily undulating':source.config.periodization==='weekly-undulating'?'Weekly undulating':'Linear')+'. Applies to accumulation and strength; peak and taper use the protected meet policy.</p>'+
   '<label>Event type<select class="input" id="cycle-event-type"><option value="mock" selected>Mock meet</option><option value="competition">Competition meet</option></select></label><label id="cycle-event-name-wrap" hidden style="display:none">Competition meet name<input class="input" id="cycle-event-name" maxlength="120" placeholder="Meet name"></label>'+
   '<label><span id="cycle-date-label">Mock meet date</span><input class="input" id="cycle-meet-date" type="date"></label><p class="more-hint" id="cycle-profile-date-hint">'+(profileContext?.eventDate?'Profile event date '+esc(profileContext.eventDate)+' is the starting default. Change it here if this cycle targets a different event.':'Choose the event date. Total prep length is calculated automatically from the reviewed start week.')+'</p>'+
   '<details class="more-details" id="cycle-advanced"><summary>Customize phase lengths</summary><p class="more-hint">Optional advanced control. The event date still fixes total weeks; custom phases must add up exactly and pass the same quality gate.</p><label><input type="checkbox" id="cycle-customize"> Override Loadnote phase allocation</label>'+
   '<div id="cycle-custom-fields"><label>Accumulation weeks<input class="input" id="cycle-accumulation" type="number" min="2" max="48" step="1"></label><label>Strength weeks<input class="input" id="cycle-strength" type="number" min="2" max="48" step="1"></label><label>Peak weeks<input class="input" id="cycle-peak" type="number" min="1" max="4" step="1"></label><label>Taper weeks<input class="input" id="cycle-taper" type="number" min="1" max="2" step="1"></label></div></details>'+
   '<p class="more-hint">Loadnote will explain the calculated structure before you can save it. Timelines shorter than the supported minimum are rejected instead of silently compressing phases.</p>'+
   '<button class="btn-primary" type="submit">Calculate & preview prep</button><div id="cycle-preview"></div><p id="cycle-error" role="alert"></p><button type="button" id="cycle-close" class="btn-secondary">Close</button></form>';
  const type=dlg.querySelector('#cycle-event-type'),name=dlg.querySelector('#cycle-event-name'),nameWrap=dlg.querySelector('#cycle-event-name-wrap'),dateLabel=dlg.querySelector('#cycle-date-label'),meet=dlg.querySelector('#cycle-meet-date'),customize=dlg.querySelector('#cycle-customize'),output=dlg.querySelector('#cycle-preview'),error=dlg.querySelector('#cycle-error');
  const syncType=()=>{const competition=type.value==='competition';nameWrap.hidden=!competition;nameWrap.style.display=competition?'grid':'none';name.required=competition;dateLabel.textContent=competition?'Competition meet date':'Mock meet date (Saturday or Sunday)';if(!competition)name.value='';};
  const requestedWeeks=Number.isInteger(request?.weeks)&&request.weeks>=7&&request.weeks<=52?request.weeks:null;
  const fallback=move(start,(requestedWeeks||12)*7-2),profileEventDay=profileContext?.eventDate?new Date(profileContext.eventDate+'T12:00:00Z').getUTCDay():null;
  if(request?.eventType==='competition'||!request&&profileContext?.eventDate&&!([0,6].includes(profileEventDay)))type.value='competition';
  meet.value=requestedWeeks?fallback:profileContext?.eventDate||fallback;syncType();
  if(requestedWeeks){const note=document.createElement('p');note.className='cycle-controller-summary';const requestedDays=Array.isArray(request?.days)?request.days.map(d=>['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][d]).filter(Boolean).join(', '):'';note.textContent='Coach handoff: '+requestedWeeks+' weeks requested'+(requestedDays?' · '+requestedDays:'')+(request?.minutes?' · '+request.minutes+' minutes per session':'')+(request?.equipment?.length?' · equipment: '+request.equipment.join(', '):'')+(request?.priority?' · '+request.priority+' priority (review context only)':'')+'. Event date '+fallback+' is a suggested review starting point, not an assumed meet registration. Confirm your actual date and event type; the full quality gate runs before saving.';dlg.querySelector('h2').after(note);}
  const invalidate=()=>{preview=null;output.replaceChildren();error.textContent='';};
  const fillCustom=p=>{for(const [id,key] of [['accumulation','accumulationWeeks'],['strength','strengthWeeks'],['peak','peakWeeks'],['taper','taperWeeks']])dlg.querySelector('#cycle-'+id).value=String(p.config[key]);};
  meet.addEventListener('input',invalidate);type.addEventListener('change',()=>{syncType();invalidate();});name.addEventListener('input',invalidate);customize.addEventListener('change',invalidate);
  dlg.querySelectorAll('#cycle-custom-fields input').forEach(el=>el.addEventListener('input',invalidate));
  dlg.querySelector('#cycle-form').onsubmit=e=>{e.preventDefault();if(busy)return;try{
   asOf=today();
   const phaseOverride=customize.checked?{accumulationWeeks:Number(dlg.querySelector('#cycle-accumulation').value),strengthWeeks:Number(dlg.querySelector('#cycle-strength').value),peakWeeks:Number(dlg.querySelector('#cycle-peak').value),taperWeeks:Number(dlg.querySelector('#cycle-taper').value)}:null;
   const args={version:1,meetDate:meet.value,eventType:type.value,eventName:name.value,phaseOverride};
   preview=LoadnoteMeetCycle.prepare(data,source,args,{asOf});fillCustom(preview);output.innerHTML=previewHtml(preview);output.querySelector('#cycle-save').onclick=save;error.textContent='';
  }catch(err){preview=null;output.replaceChildren();error.textContent=err.message;}};
  async function save(){
   if(busy||!preview)return;busy=true;try{
     const beforeIds=new Set((data.meetCycles||[]).map(r=>r.id));
     const next=LoadnoteMeetCycle.save(data,preview,{confirmed:dlg.querySelector('#cycle-confirm').checked,notes:dlg.querySelector('#cycle-notes').value},{asOf:today()});
     clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();render();window.renderPhaseBuilder?.();window.renderSchedule?.();window.renderProgrammingWorkspace?.();dlg.close();const saved=data.meetCycles.find(r=>!beforeIds.has(r.id));const action=[...document.querySelectorAll('[data-cycle-schedule]')].find(b=>b.dataset.cycleSchedule===saved?.id);if(action){for(let el=action.parentElement;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;action.scrollIntoView({block:'center'});action.focus({preventScroll:true});}showToast('Meet-prep cycle saved · schedule when ready','success');
   }catch(err){error.textContent=err.message;}finally{busy=false;}
  }
  dlg.querySelector('#cycle-close').onclick=()=>{if(!busy)dlg.close();};
  dlg.oncancel=e=>{if(busy)e.preventDefault();};window.LoadnoteProgramUsabilityUI?.cycle(dlg.querySelector('form'));dlg.showModal();
 }
 function showCurrentProgram(id){
  if(window.LoadnoteProgramWorkoutViewerUI?.open){window.LoadnoteProgramWorkoutViewerUI.open(id);return;}
  window.renderProgramLifecycle?.();
  window.renderTodayTraining?.();
  const current=document.getElementById('decision-action-center');
  if(current)current.scrollIntoView({behavior:'smooth',block:'start'});
 }
 async function schedule(id){
  if(busy||!confirm('Schedule all reviewed meet-prep cycle workouts? No existing Calendar sessions will be replaced. Event-day attempts are not selected.'))return;
  busy=true;const host=document.getElementById('meet-cycle');try{
   const next=LoadnoteMeetCycle.schedule(data,id,{asOf:today()});clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();render();window.renderPhaseBuilder?.();window.renderSchedule?.();window.renderProgrammingWorkspace?.();window.renderProgramLifecycle?.();window.renderTodayTraining?.();showToast('Reviewed meet-prep cycle scheduled · current program updated','success');setTimeout(()=>document.getElementById('decision-action-center')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
  }catch(err){host.querySelector('#cycle-status').textContent=err.message;}finally{busy=false;}
 }
 window.LoadnoteMeetCycleUI={open};
 window.renderMeetCycle=render;
})();
