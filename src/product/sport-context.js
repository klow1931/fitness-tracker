/* Athlete declarations and a separate technical-practice journal. No prescriptions. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'));else root.LoadnoteSportContext=factory(root.LoadnoteCore);})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
 'use strict';
 const DOMAINS={powerlifting:'Powerlifting',hypertrophy:'Hypertrophy',athlete:'General athletic development',weightlifting:'Olympic weightlifting'};
 const FAMILIES={snatch:'Snatch',clean:'Clean',jerk:'Jerk','clean-jerk':'Clean & jerk','snatch-pull':'Snatch pull','clean-pull':'Clean pull',other:'Other derivative / complex'};
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const text=(x,max)=>{if(typeof x!=='string'||x.length>max)throw Error('Invalid sport-context text');return x.trim();};
 function days(raw){if(!Array.isArray(raw)||raw.length>7||new Set(raw).size!==raw.length||raw.some(x=>!Number.isInteger(x)||x<0||x>6))throw Error('Choose distinct sport days');return [...raw].sort((a,b)=>a-b);}
 function goalContext(raw){
  if(raw==null)return null;
  if(!Object.hasOwn(DOMAINS,raw.primary)||!Array.isArray(raw.secondary)||raw.secondary.length>3||new Set(raw.secondary).size!==raw.secondary.length||raw.secondary.some(x=>!Object.hasOwn(DOMAINS,x)||x===raw.primary))throw Error('Choose a primary priority and distinct secondary priorities');
  if(!['unknown','off-season','pre-season','in-season','transition'].includes(raw.season)||typeof raw.scheduleKnown!=='boolean')throw Error('Choose season and sport-schedule coverage');
  const practiceDays=days(raw.practiceDays),competitionDays=days(raw.competitionDays);
  if(!raw.scheduleKnown&&(practiceDays.length||competitionDays.length))throw Error('Confirm the sport schedule before assigning days');
  return {primary:raw.primary,secondary:[...raw.secondary].sort(),season:raw.season,scheduleKnown:raw.scheduleKnown,practiceDays,competitionDays,position:text(raw.position||'',120),restrictions:text(raw.restrictions||'',1000)};
 }
 function practiceContext(raw){
  if(!raw||!date(raw.date)||typeof raw.exerciseId!=='string'||!raw.exerciseId||raw.exerciseId.length>160||!Object.hasOwn(FAMILIES,raw.family))throw Error('Choose a valid practice date, exercise identity and confirmed lift family');
  const goalId=raw.goalId||null;if(goalId!==null&&(typeof goalId!=='string'||goalId.length>160))throw Error('Invalid practice goal link');
  if(!Array.isArray(raw.attempts)||!raw.attempts.length||raw.attempts.length>100)throw Error('Record 1–100 individual attempts; record complexes as their own variation');
  const attempts=raw.attempts.map(a=>{if(!a||!Number.isFinite(a.kg)||a.kg<0||a.kg>1000||!['unknown','made','missed'].includes(a.outcome)||!['unknown','consistent','inconsistent'].includes(a.quality))throw Error('Choose valid attempt loads, outcomes and self-reported quality');return {kg:a.kg,outcome:a.outcome,quality:a.quality};});
  return {date:raw.date,goalId,exerciseId:raw.exerciseId,family:raw.family,variation:text(raw.variation||'',160),attempts,notes:text(raw.notes||'',1000)};
 }
 function validatePractice(records){
  if(!Array.isArray(records)||records.length>10000)throw Error('Invalid technical-practice journal');const ids=new Set();
  return records.map(r=>{if(!r||typeof r.id!=='string'||!r.id||r.id.length>160||ids.has(r.id)||!Array.isArray(r.revisions)||!r.revisions.length||r.revisions.length>500)throw Error('Invalid practice identity/history');ids.add(r.id);let last='';
   return {id:r.id,revisions:r.revisions.map(v=>{if(!v||!iso(v.recordedAt)||v.recordedAt<=last)throw Error('Invalid practice revision chronology');last=v.recordedAt;return {recordedAt:v.recordedAt,context:v.context===null?null:practiceContext(v.context)};})};
  });
 }
 function listPractice(records){return validatePractice(records||[]).map(r=>{const v=r.revisions.at(-1);return v.context?{id:r.id,...v.context,recordedAt:v.recordedAt}:null;}).filter(Boolean);}
 function savePractice(state,raw,{id=null,now=new Date().toISOString(),expected}={}){
  if(!iso(now))throw Error('Invalid practice save time');const records=validatePractice(state.olympicPractice||[]);
  if(expected!==undefined&&JSON.stringify(records)!==JSON.stringify(expected))throw Error('Practice history changed. Reopen the form.');
  const c=raw===null?null:practiceContext(raw);if(c&&c.date>now.slice(0,10))throw Error('Do not log future practice as completed');
  if(c&&!state.exerciseCatalog?.some(e=>e.id===c.exerciseId))throw Error('Exercise identity is unavailable');
  if(c?.goalId&&!state.athleteGoals?.some(g=>g.id===c.goalId&&g.revisions?.at(-1)?.context?.status==='active'))throw Error('Choose an active goal or leave the session unlinked');
  if(id){const r=records.find(r=>r.id===id);if(!r)throw Error('Practice record is unavailable');r.revisions.push({recordedAt:now,context:c});}
  else {if(!c)throw Error('Cannot create an empty practice record');records.push({id:Core.createId(),revisions:[{recordedAt:now,context:c}]});}
  return {...state,olympicPractice:validatePractice(records)};
 }
 return {DOMAINS,FAMILIES,date,goalContext,practiceContext,validatePractice,listPractice,savePractice};
});
