/* Shared movement reference. Reference keys never replace saved exercise IDs. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../training/exercises'));
 else root.LoadnoteExerciseReference=factory(root.LoadnoteExercises);
})(typeof globalThis!=='undefined'?globalThis:this,function(Training){
 'use strict';
 const EQUIPMENT={bodyweight:'Bodyweight',barbell:'Barbell',dumbbells:'Dumbbells',cable:'Cable',machine:'Machine',cardio:'Cardio equipment',pullup:'Pull-up bar'};
 const rows=[
  ['chest_supported_row','Chest-supported Row','upper-back','dumbbells',['chest supported row'],'Supported rowing work'],
  ['lat_pulldown','Lat Pulldown','upper-back','cable',['lat pull down'],'Vertical pulling work'],
  ['dumbbell_row','Dumbbell Row','upper-back','dumbbells',['one arm dumbbell row'],'Rowing work'],
  ['band_free_pullup','Pull-Up','upper-back','pullup',['pull up','pullup'],'Vertical pulling work'],
  ['leg_extension','Leg Extension','quadriceps','machine',[],'Knee-extension work'],
  ['split_squat','Split Squat','quadriceps','dumbbells',[],'Single-leg squat work'],
  ['bodyweight_split_squat','Bodyweight Split Squat','quadriceps','bodyweight',[],'Single-leg squat work'],
  ['leg_curl','Leg Curl','posterior-chain','machine',['hamstring curl'],'Knee-flexion work'],
  ['dumbbell_rdl','Dumbbell Romanian Deadlift','posterior-chain','dumbbells',['dumbbell rdl'],'Hip-hinge work'],
  ['glute_bridge','Bodyweight Glute Bridge','posterior-chain','bodyweight',['bodyweight bridge'],'Hip-extension work'],
  ['dumbbell_bench','Dumbbell Bench Press','chest','dumbbells',['db bench press'],'Pressing work; a suitable bench is also required'],
  ['pushup','Push-Up','chest','bodyweight',['push up','pushup'],'Bodyweight pressing work'],
  ['biceps_curl','Biceps Curl','arms','dumbbells',['dumbbell biceps curl'],'Elbow-flexion work'],
  ['triceps_pushdown','Triceps Pushdown','arms','cable',['tricep pushdown'],'Elbow-extension work'],
  ['dumbbell_triceps','Dumbbell Triceps Extension','arms','dumbbells',[],'Elbow-extension work'],
  ['plank','Plank','trunk','bodyweight',[],'Timed trunk work'],
  ['side_plank','Side Plank','trunk','bodyweight',[],'Timed trunk work'],
  ['cycling','Cycling','conditioning','cardio',['stationary cycling'],'Timed cycling work']
 ];
 const accessories=rows.map(([key,name,group,equipment,aliases,description])=>({key,name,group,equipment,aliases,description,role:'accessory'}));
 const normalize=x=>String(x||'').trim().toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ');
 const entries=[...accessories,...(Training?.exercises||[]).filter(t=>!accessories.some(a=>normalize(a.name)===normalize(t.name))).map(t=>({...t,key:t.id,aliases:[],role:t.competitionLift?'main lift':'variation',description:t.movement.replace(/_/g,' ')+' work'}))];
 const mainAliases={back_squat:['squat','barbell squat'],bench_press:['bench','barbell bench'],deadlift:['barbell deadlift'],overhead_press:['ohp'],romanian_deadlift:['rdl']};
 for(const e of entries)if(mainAliases[e.key])e.aliases=mainAliases[e.key];
 for(const e of entries)if(!e.equipment){e.equipment=['leg_press'].includes(e.key)?'machine':e.key==='bulgarian_split_squat'?'dumbbells':'barbell';}
 function resolve(name){const n=normalize(name);return entries.find(e=>[e.key,e.name,...e.aliases].some(x=>normalize(x)===n))||null;}
 function alternatives(name,equipment){const e=resolve(name);if(!e?.group)return [];return accessories.filter(a=>a.key!==e.key&&a.group===e.group&&(!equipment||equipment.includes(a.equipment)));}
 function suggestions({priorities='',preferredExerciseIds=[],equipment=[],excludedExerciseIds=[],catalog=[],identify}={}){
  const patterns={'upper-back':/upper.?back|\blats?\b|\brows?\b/,quadriceps:/quad/,arms:/arm|bicep|tricep/,trunk:/core|trunk/,'posterior-chain':/hamstring|posterior/,chest:/chest/,conditioning:/condition/};
  const preferred=new Set(preferredExerciseIds),excluded=new Set(excludedExerciseIds);
  return accessories.map(t=>{const known=catalog.find(e=>[e.name,...(e.aliases||[])].some(n=>normalize(n)===normalize(t.name)));const id=known?.id||identify?.(t.name);return {...t,id,name:known?.name||t.name,reason:preferred.has(id)?'You marked this movement preferred.':patterns[t.group].test(String(priorities).toLowerCase())?'Matches your stated '+t.group.replace(/-/g,' ')+' priority.':null};})
   .filter(t=>t.reason&&!excluded.has(t.id)&&equipment.includes(t.equipment)).sort((a,b)=>Number(preferred.has(b.id))-Number(preferred.has(a.id)));
 }
 function explain(name){const e=resolve(name);return e?e.name+': '+e.description+'. '+(e.equipment?'Equipment: '+EQUIPMENT[e.equipment]+'. ':'')+'This describes its library role, not the reason a coach prescribed it.':null;}
 return {EQUIPMENT,accessories,entries,resolve,alternatives,suggestions,explain};
});
