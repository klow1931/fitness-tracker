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
  dumbbells:[['Goblet Squat','Dumbbell Floor Press','One Arm Dumbbell Row'],['Dumbbell Romanian Deadlift','Dumbbell Shoulder Press','Reverse Lunge'],['Split Squat','Dumbbell Floor Press','Dumbbell Row']],
  bodyweight:[['Bodyweight Squat','Wall Push-Up','Glute Bridge'],['Reverse Lunge','Push-Up','Bird Dog'],['Bodyweight Squat','Wall Push-Up','Dead Bug']]
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

 function saved(state,{asOf,id=null,unscheduled=false}={}){
  monday(asOf); // Reuse real-calendar date validation without changing the selected date.
  const cutoff=asOf+'T23:59:59.999Z';
  return Custom.validate(state?.customPrograms||[]).filter(p=>p.source.name==='Loadnote beginner starting structure'&&
   p.createdAt<=cutoff&&(!id||p.id===id)&&(!unscheduled||!p.scheduledAt||p.scheduledAt>cutoff)&&(!p.replacedBy||p.replacedAt>cutoff)).map(p=>{if(p.scheduledAt>cutoff)delete p.scheduledAt;if(p.replacedAt>cutoff){delete p.replacedBy;delete p.replacedAt;}return p;});
 }
 function coach(state,question,{asOf}={}){
  const q=String(question||'').trim();
  const base={source:'Offline Coach · getting started',readOnly:true,evidence:[],intent:{topic:'beginner-help'}};
  if(/\b(?:what (?:weight|load) should i start with|how (?:much|heavy) should i (?:lift|start)|i (?:do not|don't) know (?:my |a )?(?:starting weight|one.rep max|1rm))\b/i.test(q))return {...base,
   text:'You do not need a tested one-rep max to start. Choose a load only after a lighter warm-up lets you control the movement comfortably. There is no universally safe starting number, so I will not guess one. Stop if you have pain and get qualified help if you cannot assess the movement. When logging, enter the weight actually used, or 0 for bodyweight / no added load. Effort ratings are optional.',actions:[{kind:'starter-plan',label:'Build a first training plan'}]};
  if(/\b(?:show|review|open|find)\b.*\bmy (?:first|starter|beginner)(?: training)? plan\b/i.test(q)){
   let plans=[];try{plans=saved(state,{asOf});}catch{return {...base,text:'I could not validate the saved starter plans. Review your program library before training.',actions:[{kind:'custom-programs',label:'Review program library'}]};}
   return {...base,text:plans.length?plans.length+' reviewed starter plan'+(plans.length===1?' is':'s are')+' saved: '+plans.map(p=>p.config.name).join('; ')+'. Open the plan review to choose a workout. Nothing has been loaded, scheduled or completed.':'No reviewed starter plan is saved yet. The first-plan builder needs your goal, available days and equipment; no tested max is required.',actions:[{kind:plans.length?'saved-starter':'starter-plan',label:plans.length?'Review my saved starter plans':'Build a first training plan'}],evidence:plans.map(p=>({id:p.id,name:p.config.name,scheduled:!!p.scheduledAt}))};
  }
  if(/\b(?:i(?:'m| am) new to (?:lifting|training)|help me (?:get started|start lifting|start)|how (?:do|can) i (?:start lifting|get started))\b/i.test(q))return {...base,
   text:'Start with one manageable session. If you already know your exercises, open the workout log. If you need ideas, build a first plan by choosing your goal, days and equipment. Review the movements before training; you do not need a tested max or an account. Only save the work you actually complete.',actions:[{kind:'starter-plan',label:'Help me build my first plan'},{kind:'beginner-log',label:'Open my first workout log'}]};
  return null;
 }
 return {GOALS,EQUIPMENT,DAY_NAMES,setup,suggested,monday,make,saved,coach};
});
