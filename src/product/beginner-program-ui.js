/* v3.93 beginner planner: 3 choices, exact editable review, separate save/schedule. */
(function(){
 'use strict';
 const B=()=>window.LoadnoteBeginnerProgram,C=()=>window.LoadnoteCustomProgram;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Never directly alter completed workouts or issue an automatic schedule.
 let busy=false;
 function open(){
  if(busy)return;
  let d=document.getElementById('beginner-program-dialog');
  if(!d){d=document.createElement('dialog');d.id='beginner-program-dialog';d.className='card schedule-dialog beginner-program-dialog';document.body.append(d);}
  const model=B(),goalOptions=Object.entries(model.GOALS),equipmentOptions=Object.entries(model.EQUIPMENT);
  let proposal=null,storedId=null,edited=null,signature='';
  const catalog=(data.exerciseCatalog||[]).filter(e=>e&&typeof e.name==='string'&&e.name.length<=160).map(e=>e.name).sort((a,b)=>a.localeCompare(b));
  const choices=(arr)=>arr.map(([id,label])=>'<option value="'+esc(id)+'">'+esc(label)+'</option>').join('');
  d.innerHTML='<form method="dialog"><h2 tabindex="-1">Build my first training plan</h2><p id="starter-step" role="status">Step 1 of 3 · Choose your setup</p><div id="starter-setup"><p>Choose a goal, training days, and equipment. Preview the workouts, then choose whether to save and schedule them. Nothing is scheduled automatically.</p>'+
   '<label>1. What is your goal?<select class="input" id="starter-goal">'+choices(goalOptions)+'</select></label>'+
   '<fieldset id="starter-days" aria-describedby="starter-days-hint"><legend>2. Which days can you train? Choose 2 or 3.</legend>'+model.DAY_NAMES.map((day,i)=>'<label><input type="checkbox" data-starter-day value="'+i+'" '+([0,2,4].includes(i)?'checked':'')+'> '+esc(day)+'</label>').join('')+'<p id="starter-days-hint" class="more-hint" aria-live="polite"></p></fieldset>'+
   '<label>3. What equipment do you have?<select class="input" id="starter-equipment">'+choices(equipmentOptions)+'</select></label>'+
   '<p class="more-hint">Four weeks of editable full-body workouts. No one-rep max, training history, or login required. Suggested exercises may need substitutions based on your equipment and comfort.</p>'+
   '<button type="button" class="btn-primary" id="starter-preview-btn">Preview my four-week plan</button>'+
   '</div><button type="button" class="btn-secondary" id="starter-back" hidden>Back to choices</button><details id="starter-edit-details" hidden><summary>Change exercises, sets or reps</summary><div id="starter-exercises" hidden></div></details><div id="starter-plan-preview" aria-live="polite"></div>'+
   '<label id="starter-review-label" hidden><input id="starter-confirm" type="checkbox"> I have reviewed each workout, exercise choice and the unspecified starting loads.</label>'+
   '<button type="button" class="btn-primary" id="starter-save" hidden>Save reviewed plan</button>'+
   '<div id="starter-schedule-panel" hidden><button type="button" class="btn-secondary" id="starter-open-saved">Review a workout from this plan</button><p>Plan saved, but not scheduled. You can edit a copy later in Custom Program Studio.</p>'+
   '<label><input type="checkbox" id="starter-schedule-confirm"> Add these sessions to Calendar after checking for conflicts</label>'+
   '<button type="button" class="btn-primary" id="starter-schedule">Add plan to Calendar</button></div>'+
   '<p role="status" id="starter-status"></p><button type="button" class="btn-secondary" id="starter-close">Close</button></form>'+
   '<datalist id="starter-exercise-names">'+catalog.slice(0,500).map(n=>'<option value="'+esc(n)+'"></option>').join('')+'</datalist>';
  const q=id=>d.querySelector('#starter-'+id);
  q('goal').value='fitness';q('equipment').value='gym';
  const read=()=>({goal:q('goal').value,equipment:q('equipment').value,days:[...d.querySelectorAll('[data-starter-day]:checked')].map(e=>Number(e.value))});
  const updateDayHint=()=>{
   const count=read().days.length,valid=count>=2&&count<=3,hint=d.querySelector('#starter-days-hint');
   hint.textContent=valid?count+' days selected · '+(count*4)+' planned workouts over four weeks.':
    count+' days selected · choose two or three to preview a plan.';
   d.querySelector('#starter-days').setAttribute('aria-invalid',String(!valid));
  };
  updateDayHint();
  const fingerprint=()=>JSON.stringify({...read(),edits:edited});
  const message=s=>q('status').textContent=s||'';
  const invalidate=()=>{q('step').textContent=q('setup').hidden?'Step 2 of 3 · Update and review your workouts':'Step 1 of 3 · Choose your setup';proposal=null;signature='';q('confirm').checked=false;q('review-label').hidden=true;q('save').hidden=true;q('plan-preview').replaceChildren();message('Preview again after changing choices. No program has been saved.');};
  const renderEdits=()=>{
   const suggestions=model.suggested(read());
   edited=suggestions.map(s=>s.exercises.map(e=>({...e})));
   q('exercises').hidden=false;
   q('exercises').innerHTML='<h3>Review and change exercises</h3><p>Use any exercise in your library, or edit the name. You can adjust sets and reps before previewing. The same reviewed exercises repeat across four weeks, with no automatic load progression.</p>'+
    suggestions.map((day,i)=>'<fieldset data-starter-session="'+i+'"><legend>'+esc(model.DAY_NAMES[day.day])+'</legend>'+
    day.exercises.map((e,j)=>'<div class="starter-exercise-row"><label>Exercise '+(j+1)+'<input class="input" list="starter-exercise-names" data-starter-name="'+i+'-'+j+'" value="'+esc(e.name)+'"></label>'+
    '<label>Sets<input class="input" type="number" min="1" max="4" data-starter-sets="'+i+'-'+j+'" value="'+e.sets+'"></label>'+
    '<label>Reps<input class="input" type="number" min="1" max="20" data-starter-reps="'+i+'-'+j+'" value="'+e.reps+'"></label></div>').join('')+'</fieldset>').join('')+
    '<button type="button" class="btn-secondary" id="starter-refresh">Update workout preview</button>';
   q('exercises').querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{
    const key=el.dataset.starterName||el.dataset.starterSets||el.dataset.starterReps,[i,j]=key.split('-').map(Number);
    const prop=el.dataset.starterName?'name':el.dataset.starterSets?'sets':'reps';
    edited[i][j][prop]=prop==='name'?el.value:Number(el.value);
    invalidate();
   }));
   d.querySelector('#starter-refresh').onclick=preview;
  };
  function preview(){
   if(busy||storedId)return;
   try{
    if(!edited)renderEdits();
    const before=JSON.stringify(data);
    const result=model.make(data,{...read(),exercises:edited},{asOf:today()});
    if(before!==JSON.stringify(data))throw Error('Preview unexpectedly changed saved training');
    proposal=result.proposal;signature=fingerprint();
    q('setup').hidden=true;q('back').hidden=false;q('edit-details').hidden=false;q('step').textContent='Step 2 of 3 · Review your workouts';d.scrollTop=0;
    q('plan-preview').innerHTML='<h3>Review your four-week plan</h3><p><b>'+proposal.sessions.length+' sessions</b> · Start '+esc(proposal.config.startDate)+' · '+proposal.config.weeks+' weeks</p>'+
     '<p>Every week repeats these workouts. Starting weights and RPE targets are blank; there is no inferred progression.</p>'+
     result.slots.map(slot=>'<article class="schedule-row"><b>'+esc(model.DAY_NAMES[slot.day])+'</b><p>'+slot.exercises.map(e=>esc(e.name)+' · '+e.sets+' × '+e.reps).join(' · ')+'</p></article>').join('')+
     '<details><summary>Review all scheduled dates</summary>'+proposal.sessions.map(s=>'<p>'+esc(s.date)+' · '+esc(s.name)+'</p>').join('')+'</details>'+
     '<p class="more-hint">These movement names will be added to your library when you save. Before logging, enter the load actually used, or 0 for bodyweight / no added load. Effort ratings (RPE) are optional.</p>'+
     (proposal.warnings.some(w=>/overlap|past/.test(w))?'<p class="more-hint">Review these dates against your existing Calendar before scheduling.</p>':'')+
     '<p>'+esc(result.notice)+'</p>';
    q('review-label').hidden=false;q('save').hidden=false;message('Review the plan and confirm to save. Nothing has been scheduled.');d.querySelector('h2').focus({preventScroll:true});d.scrollTop=0;
   }catch(error){invalidate();message(error.message);}
  }
  q('back').onclick=()=>{if(busy||storedId)return;q('setup').hidden=false;q('back').hidden=true;q('edit-details').hidden=true;invalidate();q('step').textContent='Step 1 of 3 · Choose your setup';q('goal').focus();};
  q('preview-btn').onclick=preview;
  for(const el of [q('goal'),q('equipment'),...d.querySelectorAll('[data-starter-day]')])el.addEventListener('change',()=>{
   if(storedId)return;
   updateDayHint();
   edited=null;q('exercises').hidden=true;q('exercises').replaceChildren();invalidate();
  });
  q('save').onclick=async()=>{
   if(busy||storedId)return;
   try{
    if(!q('confirm').checked||!proposal||signature!==fingerprint())throw Error('Review and confirm the current plan before saving');
    const again=model.make(data,{...read(),exercises:edited},{asOf:today()});
    if(JSON.stringify(again.proposal)!==JSON.stringify(proposal))throw Error('Saved training or plan changed. Review the preview again.');
    busy=true;const next=C().save(data,proposal,{confirmed:true,source:{kind:'manual',name:'Loadnote beginner starting structure'},notes:'Athlete reviewed starter exercise choices; starting loads and RPE unspecified.'});
    clearTimeout(saveTimer);await persistNow(next);data=next;storedId=next.customPrograms.at(-1).id;invalidateViews();
    window.renderCustomProgramStudio?.();window.renderProgrammingWorkspace?.();window.renderProgramLifecycle?.();
    q('exercises').querySelectorAll('input').forEach(e=>e.disabled=true);
    for(const el of [q('goal'),q('equipment'),...d.querySelectorAll('[data-starter-day]')])el.disabled=true;
    q('preview-btn').hidden=true;q('review-label').hidden=true;q('save').hidden=true;q('schedule-panel').hidden=false;
    q('step').textContent='Step 3 of 3 · Plan saved';q('back').hidden=true;q('edit-details').hidden=true;
    message('Reviewed plan saved, not scheduled. No workouts were logged. Select Calendar scheduling separately if desired.');q('open-saved').focus();
   }catch(error){message(error.message);}finally{busy=false;}
  };
  q('open-saved').onclick=()=>{if(busy||!storedId)return;d.close();openSaved({id:storedId});};
  q('schedule').onclick=async()=>{
   if(busy||!storedId)return;
   try{
    if(!q('schedule-confirm').checked)throw Error('Confirm the Calendar dates before scheduling');
    if(typeof loggerHasContent==='function'&&loggerHasContent())throw Error('Finish or clear your open workout draft before scheduling');
    busy=true;const next=C().schedule(data,storedId);clearTimeout(saveTimer);await persistNow(next);
    data=next;invalidateViews();window.renderSchedule?.();window.renderCustomProgramStudio?.();window.renderProgrammingWorkspace?.();window.renderProgramLifecycle?.();
    q('schedule').disabled=true;q('schedule-confirm').disabled=true;
    message('Sessions added to Calendar. No workout was marked completed.');
   }catch(error){message(error.message);}finally{busy=false;}
  };
  q('close').onclick=()=>{if(!busy)d.close();};d.oncancel=e=>{if(busy)e.preventDefault();};d.showModal();
 }

 function openSaved({id=null}={}){
  let d=document.getElementById('starter-saved-dialog');
  if(d?.open){d.focus();return;}
  if(!d){d=document.createElement('dialog');d.id='starter-saved-dialog';d.className='card schedule-dialog';document.body.append(d);}
  d.setAttribute('aria-label','Review saved starter plan');
  let plans=[];try{plans=B().saved(data,{asOf:today()});}catch{showToast('Could not validate starter plans. Review the program library.','error');return;}
  if(!plans.length){showToast('No current reviewed starter plan is available.','info');return;}
  d.innerHTML='<h2>Review your saved starter plan</h2><p>Choose a reviewed workout. Loading creates an editable draft for today; it does not complete training or link it to Calendar.</p>'+
   '<label>Saved plan<select class="input" id="starter-saved-plan"><option value="">Choose a plan</option>'+plans.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.config.name)+' · saved '+esc(p.createdAt.slice(0,10))+'</option>').join('')+'</select></label>'+
   '<label>Workout<select class="input" id="starter-saved-session"></select></label><div id="starter-saved-preview"></div>'+
   '<button type="button" class="btn-primary" id="starter-saved-load" disabled>Load this unscheduled workout</button>'+
   '<div id="starter-saved-schedule-panel" hidden><label><input type="checkbox" id="starter-saved-confirm"> I reviewed all Calendar dates and want to schedule this plan</label><button type="button" class="btn-secondary" id="starter-saved-schedule">Add plan to Calendar</button></div>'+
   '<button type="button" class="btn-secondary" id="starter-saved-calendar">Open Calendar</button><p id="starter-saved-status" role="status"></p><button type="button" class="btn-secondary" id="starter-saved-close">Close</button>';
  const q=name=>d.querySelector('#starter-saved-'+name);
  let pending=false;
  const current=()=>{const p=B().saved(data,{asOf:today(),id:q('plan').value})[0];if(!p)throw Error('Choose a current saved plan');return p;};
  function renderWorkout(){
   q('load').disabled=true;q('preview').replaceChildren();q('schedule-panel').hidden=true;
   if(!q('plan').value)return;
   try{const p=current(),s=p.sessions.find(s=>s.key===q('session').value);
    if(!s)return;
    q('preview').innerHTML='<h3>'+esc(p.config.name)+' · '+esc(s.name)+'</h3><ul>'+s.exercises.map(e=>'<li>'+esc(e.name)+' · '+e.sets.length+' sets · '+esc(e.sets[0]?.reps)+' reps · choose your starting load</li>').join('')+'</ul>'+
     '<details><summary>Review all plan dates</summary>'+p.sessions.map(s=>'<p>'+esc(s.date)+' · '+esc(s.name)+'</p>').join('')+'</details>'+
     '<p>'+(p.scheduledAt?'This plan is already scheduled. Start the linked workout from Calendar.':'These are editable starting targets. Enter actual loads before saving; use 0 for no added load. Effort ratings are optional.')+'</p>';
    q('load').disabled=!!p.scheduledAt;q('schedule-panel').hidden=!!p.scheduledAt;
   }catch(error){q('status').textContent=error.message;}
  }
  function selectPlan(){
   q('status').textContent='';q('confirm').checked=false;q('session').replaceChildren();
   if(q('plan').value){try{const p=current();q('session').innerHTML=p.sessions.filter(s=>s.week===1).map(s=>'<option value="'+esc(s.key)+'">'+esc(s.name)+'</option>').join('');}catch(error){q('status').textContent=error.message;}}
   renderWorkout();
  }
  q('plan').onchange=selectPlan;q('session').onchange=renderWorkout;
  q('load').onclick=()=>{if(pending)return;try{
   const p=current();if(p.scheduledAt)throw Error('This plan is now scheduled. Start from Calendar to preserve its link.');
   const session=p.sessions.find(s=>s.key===q('session').value);if(!session)throw Error('Choose a reviewed workout');
   if(fillWorkoutForm(session.exercises,'Reviewed starter plan: '+p.config.name,false,{source:{type:'program',referenceId:p.id,label:p.config.name+' · '+session.name},role:'mixed'})===false)return;
   saveLoggerDraft();d.close();window.openFastStartLogger?.({compact:true});
  }catch(error){q('status').textContent=error.message;}};
  q('schedule').onclick=async()=>{if(pending)return;try{
   if(!q('confirm').checked)throw Error('Review and confirm the Calendar dates first');
   const p=current();if(loggerHasContent())throw Error('Finish or clear your open workout draft before scheduling');
   pending=true;const next=C().schedule(data,p.id);clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();
   window.renderSchedule?.();window.renderCustomProgramStudio?.();window.renderDashboard?.();renderWorkout();q('status').textContent='Plan added to Calendar. No workout was completed.';
  }catch(error){q('status').textContent=error.message;}finally{pending=false;}};
  q('calendar').onclick=()=>{if(pending)return;d.close();window.showTab?.('calendar');};
  q('close').onclick=()=>{if(!pending)d.close();};d.oncancel=e=>{if(pending)e.preventDefault();};
  if(id&&plans.some(p=>p.id===id)||plans.length===1){q('plan').value=id||plans[0].id;selectPlan();}
  d.showModal();
 }
 window.LoadnoteBeginnerProgramUI={open,openSaved};
})();