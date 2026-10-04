(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./data-integrity'));
 else root.LoadnoteAccessories=factory(root.LoadnoteIntegrity);
})(typeof globalThis!=='undefined'?globalThis:this,function(Integrity){
 'use strict';
 const POLICY='accessory-programming-v1';
 const GROUPS={'upper-back':'Upper back',quadriceps:'Quadriceps','posterior-chain':'Posterior chain',chest:'Chest',arms:'Arms',trunk:'Trunk',conditioning:'Conditioning'};
 const PURPOSES={supplemental:'Supplemental strength',hypertrophy:'Muscle development',trunk:'Trunk work',conditioning:'Conditioning'};
 const EQUIPMENT={bodyweight:'Bodyweight',barbell:'Barbell',dumbbells:'Dumbbells',cable:'Cable',machine:'Machine',cardio:'Cardio equipment'};
 const LIBRARY=[['Chest-supported Row','upper-back','dumbbells'],['Lat Pulldown','upper-back','cable'],['Leg Extension','quadriceps','machine'],['Split Squat','quadriceps','dumbbells'],['Leg Curl','posterior-chain','machine'],['Dumbbell Bench Press','chest','dumbbells'],['Biceps Curl','arms','dumbbells'],['Triceps Pushdown','arms','cable'],['Plank','trunk','bodyweight'],['Cycling','conditioning','cardio']].map(([name,group,equipment])=>({name,group,equipment,id:Integrity.stableExerciseId(name)}));
 const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
 function normalize(raw,days,excluded=[]){
  if(raw===undefined)return [];
  if(!Array.isArray(raw)||raw.length>12)throw Error('Choose at most 12 accessory slots');
  const seen=new Set(),counts={},groups={};let weeklySets=0;
  return raw.map(a=>{
   if(!a||a.policy!==POLICY||typeof a.exerciseId!=='string'||!a.exerciseId||a.exerciseId.length>160||typeof a.name!=='string'||!a.name.trim()||a.name.length>160||!days.includes(a.day))throw Error('Accessories need an exercise identity, name and selected training day');
   const key=a.day+':'+a.exerciseId;
   if(seen.has(key)||excluded.includes(a.exerciseId))throw Error('Do not duplicate an accessory in a session or reuse a main/variation exercise as an accessory');seen.add(key);
   counts[a.day]=(counts[a.day]||0)+1;if(counts[a.day]>3)throw Error('The accessory pilot allows at most 3 movements per session');
   if(!Object.hasOwn(GROUPS,a.group)||!Object.hasOwn(PURPOSES,a.purpose)||!Object.hasOwn(EQUIPMENT,a.equipment)||a.equipmentConfirmed!==true)throw Error('Choose accessory purpose, workload group and confirm actual equipment');
   if(!['reps','duration','cardio'].includes(a.mode)||a.mode==='cardio'&&(a.group!=='conditioning'||a.purpose!=='conditioning')||a.mode!=='cardio'&&(a.group==='conditioning'||a.purpose==='conditioning'))throw Error('Conditioning requires cardio mode; strength accessories require reps or hold seconds');
   const out={policy:POLICY,exerciseId:a.exerciseId,name:a.name.trim(),day:a.day,group:a.group,purpose:a.purpose,equipment:a.equipment,equipmentConfirmed:true,mode:a.mode};
   if(a.mode==='cardio'){
    if(!integer(a.minutes,5,30))throw Error('Choose 5–30 accessory conditioning minutes');out.minutes=a.minutes;
   }else{
    if(!integer(a.sets,1,3)||!Number.isFinite(a.weightKg)||a.weightKg<0||a.weightKg>500||a.weightKg===0&&a.equipment!=='bodyweight'||!Number.isFinite(a.targetRpe)||a.targetRpe<6||a.targetRpe>8)throw Error('Choose 1–3 sets, an explicit load (zero only for bodyweight) and an RPE cap of 6–8');
    if(a.mode==='reps'&&(!integer(a.minReps,6,20)||!integer(a.maxReps,a.minReps,20)))throw Error('Choose a 6–20 rep range');
    if(a.mode==='duration'&&!integer(a.seconds,15,60))throw Error('Choose 15–60 hold seconds');
    Object.assign(out,{sets:a.sets,weightKg:a.weightKg,targetRpe:a.targetRpe},a.mode==='reps'?{minReps:a.minReps,maxReps:a.maxReps}:{seconds:a.seconds});
    weeklySets+=a.sets;groups[a.group]=(groups[a.group]||0)+a.sets;
    if(weeklySets>24||groups[a.group]>12)throw Error('Accessory pilot ceiling: 24 sets weekly and 12 per workload group. These are software limits, not an individualized training dose');
   }
   return out;
  });
 }
 function context(state,accessories,profile){
  const avoided=profile?.context?.avoidedExerciseIds||[],catalog=state.exerciseCatalog||[];
  for(const a of accessories){
   if(avoided.includes(a.exerciseId))throw Error('A selected accessory is marked avoided in your programming profile');
   const byId=catalog.find(e=>e.id===a.exerciseId),byName=Integrity.resolveExercise(catalog,a.name);
   if(byId&&byId.name!==a.name||byName&&byName.id!==a.exerciseId||!byId&&a.exerciseId!==Integrity.stableExerciseId(a.name))throw Error('Accessory exercise identity changed; rebuild the proposal');
   if(a.equipment==='barbell'&&profile?.context&&!profile.context.equipment.includes('barbell'))throw Error('Accessory requires unavailable barbell equipment');
  }
 }
 function attach(state,accessories){
  const exerciseCatalog=[...(state.exerciseCatalog||[])];
  for(const a of accessories)if(!exerciseCatalog.some(e=>e.id===a.exerciseId))exerciseCatalog.push({id:a.exerciseId,name:a.name,aliases:[]});
  return {...state,exerciseCatalog};
 }
 function progression(a){
  return a.mode==='cardio'?'Duration is an athlete-reviewed target; adjust manually, not from competition-lift progression.':a.mode==='duration'?'Hold duration and load stay fixed until separately reviewed.':`Work within ${a.minReps}–${a.maxReps} reps at or below RPE ${a.targetRpe}. Review a small load increase only after every prescribed set reaches ${a.maxReps} with complete effort logging; never auto-apply it. Missing data means hold and review.`;
 }
 function exercises(accessories,day,phase){
  if(['peaking','taper','meet','mock-meet'].includes(phase))return [];
  return accessories.filter(a=>a.day===day).map(a=>{
   const base={exerciseId:a.exerciseId,name:a.name,role:'accessory',accessoryGroup:a.group,purpose:PURPOSES[a.purpose]+' · '+GROUPS[a.group]+' · athlete-selected, not a weakness diagnosis',progression:progression(a)};
   if(a.mode==='cardio')return {...base,type:'cardio',duration:phase==='deload'?Math.max(1,Math.floor(a.minutes/2)):a.minutes,distance:0,distanceUnit:'km'};
   const count=phase==='deload'?Math.max(1,Math.ceil(a.sets/2)):a.sets;
   return {...base,type:'strength',trackBy:a.mode==='duration'?'duration':'reps',format:'straight',...(a.mode==='reps'?{repRange:{min:a.minReps,max:a.maxReps}}:{}),sets:Array.from({length:count},()=>({weight:a.weightKg,...(a.mode==='duration'?{duration:a.seconds}:{reps:a.minReps,minReps:a.minReps,maxReps:a.maxReps}),targetRpe:phase==='deload'?Math.min(a.targetRpe,6):a.targetRpe}))};
  });
 }
 function minutes(exercises){return exercises.reduce((n,e)=>n+3+(e.type==='cardio'?e.duration:3*e.sets.length),0);}
 function workload(exercises){
  const result={strengthSets:0,conditioningMinutes:0,groups:{}};
  for(const e of exercises.filter(e=>e.role==='accessory')){if(e.type==='cardio')result.conditioningMinutes+=e.duration;else{result.strengthSets+=e.sets.length;result.groups[e.accessoryGroup]=(result.groups[e.accessoryGroup]||0)+e.sets.length;}}
  return result;
 }
 function warnings(accessories){return accessories.length?['Accessories are athlete-selected proposals with explicit equipment and starting loads, not diagnosed weaknesses or individually validated doses.','Accessory time includes 3 minutes per movement plus 3 minutes per strength set or the entered conditioning duration. Main-lift work uses its existing time allowance.','Accessory loads/reps never increase automatically across weeks. Deload reduces accessory sets/conditioning time; meet peak, taper and event weeks omit accessories.','Accessory group totals are direct assigned-group counts, not complete muscle stimulus, fatigue or recovery estimates. Review overlap with primary/secondary work.']:[];}
 return {POLICY,GROUPS,PURPOSES,EQUIPMENT,LIBRARY,normalize,context,attach,exercises,minutes,workload,progression,warnings};
});
