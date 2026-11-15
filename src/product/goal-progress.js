(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./progress-model'));else root.LoadnoteGoalProgress=factory(root.LoadnoteCore,root.LoadnoteProgress);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,P){
 'use strict';
 const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
 const match=(g,e)=>g.exerciseId&&e.exerciseId?e.exerciseId===g.exerciseId:String(e.name||e.exercise||'').trim().toLowerCase()===String(g.exercise||'').trim().toLowerCase();
 function best(state,goal,asOf,from=''){
  const values=[];for(const w of state.workouts||[])if(validDate(w.date)&&w.date>=from&&w.date<=asOf)for(const e of w.exercises||[])if(match(goal,e)&&P.mode(e)==='reps')for(const s of e.sets||[])if(s.completed!==false&&Number(s.weight)>0&&Number(s.reps)>0)values.push(Core.estimated1RM(Number(s.weight),Number(s.reps),s.rpe));
  for(const p of state.prs||[])if(validDate(p.date)&&p.date>=from&&p.date<=asOf&&match(goal,p)&&Number(p.weight)>0&&Number(p.reps)>0)values.push(Core.estimated1RM(Number(p.weight),Number(p.reps),p.rpe));
  return values.length?Math.max(...values):null;
 }
 function inspect(state,goal,asOf){
  if(!validDate(asOf))throw Error('Invalid goal review date');const start=goal.startDate||goal.created;if(!validDate(start)||start>asOf)return null;
  const workouts=(state.workouts||[]).filter(w=>validDate(w.date)&&w.date>=start&&w.date<=asOf&&(w.exercises||[]).some(e=>P.mode(e)==='cardio'?Number(e.duration)>0||Number(e.distance)>0:(e.sets||[]).some(s=>s.completed!==false&&(P.mode(e)==='duration'?Number(s.duration)>0:Number(s.reps)>0))));
  const sessions=new Set(workouts.map(w=>String(w.id))).size;
  if(goal.type==='workout-count'&&Number.isSafeInteger(goal.targetSessions)&&goal.targetSessions>0)return {kind:'sessions',start:0,current:sessions,target:goal.targetSessions,percent:Math.min(100,Math.round(sessions/goal.targetSessions*100)),sessions,startDate:start};
  if(goal.type!=='strength'||!Number.isFinite(goal.targetWeight)||goal.targetWeight<=0)return null;
  const baseline=Number.isFinite(goal.startWeight)&&goal.startWeight>=0?goal.startWeight:null,current=best(state,goal,asOf,start),value=Math.max(baseline||0,current||0),range=goal.targetWeight-(baseline||0);
  return {kind:'strength',start:baseline,current:current===null?baseline:value,target:goal.targetWeight,percent:baseline===null?null:range<=0?100:Math.min(100,Math.max(0,Math.round((value-baseline)/range*100))),sessions,startDate:start};
 }
 return {best,inspect,validDate};
});
