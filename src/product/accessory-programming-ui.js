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
  host.innerHTML='<summary>Optional accessories · complete your sessions</summary><p>Add up to 3 movements per day. Select purpose, actual equipment and an explicit starting load. Suggestions use reported priorities/name matches, not a diagnosis. Loads do not auto-progress.</p><button type="button" class="btn-secondary" data-accessory-suggest>Suggest from my priorities</button><button type="button" class="btn-secondary" data-accessory-add>Add accessory</button><div data-accessory-rows></div><p data-accessory-hint role="status"></p>';
  dialog.querySelector('button[type=submit]').before(host);
  const container=host.querySelector('[data-accessory-rows]'),hint=host.querySelector('[data-accessory-hint]');
  const notify=()=>host.dispatchEvent(new Event('input',{bubbles:true}));
  function add(template){
   if(container.children.length>=12){hint.textContent='At most 12 accessory slots are supported.';return;}
   const row=document.createElement('fieldset');row.dataset.accessoryRow='true';
   const group=template?.group||'upper-back',mode=group==='conditioning'?'cardio':group==='trunk'?'duration':'reps';
   const input=(key,label,value='',type='number')=>`<label>${label}<input class="input" data-accessory="${key}" type="${type}" value="${esc(value)}" ${type==='number'?'min="0" step="any"':''}></label>`;
   row.innerHTML=`<legend>Accessory ${container.children.length+1}</legend>${input('name','Exercise / substitution',template?.name||'','text')}<label>Training day<select class="input" data-accessory="day">${days.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></label><label>Workload group<select class="input" data-accessory="group">${options(A.GROUPS,group)}</select></label><label>Purpose<select class="input" data-accessory="purpose">${options(A.PURPOSES,group==='conditioning'?'conditioning':group==='trunk'?'trunk':'hypertrophy')}</select></label><label>Equipment<select class="input" data-accessory="equipment">${options(A.EQUIPMENT,template?.equipment||'dumbbells')}</select></label><label>Tracking<select class="input" data-accessory="mode"><option value="reps">Reps</option><option value="duration">Hold seconds</option><option value="cardio">Conditioning minutes</option></select></label><div data-accessory-strength>${input('sets','Accessory sets (1–3)',2)}${input('weight','Starting external load ('+(unit==='lb'?'lb':'kg')+'; zero only for bodyweight)',template?.equipment==='bodyweight'?0:'')}${input('targetRpe','Effort cap (RPE 6–8)',7)}<div data-accessory-reps>${input('minReps','Minimum reps (6–20)',8)}${input('maxReps','Maximum reps (6–20)',12)}</div><div data-accessory-hold>${input('seconds','Hold seconds (15–60)',30)}</div></div><div data-accessory-cardio>${input('minutes','Conditioning minutes (5–30)',10)}</div><label><input type="checkbox" data-accessory="equipmentConfirmed"> I have the equipment required for this exact movement.</label><p>Substitution: replace the exercise name and review its purpose, equipment, load and tracking. No accessory max is inferred from squat, bench or deadlift.</p><button type="button" class="btn-secondary" data-accessory-remove>Remove accessory</button>`;
   row.querySelector('[data-accessory=name]').maxLength=160;row.querySelector('[data-accessory=name]').setAttribute('list','exercise-list');
   const resetSelection=()=>{row.querySelector('[data-accessory=equipmentConfirmed]').checked=false;row.querySelector('[data-accessory=weight]').value='';};
   row.querySelector('[data-accessory=name]').addEventListener('input',resetSelection);
   row.querySelector('[data-accessory=equipment]').addEventListener('change',resetSelection);
   row.querySelector('[data-accessory=day]').value=String(template?.day??selectedDays()[0]??0);
   const select=row.querySelector('[data-accessory=mode]');select.value=mode;
   const sync=()=>{row.querySelector('[data-accessory-strength]').hidden=select.value==='cardio';row.querySelector('[data-accessory-cardio]').hidden=select.value!=='cardio';row.querySelector('[data-accessory-reps]').hidden=select.value!=='reps';row.querySelector('[data-accessory-hold]').hidden=select.value!=='duration';};
   select.addEventListener('change',sync);sync();row.querySelector('[data-accessory-remove]').onclick=()=>{row.remove();notify();};container.append(row);host.open=true;notify();
  }
  host.querySelector('[data-accessory-add]').onclick=()=>add();
  host.querySelector('[data-accessory-suggest]').onclick=()=>{
   const selected=selectedDays(),p=profile?.context;if(!selected.length){hint.textContent='Choose training days first.';return;}
   const priorities=String(p?.priorities||'').toLowerCase(),patterns={'upper-back':/upper.?back|lat|row/,quadriceps:/quad/,arms:/arm|bicep|tricep/,trunk:/core|trunk/,'posterior-chain':/hamstring|posterior/,chest:/chest/,conditioning:/condition/};
   const preferred=new Set(p?.preferredExerciseIds||[]),avoided=new Set(p?.avoidedExerciseIds||[]),competition=new Set((data.exerciseRoles||[]).filter(r=>r.role==='competition'||r.role==='close-variation').map(r=>r.exerciseId));
   const candidates=A.LIBRARY.map(t=>{const known=LoadnoteIntegrity.resolveExercise(data.exerciseCatalog,t.name);return {...t,id:known?.id||t.id,name:known?.name||t.name};}).filter(t=>!avoided.has(t.id)&&!competition.has(t.id)&&(preferred.has(t.id)||patterns[t.group].test(priorities)));
   if(!candidates.length){hint.textContent='No supported priority match. Add an accessory manually, or record priorities in your programming profile.';return;}
   const seen=new Set();let added=0;
   for(const t of candidates){if(seen.has(t.group)||added>=selected.length)continue;seen.add(t.group);add({...t,day:selected[added%selected.length]});added++;}
   hint.textContent='Suggestions match reported priorities or preferred identities in the starter library. Add other movements manually. Review equipment, starting loads and total session time before generating. Existing slots are not replaced.';
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
