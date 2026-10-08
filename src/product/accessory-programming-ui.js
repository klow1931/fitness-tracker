(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const options=(values,selected)=>Object.entries(values).map(([k,v])=>`<option value="${esc(k)}" ${k===selected?'selected':''}>${esc(v)}</option>`).join('');
 function describe(e){
  if(e.type==='cardio')return `${e.duration} min · athlete-reviewed duration`;
  const values=e.sets.map(s=>`${toDisplay(s.weight)} ${unitLabel()} × ${e.trackBy==='duration'?s.duration+' sec':s.reps+' reps'} · cap ${s.targetRpe}`).join(' / ');
  return values+(e.repRange?` · rep range ${e.repRange.min}–${e.repRange.max}`:'');
 }
 function summary(sessions){
  const A=window.LoadnoteAccessories,first=sessions.filter(s=>s.week===1),w=A.workload(first.flatMap(s=>s.exercises));
  if(!w.strengthSets&&!w.conditioningMinutes)return '';
  return `<div class="cycle-controller-summary"><p><b>Accessory workload · first week:</b> ${w.strengthSets} strength/hold sets · ${w.conditioningMinutes} conditioning minutes. Separate from competition-lift workload.</p><p>${Object.entries(w.groups).map(([g,n])=>esc(A.GROUPS[g])+': '+n+' sets').join(' · ')}</p><p>These assigned-group counts do not include all indirect work from your main lifts. Review combined session time and recovery.</p></div>`;
 }
 function mount(dialog,{selectedDays,unit,profile}){
  const A=window.LoadnoteAccessories,host=document.createElement('details');host.className='more-details';host.dataset.accessoryEditor='true';
  host.innerHTML='<summary>Optional accessories</summary><p>Add up to 3 movements per day. Select purpose, actual equipment and an explicit starting load. Suggestions use reported priorities/name matches, not a diagnosis. Loads do not auto-progress.</p><button type="button" class="btn-secondary" data-accessory-suggest>Suggest from my priorities</button><button type="button" class="btn-secondary" data-accessory-add>Add accessory</button><div data-accessory-rows></div><p data-accessory-hint role="status"></p>';
  dialog.querySelector('button[type=submit]').before(host);
  const container=host.querySelector('[data-accessory-rows]'),hint=host.querySelector('[data-accessory-hint]'),R=window.LoadnoteExerciseReference;
  const tools=document.createElement('fieldset');tools.innerHTML='<legend>Tools for suggestions</legend><p>Choose what is available. Review the exact setup for each movement.</p>'+Object.entries(A.EQUIPMENT).map(([k,v])=>`<label><input type="checkbox" data-accessory-tool value="${k}" ${(profile?.context?.accessoryEquipment||['bodyweight',...(profile?.context?.equipment?.includes('barbell')?['barbell']:[])]).includes(k)?'checked':''}> ${esc(v)}</label>`).join('');host.querySelector('[data-accessory-suggest]').before(tools);
  const equipment=()=>[...tools.querySelectorAll(':checked')].map(e=>e.value);
  const available=()=>{const preferred=new Set(profile?.context?.preferredExerciseIds||[]),excluded=new Set([...(profile?.context?.avoidedExerciseIds||[]),...(data.exerciseRoles||[]).filter(r=>r.role==='competition'||r.role==='close-variation').map(r=>r.exerciseId)]);return A.LIBRARY.map(t=>{const known=LoadnoteIntegrity.resolveExercise(data.exerciseCatalog,t.name);return {...t,id:known?.id||t.id,name:known?.name||t.name};}).filter(t=>!excluded.has(t.id)).sort((a,b)=>Number(preferred.has(b.id))-Number(preferred.has(a.id)));};
  const notify=()=>host.dispatchEvent(new Event('input',{bubbles:true}));
  function add(template){
   if(container.children.length>=12){hint.textContent='At most 12 accessory slots are supported.';return;}
   const row=document.createElement('fieldset');row.dataset.accessoryRow='true';
   const group=template?.group||'upper-back',mode=group==='conditioning'?'cardio':group==='trunk'?'duration':'reps';
   const input=(key,label,value='',type='number')=>`<label>${label}<input class="input" data-accessory="${key}" type="${type}" value="${esc(value)}" ${type==='number'?'min="0" step="any"':''}></label>`;
   row.innerHTML=`<legend>Accessory ${container.children.length+1}</legend>${input('name','Exercise / substitution',template?.name||'','text')}<label>Training day<select class="input" data-accessory="day">${days.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></label><label>Workload group<select class="input" data-accessory="group">${options(A.GROUPS,group)}</select></label><label>Purpose<select class="input" data-accessory="purpose">${options(A.PURPOSES,group==='conditioning'?'conditioning':group==='trunk'?'trunk':'hypertrophy')}</select></label><label>Equipment<select class="input" data-accessory="equipment">${options(A.EQUIPMENT,template?.equipment||'dumbbells')}</select></label><label>Tracking<select class="input" data-accessory="mode"><option value="reps">Reps</option><option value="duration">Hold seconds</option><option value="cardio">Conditioning minutes</option></select></label><div data-accessory-strength>${input('sets','Accessory sets (1–3)',2)}${input('weight','Starting external load ('+(unit==='lb'?'lb':'kg')+'; zero only for bodyweight)',['bodyweight','pullup'].includes(template?.equipment)?0:'')}${input('targetRpe','Effort cap (RPE 6–8)',7)}<div data-accessory-reps>${input('minReps','Minimum reps (6–20)',8)}${input('maxReps','Maximum reps (6–20)',12)}</div><div data-accessory-hold>${input('seconds','Hold seconds (15–60)',30)}</div></div><div data-accessory-cardio>${input('minutes','Conditioning minutes (5–30)',10)}</div><label><input type="checkbox" data-accessory="equipmentConfirmed"> I have the equipment required for this exact movement.</label><p>Substitution: replace the exercise name and review its purpose, equipment, load and tracking. No accessory max is inferred from squat, bench or deadlift.</p><button type="button" class="btn-secondary" data-accessory-remove>Remove accessory</button>`;
   row.querySelector('[data-accessory=name]').maxLength=160;row.querySelector('[data-accessory=name]').setAttribute('list','exercise-list');
   const resetSelection=()=>{row.querySelector('[data-accessory=equipmentConfirmed]').checked=false;row.querySelector('[data-accessory=weight]').value='';};
   row.querySelector('[data-accessory=name]').addEventListener('input',resetSelection);
   row.querySelector('[data-accessory=equipment]').addEventListener('change',resetSelection);
   row.querySelector('[data-accessory=day]').value=String(template?.day??selectedDays()[0]??0);
   const picker=document.createElement('label');picker.textContent='Choose a movement';
   const movement=document.createElement('select');movement.className='input';movement.dataset.accessoryMovement='true';movement.innerHTML='<option value="">Custom exercise · enter below</option>'+available().map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+' · '+esc(A.GROUPS[t.group])+'</option>').join('');
   movement.innerHTML='<option value="">Custom exercise · enter below</option>'+Object.entries(A.GROUPS).map(([g,label])=>'<optgroup label="'+esc(label)+'">'+available().filter(t=>t.group===g).map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+'</option>').join('')+'</optgroup>').join('');
   picker.append(movement);row.querySelector('legend').after(picker);movement.value=template?.id||'';
   const reason=document.createElement('p');reason.dataset.accessoryReason='true';reason.setAttribute('role','status');picker.after(reason);
   const explain=(chosen)=>{reason.textContent=chosen?[(chosen.reason||'Library option for '+A.GROUPS[chosen.group]+'.'),chosen.description+'.','Review a separate load and the exact equipment setup.'].filter(Boolean).join(' '):'Custom movement: review its purpose, equipment and starting load.';};explain(template);
   const daySelect=row.querySelector('[data-accessory=day]');const syncDays=()=>{const chosen=selectedDays();[...daySelect.options].forEach(o=>o.disabled=!chosen.includes(Number(o.value)));if(!chosen.includes(Number(daySelect.value)))daySelect.value=String(chosen[0]??'');};syncDays();
   dialog.querySelector('form').addEventListener('change',syncDays);
   const select=row.querySelector('[data-accessory=mode]');select.value=mode;
   const sync=()=>{row.querySelector('[data-accessory-strength]').hidden=select.value==='cardio';row.querySelector('[data-accessory-cardio]').hidden=select.value!=='cardio';row.querySelector('[data-accessory-reps]').hidden=select.value!=='reps';row.querySelector('[data-accessory-hold]').hidden=select.value!=='duration';};
   movement.addEventListener('change',()=>{const chosen=available().find(t=>t.id===movement.value);if(!chosen){explain(null);resetSelection();notify();return;}explain(chosen);row.querySelector('[data-accessory=name]').value=chosen.name;row.querySelector('[data-accessory=group]').value=chosen.group;row.querySelector('[data-accessory=equipment]').value=chosen.equipment;row.querySelector('[data-accessory=purpose]').value=chosen.group==='conditioning'?'conditioning':chosen.group==='trunk'?'trunk':'hypertrophy';select.value=chosen.group==='conditioning'?'cardio':chosen.group==='trunk'?'duration':'reps';resetSelection();if(['bodyweight','pullup'].includes(chosen.equipment))row.querySelector('[data-accessory=weight]').value='0';sync();notify();});
   row.querySelector('[data-accessory=name]').addEventListener('input',()=>{movement.value='';explain(null);});
   select.addEventListener('change',sync);sync();row.querySelector('[data-accessory-remove]').onclick=()=>{row.remove();notify();};container.append(row);host.open=true;notify();
  }
  host.querySelector('[data-accessory-add]').onclick=()=>add();
  host.querySelector('[data-accessory-suggest]').onclick=()=>{
   const selected=selectedDays(),p=profile?.context;if(!selected.length){hint.textContent='Choose training days first.';return;}
   const excluded=[...(p?.avoidedExerciseIds||[]),...(data.exerciseRoles||[]).filter(r=>r.role==='competition'||r.role==='close-variation').map(r=>r.exerciseId)];
   const candidates=R.suggestions({priorities:p?.priorities,preferredExerciseIds:p?.preferredExerciseIds,equipment:equipment(),excludedExerciseIds:excluded,catalog:data.exerciseCatalog,identify:LoadnoteIntegrity.stableExerciseId});
   if(!candidates.length){hint.textContent='No match with the selected tools. Check your priorities or tools, choose a library movement, or add a custom exercise.';return;}
   const existing=new Set([...container.children].map(row=>row.querySelector('[data-accessory=name]').value.toLowerCase())),counts=Object.fromEntries(selected.map(day=>[day,[...container.children].filter(row=>Number(row.querySelector('[data-accessory=day]').value)===day).length]));
   let added=0;const suggestedGroups=new Set();
   for(const t of candidates){if(suggestedGroups.has(t.group)||existing.has(t.name.toLowerCase())||added>=selected.length||container.children.length>=12)continue;const day=selected.filter(d=>counts[d]<3).sort((a,b)=>counts[a]-counts[b])[0];if(day===undefined)break;add({...t,day});existing.add(t.name.toLowerCase());counts[day]++;suggestedGroups.add(t.group);added++;}
   hint.textContent=added?added+' suggested movement(s) added. Preferred movements come first. Use the picker to swap; confirm equipment and starting loads before previewing.':'Matching movements are already listed, or accessory slots are full. Use the movement picker to swap a suggestion.';

  };
  function read(){return [...container.children].map(row=>{
   const v=k=>row.querySelector(`[data-accessory="${k}"]`).value,name=v('name').trim(),known=LoadnoteIntegrity.resolveExercise(data.exerciseCatalog,name),mode=v('mode');
   if(mode!=='cardio'&&v('weight')==='')throw Error('Enter an explicit accessory starting load; zero is only for bodyweight.');
   return {policy:A.POLICY,exerciseId:known?.id||LoadnoteIntegrity.stableExerciseId(name),name:known?.name||name,day:Number(v('day')),group:v('group'),purpose:v('purpose'),equipment:v('equipment'),equipmentConfirmed:row.querySelector('[data-accessory=equipmentConfirmed]').checked,mode,...(mode==='cardio'?{minutes:Number(v('minutes'))}:{sets:Number(v('sets')),weightKg:Number(v('weight'))*(unit==='lb'?.45359237:1),targetRpe:Number(v('targetRpe')),...(mode==='duration'?{seconds:Number(v('seconds'))}:{minReps:Number(v('minReps')),maxReps:Number(v('maxReps'))})})};
  });}
  return {read};
 }
 window.LoadnoteAccessoriesUI={mount,describe,summary};
})();
