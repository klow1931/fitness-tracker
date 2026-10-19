/* v3.63 — athlete-authored programs. Imported text is never a prescription until reviewed. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'),require('./session-intent'),require('./data-integrity'));
 else root.LoadnoteCustomProgram=factory(root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteIntegrity);
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule,Intent,Integrity){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const day=x=>Schedule.date(x);
 const monday=x=>day(x)&&new Date(x+'T12:00:00Z').getUTCDay()===1;
 const move=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
 const dayNames=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const DAY_MAP={mon:0,monday:0,tue:1,tues:1,tuesday:1,wed:2,wednesday:2,thu:3,thur:3,thurs:3,thursday:3,fri:4,friday:4,sat:5,saturday:5,sun:6,sunday:6};
 const number=(v,desc,{min,max,integer=false,optional=false}={})=>{
   if(v===undefined||v===null||String(v).trim()===''){if(optional)return null;throw Error(desc+' is required');}
   const n=Number(v);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error(desc+' must be '+min+'–'+max);return n;
 };
 function normalizeRow(row,unit){
   if(!row||typeof row!=='object')throw Error('Exercise row is missing');
   const week=number(row.week,'Week',{min:1,max:52,integer:true}),dayKey=String(row.day??row.weekday??'').trim().toLowerCase(),weekday=Object.hasOwn(DAY_MAP,dayKey)?DAY_MAP[dayKey]:/^([1-7])$/.test(dayKey)?Number(dayKey)-1:-1;
   if(weekday<0)throw Error('Day must be Monday–Sunday (or 1–7)');
   const name=String(row.exercise??row.name??'').trim().replace(/\s+/g,' ');
   if(!name||name.length>160)throw Error('Exercise name must be 1–160 characters');
   const type=String(row.type||'strength').trim().toLowerCase();if(!['strength','cardio'].includes(type))throw Error('Training type must be strength or cardio');
   const notes=String(row.notes||'').trim();if(notes.length>500)throw Error('Notes must be 500 characters or less');
   if(type==='cardio')return {week,weekday,name,type,minutes:number(row.minutes??row.duration,'Cardio minutes',{min:1,max:360}),notes};
   const sets=number(row.sets,'Sets',{min:1,max:12,integer:true}),reps=number(row.reps,'Reps',{min:1,max:50,integer:true});
   const rpe=number(row.rpe??row.targetRpe,'RPE',{min:1,max:10,optional:true});
   const rest=number(row.rest??row.restSeconds,'Rest seconds',{min:60,max:600,integer:true,optional:true});
   const load=number(row.weight??row.load,'Load',{min:0,max:2205,optional:true});
   const loadUnit=String(row.unit||unit||'').trim().toLowerCase();
   if(load!==null&&!['kg','lb','lbs'].includes(loadUnit))throw Error('Load unit must be explicitly reviewed as kg or lb');
   const weightKg=load===null?null:Math.round((loadUnit==='kg'?load:load/2.20462262185)*100)/100;
   if(weightKg!==null&&weightKg>1000)throw Error('Load exceeds the 1000 kg safety limit');
   return {week,weekday,name,type,sets,reps,weightKg,rpe,rest,notes};
 }
 function config(raw){
   const name=String(raw?.name||'').trim(),weeks=number(raw?.weeks,'Program length',{min:1,max:52,integer:true}),startDate=raw?.startDate;
   if(!name||name.length>120)throw Error('Enter a program name (up to 120 characters)');
   if(!monday(startDate))throw Error('Choose a Monday as the first program week start');
   return {name,weeks,startDate};
 }
 function normalizeRows(rows,unit,weeks){
   if(!Array.isArray(rows)||rows.length<1||rows.length>1500)throw Error('Include 1–1500 exercise rows');
   const normalized=[],errors=[];
   rows.forEach((row,i)=>{try{const r=normalizeRow(row,unit);if(r.week>weeks)throw Error('Week exceeds the program length');normalized.push(r);}catch(e){errors.push('Row '+(i+1)+': '+e.message);}});
   if(errors.length)throw Error(errors.slice(0,8).join('; ')+(errors.length>8?' (and '+(errors.length-8)+' more)':''));
   const count=new Map();for(const r of normalized){const k=r.week+':'+r.weekday;count.set(k,(count.get(k)||0)+1);if(count.get(k)>20)throw Error('A training day cannot contain more than 20 exercises');}
   return normalized;
 }
 function build(state,raw){
   const cfg=config(raw),entries=normalizeRows(raw.rows,raw.unit,cfg.weeks),groups=new Map(),warnings=[];
   for(const entry of entries){const key=entry.week+':'+entry.weekday;const group=groups.get(key)||{key:'w'+entry.week+'d'+entry.weekday,week:entry.week,weekday:entry.weekday,date:move(cfg.startDate,(entry.week-1)*7+entry.weekday),name:'Week '+entry.week+' · '+dayNames[entry.weekday],exercises:[]};
     const catalog=Integrity.resolveExercise(state.exerciseCatalog||[],entry.name);
     const target={name:entry.name,exerciseId:catalog?.id||null,type:entry.type,notes:entry.notes};
     if(entry.type==='cardio')target.duration=entry.minutes;
     else {target.sets=Array.from({length:entry.sets},()=>{const s={reps:entry.reps};if(entry.weightKg!==null)s.weight=entry.weightKg;if(entry.rpe!==null)s.targetRpe=entry.rpe;return s;});if(entry.rest!==null)target.restSeconds=entry.rest;}
     group.exercises.push(target);groups.set(key,group);
   }
   const sessions=[...groups.values()].sort((a,b)=>a.date.localeCompare(b.date));
   const noLoad=entries.filter(x=>x.type==='strength'&&x.weightKg===null).length,noRpe=entries.filter(x=>x.type==='strength'&&x.rpe===null).length;
   if(noLoad)warnings.push(noLoad+' strength row(s) have no specified load; Loadnote will not guess one.');
   if(noRpe)warnings.push(noRpe+' strength row(s) have no RPE target; no target is inferred.');
   const unknown=entries.filter(x=>!Integrity.resolveExercise(state.exerciseCatalog||[],x.name)).length;
   if(unknown)warnings.push(unknown+' exercise row(s) are not in the catalog. Exact athlete-authored names will be retained.');
   if(sessions.some(s=>s.date<new Date().toISOString().slice(0,10)))warnings.push('Some dates are in the past. Only workouts explicitly linked to these Calendar sessions count as completed program sessions.');
   const busy=Schedule.list(state.scheduledSessions||[]).filter(s=>s.status==='scheduled'&&sessions.some(x=>x.date===s.date));
   if(busy.length)warnings.push(busy.length+' existing scheduled Calendar session(s) overlap imported dates. Scheduling will be blocked until resolved.');
   return {version:1,config:cfg,entries,sessions,warnings};
 }
 function validate(records){
   if(!Array.isArray(records)||records.length>200)throw Error('Invalid custom program library');const ids=new Set();
   return records.map(r=>{
     if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||!iso(r.createdAt)||r.review?.confirmed!==true||r.review.recordedAt!==r.createdAt||typeof r.review.notes!=='string'||r.review.notes.length>1000||r.scheduledAt!=null&&!iso(r.scheduledAt)||!Array.isArray(r.entries)||!Array.isArray(r.sessions)||!r.sessions.length||!r.source||!['manual','csv','tsv','txt','xlsx','pdf','json'].includes(r.source.kind)||typeof r.source.name!=='string'||r.source.name.length>180)throw Error('Invalid saved custom program');
     config(r.config);if(r.entries.length>1500||r.entries.some(e=>!Number.isInteger(e.week)||e.week<1||e.week>r.config.weeks||!Number.isInteger(e.weekday)||e.weekday<0||e.weekday>6||typeof e.name!=='string'||!e.name||!['strength','cardio'].includes(e.type)))throw Error('Invalid saved custom exercise row');
     if(r.sessions.some(s=>!day(s.date)||!Number.isInteger(s.week)||!Array.isArray(s.exercises)||!s.exercises.length))throw Error('Invalid saved custom session');ids.add(r.id);return copy(r);
   });
 }
 function save(state,proposal,{confirmed=false,notes='',source={kind:'manual',name:''},now=new Date().toISOString(),id}={}){
   if(!confirmed||!iso(now)||typeof notes!=='string'||notes.length>1000)throw Error('Review and confirm the exact program before saving');
   if(!source||!['manual','csv','tsv','txt','xlsx','pdf','json'].includes(source.kind)||typeof source.name!=='string'||source.name.length>180)throw Error('Invalid import source');
   const rows=proposal?.entries?.map(r=>r.type==='cardio'?{week:r.week,day:String(r.weekday+1),exercise:r.name,type:'cardio',minutes:r.minutes,notes:r.notes}:{week:r.week,day:String(r.weekday+1),exercise:r.name,type:'strength',sets:r.sets,reps:r.reps,weight:r.weightKg,unit:'kg',rpe:r.rpe,rest:r.rest,notes:r.notes});
   const fresh=build(state,{...proposal?.config,rows,unit:'kg'});
   if(JSON.stringify(fresh.entries)!==JSON.stringify(proposal.entries)||JSON.stringify(fresh.sessions)!==JSON.stringify(proposal.sessions))throw Error('Program preview is stale; review it again');
   const catalog=copy(state.exerciseCatalog||[]);for(const s of fresh.sessions)for(const e of s.exercises)if(!e.exerciseId){let exerciseId=Integrity.stableExerciseId(e.name),suffix=1;while(catalog.some(x=>x.id===exerciseId&&Integrity.compactKey(x.name)!==Integrity.compactKey(e.name)))exerciseId=Integrity.stableExerciseId(e.name)+'_'+suffix++;if(!catalog.some(x=>x.id===exerciseId))catalog.push({id:exerciseId,name:e.name,aliases:[]});e.exerciseId=exerciseId;}
   const record={...fresh,id:String(id||('custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7))),createdAt:now,source:{kind:source.kind,name:source.name},review:{confirmed:true,recordedAt:now,notes:notes.trim()},scheduledAt:null};
   return {...state,exerciseCatalog:catalog,customPrograms:validate([...(state.customPrograms||[]),record])};
 }
 function schedule(state,id,{now=new Date().toISOString()}={}){
   if(!iso(now))throw Error('Invalid schedule time');const records=validate(state.customPrograms||[]),p=records.find(r=>r.id===id);if(!p||p.scheduledAt)throw Error('Program is unavailable or already scheduled');
   const existing=Schedule.list(state.scheduledSessions||[]);if(existing.some(s=>s.status==='scheduled'&&p.sessions.some(x=>x.date===s.date)))throw Error('Calendar conflict: resolve existing scheduled dates before scheduling this program');
   let sessions=state.scheduledSessions||[];
   for(const s of p.sessions){const exercises=s.exercises.map(e=>e.type==='cardio'?{name:e.name,exerciseId:e.exerciseId||undefined,type:'cardio',duration:e.duration}:{name:e.name,exerciseId:e.exerciseId||undefined,type:'strength',sets:e.sets,restSeconds:e.restSeconds});
     const plan=Intent.createPrescription(exercises,{type:'program',referenceId:p.id,label:p.config.name+' · '+s.name},now);
     sessions=Schedule.create(sessions,{name:p.config.name+' · '+s.name,date:s.date,role:'mixed',goal:'Athlete-authored program; preserve original planned targets',prescription:plan},{id:'custom:'+p.id+':'+s.key,now});
   }
   p.scheduledAt=now;return {...state,customPrograms:validate(records),scheduledSessions:sessions};
 }
 function insights(state,id,{asOf}={}){
   if(!day(asOf))throw Error('Choose a valid review date');const p=validate(state.customPrograms||[]).find(r=>r.id===id);if(!p)throw Error('Custom program not found');
   const movements=new Map();for(const e of p.entries){const k=e.name.toLowerCase(),m=movements.get(k)||{name:e.name,exposures:0,sets:0,weeks:new Set(),loads:[]};m.exposures++;m.weeks.add(e.week);if(e.type==='strength'){m.sets+=e.sets;if(e.weightKg!=null)m.loads.push({week:e.week,kg:e.weightKg});}movements.set(k,m);}
   const patterns=[...movements.values()].sort((a,b)=>b.exposures-a.exposures).slice(0,6).map(m=>({name:m.name,exposures:m.exposures,weeks:m.weeks.size,sets:m.sets,firstLoadKg:m.loads.sort((a,b)=>a.week-b.week)[0]?.kg??null,lastLoadKg:m.loads.at(-1)?.kg??null}));
   if(!p.scheduledAt)return {status:'not-scheduled',name:p.config.name,planned:p.sessions.length,completed:0,skipped:0,unconfirmed:0,linkedSets:0,matchedSets:0,patterns,notes:['Loadnote can describe the reviewed program structure now. Schedule it to compare exact prescriptions with linked workouts.']};
   const rows=Schedule.rows(state.scheduledSessions||[],state.workouts||[],{asOf}).filter(s=>s.id.startsWith('custom:'+p.id+':'));
   let linkedSets=0,matchedSets=0;const differences=[];
   for(const s of rows.filter(s=>s.state==='completed')){
     const w=(state.workouts||[]).find(w=>String(w.id)===String(s.workoutIds[0]));if(!w)continue;
     for(const exercise of s.prescription?.plannedExercises||[]){if(exercise.type!=='strength')continue;
       const match=(w.exercises||[]).find(e=>exercise.exerciseId&&e.exerciseId===exercise.exerciseId||String(e.name||'').toLowerCase()===exercise.name.toLowerCase());
       if(!match){differences.push(s.date+' · '+exercise.name+' not logged');continue;}
       for(let i=0;i<exercise.sets.length;i++){linkedSets++;const target=exercise.sets[i],actual=match.sets?.[i];if(actual&&actual.reps===target.reps&&(target.weight==null||Math.abs(Number(actual.weight)-Number(target.weight))<=0.01))matchedSets++;}
     }
   }
   return {status:'ready',name:p.config.name,planned:p.sessions.length,completed:rows.filter(s=>s.state==='completed').length,skipped:rows.filter(s=>s.state==='skipped').length,unconfirmed:rows.filter(s=>s.state==='unconfirmed').length,linkedSets,matchedSets,patterns,differences:differences.slice(0,8),notes:['Only Calendar-linked workouts provide exact planned-versus-actual comparisons.','These observations can guide a review; they do not demonstrate a program caused a result or authorize automatic changes.']};
 }
 return {dayNames,build,validate,save,schedule,insights,normalizeRow};
});
