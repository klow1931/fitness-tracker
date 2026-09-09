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
 const current=rows.find((row,i)=>!progress[i].complete);
 const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
 rows.forEach((row,i)=>{
  let bar=row.querySelector('.exercise-flow-bar');
  if(!bar){bar=document.createElement('div');bar.className='exercise-flow-bar';bar.innerHTML='<strong></strong><div class="exercise-flow-buttons"><button type="button" data-workout-action="expand-exercise" class="btn-secondary">Show sets</button><button type="button" data-workout-action="move-up" class="btn-secondary" aria-label="Move exercise up">↑</button><button type="button" data-workout-action="move-down" class="btn-secondary" aria-label="Move exercise down">↓</button><button type="button" data-workout-action="swap-exercise" class="btn-secondary">Swap</button></div>';row.prepend(bar);}
  const p=progress[i],collapsed=trainingFocus&&p.complete&&!expandedTrainingRows.has(row);
  row.classList.toggle('training-collapsed',collapsed);row.classList.toggle('training-current',trainingFocus&&row===current);
  setText(bar.querySelector('strong'),`${i+1}. ${row.querySelector('.ex-name').value.trim()||'New exercise'}${p.complete?' · Complete':''}`);
  const expand=bar.querySelector('[data-workout-action="expand-exercise"]');expand.hidden=!trainingFocus||!p.complete;expand.setAttribute('aria-expanded',String(!collapsed));setText(expand,collapsed?'Show sets':'Collapse');
  bar.querySelector('[data-workout-action="move-up"]').disabled=i===0;bar.querySelector('[data-workout-action="move-down"]').disabled=i===rows.length-1;
 });
 const summary=document.getElementById('training-progress-label');if(summary)setText(summary,`${done}/${total} entered strength sets checked · ${finished}/${rows.length} exercises checked complete`);
 const meter=document.getElementById('training-progress');if(meter){meter.max=Math.max(total,1);meter.value=done;}
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
 const count=workout.exercises.reduce((n,e)=>n+(e.sets?.length||0),0);
 add('p',`${workout.exercises.length} exercises · ${count} strength sets · ${Math.round(toDisplay(calcVolume(workout)))} ${unitLabel()} rep volume`);
 for(const pr of newPRs)add('p',`★ New personal best: ${pr.exercise} · ${formatStrengthSet(pr)}`);
 for(const exercise of workout.exercises){
  const last=LoadnoteSession.previous(previousWorkouts,exercise.name,workout.date,workout.id,exercise.type,exercise.trackBy);
  if(exercise.type==='cardio'){add('p',`${exercise.name}: ${exercise.duration||0} min · ${exercise.distance||0} ${exercise.distanceUnit}`);continue;}
  if(!last){add('p',`${exercise.name}: first matching session logged.`);continue;}
  add('h3',exercise.name);add('p','This session: '+exercise.sets.map(formatStrengthSet).join(' / '));add('p',`Previous (${last.date}): `+last.exercise.sets.map(formatStrengthSet).join(' / '));
 }
 const close=add('button','Dismiss recap');close.type='button';close.className='btn-secondary';close.onclick=()=>{host.hidden=true;};
}
