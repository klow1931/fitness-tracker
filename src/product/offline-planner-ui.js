(function(){
 'use strict';
 const A=()=>window.LoadnoteOfflinePlanner,esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 let generation=0;
 function modal(){let d=document.getElementById('offline-plan-dialog');if(!d){d=document.createElement('dialog');d.id='offline-plan-dialog';d.className='card schedule-dialog';d.setAttribute('aria-labelledby','offline-plan-title');document.body.append(d);}if(d.open)d.close();return d;}
 function setup(r){window.openProgrammingProfile({guided:true,initial:{goal:r.goal||'general',sessionMinutes:r.minutes>=30?r.minutes:60,availableDays:Array.from({length:r.frequency||3},(_,i)=>Math.floor(i*7/(r.frequency||3))),equipment:r.equipment.includes('barbell')?['barbell']:[],accessoryEquipment:r.equipment},notice:'Review your saved setup before using this offline request. Chat does not update availability, equipment or exclusions.',onSaved:()=>open(r)});}
 function open(r){
  const ticket=++generation;r=JSON.parse(JSON.stringify(r));
  const missing=A().gaps(r,data);if(missing.length){showToast(missing[0],'info');return;}
  const d=modal(),p=LoadnoteProgrammingProfile.current(data.programmingProfiles||[])?.context;
  if(!p){setup(r);return;}
  if(r.kind==='daily'){daily(d,r,p,ticket);return;}
  const blocked=p.availableDays.length<r.frequency||r.minutes>p.sessionMinutes;
  d.innerHTML='<h2 id="offline-plan-title">Review your program request</h2><p>'+esc(A().summary(r))+'</p><p>These settings came from your request, not an inferred training dose. Exact loads and movement suitability still need review in the designer.</p>'+(blocked?'<p role="status">The request exceeds your saved available days or session time. Edit setup or ask Coach for a different request; nothing is silently changed.</p>':'')+'<fieldset><legend>Choose '+r.frequency+' days within your saved availability</legend>'+p.availableDays.map((n,i)=>'<label><input type="checkbox" data-offline-day value="'+n+'" '+(i<r.frequency?'checked':'')+'> '+dayNames[n]+'</label>').join('')+'</fieldset><p>Equipment requested: '+esc(r.equipment.join(', '))+'. Confirm the actual setup in the next review. New requests do not clear exclusions or override current intake restrictions.</p><p id="offline-plan-error" role="alert"></p><div class="offline-plan-actions"><button type="button" class="btn-primary" id="offline-program-continue" '+(blocked?'disabled':'')+'>Continue to program draft</button><button type="button" class="btn-secondary" id="offline-edit-setup">Edit training setup</button><button type="button" class="btn-secondary" id="offline-plan-close">Close</button></div>';
  d.querySelector('#offline-edit-setup').onclick=()=>{d.close();setup(r);};d.querySelector('#offline-plan-close').onclick=()=>d.close();
  d.querySelector('#offline-program-continue').onclick=()=>{try{
   const days=[...d.querySelectorAll('[data-offline-day]:checked')].map(e=>Number(e.value));if(days.length!==r.frequency)throw Error('Choose exactly '+r.frequency+' days');
   if(A().gaps(r,data).length)throw Error('Training context changed; reopen this request');
   if(r.goal==='strength'){
    if(!['barbell'].every(e=>r.equipment.includes(e)))throw Error('The strength designer requires a barbell setup. Use a muscle-growth request for supported dumbbell/bodyweight movements.');
    d.close();showTab('coach');showSubTab('coach','co-programs');window.LoadnotePhaseBuilderUI.open(null,{guided:true,periodization:r.periodization||'linear',request:{...r,days}});
   }else{
    d.close();showTab('coach');showSubTab('coach','co-programs');window.LoadnoteHypertrophyBuilderUI.open(null,{request:{...r,days}});
   }
  }catch(e){d.querySelector('#offline-plan-error').textContent=e.message;}};d.showModal();
 }
 async function daily(d,r,p,ticket){
  let device;try{device=await window.LoadnoteAdaptiveSessionUI.readProfile();}catch(e){d.innerHTML='<h2 id="offline-plan-title">Review training preferences</h2><p>Device preferences could not be validated. Review them before creating another dose.</p><button type="button" class="btn-secondary">Close</button>';d.querySelector('button').onclick=()=>d.close();d.showModal();return;}
  if(ticket!==generation)return;
  const day=new Date(today()+'T12:00:00Z');if(r.tomorrow)day.setUTCDate(day.getUTCDate()+1);const date=day.toISOString().slice(0,10);
  const scheduled=LoadnoteSchedule.list(data.scheduledSessions||[]).filter(s=>s.date===date&&s.status==='scheduled'&&!(data.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===s.id));
  if(scheduled.length){
   d.innerHTML='<h2 id="offline-plan-title">You already have planned training</h2><p>'+esc(date+' · '+scheduled.map(s=>s.name).join(', '))+'</p><p>Review or adapt the existing plan first. A separate draft will not replace, complete or cancel any Calendar workout.</p><div class="offline-plan-actions"><button type="button" class="btn-primary" id="offline-review-scheduled">Review existing planned session</button><button type="button" class="btn-secondary" id="offline-separate">Draft a separate, unlinked workout</button><button type="button" class="btn-secondary" id="offline-plan-close">Close</button></div>';
   d.querySelector('#offline-review-scheduled').onclick=()=>{d.close();window.LoadnoteAdaptiveSessionUI.open({requestedMinutes:r.minutes});};d.querySelector('#offline-separate').onclick=()=>standalone(d,r,date,device);d.querySelector('#offline-plan-close').onclick=()=>d.close();d.showModal();return;
  }
  standalone(d,r,date,device);
 }
 function standalone(d,r,date,device){
  const exclusions=device.preferences.excludedExerciseIds,choices=A().candidates(data,r,{excludedExerciseIds:exclusions}),unit=currentUnit();let preview=null,stamp=null,reviewedRows=null;
  d.innerHTML='<form><h2 id="offline-plan-title">Draft your daily workout</h2><p>'+esc(A().summary(r)+' · '+date)+'</p><p>Movement suggestions use your equipment, stated focus and confirmed exclusions. Sets, reps and rest below are editable starting conveniences, not a personalized dose. Enter fresh loads; unknown loads are not filled from a 1RM or past performance.</p>'+choices.map(e=>'<fieldset data-offline-movement="'+esc(e.key)+'"><legend><label><input type="checkbox" data-include checked> '+esc(e.name)+'</label></legend><p>'+esc(LoadnoteExerciseReference.EQUIPMENT[e.equipment])+' · '+esc(e.equipment==='dumbbells'?'load per hand':e.equipment==='bodyweight'?'added load, 0 means no added weight':['machine','cable'].includes(e.equipment)?'stack load':'total load')+'</p>'+[['sets','Sets',2],['reps','Reps',8],['load','Starting load ('+unitLabel()+')',''],['rpe','Planned RPE cap',7],['rest','Rest seconds',120]].map(([id,label,value])=>'<label>'+label+'<input class="input" type="number" step="any" data-value="'+id+'" value="'+value+'" required></label>').join('')+'</fieldset>').join('')+(choices.length?'':'<p>No compatible movements are available for this request. Add equipment or change the focus; exclusions are not bypassed.</p>')+'<label><input type="checkbox" id="offline-workout-confirm"> I reviewed movement suitability, all equipment (including supports such as a bench), load conventions and starting targets. This is not medical clearance.</label><p id="offline-plan-error" role="alert"></p><button type="submit" class="btn-primary" '+(choices.length?'':'disabled')+'>Review workout targets</button><div id="offline-workout-preview"></div><button type="button" class="btn-secondary" id="offline-plan-close">Close</button></form>';
  const rows=()=>[...d.querySelectorAll('[data-offline-movement]')].filter(el=>el.querySelector('[data-include]').checked).map(el=>{const v=k=>el.querySelector('[data-value="'+k+'"]').value;if(!v('load').trim())throw Error('Enter each starting load; 0 is allowed only for bodyweight movements');return {key:el.dataset.offlineMovement,sets:Number(v('sets')),reps:Number(v('reps')),weightKg:toStorage(Number(v('load'))),rpe:Number(v('rpe')),rest:Number(v('rest'))};});
  const error=e=>d.querySelector('#offline-plan-error').textContent=e.message||String(e),snapshot=()=>JSON.stringify({profile:data.programmingProfiles,catalog:data.exerciseCatalog,roles:data.exerciseRoles,sessions:data.scheduledSessions,workouts:data.workouts,unit:currentUnit(),day:today()});
  d.querySelector('form').oninput=e=>{if(e.target.closest('#offline-workout-preview'))return;preview=null;d.querySelector('#offline-workout-preview').replaceChildren();};
  d.querySelector('form').onchange=e=>{if(e.target.matches('[data-include]'))for(const input of e.target.closest('fieldset').querySelectorAll('[data-value]'))input.disabled=!e.target.checked;};
  d.querySelector('form').onsubmit=e=>{e.preventDefault();try{
   if(currentUnit()!==unit)throw Error('Units changed; reopen the draft');
   preview=A().workout(data,r,rows(),{confirmed:d.querySelector('#offline-workout-confirm').checked,excludedExerciseIds:exclusions});stamp=snapshot();reviewedRows=JSON.stringify(rows());
   const host=d.querySelector('#offline-workout-preview');host.innerHTML='<h3>Review planned work</h3>'+preview.prescription.plannedExercises.map(ex=>'<p>'+esc(LoadnoteWorkoutBrief.describe(ex,unit))+'</p>').join('')+'<p>Estimated work: '+preview.estimate.minutes+' minutes; budget: '+r.minutes+' minutes. Warm-up, queues and interruptions need additional time.</p><p>'+esc(preview.notice)+'</p><label><input type="checkbox" id="offline-load-confirm"> Load this as an unscheduled draft. Nothing is completed or saved to workout history.</label><button type="button" class="btn-primary" id="offline-load-workout">Load reviewed workout</button>';
   host.querySelector('#offline-load-workout').onclick=async()=>{try{
    if(JSON.stringify(await window.LoadnoteAdaptiveSessionUI.readProfile())!==JSON.stringify(device))throw Error('Device preferences changed; reopen the workout request');
    if(!d.open||!d.contains(host))return;
    if(!preview||snapshot()!==stamp||JSON.stringify(rows())!==reviewedRows)throw Error('Training context changed; review a fresh draft');
    if(!host.querySelector('#offline-load-confirm').checked)throw Error('Confirm loading the reviewed draft');
    if(loggerHasContent()||workoutEdit||pendingScheduledSession||window.LoadnoteSportPlannerUI?.hasDraft?.())throw Error('Finish or clear the existing workout draft first; it has not been replaced');
    const fresh=A().workout(data,r,rows(),{confirmed:d.querySelector('#offline-workout-confirm').checked,excludedExerciseIds:exclusions});
    if(fresh.estimate.minutes>r.minutes)throw Error('The work alone exceeds your time budget. Reduce the draft and review again; rest is not silently shortened');
    if(fillWorkoutForm(fresh.prescription.plannedExercises,'Offline Coach · '+date,false,{source:fresh.prescription.source})===false)return;
    document.getElementById('wo-date').value=date;saveLoggerDraft();d.close();window.openFastStartLogger({compact:false});
   }catch(e){error(e);}};
  }catch(e){preview=null;error(e);}};
  d.querySelector('#offline-plan-close').onclick=()=>d.close();if(!d.open)d.showModal();
 }
 function prefillPhase(d,r){
  if(A().gaps(r,data).length)throw Error('The request needs another review');
  const p=LoadnoteProgrammingProfile.current(data.programmingProfiles||[])?.context;
  if(!r.days?.every(day=>p?.availableDays.includes(day)))throw Error('Requested days exceed saved availability');
  const put=(id,value)=>{d.querySelector('#phase-'+id).value=value;};
  put('name','Offline strength draft · '+r.weeks+' weeks');put('minutes',r.minutes);
  const accumulation=Math.max(2,Math.min(6,Math.floor((r.weeks-1)/2)));put('accumulation',accumulation);put('strength',r.weeks-1-accumulation);
  d.querySelectorAll('[data-phase-day]').forEach(el=>el.checked=r.days.includes(Number(el.value)));
  const lifts=['squat','bench','deadlift'];
  d.querySelectorAll('[data-phase-slot]').forEach(el=>el.value='off');
  lifts.forEach((lift,i)=>{
   d.querySelector('[data-phase-slot="'+lift+':'+r.days[i%r.days.length]+'"]').value='primary:straight';
   if(r.days.length>=3)d.querySelector('[data-phase-slot="'+lift+':'+r.days[(i+1)%r.days.length]+'"]').value='light:straight';
  });
  for(const day of r.days){
   const used=lifts.some(l=>d.querySelector('[data-phase-slot="'+l+':'+day+'"]').value!=='off');if(used)continue;
   const lift=[r.priority||'bench',...lifts].find(l=>d.querySelector('[data-phase-slot="'+l+':'+day+'"]').value==='off'&&[...d.querySelectorAll('[data-phase-slot^="'+l+':"]')].filter(e=>e.value!=='off').length<3);
   if(lift)d.querySelector('[data-phase-slot="'+lift+':'+day+'"]').value='light:straight';
  }
  if(r.priority){const off=r.days.find(day=>d.querySelector('[data-phase-slot="'+r.priority+':'+day+'"]').value==='off');if(off!=null&&[...d.querySelectorAll('[data-phase-slot^="'+r.priority+':"]')].filter(e=>e.value!=='off').length<3)d.querySelector('[data-phase-slot="'+r.priority+':'+off+'"]').value='light:straight';}
  const note=document.createElement('p');note.className='more-hint';note.textContent=A().summary(r)+'. Exposure suggestions are editable, not evidence of recovery or a personalized dose. Enter explicit training maxes; save and schedule only after review.';d.querySelector('h2').after(note);
 }
 function prefillHypertrophy(d,r){
  const goals=LoadnoteGoals.list(data.athleteGoals||[]).filter(LoadnoteHypertrophyBuilder.eligibleGoal),goal=d.querySelector('#hyp-goal');
  if(goals.length===1){goal.value=goals[0].id;goal.onchange({target:goal});}
  d.querySelector('#hyp-name').value='Offline muscle-growth draft';d.querySelector('#hyp-weeks').value=r.weeks;d.querySelector('#hyp-minutes').value=r.minutes;
  d.querySelectorAll('[data-hyp-day]').forEach(e=>e.checked=r.days.includes(Number(e.value)));
  const choices=A().candidates(data,{...r,focus:'full'},{requireMapped:true}).filter(e=>e.exerciseId&&LoadnoteTrainingKnowledge.mapping(data.exerciseCatalog.find(c=>c.id===e.exerciseId)?.muscles)?.mode==='resistance');
  if(choices.length){
   d.querySelector('#hyp-slots').replaceChildren();
   for(const day of r.days)for(const choice of choices.slice(0,3)){
    d.querySelector('#hyp-add').click();const el=d.querySelector('#hyp-slots').lastElementChild;el.querySelector('[data-slot="day"]').value=day;
    const exercise=el.querySelector('[data-slot="exercise"]');exercise.value=choice.exerciseId;exercise.onchange({target:exercise});
    const equipment=el.querySelector('[data-slot="equipment"]');equipment.value=choice.equipment;equipment.onchange({target:equipment});
    el.querySelector('[data-slot="purpose"]').value='Requested '+r.goal+' structure; review this movement and dose';
   }
  }
  const note=document.createElement('p');note.textContent=A().summary(r)+'. All doses are editable; loads and equipment confirmation remain required. Goals and workload rules are unchanged.';d.querySelector('h2').after(note);
  const button=document.createElement('button');button.type='button';button.className='btn-secondary';button.textContent='Review or create a training goal';button.onclick=()=>{d.close();showTab('coach');showSubTab('coach','co-goals');};note.after(button);
 }
 window.LoadnoteOfflinePlannerUI={open,prefillPhase,prefillHypertrophy};
})();
