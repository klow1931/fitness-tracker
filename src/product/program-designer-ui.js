(function(){
 'use strict';
 function mount(form,{profile,onProfileSaved,invalidate}){
  const M=LoadnoteProgramDesigner,labels=LoadnoteProgrammingProfile.EQUIPMENT;
  let selectedUnit=currentUnit(),saving=false;
  const cache=new WeakMap(),weights=()=>[...form.querySelectorAll('#phase-increment,[id$="-tm"],[data-accessory="weight"]')];
  const read=input=>{const saved=cache.get(input);return saved?.display===input.value?saved.kg:M.kg(input.value,input.dataset.designerUnit||selectedUnit);};
  function convert(input,to){
   const from=input.dataset.designerUnit||selectedUnit;
   if(input.value!==''&&from!==to){const value=read(input);input.value=String(M.display(value,to));cache.set(input,{kg:value,display:input.value});}
   input.dataset.designerUnit=to;
   const text=input.closest('label')?.firstChild;
   if(text?.nodeType===3){const next=text.textContent.replace(/\((?:kg|lb)(?=[;)])/,'('+to);if(next!==text.textContent)text.textContent=next;}
  }
  const units=document.createElement('label');units.className='designer-unit-choice';units.textContent='Enter program loads in';
  const picker=document.createElement('select');picker.id='phase-input-unit';picker.className='input';picker.innerHTML='<option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option>';picker.value=selectedUnit;units.append(picker);
  const hint=document.createElement('p');hint.className='more-hint';hint.textContent='Applies to maxes, load increments and accessory loads. Preview weights use your app’s '+unitLabel()+' display. Switching converts entered values; blank maxes stay blank.';
  const basics=form.querySelector('.phase-main-lifts');basics.querySelector('legend').after(units,hint);
  picker.onchange=()=>{
   const next=picker.value;
   try{for(const input of weights())if(input.value!=='')M.display(read(input),next);for(const input of weights())convert(input,next);selectedUnit=next;invalidate();form._programWizard?.render();}
   catch(e){picker.value=selectedUnit;form.querySelector('#phase-error').textContent=e.message;}
  };
  form.addEventListener('input',e=>cache.delete(e.target));
  const refresh=()=>weights().forEach(input=>convert(input,selectedUnit));refresh();
  const observer=new MutationObserver(()=>refresh());observer.observe(form,{childList:true,subtree:true});
  const access=document.createElement('details');access.className='more-details designer-equipment';access.id='phase-equipment-access';
  access.innerHTML='<summary></summary><fieldset><legend>Equipment you can actually use</legend>'+Object.entries(labels).map(([key,label])=>'<label><input type="checkbox" data-designer-equipment value="'+key+'"> '+label+'</label>').join('')+'</fieldset><p class="more-hint">This barbell designer needs all four. Confirm actual access here; existing programs and workouts stay unchanged.</p><button type="button" class="btn-secondary" data-designer-save-equipment>Save equipment access</button><p role="status" data-designer-equipment-status></p>';
  const status=access.querySelector('[role=status]'),button=access.querySelector('button');
  function renderEquipment(){
   const missing=M.missing(profile);access.querySelector('summary').textContent=missing.length?'Confirm equipment access':'Equipment access confirmed';access.open=missing.length>0;
   for(const input of access.querySelectorAll('input'))input.checked=profile.context.equipment.includes(input.value);
   status.textContent=missing.length?'Missing in saved setup: '+missing.map(k=>labels[k]).join(', ')+'.':'Barbell, plates, rack and bench confirmed in saved setup.';
  }
  button.onclick=async()=>{
   if(saving)return;saving=true;button.disabled=true;
   try{const next=M.updateEquipment(data,profile.id,[...access.querySelectorAll(':checked')].map(e=>e.value));if(next!==data){clearTimeout(saveTimer);await persistNow(next);data=next;invalidateViews();profile=LoadnoteProgrammingProfile.current(data.programmingProfiles);onProfileSaved(profile);invalidate();}renderEquipment();if(!access.open)access.querySelector('summary').focus({preventScroll:true});const error=form.querySelector('#phase-error');if(M.equipmentError(error.textContent))error.textContent='';status.textContent=M.missing(profile).length?'Access saved. This designer still needs: '+M.missing(profile).map(k=>labels[k]).join(', ')+'.':'Equipment access saved. Continue with your setup.';}
   catch(e){status.textContent='Could not save equipment access: '+e.message;}
   finally{saving=false;button.disabled=false;}
  };
  (form.querySelector('[data-wizard-step="0"]')||form).append(access);renderEquipment();
  const guard=()=>{if(saving)throw Error('Saving equipment access. Wait for confirmation before continuing.');M.requireEquipment(profile);};
  form._designer={unit:()=>selectedUnit,kg:read,guard,refresh,errorField:()=>access.querySelector('[data-designer-equipment]:not(:checked)')||button};
  form.closest('dialog').addEventListener('close',()=>observer.disconnect(),{once:true});
  return form._designer;
 }
 window.LoadnoteProgramDesignerUI={mount};
})();
