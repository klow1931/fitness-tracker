(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'));else root.LoadnoteBlocks=factory(root.LoadnoteCore);})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
 'use strict';
 const types={'return-reentry':'Return / Re-entry',accumulation:'Base / Accumulation',hypertrophy:'Hypertrophy',strength:'Strength',peaking:'Peaking',deload:'Deload',testing:'Testing / Meet',general:'General Training',custom:'Custom'};
 const strategies={conservative:'Conservative',moderate:'Moderate',aggressive:'Aggressive','performance-based':'Performance-based',unknown:'Unknown / Not specified'};
 const intents={gradual:'Gradual planned progression',autoregulated:'Autoregulated progression',percentage:'Percentage-based progression',performance:'Performance-based progression',maintain:'Maintain current loads','return-ramp':'Return-to-training ramp',deload:'Deload / recovery',testing:'Testing',custom:'Custom',unknown:'Not specified'};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function date(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
 function stamp(s){return typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;}
 function text(s,max=2000){if(typeof s!=='string'||s.length>max)throw Error('Invalid block text');return s.trim();}
 function context(input){
  if(!input||typeof input!=='object')throw Error('Invalid block context');
  const c={name:text(input.name||'',120),startDate:input.startDate,endDate:input.endDate||null,blockType:input.blockType||'general',primaryGoal:text(input.primaryGoal||'',300),loadStrategy:input.loadStrategy||'unknown',progressionIntent:input.progressionIntent||'unknown',notes:text(input.notes||''),progressionNotes:text(input.progressionNotes||''),trainingMaxes:[],known1RMs:[]};
  if(!c.name||!date(c.startDate)||(c.endDate&&(!date(c.endDate)||c.endDate<c.startDate)))throw Error('Enter a name and valid date range');
  // String identifiers allow future block types without restructuring persisted records.
  if(typeof c.blockType!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(c.blockType))throw Error('Invalid block type');
  if(!Object.hasOwn(strategies,c.loadStrategy)||!Object.hasOwn(intents,c.progressionIntent))throw Error('Invalid loading or progression option');
  for(const field of ['trainingMaxes','known1RMs']){
   const rows=input[field]??[];if(!Array.isArray(rows)||rows.length>100)throw Error('Invalid strength benchmarks');
   c[field]=rows.map(r=>{const exercise=text(r.exercise||'',120);if(!exercise||typeof r.kg!=='number'||!Number.isFinite(r.kg)||r.kg<=0||r.kg>2000||!date(r.observedOn))throw Error('Benchmarks need an exercise, positive kg and known-on date');return {exercise,kg:r.kg,observedOn:r.observedOn};});
   if(new Set(c[field].map(r=>r.exercise.toLowerCase())).size!==c[field].length)throw Error('Duplicate benchmark exercise');
  }
  return c;
 }
 function visible(record,knownAt){const revisions=record.revisions.filter(r=>!knownAt||r.recordedAt<=knownAt);const r=revisions.at(-1);return r?.context?{id:record.id,...clone(r.context),createdAt:record.createdAt,updatedAt:r.recordedAt}:null;}
 function list(records,knownAt){return (records||[]).map(r=>visible(r,knownAt)).filter(Boolean).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.id.localeCompare(b.id));}
 function noOverlap(blocks){for(let i=1;i<blocks.length;i++)if((blocks[i-1].endDate||'9999-12-31')>=blocks[i].startDate)throw Error('Training blocks cannot overlap. End the previous block before the next starts.');}
 function validate(records){
  if(!Array.isArray(records)||records.length>1000)throw Error('Invalid training blocks');records=clone(records);const ids=new Set(),events=new Set();
  for(const b of records){if(!b||typeof b.id!=='string'||!b.id||ids.has(b.id)||!stamp(b.createdAt)||!Array.isArray(b.revisions)||!b.revisions.length)throw Error('Invalid block identity or history');ids.add(b.id);
   let previous='';for(const r of b.revisions){if(!r||!stamp(r.recordedAt)||r.recordedAt<=previous||r.recordedAt<b.createdAt)throw Error('Invalid block revision time');if(r.context!==null)r.context=context(r.context);previous=r.recordedAt;events.add(previous);}
   if(b.revisions[0].recordedAt!==b.createdAt||b.updatedAt!==previous)throw Error('Invalid block timestamps');
  }
  for(const event of events)noOverlap(list(records,event));return clone(records);
 }
 function upsert(records,input,{id,now=new Date().toISOString()}={}){
  const next=validate(records||[]);const c=context(input);let b=next.find(b=>b.id===id);
  if(id&&!b)throw Error('Block no longer exists');if(!stamp(now))throw Error('Invalid time');
  if(b){if(now<=b.updatedAt)throw Error('Block was changed at a later time');b.revisions.push({recordedAt:now,context:c});b.updatedAt=now;}
  else next.push({id:Core.createId(),createdAt:now,updatedAt:now,revisions:[{recordedAt:now,context:c}]});
  return validate(next);
 }
 function remove(records,id,now=new Date().toISOString()){const next=validate(records);const b=next.find(b=>b.id===id);if(!b||!visible(b))throw Error('Block no longer exists');if(!stamp(now)||now<=b.updatedAt)throw Error('Invalid deletion time');b.revisions.push({recordedAt:now,context:null});b.updatedAt=now;return validate(next);}
 function at(records,day,{knownAt,retrospective=false}={}){
  if(!date(day))throw Error('Invalid analysis date');if(knownAt&&!stamp(knownAt))throw Error('Invalid knowledge cutoff');
  const limit=day+'T23:59:59.999Z',cutoff=retrospective?undefined:(knownAt&&knownAt<limit?knownAt:limit);
  const b=list(records,cutoff).find(b=>b.startDate<=day&&(!b.endDate||b.endDate>=day));if(!b)return null;
  for(const field of ['trainingMaxes','known1RMs'])b[field]=b[field].filter(r=>r.observedOn<=day);
  return {...b,contextMode:retrospective?'retrospective':'as-recorded'};
 }
 function analyze(records,workouts,id,{asOf,knownAt,retrospective=false}={}){
  if(!date(asOf))throw Error('An explicit analysis date is required');
  if(knownAt&&!stamp(knownAt))throw Error('Invalid knowledge cutoff');
  const limit=asOf+'T23:59:59.999Z',cutoff=retrospective?undefined:(knownAt&&knownAt<limit?knownAt:limit);
  const b=list(records,cutoff).find(b=>b.id===id);if(!b||b.startDate>asOf)return null;
  const end=b.endDate&&b.endDate<asOf?b.endDate:asOf;
  const ws=(workouts||[]).filter(w=>date(w.date)&&w.date>=b.startDate&&w.date<=end);
  const days=new Set(ws.map(w=>w.date)).size,duration=Math.floor((Date.parse(end)-Date.parse(b.startDate))/86400000)+1;
  const exercises=new Map();for(const w of ws)for(const e of w.exercises||[]){if(e.type==='cardio'||e.trackBy==='duration')continue;const key=String(e.name||'').trim().toLowerCase();if(!key)continue;if(!exercises.has(key))exercises.set(key,{name:e.name,loads:new Map(),estimates:new Map()});const row=exercises.get(key);
   for(const s of e.sets||[]){const weight=Number(s.weight),reps=Number(s.reps),rpe=Number(s.rpe);if(!(weight>0&&Number.isFinite(weight)&&reps>=1&&Number.isInteger(reps)))continue;row.loads.set(w.date,Math.max(row.loads.get(w.date)||0,weight));
    if(reps<=12&&rpe>=6&&rpe<=10)row.estimates.set(w.date,Math.max(row.estimates.get(w.date)||0,Core.estimated1RM(weight,reps,rpe)));
   }
  }
  const trend=map=>{const rows=[...map].sort(([a],[b])=>a.localeCompare(b));if(rows.length<3)return null;const first=rows[0],last=rows.at(-1);return {firstDate:first[0],lastDate:last[0],start:first[1],end:last[1],percent:Core.round((last[1]/first[1]-1)*100,1),days:rows.length};};
  for(const field of ['trainingMaxes','known1RMs'])b[field]=b[field].filter(r=>r.observedOn<=end);
  return {block:b,contextMode:retrospective?'retrospective':'as-recorded',workoutCount:ws.length,totalVolume:ws.length?ws.reduce((s,w)=>s+Core.calcVolume(w),0):null,averageRPE:Core.averageRPE(ws),durationDays:duration,trainingDays:days,frequencyPerWeek:duration>=7?Core.round(days/duration*7,1):null,adherence:null,completionRate:null,prescribedIntensity:null,prs:null,
   exercises:[...exercises.values()].map(e=>({name:e.name,loggedLoadTrend:trend(e.loads),estimatedCapacityTrend:trend(e.estimates),prescriptionTrend:null})),
   interpretation:b.loadStrategy==='conservative'||b.blockType==='return-reentry'||b.progressionIntent==='return-ramp'?'Deliberate progression context: increases in logged load are not equivalent to strength gains. RPE-aware estimates describe demonstrated performance, not tested maximum capacity.':'Logged load and RPE-aware estimated performance are separate observations, not predictions.'};
 }
 return {types,strategies,intents,context,validate,list,upsert,remove,at,analyze,date};
});
