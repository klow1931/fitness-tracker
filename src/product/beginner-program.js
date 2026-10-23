/* v3.93 — reviewable beginner structures backed by Custom Program.
 * No new prescription persistence, inferred training max, RPE or starting load.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./custom-program'):root.LoadnoteCustomProgram);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.LoadnoteBeginnerProgram=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Custom){
 'use strict';
 const GOALS={strength:'Build strength',muscle:'Build muscle',fitness:'Get into a routine'};
 const EQUIPMENT={gym:'Full gym',dumbbells:'Dumbbells',bodyweight:'Bodyweight / home'};
 const DAY_NAMES=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const MOVES={
  gym:[['Leg Press','Chest Press','Seated Cable Row'],['Romanian Deadlift','Lat Pulldown','Dumbbell Shoulder Press'],['Goblet Squat','Incline Dumbbell Bench Press','Chest Supported Row']],
  dumbbells:[['Goblet Squat','Dumbbell Floor Press','One Arm Dumbbell Row'],['Dumbbell Romanian Deadlift','Dumbbell Shoulder Press','Reverse Lunge'],['Split Squat','Dumbbell Bench Press','Dumbbell Row']],
  bodyweight:[['Bodyweight Squat','Incline Push-Up','Glute Bridge'],['Reverse Lunge','Push-Up','Bird Dog'],['Step-Up','Wall Push-Up','Dead Bug']]
 };
 function monday(asOf){
  if(typeof asOf!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||new Date(asOf+'T12:00:00Z').toISOString().slice(0,10)!==asOf)throw Error('Review the current date before previewing a plan');
  const t=new Date(asOf+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+(8-t.getUTCDay())%7);return t.toISOString().slice(0,10);
 }
 function setup(input){
  const goal=input?.goal,equipment=input?.equipment,days=input?.days;
  if(!Object.hasOwn(GOALS,goal)||!Object.hasOwn(EQUIPMENT,equipment))throw Error('Choose a training goal and equipment access');
  if(!Array.isArray(days)||days.length<2||days.length>3||days.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(days).size!==days.length)throw Error('Choose two or three distinct days you can train');
  return {goal,equipment,days:[...days].sort((a,b)=>a-b)};
 }
 function suggested(input){
  const c=setup(input),pattern=MOVES[c.equipment],reps=c.goal==='strength'?[5,8,8]:c.goal==='muscle'?[8,10,10]:[8,8,8];
  return c.days.map((day,index)=>({day,exercises:pattern[index].map((name,n)=>({
   name,sets:c.goal==='strength'&&n===0?3:2,reps:reps[n]
  }))}));
 }
 function make(state,input,{asOf}={}){
  const c=setup(input),base=suggested(c),edits=input?.exercises;
  const slots=base.map((d,i)=>({day:d.day,exercises:d.exercises.map((slot,j)=>{
   const e=Array.isArray(edits?.[i])?edits[i][j]:null;
   if(!e)return slot;
   const name=String(e.name??'').trim().replace(/\s+/g,' ');
   if(!name||name.length>160)throw Error('Choose a valid exercise name for each slot');
   if(!Number.isInteger(e.sets)||e.sets<1||e.sets>4||!Number.isInteger(e.reps)||e.reps<1||e.reps>20)throw Error('Choose 1–4 sets and 1–20 repetitions');
   return {name,sets:e.sets,reps:e.reps};
  })}));
  for(const day of slots){
   const names=day.exercises.map(e=>e.name.toLowerCase());
   if(new Set(names).size!==names.length)throw Error('Each exercise in a workout must be distinct');
  }
  const raw={name:'My first '+GOALS[c.goal].toLowerCase()+' plan',weeks:4,startDate:monday(asOf),unit:'kg',rows:[]};
  for(let w=1;w<=4;w++)for(const day of slots)for(const e of day.exercises)
   raw.rows.push({week:w,day:DAY_NAMES[day.day],exercise:e.name,type:'strength',
    sets:e.sets,reps:e.reps,weight:'',rpe:'',notes:'Starter structure only. Choose your own usable load and record actual effort when you train.'});
  const proposal=Custom.build(state,raw);
  return {config:c,slots,proposal,
   notice:'Editable starting structure, not an individualized prescription. Loads and RPE are deliberately unspecified. Check exercise suitability and choose a manageable load before training. Nothing has been saved or scheduled.'};
 }
 return {GOALS,EQUIPMENT,DAY_NAMES,setup,suggested,monday,make};
});