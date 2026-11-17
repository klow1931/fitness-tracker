/* Device-local presentation only; training collections and kg values stay untouched. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./goal-progress'));else root.LoadnoteUIFlow=factory(root.LoadnoteGoalProgress);})(typeof globalThis!=='undefined'?globalThis:this,function(Goals){
 'use strict';
 const KEY='loadnote.ui-flow.v1';
 function normalize(value){return {pins:[...new Set((Array.isArray(value?.pins)?value.pins:[]).filter(k=>typeof k==='string'&&k.length<=512))].slice(0,64),goalId:typeof value?.goalId==='string'?value.goalId.slice(0,256):null};}
 function read(storage){try{if(!storage)storage=globalThis.localStorage;return normalize(JSON.parse(storage.getItem(KEY)||'null'));}catch{return normalize();}}
 function write(storage,patch){const next=normalize({...read(storage),...patch});storage.setItem(KEY,JSON.stringify(next));return next;}
 function togglePin(storage,key){const current=read(storage),pins=current.pins.includes(key)?current.pins.filter(k=>k!==key):[...current.pins,key];if(pins.length>64)throw Error('Unpin an exercise first');return write(storage,{pins});}
 function pinned(rows,pins){const byKey=new Map(rows.map(r=>[r.key,r]));return pins.map(k=>byKey.get(k)).filter(Boolean);}
 function homeGoal(state,goalId,asOf){
  const goals=(state?.goals||[]).filter(g=>g&&!g.completed&&['strength','workout-count'].includes(g.type)).map(g=>({goal:g,progress:Goals.inspect(state,g,asOf)})).filter(r=>r.progress);
  return {goals,selected:goals.find(r=>String(r.goal.id)===goalId)||goals[0]||null};
 }
 return {KEY,normalize,read,write,togglePin,pinned,homeGoal};
});
