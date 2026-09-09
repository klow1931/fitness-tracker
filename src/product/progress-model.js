(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteProgress=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const nameKey=name=>String(name||'').trim().toLowerCase();
 function mode(e){return e.type==='cardio'?'cardio':e.trackBy==='duration'||(!e.trackBy&&(e.sets||[]).some(s=>s.duration>0&&!(s.reps>0)))?'duration':'reps';}
 function key(e){return JSON.stringify([nameKey(e.name),mode(e)]);}
 function filter(workouts,{query='',from='',to=''}={}){return (workouts||[]).filter(w=>(!from||w.date>=from)&&(!to||w.date<=to)&&(!query||(w.exercises||[]).some(e=>nameKey(e.name).includes(nameKey(query))))).slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));}
 function entries(workouts,name,tracking='reps'){return filter(workouts).flatMap(w=>(w.exercises||[]).filter(e=>nameKey(e.name)===nameKey(name)&&mode(e)===tracking).map(e=>({date:w.date,id:w.id,exercise:e})));}
 function series(workouts,name,{weeks=0,metric='estimate',end}={},estimate){
  const now=end||new Date().toISOString().slice(0,10),start=new Date(now+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-Number(weeks)*7+1);
  const from=weeks?start.toISOString().slice(0,10):'',byDate=new Map();
  for(const entry of entries(filter(workouts,{from,to:now}),name))for(const s of entry.exercise.sets||[]){
   if(!(Number(s.reps)>0)||!Number.isFinite(Number(s.weight))||Number(s.weight)<0)continue;
   const value=metric==='load'?Number(s.weight):estimate(Number(s.weight),Number(s.reps));if(!Number.isFinite(value))continue;
   byDate.set(entry.date,Math.max(byDate.get(entry.date)??-Infinity,value));
  }
  return [...byDate].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value}));
 }
 function compare(a,b){
  const group=w=>{const result=new Map();for(const e of w?.exercises||[]){const k=key(e);if(!result.has(k))result.set(k,{name:e.name,mode:mode(e),exercises:[]});result.get(k).exercises.push(e);}return result;};
  const left=group(a),right=group(b);return [...new Set([...left.keys(),...right.keys()])].map(k=>({name:(left.get(k)||right.get(k)).name,mode:(left.get(k)||right.get(k)).mode,left:left.get(k)?.exercises||[],right:right.get(k)?.exercises||[]}));
 }
 return {mode,key,filter,entries,series,compare};
});
