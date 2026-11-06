/* Device-local presentation preferences. Never modifies athlete or workout data. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.LoadnoteBeginnerExperience=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='loadnote.experience.v1';
 function normalize(value){
  const v=value&&typeof value==='object'?value:{};
  return {view:v.view==='simple'?'simple':'full',entry:['help','program','log'].includes(v.entry)?v.entry:null,
   guide:['active','skipped','complete'].includes(v.guide)?v.guide:'active',step:Number.isInteger(v.step)?Math.max(0,Math.min(3,v.step)):0};
 }
 function read(storage){try{return normalize(JSON.parse(storage.getItem(KEY)));}catch{return normalize();}}
 function write(storage,current,patch){
  const next=normalize({...current,...patch});
  storage.setItem(KEY,JSON.stringify(next));
  return next;
 }
 // Only new users without saved training or an explicit setting start Simple.
 function isNewAthlete(state){
  const s=state&&typeof state==='object'?state:{};
  if(s.onboardingDismissed)return false;
  return !['workouts','programmingProfiles','reviewedPrograms','phasePrograms',
   'meetCycles','programs','sportPrograms','customPrograms','scheduledSessions',
   'trainingBlocks'].some(key=>Array.isArray(s[key])&&s[key].length>0);
 }
 // Visual-only milestones: these do not complete a set or persist a workout.
 function guideStage({namedExercise=false,enteredSet=false,reviewOpen=false}={}){
  return reviewOpen?3:!namedExercise?0:!enteredSet?1:2;
 }
 function earlyTraining(state,{asOf,preference}={}){
  const p=normalize(preference),s=state||{};
  const advanced=['programmingProfiles','reviewedPrograms','phasePrograms','meetCycles','programs','sportPrograms','trainingBlocks'].some(key=>s[key]?.length)||
   (s.customPrograms||[]).some(plan=>plan.source?.name!=='Loadnote beginner starting structure');
  if(p.view!=='simple'||!['log','help'].includes(p.entry)||advanced)return {guided:false,workouts:[],recent:[],weekCount:0};
  const valid=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
  const workouts=(s.workouts||[]).filter(w=>valid(asOf)&&valid(w?.date)&&w.date<=asOf&&Array.isArray(w.exercises)&&w.exercises.some(e=>
   e?.type==='cardio'?Number(e.duration)>0||Number(e.distance)>0:(e?.sets||[]).some(set=>Number(set.reps)>0||Number(set.duration)>0)
  )).slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const guided=workouts.length<3;
  const start=valid(asOf)?new Date(Date.parse(asOf+'T12:00:00Z')-6*86400000).toISOString().slice(0,10):null;
  return {guided,workouts,recent:workouts.slice(0,3),weekCount:start?workouts.filter(w=>w.date>=start).length:0};
 }
 const steps=[
  {title:'1. Choose your exercise',body:'Choose an exercise to log. No program or one-rep max is required.'},
  {title:'2. Record what you actually did',body:'Enter your actual weight and reps (or duration). RPE means effort; leave it blank if you are unsure.'},
  {title:'3. Review the work you did',body:'Complete your sets as you go. When finished, review your workout, then save. Opening review does not save anything.'},
  {title:'4. Review, then save',body:'Check your work, then choose Save workout. Opening review does not save. Wait for confirmation; if saving fails, keep this page open and retry.'}
 ];
 return {KEY,normalize,read,write,steps,isNewAthlete,guideStage,earlyTraining};
});
