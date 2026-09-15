/* Review-only heuristics. Never correct or merge athlete data automatically. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./training-blocks'));else root.LoadnoteCleanup=factory(root.LoadnoteBlocks);})(typeof globalThis!=='undefined'?globalThis:this,function(Blocks){
 'use strict';
 const tokens=s=>[...new Set(String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t&&t!=='machine'))];
 function similar(a,b){
  const x=tokens(a),y=tokens(b);if(!x.length||!y.length)return false;
  const qualifiers=['single','arm','leg','pause','paused','tempo','incline','decline','front','back','sumo','romanian','barbell','dumbbell'];
  if(qualifiers.some(t=>x.includes(t)!==y.includes(t)))return false;
  const common=x.filter(t=>y.includes(t)).length;
  return common>0&&(common/new Set([...x,...y]).size>=0.6||(common===Math.min(x.length,y.length)&&Math.abs(x.length-y.length)<=1));
 }
 function inspect(state,{asOf}={}){
  if(!Blocks.date(asOf))throw Error('An analysis date is required');
  const workouts=(state.workouts||[]).filter(w=>Blocks.date(w.date)&&w.date<=asOf).slice().sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
  const flags=[],histories=new Map();
  for(const w of workouts)for(const e of w.exercises||[]){
   if(e.exerciseId){if(!histories.has(e.exerciseId))histories.set(e.exerciseId,[]);histories.get(e.exerciseId).push({workoutId:String(w.id),date:w.date,name:e.name,type:e.type,trackBy:e.trackBy,sets:e.sets||[],duration:e.duration,distance:e.distance,distanceUnit:e.distanceUnit});}
   if(e.type==='cardio'||e.trackBy==='duration')continue;
   for(let i=1;i<(e.sets||[]).length-1;i++){
    const a=e.sets[i-1],b=e.sets[i],c=e.sets[i+1],loads=[a,b,c].map(s=>Number(s.weight));
    if(!loads.every(v=>Number.isFinite(v)&&v>0)||!(Number(a.reps)>0&&a.reps===b.reps&&b.reps===c.reps))continue;
    if(Math.abs(loads[0]-loads[2])/Math.max(loads[0],loads[2])<=0.1&&loads[1]<Math.min(loads[0],loads[2])*0.6)
     flags.push({workoutId:String(w.id),date:w.date,exercise:e.name,setNumber:i+1,loads,reps:b.reps,reason:'Middle set is over 40% lighter than similar neighboring sets. This may be intentional, not an error.'});
   }
  }
  const catalog=(state.exerciseCatalog||[]).filter(e=>histories.has(e.id)),aliases=[];
  for(let i=0;i<catalog.length;i++)for(let j=i+1;j<catalog.length;j++)if(similar(catalog[i].name,catalog[j].name))aliases.push({left:catalog[i],right:catalog[j],leftHistory:histories.get(catalog[i].id),rightHistory:histories.get(catalog[j].id)});
  const blocks=Blocks.list(state.trainingBlocks||[]).filter(b=>b.startDate<=asOf).map(b=>{const end=b.endDate&&b.endDate<asOf?b.endDate:asOf,ws=workouts.filter(w=>w.date>=b.startDate&&w.date<=end),days=[...new Set(ws.map(w=>w.date))];return {id:b.id,name:b.name,start:b.startDate,end,coverage:b.dataCompleteness,workoutCount:ws.length,days:days.length,first:days[0]||null,last:days.at(-1)||null};});
  return {asOf,flags,aliases,blocks};
 }
 function singles(evidence){return (evidence||[]).flatMap(row=>(row.actualSets||[]).filter(s=>s.reps===1&&s.weight>0&&s.rpe>=1&&s.rpe<10).map(s=>({date:row.date,workoutId:row.workoutId,weight:s.weight,rpe:s.rpe}))).sort((a,b)=>a.date.localeCompare(b.date));}
 return {inspect,similar,singles};
});
