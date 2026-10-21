/* Athlete-specific offline context from reviewed, saved training preferences.
 * Chat history only resolves follow-up topics; no inferred memories or medical claims.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'),require('./coach-support'));
 else root.LoadnoteCoachTrainingProfile=factory(root.LoadnoteProgrammingProfile,root.LoadnoteCoachSupport);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile,Support){
 'use strict';
 const clean=q=>String(q||'').trim().replace(/\s+/g,' ').slice(0,500);
 const contextQuestion=q=>/\b(what|which|show|tell|know|remember|remind)\b.*\b(my|about my|for me)\b.*\b(training setup|training preferences|goal|equipment|available days|training days|schedule|preferences|exclusions|session time|preferred exercises|avoided exercises)\b|\b(my|athlete) (profile|training setup|preferences)\b|\b(what equipment|which equipment|my available days|my training goal|what.*know about my training)\b/i.test(q);
 const specific=q=>/\b(equipment|available days|schedule|session time|session length|goals?|training setup|preferences|exclusions|avoided exercises|preferred exercises)\b/i.test(q);
 const follow=q=>/^(and|what about) (my |the )?(equipment|goals?|schedule|training days|available days|exclusions|preferred exercises|session time)\??$/i.test(q);
 const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 // Chat can propose a future setting only when the athlete explicitly names the days.
 function naturalDays(question,record){
  if(!record)return null;const q=clean(question);
  if(!/\b(?:i (?:train|work out|can train)|my (?:training|available) days? (?:are|is)|i(?:'m| am) available)\b/i.test(q))return null;
  const found=days.flatMap((day,i)=>new RegExp('\\b'+day+'\\b','i').test(q)?[i]:[]);
  return found.length?{kind:'training-days',availableDays:found,baseRevisionId:record.id}:null;
 }
 function naturalMinutes(question,record){
  if(!record)return null;const q=clean(question);
  if(!/\b(?:i (?:only )?have|i(?:'ve| have) (?:only |just )?got|my (?:workouts?|sessions?) (?:are|last)|i(?:'m| am) limited to|i can train for)\b/i.test(q))return null;
  const matches=[...q.matchAll(/\b(\d{1,3})\s*(?:minutes?|mins?)\b/gi)];
  if(matches.length!==1)return null;const n=Number(matches[0][1]);
  return n>=30&&n<=240?{kind:'profile-fields',changes:{sessionMinutes:n},baseRevisionId:record.id}:null;
 }
 function dayProposal(question,record){
  const q=clean(question),match=q.match(/^(?:please\s+)?(?:use|set|change|make)\s+(?:my\s+)?(?:training|available)\s+days\s+(?:to|as)\s+(.+?)[.!?]?$/i)
   ||q.match(/^(?:please\s+)?(?:use|set|change|make)\s+(.+?)\s+as\s+(?:my|your)\s+(?:training|available)\s+days[.!?]?$/i);
  if(!match||!record)return null;
  const found=[],remainder=match[1].replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,day=>{found.push(days.findIndex(d=>d.toLowerCase()===day.toLowerCase()));return '';});
  if(!found.length||found.length>7||new Set(found).size!==found.length||!/^[\s,&]*(?:and[\s,&]*)*$/i.test(remainder))return null;
  return {kind:'training-days',availableDays:found.sort((a,b)=>a-b),baseRevisionId:record.id};
 }
 function fieldProposal(question,record){
  if(!record)return null;const q=clean(question);
  const equipment=q.match(/^(?:please\s+)?(?:use|set|change|make)\s+(?:my\s+)?equipment\s+(?:to|as)\s+(.+?)[.!?]?$/i)
   ||q.match(/^(?:please\s+)?use\s+(.+?)\s+as\s+my\s+equipment[.!?]?$/i);
  if(equipment){
   const names={barbell:'barbell',barbells:'barbell',plates:'plates',rack:'rack','squat rack':'rack',bench:'bench',dumbbell:'dumbbells',dumbbells:'dumbbells',dbs:'dumbbells',cable:'cable',cables:'cable',machine:'machine',machines:'machine',bodyweight:'bodyweight','body weight':'bodyweight','pull up bar':'pullup','pull-up bar':'pullup',cardio:'cardio'};
   const pieces=equipment[1].replace(/[.!?]+$/,'').toLowerCase().split(/\s*(?:,|&|\band\b)\s*/).map(x=>x.trim()).filter(Boolean);
   const found=pieces.map(x=>names[x]);
   if(found.length&&found.every(Boolean)&&new Set(found).size===found.length){
    const primary=found.filter(e=>Object.hasOwn(Profile.EQUIPMENT,e)).sort(),accessory=found.filter(e=>!Object.hasOwn(Profile.EQUIPMENT,e)).sort();
    return {kind:'profile-fields',changes:{equipment:primary,accessoryEquipment:accessory},baseRevisionId:record.id};
   }
   return null;
  }
  const minutes=q.match(/^(?:please\s+)?(?:set|change|make)\s+(?:my\s+)?(?:session time|session length|time per session)\s+to\s+(\d{2,3})\s+minutes?[.!?]?$/i);
  if(minutes){const value=Number(minutes[1]);return value>=30&&value<=240?{kind:'profile-fields',changes:{sessionMinutes:value},baseRevisionId:record.id}:null;}
  const priority=q.match(/^(?:please\s+)?(?:set|change)\s+(?:my\s+)?(?:training priority|training priorities)\s+to\s+(.+?)[.!?]?$/i);
  if(priority&&priority[1].trim().length<=1000)return {kind:'profile-fields',changes:{priorities:priority[1].trim()},baseRevisionId:record.id};
  return null;
 }
 function answer(state,question,{asOf,history=[]}={}){
  const q=clean(question);
  if(!q||Support.health(String(question||'')))return null;
  let saved=null;try{saved=Profile.current(state.programmingProfiles||[],asOf?asOf+'T23:59:59.999Z':undefined);}catch{/* The existing explicit setup-query error route below explains invalid saved data. */}
  const proposed=dayProposal(q,saved)||fieldProposal(q,saved)||naturalDays(q,saved)||naturalMinutes(q,saved);
  if(proposed){const change=proposed.kind==='training-days'?{key:'availableDays',old:saved.context.availableDays,value:proposed.availableDays,label:'training days',format:rows=>rows.map(i=>days[i]).join(', ')}:
   Object.hasOwn(proposed.changes,'equipment')?{key:'equipment',old:[...saved.context.equipment,...(saved.context.accessoryEquipment||[])],value:[...proposed.changes.equipment,...proposed.changes.accessoryEquipment],label:'equipment',format:rows=>rows.join(', ')||'none'}:
   Object.hasOwn(proposed.changes,'sessionMinutes')?{key:'sessionMinutes',old:saved.context.sessionMinutes,value:proposed.changes.sessionMinutes,label:'session time',format:n=>n+' minutes'}:
   {key:'priorities',old:saved.context.priorities,value:proposed.changes.priorities,label:'training priority',format:s=>s||'none'};
   return {text:'Review requested '+change.label+': '+change.format(change.value)+'. Current saved '+change.label+': '+change.format(change.old)+'. Nothing has changed. Open the review card and explicitly save the revised training setup if it is correct. Existing scheduled workouts stay unchanged.',source:'Saved training preferences · proposed change',readOnly:true,evidence:[{field:change.key,before:change.old,proposed:change.value}],intent:{topic:'training-preferences'},actions:[{kind:'profile-review',label:'Review '+change.label+' before saving',proposal:proposed}]};}
  // Dedicated movement-reference and sport-goal tools take precedence.
  // Saved Profile equipment is not the equipment needed for an exercise.
  if(/\bequipment\s+(?:for|needed for|used for)\b/i.test(q)||/\b(?:review|analyse|analyze|compare|evaluate)\b.*\b(?:sport|training)\s+goal\b/i.test(q))return null;
  if(/^(?:please\s+)?(?:use|set|change|make)\s+(?:my\s+)?(?:equipment|session time|session length|time per session|training priority|training priorities|training days|available days)\s+(?:to|as)\b/i.test(q))return {text:saved?'I could not safely interpret that preference request. For equipment, list exact items such as dumbbells, bench, barbell, plates or rack joined by "and" or commas. For session time, use 30–240 minutes. For training days, name distinct weekdays. Nothing was changed.':'Save a training setup in Profile first, then ask Coach for an explicit reviewed preference change. Nothing was changed.',source:'Saved training preferences · clarification',readOnly:true,evidence:[],intent:{topic:'training-preferences'},actions:[]};
  let requested=contextQuestion(q);
  if(!requested&&follow(q)){
   for(const turn of (Array.isArray(history)?history:[]).slice(-8).reverse()){
    if(turn.role!=='user')continue;
    const prior=clean(turn.content);
    if(Support.health(prior))break;
    if(contextQuestion(prior)){requested=true;break;}
    if(!follow(prior))break;
   }
  }
  if(!requested)return null;
  let record;try{record=Profile.current(state.programmingProfiles||[],asOf?asOf+'T23:59:59.999Z':undefined);}
  catch{return {text:'I could not validate the saved training setup. Open Profile to review it; I will not guess your preferences.',source:'Saved training preferences unavailable',readOnly:true,evidence:[],intent:{topic:'training-preferences'}};}
  const p=record?.context;
  if(!p)return {text:'You have not completed a saved training setup yet. Open Profile → Training setup to record your goals, available days and equipment. I cannot infer preferences from chat or past workouts.',source:'Saved training preferences',readOnly:true,evidence:[],intent:{topic:'training-preferences'}};
  const goal=Profile.GOALS?.[p.goal]||'Not confirmed';
  const schedule=Array.isArray(p.availableDays)?p.availableDays.map(i=>days[i]).filter(Boolean):[];
  const equipment=Array.isArray(p.equipment)?p.equipment.filter(x=>typeof x==='string').slice(0,12):[];
  const catalog=state.exerciseCatalog||[];
  const names=ids=>(Array.isArray(ids)?ids:[]).slice(0,8).map(id=>catalog.find(e=>e.id===id)?.name||'Unmapped exercise').join(', ');
  const sections={
   goal:'Saved goal: '+goal+'. Experience: '+(p.experience||'not confirmed')+'.',
   schedule:'Saved training days: '+(schedule.join(', ')||'not confirmed')+'. Time per session: '+(Number.isFinite(p.sessionMinutes)?p.sessionMinutes+' minutes':'not confirmed')+'.',
   equipment:'Saved equipment: '+(equipment.join(', ')||'none confirmed')+'.',
   exercises:'Preferred movements: '+(names(p.preferredExerciseIds)||'none confirmed')+'. Excluded movements: '+(names(p.avoidedExerciseIds)||'none confirmed')+'.'
  };
  const ask=q.toLowerCase();
  const rows=/\b(equipment)\b/.test(ask)?[sections.equipment]:/\b(exclusion|avoid|preferred exercise)\b/.test(ask)?[sections.exercises]:/\b(schedule|days|availability|session time|session length)\b/.test(ask)?[sections.schedule]:/\bgoal\b/.test(ask)?[sections.goal]:Object.values(sections);
  return {text:rows.join(' ')+' These are your saved training preferences, not a diagnosis or a memory of unsaved conversations. Update them in Profile before planning a new program.',source:'Saved training preferences',readOnly:true,
   evidence:[{goal:p.goal,experience:p.experience,availableDays:schedule,sessionMinutes:p.sessionMinutes,equipment,preferred:names(p.preferredExerciseIds),excluded:names(p.avoidedExerciseIds)}],
   intent:{topic:'training-preferences'}};
 }
 return {answer};
});
