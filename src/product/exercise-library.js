(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./exercise-reference'),require('./movement-guidance'));else root.LoadnoteExerciseLibrary=factory(root.LoadnoteExerciseReference,root.LoadnoteMovementGuidance);})(typeof globalThis!=='undefined'?globalThis:this,function(Reference,Guidance){
 'use strict';
 const norm=x=>String(x||'').trim().toLowerCase();
 function search(state,{query='',equipment='',role='',instructionsOnly=false}={}){
  const rows=Reference.entries.map(e=>({...e,known:true}));
  for(const c of state.exerciseCatalog||[])if(!rows.some(e=>norm(e.name)===norm(c.name)))rows.push({key:c.id,name:c.name,equipment:Reference.resolve(c.name)?.equipment||null,role:'saved exercise',aliases:c.aliases||[],description:'Your saved movement identity; load and tracking conventions belong to the reviewed plan.',known:false});
  for(const name of Guidance.names())if(!rows.some(e=>e.name===name))rows.push({key:'guide:'+name,name,equipment:null,role:'instruction',aliases:[],description:'Curated instruction for this exact name.',known:false});
  return rows.filter(e=>[e.name,...(e.aliases||[])].some(n=>norm(n).includes(norm(query)))&&(!equipment||e.equipment===equipment)&&(!role||e.role===role)&&(!instructionsOnly||!!Guidance.find(e.name))).sort((a,b)=>a.name.localeCompare(b.name)).map(e=>({...e,instructions:!!Guidance.find(e.name)}));
 }
 return {search};
});
