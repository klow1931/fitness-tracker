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
  const records=Custom.validate(state?.customPrograms||[]).filter(p=>p.createdAt<=cutoff),byId=new Map(records.map(p=>[p.id,p]));
  function origin(p){const seen=new Set();let depth=0;while(p&&!seen.has(p.id)){seen.add(p.id);if(p.source.name==='Loadnote beginner starting structure')return {rootId:p.id,depth};p=byId.get(p.revision?.parentId);depth++;}return null;}
  return records.map(p=>({p,lineage:origin(p)})).filter(({p,lineage})=>lineage&&(!id||p.id===id)&&(!unscheduled||!p.scheduledAt||p.scheduledAt>cutoff)&&(!p.replacedBy||p.replacedAt>cutoff)).map(({p,lineage})=>{if(p.scheduledAt>cutoff)delete p.scheduledAt;if(p.replacedAt>cutoff){delete p.replacedBy;delete p.replacedAt;}return {...p,starterRootId:lineage.rootId,starterRevision:lineage.depth};});
 }
 const SELECTION_KEY='loadnote.starter-selection.v1';
 function selected(storage,state,{asOf}={}){try{const id=storage.getItem(SELECTION_KEY);return saved(state,{asOf}).some(p=>p.id===id)?id:null;}catch{return null;}}
 function coach(state,question,{asOf,unit='kg',history=[],selectedPlanId=null,live=null}={}){
  const q=String(question||'').trim();
  const base={source:'Offline Coach · getting started',readOnly:true,evidence:[],intent:{topic:'beginner-help'}};

  const todayQuestion=/\b(?:what should i (?:train|do)(?: today| next)|what(?:'s| is) my (?:next workout|workout today))\b/i.test(q);
  const progression=/\b(?:progression|when (?:to|should i|can i) (?:add|increase)|how do i know when to add|should i (?:add|increase) (?:the )?(?:weight|load))\b/i.test(q);
  if(todayQuestion||progression){
   let plans=[];try{plans=saved(state,{asOf});}catch{return {...base,text:'I could not validate your saved plans. Review the program library before changing training.',actions:[{kind:'custom-programs',label:'Review program library'}]};}
   if(plans.length){
    if(todayQuestion&&live?.liveWorkout?.active)return {...base,text:'You have an unfinished workout open. Resume that draft before choosing a new plan or workout; no existing work has been replaced.',actions:[{kind:'beginner-log',label:'Resume my current workout'}]};
    if(progression&&/\b(?:competition|powerlifting|meet|cycle|phase|olympic|hypertrophy)\b/i.test(q)&&!plans.some(p=>q.toLowerCase().includes(p.config.name.toLowerCase())))return null;
    const named=plans.filter(p=>q.toLowerCase().includes(p.config.name.toLowerCase()));
    const plan=plans.find(p=>p.id===selectedPlanId)||(named.length===1?named[0]:plans.length===1?plans[0]:null);
    if(!plan)return {...base,text:'Choose the saved plan version you want to use. Originals and reviewed edits can have different prescriptions; I will not pick a version silently.',actions:[{kind:'saved-starter',label:'Choose my plan version'}]};
    if(todayQuestion)return {...base,text:plan.config.name+(plan.starterRevision?' · reviewed edit':' · original')+(plan.scheduledAt?' is scheduled. Review the linked session in Calendar; an unfinished workout still takes priority.':' is saved but not scheduled. You can review one of its workouts and load an unfinished draft when you choose to train. No training day or completed work is assumed.'),evidence:[{id:plan.id,name:plan.config.name,scheduled:!!plan.scheduledAt}],actions:[{kind:plan.scheduledAt?'calendar':'saved-starter',label:plan.scheduledAt?'Review my Calendar':'Review a workout from my plan',planId:plan.id}]};
    const unique=new Map();for(const s of plan.sessions)for(const e of s.exercises)if(e.type!=='cardio'&&!unique.has(e.exerciseId||e.name.toLowerCase()))unique.set(e.exerciseId||e.name.toLowerCase(),e);
    const exercises=[...unique.values()],mentioned=exercises.filter(e=>q.toLowerCase().includes(e.name.toLowerCase())),mentions=mentioned.filter(e=>!mentioned.some(other=>other.name.length>e.name.length&&other.name.toLowerCase().includes(e.name.toLowerCase())));
    if(mentions.length!==1)return {...base,text:'Which exercise from '+plan.config.name+' should we review? '+exercises.slice(0,12).map(e=>e.name).join(', ')+'. Completing a workout alone is not permission to increase its load.',actions:[{kind:'saved-starter',label:'Review my plan version',planId:plan.id}],followUps:exercises.slice(0,3).map(e=>'Review '+e.name+' progression')};
    const exercise=mentions[0],History=typeof module==='object'&&module.exports?require('./coach-training-history'):globalThis.LoadnoteCoachTrainingHistory;
    let evidence=null;try{evidence=History?.inspect(state,{exerciseId:exercise.exerciseId,name:exercise.name,aliases:[exercise.name]},{asOf,unit});}catch{}
    const rows=evidence?.sessions||[],latest=rows[0];
    const summary=latest?latest.date+': '+latest.sets.map(s=>(s.reps??'unknown')+' reps × '+s.weight+' · '+(s.rpe==null?'effort unknown':'RPE '+s.rpe)).join('; ')+'.':'No validated recorded working sets are available for this exercise.';
    return {...base,text:exercise.name+' in '+plan.config.name+': '+summary+' Compare the same exercise, load convention, reps and actual effort across sessions. Missing effort stays unknown; one successful workout does not establish readiness for a load increase. Review any change in Studio, or use the existing scheduled-session review tools. Nothing was changed.',evidence:evidence?[evidence]:[],actions:[{kind:'training-feedback',label:'Review recorded training evidence'},{kind:'custom-programs',label:'Review targets and feedback in Studio'}]};
   }
  }
  if(/\b(?:what (?:weight|load) should i start with|how (?:much|heavy) should i (?:lift|start)|i (?:do not|don't) know (?:my |a )?(?:starting weight|one.rep max|1rm))\b/i.test(q))return {...base,
   text:'You do not need a tested one-rep max to start. Choose a load only after a lighter warm-up lets you control the movement comfortably. There is no universally safe starting number, so I will not guess one. Stop if you have pain and get qualified help if you cannot assess the movement. When logging, enter the weight actually used, or 0 for bodyweight / no added load. Effort ratings are optional.',actions:[{kind:'starter-plan',label:'Build a first training plan'}]};
  if(/\b(?:show|review|open|find)\b.*\bmy (?:first|starter|beginner)(?: training)? plan\b/i.test(q)){
   let plans=[];try{plans=saved(state,{asOf});}catch{return {...base,text:'I could not validate the saved starter plans. Review your program library before training.',actions:[{kind:'custom-programs',label:'Review program library'}]};}
   return {...base,text:plans.length?plans.length+' reviewed starter plan'+(plans.length===1?' is':'s are')+' saved: '+plans.map(p=>p.config.name).join('; ')+'. Open the plan review to choose a workout. Nothing has been loaded, scheduled or completed.':'No reviewed starter plan is saved yet. The first-plan builder needs your goal, available days and equipment; no tested max is required.',actions:[{kind:plans.length?'saved-starter':'starter-plan',label:plans.length?'Review my saved starter plans':'Build a first training plan'}],evidence:plans.map(p=>({id:p.id,name:p.config.name,scheduled:!!p.scheduledAt}))};
  }
  if(/\b(?:i(?:'m| am) (?:a )?(?:beginner|new to (?:lifting|training|weights))|i (?:have never|haven't|have not|never) (?:lifted|trained)(?: weights)? before|i(?:'ve| have) never (?:lifted|trained)(?: weights)?(?: before)?|help me (?:get started|start lifting|start)|how (?:do|can) i (?:start lifting|get started))\b/i.test(q))return {...base,
   text:'Start with one manageable session. If you already know your exercises, open the workout log. If you need ideas, build a first plan by choosing your goal, days and equipment. Review the movements before training; you do not need a tested max or an account. Only save the work you actually complete.',actions:[{kind:'starter-plan',label:'Help me build my first plan'},{kind:'beginner-log',label:'Open my first workout log'}]};
  return null;
 }
 return {GOALS,EQUIPMENT,DAY_NAMES,setup,suggested,monday,make,saved,coach,SELECTION_KEY,selected};
});
