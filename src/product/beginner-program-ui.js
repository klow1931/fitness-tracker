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
  d.innerHTML='<form method="dialog"><h2>Build my first training plan</h2><p>Three choices. Review every workout before saving; nothing is scheduled automatically.</p>'+
   '<label>1. What is your goal?<select class="input" id="starter-goal">'+choices(goalOptions)+'</select></label>'+
   '<fieldset id="starter-days"><legend>2. Which days can you train? Choose 2 or 3.</legend>'+model.DAY_NAMES.map((day,i)=>'<label><input type="checkbox" data-starter-day value="'+i+'" '+([0,2,4].includes(i)?'checked':'')+'> '+esc(day)+'</label>').join('')+'</fieldset>'+
   '<label>3. What equipment do you have?<select class="input" id="starter-equipment">'+choices(equipmentOptions)+'</select></label>'+
   '<p class="more-hint">Four weeks of editable full-body workouts. No one-rep max, training history, or login required. Suggested exercises may need substitutions based on your equipment and comfort.</p>'+
   '<button type="button" class="btn-primary" id="starter-preview-btn">Preview my four-week plan</button>'+
   '<div id="starter-exercises" hidden></div><div id="starter-plan-preview" aria-live="polite"></div>'+
   '<label id="starter-review-label" hidden><input id="starter-confirm" type="checkbox"> I have reviewed each workout, exercise choice and the unspecified starting loads.</label>'+
   '<button type="button" class="btn-primary" id="starter-save" hidden>Save reviewed plan</button>'+
   '<div id="starter-schedule-panel" hidden><p>Plan saved, but not scheduled. You can edit a copy later in Custom Program Studio.</p>'+
   '<label><input type="checkbox" id="starter-schedule-confirm"> Add these sessions to Calendar after checking for conflicts</label>'+
   '<button type="button" class="btn-primary" id="starter-schedule">Add plan to Calendar</button></div>'+
   '<p role="status" id="starter-status"></p><button type="button" class="btn-secondary" id="starter-close">Close</button></form>'+
   '<datalist id="starter-exercise-names">'+catalog.slice(0,500).map(n=>'<option value="'+esc(n)+'"></option>').join('')+'</datalist>';
  const q=id=>d.querySelector('#starter-'+id);
  q('goal').value='fitness';q('equipment').value='gym';
  const read=()=>({goal:q('goal').value,equipment:q('equipment').value,days:[...d.querySelectorAll('[data-starter-day]:checked')].map(e=>Number(e.value))});
  const fingerprint=()=>JSON.stringify({...read(),edits:edited});
  const message=s=>q('status').textContent=s||'';
  const invalidate=()=>{proposal=null;signature='';q('confirm').checked=false;q('review-label').hidden=true;q('save').hidden=true;q('plan-preview').replaceChildren();message('Preview again after changing choices. No program has been saved.');};
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
    q('plan-preview').innerHTML='<h3>Review your four-week plan</h3><p><b>'+proposal.sessions.length+' sessions</b> · Start '+esc(proposal.config.startDate)+' · '+proposal.config.weeks+' weeks</p>'+
     '<p>Every week repeats these workouts. Starting weights and RPE targets are blank; there is no inferred progression.</p>'+
     result.slots.map(slot=>'<article class="schedule-row"><b>'+esc(model.DAY_NAMES[slot.day])+'</b><p>'+slot.exercises.map(e=>esc(e.name)+' · '+e.sets+' × '+e.reps).join(' · ')+'</p></article>').join('')+
     '<details><summary>Review all scheduled dates</summary>'+proposal.sessions.map(s=>'<p>'+esc(s.date)+' · '+esc(s.name)+'</p>').join('')+'</details>'+
     proposal.warnings.map(w=>'<p class="more-hint">'+esc(w)+'</p>').join('')+
     '<p>'+esc(result.notice)+'</p>';
    q('review-label').hidden=false;q('save').hidden=false;message('Review the plan and confirm to save. Nothing has been scheduled.');
   }catch(error){invalidate();message(error.message);}
  }
  q('preview-btn').onclick=preview;
  for(const el of [q('goal'),q('equipment'),...d.querySelectorAll('[data-starter-day]')])el.addEventListener('change',()=>{
   if(storedId)return;
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
    message('Reviewed plan saved. No workouts were logged or scheduled.');
   }catch(error){message(error.message);}finally{busy=false;}
  };
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
  q('close').onclick=()=>d.close();d.showModal();
 }
 window.LoadnoteBeginnerProgramUI={open};
})();