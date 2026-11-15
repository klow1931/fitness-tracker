(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteProgress=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const nameKey=name=>String(name||'').trim().toLowerCase();
 function mode(e){return e.type==='cardio'?'cardio':e.trackBy==='duration'||(!e.trackBy&&(e.sets||[]).some(s=>s.duration>0&&!(s.reps>0)))?'duration':'reps';}
 function key(e){return JSON.stringify([e.exerciseId||nameKey(e.name),mode(e)]);}
 function filter(workouts,{query='',from='',to=''}={}){return (workouts||[]).filter(w=>(!from||w.date>=from)&&(!to||w.date<=to)&&(!query||(w.exercises||[]).some(e=>nameKey(e.name).includes(nameKey(query))))).slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));}
 function entries(workouts,name,tracking='reps',exerciseId){
  const ids=new Set(exerciseId?[exerciseId]:[]);for(const w of workouts||[])for(const e of w.exercises||[])if(nameKey(e.name)===nameKey(name)&&e.exerciseId)ids.add(e.exerciseId);
  return filter(workouts).flatMap(w=>(w.exercises||[]).filter(e=>(nameKey(e.name)===nameKey(name)||(e.exerciseId&&ids.has(e.exerciseId)))&&mode(e)===tracking).map(e=>({date:w.date,id:w.id,exercise:e})));
 }
 function series(workouts,name,{weeks=0,metric='estimate',end,exerciseId}={},estimate){
  const now=end||new Date().toISOString().slice(0,10),start=new Date(now+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-Number(weeks)*7+1);
  const from=weeks?start.toISOString().slice(0,10):'',byDate=new Map();
  for(const entry of entries(filter(workouts,{from,to:now}),name,'reps',exerciseId))for(const s of entry.exercise.sets||[]){
   if(!(Number(s.reps)>0)||!Number.isFinite(Number(s.weight))||Number(s.weight)<0)continue;
   const value=metric==='load'?Number(s.weight):estimate(Number(s.weight),Number(s.reps),s.rpe);if(!Number.isFinite(value))continue;
   byDate.set(entry.date,Math.max(byDate.get(entry.date)??-Infinity,value));
  }
  return [...byDate].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value}));
 }
 function compare(a,b){
  const group=w=>{const result=new Map();for(const e of w?.exercises||[]){const k=key(e);if(!result.has(k))result.set(k,{name:e.name,mode:mode(e),exercises:[]});result.get(k).exercises.push(e);}return result;};
  const left=group(a),right=group(b);return [...new Set([...left.keys(),...right.keys()])].map(k=>({name:(left.get(k)||right.get(k)).name,mode:(left.get(k)||right.get(k)).mode,left:left.get(k)?.exercises||[],right:right.get(k)?.exercises||[]}));
 }
 function options(workouts){
  const rows=new Map();for(const w of workouts||[])for(const e of w.exercises||[])if(nameKey(e.name)){const k=key(e);if(!rows.has(k))rows.set(k,{key:k,name:e.name,exerciseId:e.exerciseId||null,tracking:mode(e)});}
  return [...rows.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.tracking.localeCompare(b.tracking));
 }
 function chartSeries(workouts,selection,{metric='load',weeks=0,end}={},estimate){
  if(!selection)return [];const now=end||new Date().toISOString().slice(0,10),start=new Date(now+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-weeks*7+1);const days=new Map();
  for(const w of filter(workouts,{from:weeks?start.toISOString().slice(0,10):'',to:now}))for(const e of w.exercises||[]){
   if(mode(e)!==selection.tracking||(selection.exerciseId?e.exerciseId!==selection.exerciseId:!!e.exerciseId||nameKey(e.name)!==nameKey(selection.name)))continue;
   let values=[];
   if(selection.tracking==='cardio')values=[metric==='distance'?(Number(e.distance)*(e.distanceUnit==='mi'?1.609344:1)):Number(e.duration)];
   else values=(e.sets||[]).filter(s=>s.completed!==false).map(s=>{
    if(selection.tracking==='duration')return Number(s.duration);
    if(!(Number(s.reps)>0))return NaN;
    if(metric==='reps')return Number(s.reps);
    if(s.weight==null||s.weight===''||!Number.isFinite(Number(s.weight))||Number(s.weight)<0)return NaN;
    return metric==='estimate'?estimate(Number(s.weight),Number(s.reps),s.rpe):Number(s.weight);
   });
   for(const value of values)if(Number.isFinite(value)&&value>=0)days.set(w.date,Math.max(days.get(w.date)??-Infinity,value));
  }
  return [...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value}));
 }
 return {mode,key,filter,entries,series,compare,options,chartSeries};
});
