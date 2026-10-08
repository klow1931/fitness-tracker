/* Existing form nodes retain their values and handlers when reordered. */
let trainingFocus=false,swapRow=null;
const expandedTrainingRows=new WeakSet();
function trainingRows(){return [...document.querySelectorAll('#exercise-rows > div')];}
function trainingRowProgress(row){
 if(row.dataset.type==='cardio')return {total:0,done:0,complete:!!row.querySelector('.cardio-done')?.checked&&(Number(row.querySelector('.cardio-duration')?.value)>0||Number(row.querySelector('.cardio-distance')?.value)>0)};
 const sets=[...row.querySelectorAll('.sets-container > div')];
 const entered=sets.filter(s=>Number(s.querySelector('.set-reps,.set-duration')?.value)>0);
 const done=entered.filter(s=>s.querySelector('.set-done-check')?.checked).length;
 return {total:entered.length,done,complete:entered.length>0&&done===entered.length&&sets.every(s=>Number(s.querySelector('.set-reps,.set-duration')?.value)>0)};
}
function updateTrainingFlow(){
 const rows=trainingRows();let total=0,done=0,finished=0;
 const progress=rows.map(row=>{const p=trainingRowProgress(row);total+=p.total;done+=p.done;if(p.complete)finished++;return p;});
 const execution=!!window.LoadnoteTrainingExecutionUI?.isActive?.();
 const firstIncomplete=rows.find((row,i)=>!progress[i].complete);
 const current=execution
  ? rows.find((row,i)=>row.querySelector('.ex-name')?.value.trim()&&!progress[i].complete)||firstIncomplete
  : firstIncomplete;
 const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
 rows.forEach((row,i)=>{
  let bar=row.querySelector('.exercise-flow-bar');
  if(!bar){bar=document.createElement('div');bar.className='exercise-flow-bar';bar.innerHTML='<strong></strong><div class="exercise-flow-buttons"><button type="button" data-workout-action="expand-exercise" class="btn-secondary">Show sets</button><button type="button" data-workout-action="move-up" class="btn-secondary" aria-label="Move exercise up">↑</button><button type="button" data-workout-action="move-down" class="btn-secondary" aria-label="Move exercise down">↓</button><button type="button" data-workout-action="swap-exercise" class="btn-secondary">Swap</button></div>';row.prepend(bar);}
  const p=progress[i],expanded=expandedTrainingRows.has(row);
  const executionCollapsed=execution&&row!==current&&!expanded;
  const focusCollapsed=!execution&&trainingFocus&&p.complete&&!expanded;
  const collapsed=executionCollapsed||focusCollapsed;
  row.classList.toggle('training-collapsed',collapsed);
  row.classList.toggle('training-current',(execution||trainingFocus)&&row===current);
  row.classList.toggle('training-execution-current',execution&&row===current);
  row.classList.toggle('training-execution-complete',execution&&p.complete);
  row.classList.toggle('training-execution-upcoming',execution&&row!==current&&!p.complete);
  const status=p.complete?' · Complete':execution&&row!==current?' · Up next':'';
  setText(bar.querySelector('strong'),`${i+1}. ${row.querySelector('.ex-name').value.trim()||'New exercise'}${status}`);
  const expand=bar.querySelector('[data-workout-action="expand-exercise"]'),canExpand=execution?row!==current:trainingFocus&&p.complete;
  expand.hidden=!canExpand;expand.setAttribute('aria-expanded',String(!collapsed));setText(expand,collapsed?'Show sets':'Collapse');
  bar.querySelector('[data-workout-action="move-up"]').disabled=i===0;bar.querySelector('[data-workout-action="move-down"]').disabled=i===rows.length-1;
  if(row.dataset.type!=='cardio'){
   const sets=[...row.querySelectorAll('.sets-container > div')],active=row.querySelector('.logger-active-set');
   let currentSet=active&&!active.querySelector('.set-done-check')?.checked?active:null;
   if(!currentSet&&row===current)currentSet=sets.find(s=>!s.querySelector('.set-done-check')?.checked)||sets[0]||null;
   sets.forEach(set=>{
    const checked=!!set.querySelector('.set-done-check')?.checked;
    set.classList.toggle('training-execution-set-current',execution&&row===current&&set===currentSet);
    set.classList.toggle('training-execution-set-complete',execution&&checked);
    set.classList.toggle('training-execution-set-upcoming',execution&&row===current&&set!==currentSet&&!checked);
   });
  }
 });
 const summary=document.getElementById('training-progress-label');
 if(summary){
  let next='';
  if(current){
   const name=current.querySelector('.ex-name')?.value.trim()||'Exercise';
   if(current.dataset.type==='cardio')next=' · Next: '+name;
   else{
    const sets=[...current.querySelectorAll('.sets-container > div')],trackBy=current.dataset.trackBy==='duration'?'duration':'reps';
    const target=sets.findIndex(s=>Number(s.querySelector(trackBy==='duration'?'.set-duration':'.set-reps')?.value)>0&&!s.querySelector('.set-done-check')?.checked);
    next=' · Next: '+name+(target>=0?' · Set '+(target+1):'');
   }
  }else if(total&&done===total)next=' · Ready to review';
  setText(summary,(total?`${done}/${total} sets · `:'')+`${finished}/${rows.length} exercises`+next);
 }
 const meter=document.getElementById('training-progress');if(meter){meter.max=Math.max(total,1);meter.value=done;}
 window.refreshLoggerQuickEntry?.();
 window.refreshGymFloorUI?.();
}
function toggleTrainingFocus(){trainingFocus=document.getElementById('training-focus').checked;updateTrainingFlow();}
function expandTrainingExercise(button){const row=button.closest('[data-idx]');if(expandedTrainingRows.has(row))expandedTrainingRows.delete(row);else expandedTrainingRows.add(row);updateTrainingFlow();}
function moveTrainingExercise(button,direction){const row=button.closest('[data-idx]'),sibling=direction<0?row.previousElementSibling:row.nextElementSibling;if(!sibling)return;if(direction<0)row.parentElement.insertBefore(row,sibling);else row.parentElement.insertBefore(sibling,row);saveLoggerDraft();button.focus({preventScroll:true});}
function openExerciseSwap(button){swapRow=button.closest('[data-idx]');document.getElementById('swap-current').textContent=swapRow.querySelector('.ex-name').value||'Unnamed exercise';document.getElementById('swap-name').value='';document.getElementById('exercise-swap').showModal();}
function confirmExerciseSwap(){const input=document.getElementById('swap-name'),name=input.value.trim();if(!name){input.reportValidity();return;}if(!swapRow?.isConnected)return;swapRow.querySelector('.ex-name').value=name;saveLoggerDraft();document.getElementById('exercise-swap').close();swapRow=null;}
function showWorkoutRecap(workout,previousWorkouts,newPRs,editing){
 const host=document.getElementById('workout-recap');if(!host)return;host.replaceChildren();host.hidden=false;
 const add=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;host.appendChild(el);return el;};
 add('h2',editing?'Workout updated':'Session saved. Work logged.');
 const takeaway=window.LoadnoteTrainingCockpit?.workoutTakeaway?.(workout);
 if(takeaway){
  const section=add('section','');section.className='workout-takeaway';section.setAttribute('aria-label','Workout takeaway');
  const caution=takeaway.watch.includes('no recorded RPE')||takeaway.watch.startsWith('Cardio recorded');
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Logging notes';details.append(summary);
  for(const [label,text] of [['Logged',takeaway.logged],['Watch',takeaway.watch],['Next',takeaway.next]]){
   const p=document.createElement('p'),b=document.createElement('b');b.textContent=label+': ';p.append(b,document.createTextNode(text));
   (label==='Logged'||label==='Watch'&&caution?section:details).append(p);
  }
  section.append(details);
 }
 const details=add('details','');details.className='recap-details';const summary=document.createElement('summary');summary.textContent='Session details and previous sets';details.append(summary);
 const detail=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;details.append(el);return el;};
 const count=workout.exercises.reduce((n,e)=>n+(e.sets?.length||0),0);
 detail('p',`${workout.exercises.length} exercises · ${count} strength sets · ${Math.round(toDisplay(calcVolume(workout)))} ${unitLabel()} rep volume`);
 for(const pr of newPRs)add('p',`★ New personal best: ${pr.exercise} · ${formatStrengthSet(pr)}`);
 for(const exercise of workout.exercises){
  const last=LoadnoteSession.previous(previousWorkouts,exercise.name,workout.date,workout.id,exercise.type,exercise.trackBy);
  if(exercise.type==='cardio'){detail('p',`${exercise.name}: ${exercise.duration||0} min · ${exercise.distance||0} ${exercise.distanceUnit}`);continue;}
  if(!last){detail('p',`${exercise.name}: first matching session logged.`);continue;}
  detail('h3',exercise.name);detail('p','This session: '+exercise.sets.map(formatStrengthSet).join(' / '));detail('p',`Previous (${last.date}): `+last.exercise.sets.map(formatStrengthSet).join(' / '));
 }
 const close=add('button','Dismiss recap');close.type='button';close.className='btn-secondary recap-dismiss';close.onclick=()=>{host.hidden=true;};
}
