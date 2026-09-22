(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./training-blocks'),require('./schedule'),require('./decision-readiness'),require('./session-intent'));else root.LoadnoteGoals=factory(root.LoadnoteCore,root.LoadnoteBlocks,root.LoadnoteSchedule,root.LoadnoteReadiness,root.LoadnoteIntent);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Blocks,Schedule,Readiness,Intent){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const stamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
 const text=(v,max)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid goal text');return v.trim();};
 const ids=v=>{if(!Array.isArray(v)||v.length>1000||v.some(x=>typeof x!=='string'||!x||x.length>160)||new Set(v).size!==v.length)throw Error('Invalid goal links');return [...v];};
 function context(v){
  if(!v||typeof v!=='object')throw Error('Invalid athlete goal');
  const c={name:text(v.name,120),sport:text(v.sport||'powerlifting',80),status:v.status||'active',eventName:text(v.eventName||'',160),eventDate:v.eventDate||null,weightClass:text(v.weightClass||'',80),experience:text(v.experience||'',300),equipment:text(v.equipment||'',500),notes:text(v.notes||'',1000),availableDays:v.availableDays||[],sessionMinutes:v.sessionMinutes??null,targets:v.targets||[],blockIds:ids(v.blockIds||[]),sessionIds:ids(v.sessionIds||[])};
  if(!c.name||!c.sport||!['active','completed','archived'].includes(c.status)||(c.eventDate&&!Blocks.date(c.eventDate)))throw Error('Enter a goal name and valid event date');
  if(!Array.isArray(c.availableDays)||c.availableDays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(c.availableDays).size!==c.availableDays.length)throw Error('Invalid available days');
  c.availableDays=[...c.availableDays];
  if(c.sessionMinutes!==null&&(!Number.isInteger(c.sessionMinutes)||c.sessionMinutes<1||c.sessionMinutes>1440))throw Error('Session length must be 1–1440 minutes');
  if(!Array.isArray(c.targets)||c.targets.length>3||new Set(c.targets.map(t=>t.lift)).size!==c.targets.length)throw Error('Invalid lift targets');
  c.targets=c.targets.map(t=>{if(!['squat','bench','deadlift'].includes(t.lift)||typeof t.kg!=='number'||!Number.isFinite(t.kg)||t.kg<=0||t.kg>2000)throw Error('Targets need a lift and positive kg');return {lift:t.lift,kg:t.kg};});return c;
 }
 function validate(records){if(!Array.isArray(records)||records.length>1000)throw Error('Invalid athlete goals');const seen=new Set();return records.map(r=>{if(!r||typeof r.id!=='string'||!r.id||r.id.length>160||seen.has(r.id)||!Array.isArray(r.revisions)||!r.revisions.length||r.revisions.length>500)throw Error('Invalid goal history');seen.add(r.id);let last='';return {id:r.id,revisions:r.revisions.map(v=>{if(!v||!stamp(v.recordedAt)||v.recordedAt<=last)throw Error('Invalid goal revision time');last=v.recordedAt;return {recordedAt:v.recordedAt,context:context(v.context)};})};});}
 function list(records,knownAt){if(knownAt&&!stamp(knownAt))throw Error('Invalid knowledge cutoff');return validate(records||[]).map(r=>{const v=r.revisions.filter(v=>!knownAt||v.recordedAt<=knownAt).at(-1);return v?{id:r.id,...clone(v.context),createdAt:r.revisions[0].recordedAt,updatedAt:v.recordedAt}:null;}).filter(Boolean);}
 function upsert(records,input,{id,now=new Date().toISOString()}={}){if(!stamp(now))throw Error('Invalid goal time');const next=validate(records||[]),c=context(input);if(id){const r=next.find(r=>r.id===id);if(!r)throw Error('Goal no longer exists');r.revisions.push({recordedAt:now,context:c});}else next.push({id:Core.createId(),revisions:[{recordedAt:now,context:c}]});return validate(next);}
 function week(state,{asOf,goalId,knownAt,retrospective=true}={}){
  if(!Blocks.date(asOf)||knownAt&&!stamp(knownAt))throw Error('Invalid review date');const end=asOf+'T23:59:59.999Z',cutoff=knownAt&&knownAt<end?knownAt:end;
  const goal=goalId?list(state.athleteGoals,retrospective?undefined:cutoff).find(g=>g.id===goalId):null;if(goalId&&!goal)throw Error('Goal unavailable on this date');
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};const from=move(asOf,-(new Date(asOf+'T12:00:00Z').getUTCDay()+6)%7),to=move(from,6);
  const blocks=Blocks.list(state.trainingBlocks||[],retrospective?undefined:cutoff),blockIds=new Set(goal?.blockIds||[]),sessionIds=new Set(goal?.sessionIds||[]);
  const blockFor=day=>blocks.find(b=>b.startDate<=day&&(!b.endDate||b.endDate>=day));
  const schedule=Schedule.summary(state.scheduledSessions||[],Readiness.workoutsAt(state,asOf,cutoff,retrospective).workouts,{from,to,asOf,knownAt:retrospective?undefined:cutoff});
  const matches=s=>!goal||sessionIds.has(s.id)||blockIds.has(s.blockId||blockFor(s.date)?.id);
  const sessions=schedule.sessions.filter(matches),selectedIds=new Set(sessions.map(s=>s.id));
  const all=Readiness.workoutsAt(state,asOf,cutoff,retrospective).workouts.map(w=>{if(!retrospective&&w.sessionIntent?.prescription?.capturedAt>cutoff){w.sessionIntent.prescription=null;delete w.sessionIntent.schedule;}return w;});
  const workouts=all.filter(w=>w.date>=from&&w.date<=asOf&&(!goal||sessionIds.has(w.sessionIntent?.schedule?.id)||selectedIds.has(w.sessionIntent?.schedule?.id)||blockIds.has(blockFor(w.date)?.id)));
  const counts={completed:0,skipped:0,cancelled:0,unconfirmed:0,scheduled:0};sessions.forEach(s=>counts[s.state]++);const resolved=counts.completed+counts.skipped;
  const scope={id:'week',createdAt:'0001-01-01T00:00:00.000Z',updatedAt:'0001-01-01T00:00:00.000Z',revisions:[{recordedAt:'0001-01-01T00:00:00.000Z',context:Blocks.context({name:'Week',startDate:from,endDate:asOf})}]};
  const metrics=Blocks.analyze([scope],workouts,'week',{asOf,retrospective:true});
  return {goal,from,to,asOf,sessions,counts,loggedWorkouts:workouts.length,adherence:resolved?Math.round(counts.completed/resolved*100):null,resolved,definition:schedule.definition,prescription:Intent.summarize(workouts),metrics,missingLinks:goal?[...goal.blockIds.filter(id=>!blocks.some(b=>b.id===id)),...goal.sessionIds.filter(id=>!Schedule.list(state.scheduledSessions||[],retrospective?undefined:cutoff).some(s=>s.id===id))]:[]};
 }
 return {context,validate,list,upsert,week};
});
