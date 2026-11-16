/* Read-only saved-training projection for the focused Home view. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./progress-model'),require('./schedule'));else root.LoadnoteSimpleHome=factory(root.LoadnoteProgress,root.LoadnoteSchedule);})(typeof globalThis!=='undefined'?globalThis:this,function(Progress,Schedule){
 'use strict';
 function inspect(state,{asOf}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid Home date');
  const date=new Date(asOf+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-6);const from=date.toISOString().slice(0,10),seen=new Set();
  const logged=Progress.filter((state?.workouts||[]).filter(w=>Schedule.date(w?.date)),{to:asOf}).filter(w=>{
   if(w.id==null||seen.has(String(w.id)))return false;
   const meaningful=(Array.isArray(w.exercises)?w.exercises:[]).some(e=>e&&(Progress.mode(e)==='cardio'?Number(e.duration)>0||Number(e.distance)>0:(e.sets||[]).some(s=>s.completed!==false&&(Progress.mode(e)==='duration'?Number(s.duration)>0:Number(s.reps)>0))));
   if(meaningful)seen.add(String(w.id));return meaningful;
  });
  const latest=logged[0];
  return {from,to:asOf,sessions:logged.filter(w=>w.date>=from).length,latest:latest?{id:latest.id,date:latest.date,names:(latest.exercises||[]).map(e=>String(e.name||'').trim()).filter(Boolean).slice(0,3),exerciseCount:latest.exercises.length}:null};
 }
 return {inspect};
});
