/* Nutrition values are per named serving; null means unknown, never measured zero. */
(function(root) {
  'use strict';
  const macros = ['protein','carbs','fat','calories'];
  const micros = ['fiber','sugar','satFat','cholesterol','sodium','potassium','calcium','iron','vitaminC','vitaminD','magnesium'];
  const fields = [...macros,...micros];
  const number = value => value === '' || value == null ? null : (Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null);
  const round = n => Math.round(n * 1000) / 1000;
  function servings(value) {
    const n = number(value);
    if (n === null || n <= 0 || n > 1000) throw new Error('Enter servings greater than 0 and no more than 1,000.');
    return n;
  }
  function scale(food, quantity) {
    quantity = servings(quantity);
    const result = {id: root.crypto?.randomUUID?.() || String(Date.now())+'-'+Math.random(), name:String(food.name || 'Food'), serving:String(food.serving || '1 serving'), servings:quantity, ...basis(food)};
    if(food.barcode) result.barcode=String(food.barcode);
    fields.forEach(key => { const n=number(food[key]); result[key]=n === null ? null : round(n*quantity); });
    if(result.calories === null && macros.slice(0,3).every(k=>result[k] !== null)) result.calories=round(result.protein*4+result.carbs*4+result.fat*9);
    return result;
  }
  function totals(foods) {
    const result={};
    fields.forEach(key=>{result[key]=foods.length && foods.some(f=>number(f[key])===null) ? null : round(foods.reduce((sum,f)=>sum+(number(f[key]) || 0),0));});
    return result;
  }
  function fromProduct(p, barcode) {
    const n=p.nutriments || {};
    const map={protein:'proteins',carbs:'carbohydrates',fat:'fat',calories:'energy-kcal',fiber:'fiber',sugar:'sugars',satFat:'saturated-fat',cholesterol:'cholesterol',sodium:'sodium',potassium:'potassium',calcium:'calcium',iron:'iron',vitaminC:'vitamin-c',vitaminD:'vitamin-d',magnesium:'magnesium'};
    // Use one basis for every field. Never silently mix 100g and serving values.
    const nutrientKeys=[...Object.values(map),'energy-kj','energy','salt'];
    const has100=nutrientKeys.some(k=>number(n[k+'_100g'])!==null);
    const suffix=has100?'_100g':'_serving';
    const hasServing=nutrientKeys.some(k=>number(n[k+'_serving'])!==null);
    if(!has100 && !hasServing) throw new Error('This product has no usable nutrition values. Add its label manually.');
    const food={id:'bc-'+barcode,name:String(p.product_name || p.generic_name || 'Unknown product'),brand:String(p.brands || ''),barcode:String(barcode),serving:has100?'100g / 100ml (match package label)':String(p.serving_size || '1 serving (check package)'),source:'openfoodfacts',nutritionBasis:has100?'100g':'serving',servingQuantity:has100?100:null,servingUnit:null};
    Object.entries(map).forEach(([key,api])=>{
      let value=number(n[api+suffix]);
      if(key==='calories' && value===null) {const kj=number(n['energy-kj'+suffix]) ?? number(n['energy'+suffix]);value=kj===null?null:kj/4.184;}
      if(key==='sodium' && value===null) {const salt=number(n['salt'+suffix]);value=salt===null?null:salt/2.5;}
      if(value!==null && ['cholesterol','sodium','potassium','calcium','iron','vitaminC','magnesium'].includes(key)) value*=1000;
      if(value!==null && key==='vitaminD') value*=1000000;
      food[key]=value===null?null:round(value);
    });
    return food;
  }
  function resize(entry, quantity) {
    const old=servings(entry.servings);
    const base={...entry}; fields.forEach(k=>base[k]=number(entry[k])===null?null:entry[k]/old);
    return {...scale(base,quantity),id:entry.id};
  }
  function basis(food) {
    if(number(food.servingQuantity)>0 && ['g','ml'].includes(food.servingUnit)) return {servingQuantity:Number(food.servingQuantity),servingUnit:food.servingUnit};
    const label=String(food.serving || '');
    // Mixed mass/volume labels need explicit confirmation; never infer a density.
    if(/\bg\b/i.test(label) && /\bml\b/i.test(label)) return {servingQuantity:null,servingUnit:null};
    const match=label.match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i) || label.match(/\((\d+(?:\.\d+)?)\s*(g|ml)\)/i);
    return match && Number(match[1])>0 ? {servingQuantity:Number(match[1]),servingUnit:match[2].toLowerCase()} : {servingQuantity:null,servingUnit:null};
  }
  function portion(food, amount, unit) {
    if(unit==='servings') return servings(amount);
    const b=basis(food);
    if(!['g','ml'].includes(unit) || b.servingUnit!==unit || !b.servingQuantity) throw new Error('Confirm a matching gram or milliliter serving basis first. Mass and volume cannot be interchanged.');
    const value=number(amount);
    if(value===null || value<=0) throw new Error('Enter a positive amount.');
    return servings(value/b.servingQuantity);
  }
  function summary(days, key, start='', end='9999-12-31') {
    const unique=new Map();
    for(const day of days || []) if(day && /^\d{4}-\d{2}-\d{2}$/.test(day.date) && day.date>=start && day.date<=end) unique.set(day.date,day);
    const logged=[...unique.values()];
    const completed=logged.filter(d=>d.complete===true);
    const values=completed.map(d=>number(d[key])).filter(v=>v!==null);
    return {average:values.length?round(values.reduce((a,b)=>a+b,0)/values.length):null,validDays:values.length,completeDays:completed.length,loggedDays:logged.length,incompleteDays:logged.length-completed.length,unknownDays:completed.length-values.length};
  }
  function window7(end) {
    const d=new Date(end+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-6);
    return {start:d.toISOString().slice(0,10),end};
  }
  const api={fields,number,servings,scale,totals,fromProduct,resize,basis,portion,summary,window7};
  root.LoadnoteNutrition=api;
  if(typeof module==='object' && module.exports) module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
