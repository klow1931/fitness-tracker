/* Accessible, scoped nutrition forms. Library updates never rewrite history. */
function nutritionSummary7(key) {
  const range=LoadnoteNutrition.window7(today());
  return LoadnoteNutrition.summary(data.nutrition,key,range.start,range.end);
}
function nutritionSummaryLabel(summary,unit) {
  return (summary.average===null?'No average':round1(summary.average)+' '+unit)+' · '+summary.validDays+' complete days with known values / '+summary.loggedDays+' logged';
}
function nutritionDialog(title) {
  nutritionRefreshToken++;
  let dialog=document.getElementById('nutrition-dialog');
  if(!dialog) {dialog=document.createElement('dialog');dialog.id='nutrition-dialog';dialog.className='nutrition-dialog';document.body.appendChild(dialog);}
  if(dialog.open)dialog.close();
  dialog.innerHTML='<h2 id="nutrition-dialog-title"></h2><div id="nutrition-dialog-body"></div><p id="nutrition-dialog-error" role="alert"></p><button type="button" id="nutrition-dialog-cancel" class="btn-secondary">Cancel</button>';
  dialog.setAttribute('aria-labelledby','nutrition-dialog-title');
  dialog.querySelector('h2').textContent=title;
  dialog.querySelector('#nutrition-dialog-cancel').onclick=()=>dialog.close();
  return dialog;
}
function editPickedFood() {if(pickedFood)openNutritionEditor(pickedFood,'picked');}
function editLibraryFood(id) {
  const food=data.foodLibrary.find(f=>String(f.id)===String(id));
  if(food)openNutritionEditor(food,'library');
}
function openNutritionEditor(food,mode) {
  const date=document.getElementById('nu-date').value || today();
  const base={...food};
  const initial=mode==='day' ? LoadnoteNutrition.number(food.servings) || 1 : 1;
  if(mode==='day')LoadnoteNutrition.fields.forEach(k=>base[k]=LoadnoteNutrition.number(food[k])===null?null:food[k]/initial);
  const basis=LoadnoteNutrition.basis(food);
  const dialog=nutritionDialog(mode==='library'?'Edit library food':'Edit food and portion');
  const fields=LoadnoteNutrition.fields.map(key=>{
    const unit=key==='calories'?'kcal':MICRO_FIELDS.find(f=>f.key===key)?.unit || 'g';
    return '<label>'+escapeHtml(key)+' ('+unit+')<input class="input" type="number" step="any" min="0" max="100000" id="nutrition-edit-'+key+'" value="'+escapeHtml(base[key] ?? '')+'" /></label>';
  }).join('');
  dialog.querySelector('#nutrition-dialog-body').innerHTML=`<form id="nutrition-edit-form">
    <label>Name<input id="nutrition-edit-name" class="input" required maxlength="200" value="${escapeHtml(food.name)}" /></label>
    <label>Serving description<input id="nutrition-edit-serving" class="input" value="${escapeHtml(food.serving || '1 serving')}" /></label>
    <p>All nutrients below are for ONE serving. Confirm these against the package label. Blank means unknown.</p>
    <label>One serving equals (optional)<input id="nutrition-edit-basis" class="input" type="number" min="0.001" max="100000" step="any" value="${basis.servingQuantity ?? ''}" /></label>
    <label>Serving basis unit<select id="nutrition-edit-basis-unit" class="input"><option value="">Not specified</option><option value="g">g</option><option value="ml">ml</option></select></label>
    <p>Do not convert grams to milliliters. For barcode values per 100g/100ml, enter 100 and the unit shown on the package.</p>
    <div class="nutrition-editor-grid">${fields}</div>
    <label>Amount to log<input id="nutrition-edit-amount" class="input" type="number" step="any" min="0.001" required value="${initial}" /></label>
    <label>Amount unit<select id="nutrition-edit-unit" class="input"><option value="servings">Servings</option><option value="g">g</option><option value="ml">ml</option></select></label>
    <p>${mode==='library'?'Changes apply to future uses only. Amount is not used for a library edit.':'Changes apply to this entry only, not your library or other days.'}</p>
    <button class="btn-primary" type="submit">Save food</button></form>`;
  dialog.querySelector('#nutrition-edit-basis-unit').value=basis.servingUnit || '';
  if(mode==='library') {dialog.querySelector('#nutrition-edit-amount').disabled=true;dialog.querySelector('#nutrition-edit-unit').disabled=true;}
  dialog.querySelector('form').onsubmit=async event=>{
    event.preventDefault();
    const button=event.submitter;button.disabled=true;
    try {
      const name=document.getElementById('nutrition-edit-name').value.trim();
      if(!name)throw new Error('Name required.');
      const edited={...base,name,serving:document.getElementById('nutrition-edit-serving').value.trim() || '1 serving',servingQuantity:readNutritionInput('nutrition-edit-basis'),servingUnit:document.getElementById('nutrition-edit-basis-unit').value || null};
      if(!!edited.servingQuantity!==!!edited.servingUnit)throw new Error('Specify both serving quantity and unit, or leave both blank.');
      if(edited.servingQuantity)edited.serving=edited.servingQuantity+edited.servingUnit;
      LoadnoteNutrition.fields.forEach(key=>edited[key]=readNutritionInput('nutrition-edit-'+key));
      if(mode==='library') {
        const index=data.foodLibrary.findIndex(f=>String(f.id)===String(food.id));
        if(index<0)throw new Error('This food is no longer in your library.');
        data.foodLibrary[index]={...edited,source:food.source==='builtin'?'custom':food.source,labelReviewedAt:new Date().toISOString()};
        await persistNow(data);renderFoodLibrary();
      } else if(mode==='picked') {
        const amount=document.getElementById('nutrition-edit-amount').value,unit=document.getElementById('nutrition-edit-unit').value;
        const quantity=LoadnoteNutrition.portion(edited,amount,unit);
        pickFood(edited);document.getElementById('picked-servings').value=quantity;
      } else {
        if(date!==(document.getElementById('nu-date').value || today()))throw new Error('The selected day changed. Reopen this editor.');
        const quantity=LoadnoteNutrition.portion(edited,document.getElementById('nutrition-edit-amount').value,document.getElementById('nutrition-edit-unit').value);
        dayFoods=dayFoods.map(f=>String(f.id)===String(food.id)?{...LoadnoteNutrition.scale(edited,quantity),id:food.id}:f);
        await commitNutritionDay();
      }
      dialog.close();
    }catch(error){dialog.querySelector('#nutrition-dialog-error').textContent=error.message;}
    finally{button.disabled=false;}
  };
  dialog.showModal();
}
function openRecentNutritionFoods() {
  const recent=[...(data.nutrition || [])].sort((a,b)=>b.date.localeCompare(a.date)).flatMap(d=>d.foods || []);
  const seen=new Set();const foods=recent.filter(f=>{const key=f.name+'|'+f.serving;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,20);
  const dialog=nutritionDialog('Repeat recent food');
  const body=dialog.querySelector('#nutrition-dialog-body');
  body.innerHTML=foods.length?foods.map((f,i)=>'<button class="btn-secondary" data-recent="'+i+'">'+escapeHtml(f.name)+' ×'+escapeHtml(f.servings)+'</button>').join(''):'Log a food first to reuse it here.';
  body.onclick=event=>{const b=event.target.closest('[data-recent]');if(!b)return;dayFoods.push({...foods[Number(b.dataset.recent)],id:crypto.randomUUID()});commitNutritionDay();dialog.close();};
  dialog.showModal();
}
let nutritionRefreshToken=0;
async function refreshBarcodeFood(id) {
  const food=data.foodLibrary.find(f=>String(f.id)===String(id));
  if(!food?.barcode)return;
  const dialog=nutritionDialog('Compare barcode with package label');
  const token=nutritionRefreshToken;
  dialog.querySelector('#nutrition-dialog-body').textContent='Fetching current Open Food Facts values…';dialog.showModal();
  try {
    const product=await fetchOpenFoodFacts(food.barcode);
    if(token!==nutritionRefreshToken || !dialog.open)return;
    if(!product)throw new Error('Product not found. Your saved food has not changed.');
    const fresh=foodFromOpenFoodFactsProduct(product,food.barcode);
    dialog.querySelector('#nutrition-dialog-body').innerHTML=`<p>Compare both serving bases with your package. The columns may use different portions; they are NOT a like-for-like nutrient change. Online data can be incomplete. Replacing updates only the library, never historical meals.</p>
      <div class="nutrition-table-scroll"><table><thead><tr><th>Field</th><th>Saved</th><th>Online</th></tr></thead><tbody>
      <tr><th>Name</th><td>${escapeHtml(food.name)}</td><td>${escapeHtml(fresh.name)}</td></tr>
      <tr><th>Serving basis</th><td>${escapeHtml(food.serving)}</td><td>${escapeHtml(fresh.serving)}</td></tr>
      ${LoadnoteNutrition.fields.map(key=>'<tr><th>'+escapeHtml(key)+' ('+(key==='calories'?'kcal':MICRO_FIELDS.find(f=>f.key===key)?.unit || 'g')+')</th><td>'+nutritionValue(food[key])+'</td><td>'+nutritionValue(fresh[key])+'</td></tr>').join('')}
      </tbody></table></div><label><input type="checkbox" id="nutrition-label-confirm" /> I compared the values and serving basis with my package</label><button id="nutrition-replace-food" class="btn-primary" disabled>Replace library values</button>`;
    const button=dialog.querySelector('#nutrition-replace-food');
    dialog.querySelector('#nutrition-label-confirm').onchange=event=>button.disabled=!event.target.checked;
    button.onclick=async()=>{
      button.disabled=true;
      try {
        const index=data.foodLibrary.findIndex(f=>String(f.id)===String(id));
        if(index<0)throw new Error('Saved food no longer exists.');
        data.foodLibrary[index]={...fresh,id:food.id,labelReviewedAt:new Date().toISOString()};
        await persistNow(data);renderFoodLibrary();dialog.close();showToast('Library updated. Historical entries unchanged.','success');
      }catch(error){dialog.querySelector('#nutrition-dialog-error').textContent=error.message;button.disabled=false;}
    };
  }catch(error){if(token===nutritionRefreshToken && dialog.open)dialog.querySelector('#nutrition-dialog-error').textContent=error.message;}
}
