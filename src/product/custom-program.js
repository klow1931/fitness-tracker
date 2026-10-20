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
 const REASONS={recovery:'Fatigue or recovery',performance:'Training performance',schedule:'Time or scheduling',equipment:'Equipment or access',preference:'Personal preference',coaching:'Coach or programming review',other:'Other'};
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
   const sets=number(row.sets,'Sets',{min:1,max:12,integer:true});
   const rawReps=String(row.reps??'').trim(),range=rawReps.replace(/[–—]/g,'-').match(/^(\d{1,2})\s*(?:-|to)\s*(\d{1,2})$/i);
   const reps=number(range?range[1]:row.reps,'Reps',{min:1,max:50,integer:true});
   const minReps=range?reps:row.minReps==null?null:number(row.minReps,'Minimum reps',{min:1,max:50,integer:true});
   const maxReps=range?number(range[2],'Maximum reps',{min:1,max:50,integer:true}):row.maxReps==null?null:number(row.maxReps,'Maximum reps',{min:1,max:50,integer:true});
   if((minReps===null)!==(maxReps===null)||minReps!==null&&(minReps>=maxReps||reps<minReps||reps>maxReps))throw Error('Rep range must be ascending, e.g. 8–12');
   const rpe=number(row.rpe??row.targetRpe,'RPE',{min:1,max:10,optional:true});
   const rest=number(row.rest??row.restSeconds,'Rest seconds',{min:60,max:600,integer:true,optional:true});
   const inputWeight=row.weight??row.load,percentToken=typeof inputWeight==='string'&&/^\d+(?:\.\d+)?\s*%$/.test(inputWeight.trim());
   const percent=number(percentToken?inputWeight.replace(/\s*%/,''):row.percent,'Percentage',{min:1,max:100,optional:true});
   const loadUnit=String(row.unit||unit||'').trim().toLowerCase().replace(/^lbs$/,'lb');
   let weightKg=null,percentageFields={};
   if(percent!==null){
     if(!percentToken&&inputWeight!==null&&inputWeight!==undefined&&String(inputWeight).trim()!=='')throw Error('Choose either a fixed load or a percentage, not both');
     const percentBasis=String(row.percentBasis||'').trim().toLowerCase();
     if(!['training-max','tested-1rm'].includes(percentBasis))throw Error('Choose percentage basis: training max or tested 1RM');
     const reference=number(row.reference,'Percentage reference load',{min:1,max:2205});
     const referenceUnit=String(row.referenceUnit||loadUnit).trim().toLowerCase().replace(/^lbs$/,'lb');
     if(!['kg','lb'].includes(referenceUnit))throw Error('Choose percentage reference unit: kg or lb');
     const roundTo=number(row.roundTo===''||row.roundTo==null?(referenceUnit==='lb'?5:2.5):row.roundTo,'Plate rounding increment',{min:0.1,max:25});
     const calculated=Math.round((reference*percent/100+1e-8)/roundTo)*roundTo;
     weightKg=Math.round((referenceUnit==='kg'?calculated:calculated/2.20462262185)*100)/100;
     percentageFields={percent,percentBasis,reference,referenceUnit,roundTo};
   }else{
     const load=number(inputWeight,'Load',{min:0,max:2205,optional:true});
     if(load!==null&&!['kg','lb'].includes(loadUnit))throw Error('Load unit must be explicitly reviewed as kg or lb');
     weightKg=load===null?null:Math.round((loadUnit==='kg'?load:load/2.20462262185)*100)/100;
   }
   if(weightKg!==null&&weightKg>1000)throw Error('Load exceeds the 1000 kg safety limit');
   return {week,weekday,name,type,sets,reps,weightKg,rpe,rest,notes,...(minReps!==null?{minReps,maxReps}:{}),...percentageFields};
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
     else {target.sets=Array.from({length:entry.sets},()=>{const s={reps:entry.reps};if(entry.minReps!=null){s.minReps=entry.minReps;s.maxReps=entry.maxReps;}if(entry.percent!=null){s.percent=entry.percent;s.percentBasis=entry.percentBasis;s.referenceKg=Math.round((entry.referenceUnit==='lb'?entry.reference/2.20462262185:entry.reference)*100)/100;s.roundTo=entry.roundTo;s.roundUnit=entry.referenceUnit;}if(entry.weightKg!==null)s.weight=entry.weightKg;if(entry.rpe!==null)s.targetRpe=entry.rpe;return s;});if(entry.rest!==null)target.restSeconds=entry.rest;}
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
 // Editor operations are pure and never touch an approved program or Calendar.
 // In particular, a movement swap cannot inherit the old exercise's load/RPE.
 // Bulk editor is draft-only: a separate preview/confirmation is required in the UI.
 function bulkEditDraftRows(rows,selected,changes){
  if(!Array.isArray(rows)||rows.length>1500||!Array.isArray(selected)||!selected.length||selected.length>rows.length||!changes||typeof changes!=='object')throw Error('Select valid draft exercise rows');
  const indexes=new Set(selected);if(indexes.size!==selected.length||[...indexes].some(i=>!Number.isInteger(i)||i<0||i>=rows.length))throw Error('Invalid exercise selection');
  const keys=Object.keys(changes);if(!keys.length||keys.some(k=>!['sets','reps','rpe','rest','minutes'].includes(k)))throw Error('Choose supported targets to update');
  for(const [key,value] of Object.entries(changes))if(value===null||value===undefined||String(value).trim()==='')throw Error('Enter a value for '+key);
  const result=copy(rows);for(const i of indexes){
   const row=result[i],cardio=row.type==='cardio';
   for(const [key,value] of Object.entries(changes)){
    if(cardio!== (key==='minutes'))throw Error('Select only compatible '+(cardio?'cardio':'strength')+' rows for this edit');
    const allowed={sets:[1,12],reps:[1,50],rpe:[1,10],rest:[60,600],minutes:[1,360]}[key],n=Number(value);
    if(!Number.isFinite(n)||n<allowed[0]||n>allowed[1]||key!=='rpe'&&!Number.isInteger(n))throw Error('Invalid '+key+' target');
    row[key]=String(n);
   }
  }return {rows:result,changed:indexes.size,affected:selected.map(i=>({row:i+1,week:rows[i].week,day:rows[i].day,exercise:rows[i].exercise,type:rows[i].type}))};
 }
 function copyDraftWeek(rows,fromWeek,toWeek){
   if(!Array.isArray(rows)||rows.length>1500||![fromWeek,toWeek].every(n=>Number.isInteger(n)&&n>=1&&n<=52)||fromWeek===toWeek)throw Error('Choose two different valid program weeks');
   const originals=rows.filter(r=>Number(r.week)===fromWeek);
   if(!originals.length)throw Error('The source week has no exercise rows');
   if(rows.some(r=>Number(r.week)===toWeek))throw Error('The target week already contains exercises; choose an empty week to avoid overwriting work');
   if(rows.length+originals.length>1500)throw Error('The program editor supports at most 1500 exercise rows');
   return [...copy(rows),...originals.map(r=>({...copy(r),week:String(toWeek)}))];
 }
 function swapDraftMovement(rows,{from,to,firstWeek=1,lastWeek=52}={}){
   if(!Array.isArray(rows)||rows.length>1500||!Number.isInteger(firstWeek)||!Number.isInteger(lastWeek)||firstWeek<1||lastWeek>52||firstWeek>lastWeek)throw Error('Choose a valid week range');
   const oldName=String(from||'').trim().replace(/\s+/g,' '),newName=String(to||'').trim().replace(/\s+/g,' ');
   if(!oldName||!newName||newName.length>160||oldName.toLowerCase()===newName.toLowerCase())throw Error('Choose different, nonempty exercise names (160 characters maximum)');
   let changed=0,clearedTargets=0;
   const result=copy(rows).map(r=>{
     if(Number(r.week)<firstWeek||Number(r.week)>lastWeek||String(r.exercise||'').trim().replace(/\s+/g,' ').toLowerCase()!==oldName.toLowerCase())return r;
     changed++;
     const previous=String(r.weight??'').trim()!==''||String(r.rpe??'').trim()!=='';
     if(r.type!=='cardio'){r.weight='';r.rpe='';if(previous)clearedTargets++;}
     r.exercise=newName;return r;
   });
   if(!changed)throw Error('No matching exercise rows were found in those weeks');
   return {rows:result,changed,clearedTargets};
 }
 function weeklyOverview(proposal){
   if(!proposal?.config||!Array.isArray(proposal.entries)||!Number.isInteger(proposal.config.weeks)||proposal.config.weeks<1||proposal.config.weeks>52)throw Error('Review a valid program first');
   const weeks=Array.from({length:proposal.config.weeks},(_,i)=>({week:i+1,days:new Set(),exerciseRows:0,strengthSets:0,cardioMinutes:0}));
   for(const row of proposal.entries){const w=weeks[row.week-1];if(!w)throw Error('Exercise week is outside the program');w.days.add(row.weekday);w.exerciseRows++;if(row.type==='strength')w.strengthSets+=row.sets;else if(row.type==='cardio')w.cardioMinutes+=row.minutes;}
   const summary=weeks.map(w=>({week:w.week,days:w.days.size,exerciseRows:w.exerciseRows,strengthSets:w.strengthSets,cardioMinutes:w.cardioMinutes}));
   const increases=[];
   for(let i=1;i<summary.length;i++){const before=summary[i-1].strengthSets,after=summary[i].strengthSets;if(before>0&&after>=before*1.5&&after-before>=4)increases.push({week:i+1,from:before,to:after});}
   return {weeks:summary,emptyWeeks:summary.filter(w=>!w.exerciseRows).map(w=>w.week),largeSetIncreases:increases};
 }
 function compare(original,updated){
   if(!original?.config||!Array.isArray(original.entries)||!updated?.config||!Array.isArray(updated.entries))throw Error('Choose a reviewed program to compare');
   const changes=[],kinds=[];
   const add=(message,kind)=>{changes.push(message);kinds.push(kind);};
   for(const [key,label] of [['name','Program name'],['weeks','Program length'],['startDate','Week 1 start date']])if(original.config[key]!==updated.config[key])add(label+': '+original.config[key]+' → '+updated.config[key],'config');
   const key=e=>e.week+':'+e.weekday+':'+e.type+':'+e.name.toLowerCase(),groups=entries=>{const m=new Map();for(const e of entries){const k=key(e);if(!m.has(k))m.set(k,[]);m.get(k).push(e);}return m;};
   const before=groups(original.entries),after=groups(updated.entries);
   for(const k of new Set([...before.keys(),...after.keys()])){
     const old=before.get(k)||[],fresh=after.get(k)||[];
     for(let i=0;i<Math.max(old.length,fresh.length);i++){
       const a=old[i],b=fresh[i],r=a||b,label='Week '+r.week+' '+dayNames[r.weekday]+' · '+r.name;
       if(!a||!b){add((a?'Removed ':'Added ')+label,'exercise');continue;}
       const fields=r.type==='cardio'?[['minutes','minutes']]:[['sets','sets'],['reps','reps'],['minReps','minimum reps'],['maxReps','maximum reps'],['weightKg','load (kg)'],['percent','percentage'],['percentBasis','percentage basis'],['reference','reference'],['referenceUnit','reference unit'],['roundTo','rounding'],['rpe','RPE'],['rest','rest (sec)']];
       const edits=fields.filter(([field])=>a[field]!==b[field]).map(([field,name])=>name+': '+(a[field]??'unspecified')+' → '+(b[field]??'unspecified'));
       if(a.notes!==b.notes)edits.push('exercise notes edited');
       if(edits.length)add(label+' — '+edits.join(', '),'exercise');
     }
   }
   return {count:changes.length,changes:changes.slice(0,25).map(x=>x.slice(0,250)),kinds:kinds.slice(0,25)};
 }
 function validate(records){
   if(!Array.isArray(records)||records.length>200)throw Error('Invalid custom program library');const ids=new Set();
   return records.map(r=>{
     if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||!iso(r.createdAt)||r.review?.confirmed!==true||r.review.recordedAt!==r.createdAt||typeof r.review.notes!=='string'||r.review.notes.length>1000||r.scheduledAt!=null&&!iso(r.scheduledAt)||!Array.isArray(r.entries)||!Array.isArray(r.sessions)||!r.sessions.length||!r.source||!['manual','csv','tsv','txt','xlsx','pdf','json'].includes(r.source.kind)||typeof r.source.name!=='string'||r.source.name.length>180)throw Error('Invalid saved custom program');
     if(r.revision!==undefined){const v=r.revision;if(!v||typeof v.parentId!=='string'||!v.parentId||v.parentId===r.id||!v.reason||!Object.hasOwn(REASONS,v.reason.kind)||typeof v.reason.detail!=='string'||v.reason.detail.length>500||typeof v.reason.coachVisible!=='boolean'||!Number.isInteger(v.changeCount)||v.changeCount<1||v.changeCount>3003||!Array.isArray(v.changes)||v.changes.length<1||v.changes.length>25||v.changeCount<v.changes.length||v.changes.some(x=>typeof x!=='string'||!x||x.length>250))throw Error('Invalid custom program revision');
       if(v.exerciseReasons!==undefined){if(!Array.isArray(v.exerciseReasons)||v.exerciseReasons.length>25)throw Error('Invalid exercise edit reasons');const indexes=new Set();for(const e of v.exerciseReasons){if(!e||!Number.isInteger(e.changeIndex)||e.changeIndex<0||e.changeIndex>=v.changes.length||indexes.has(e.changeIndex)||!Object.hasOwn(REASONS,e.kind)||typeof e.detail!=='string'||e.detail.length>350||(e.kind==='other'&&!e.detail.trim()))throw Error('Invalid exercise edit reasons');indexes.add(e.changeIndex);}}
     }
     if(r.replacedBy!==undefined&&(typeof r.replacedBy!=='string'||!r.replacedBy||r.replacedBy===r.id||!r.scheduledAt||!iso(r.replacedAt)))throw Error('Invalid custom program replacement history');
     if(r.replacedAt!==undefined&&r.replacedBy===undefined)throw Error('Invalid custom program replacement time');
     config(r.config);if(r.entries.length>1500||r.entries.some(e=>!Number.isInteger(e.week)||e.week<1||e.week>r.config.weeks||!Number.isInteger(e.weekday)||e.weekday<0||e.weekday>6||typeof e.name!=='string'||!e.name||!['strength','cardio'].includes(e.type)))throw Error('Invalid saved custom exercise row');
     if(r.sessions.some(s=>!day(s.date)||!Number.isInteger(s.week)||!Array.isArray(s.exercises)||!s.exercises.length))throw Error('Invalid saved custom session');ids.add(r.id);return copy(r);
   });
 }
 function save(state,proposal,{confirmed=false,notes='',source={kind:'manual',name:''},now=new Date().toISOString(),id,parentId=null,reason=null}={}){
   if(!confirmed||!iso(now)||typeof notes!=='string'||notes.length>1000)throw Error('Review and confirm the exact program before saving');
   if(!source||!['manual','csv','tsv','txt','xlsx','pdf','json'].includes(source.kind)||typeof source.name!=='string'||source.name.length>180)throw Error('Invalid import source');
   const rows=proposal?.entries?.map(r=>r.type==='cardio'?{week:r.week,day:String(r.weekday+1),exercise:r.name,type:'cardio',minutes:r.minutes,notes:r.notes}:{week:r.week,day:String(r.weekday+1),exercise:r.name,type:'strength',sets:r.sets,reps:r.minReps!=null?r.minReps+'-'+r.maxReps:r.reps,weight:r.percent!=null?'':r.weightKg,unit:r.percent!=null?r.referenceUnit:'kg',rpe:r.rpe,rest:r.rest,notes:r.notes,...(r.percent!=null?{percent:r.percent,percentBasis:r.percentBasis,reference:r.reference,referenceUnit:r.referenceUnit,roundTo:r.roundTo}:{})});
   const fresh=build(state,{...proposal?.config,rows,unit:'kg'});
   if(JSON.stringify(fresh.entries)!==JSON.stringify(proposal.entries)||JSON.stringify(fresh.sessions)!==JSON.stringify(proposal.sessions))throw Error('Program preview is stale; review it again');
   let revision;
   if(parentId!==null){const parent=validate(state.customPrograms||[]).find(p=>p.id===parentId);if(!parent)throw Error('The original program is no longer available');
     const difference=compare(parent,fresh);if(!difference.count)throw Error('No changes found. Edit the copy before saving it.');
     if(!reason||!Object.hasOwn(REASONS,reason.kind)||typeof reason.detail!=='string'||reason.detail.length>500||typeof reason.coachVisible!=='boolean'||(reason.kind==='other'&&!reason.detail.trim()))throw Error('Choose why you changed this program; describe an Other reason');
     const exerciseReasons=reason.exerciseReasons??[];if(!Array.isArray(exerciseReasons)||exerciseReasons.length>25)throw Error('Invalid exercise edit reasons');
     const used=new Set();for(const entry of exerciseReasons){if(!entry||!Number.isInteger(entry.changeIndex)||difference.kinds[entry.changeIndex]!=='exercise'||used.has(entry.changeIndex)||!Object.hasOwn(REASONS,entry.kind)||typeof entry.detail!=='string'||entry.detail.length>350||(entry.kind==='other'&&!entry.detail.trim()))throw Error('Review each exercise reason against the current change list');used.add(entry.changeIndex);}
     revision={parentId,reason:{kind:reason.kind,detail:reason.detail.trim(),coachVisible:reason.coachVisible},changeCount:difference.count,changes:difference.changes,exerciseReasons:exerciseReasons.map(e=>({changeIndex:e.changeIndex,kind:e.kind,detail:e.detail.trim()}))};
   }else if(reason!==null)throw Error('Change reasons require an existing program copy');
   const catalog=copy(state.exerciseCatalog||[]);for(const s of fresh.sessions)for(const e of s.exercises)if(!e.exerciseId){let exerciseId=Integrity.stableExerciseId(e.name),suffix=1;while(catalog.some(x=>x.id===exerciseId&&Integrity.compactKey(x.name)!==Integrity.compactKey(e.name)))exerciseId=Integrity.stableExerciseId(e.name)+'_'+suffix++;if(!catalog.some(x=>x.id===exerciseId))catalog.push({id:exerciseId,name:e.name,aliases:[]});e.exerciseId=exerciseId;}
   const record={...fresh,id:String(id||('custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7))),createdAt:now,source:{kind:source.kind,name:source.name},review:{confirmed:true,recordedAt:now,notes:notes.trim()},scheduledAt:null};
   if(revision)record.revision=revision;
   return {...state,exerciseCatalog:catalog,customPrograms:validate([...(state.customPrograms||[]),record])};
 }
 function schedule(state,id,{now=new Date().toISOString()}={}){
   if(!iso(now))throw Error('Invalid schedule time');const records=validate(state.customPrograms||[]),p=records.find(r=>r.id===id);if(!p||p.scheduledAt)throw Error('Program is unavailable or already scheduled');
   const existing=Schedule.list(state.scheduledSessions||[]);if(existing.some(s=>s.status==='scheduled'&&p.sessions.some(x=>x.date===s.date)))throw Error('Calendar conflict: resolve existing scheduled dates before scheduling this program');
   let sessions=state.scheduledSessions||[];
   for(const s of p.sessions)sessions=Schedule.create(sessions,sessionContext(p,s,now),{id:'custom:'+p.id+':'+s.key,now});
   p.scheduledAt=now;return {...state,customPrograms:validate(records),scheduledSessions:sessions};
 }
 function sessionContext(p,s,now){
   const exercises=s.exercises.map(e=>e.type==='cardio'?{name:e.name,exerciseId:e.exerciseId||undefined,type:'cardio',duration:e.duration,notes:e.notes}:{name:e.name,exerciseId:e.exerciseId||undefined,type:'strength',sets:e.sets,restSeconds:e.restSeconds,notes:e.notes});
   const prescription=Intent.createPrescription(exercises,{type:'program',referenceId:p.id,label:p.config.name+' · '+s.name},now);
   return {name:p.config.name+' · '+s.name,date:s.date,role:'mixed',goal:'Athlete-authored program; preserve original planned targets',prescription};
 }
 function replacementPreview(state,id,{asOf}={}){
   if(!day(asOf))throw Error('Choose a valid program replacement date');
   const records=validate(state.customPrograms||[]),child=records.find(p=>p.id===id),parent=records.find(p=>p.id===child?.revision?.parentId);
   if(!child||!parent||!parent.scheduledAt||child.scheduledAt||parent.replacedBy)throw Error('Choose an unscheduled copy of a currently scheduled original');
   const all=Schedule.list(state.scheduledSessions||[]),prefix='custom:'+parent.id+':',own=all.filter(s=>s.id.startsWith(prefix));
   const remove=own.filter(s=>s.date>asOf&&s.status==='scheduled'),protectedRows=own.filter(s=>s.date<=asOf||s.status!=='scheduled');
   const add=child.sessions.filter(s=>s.date>asOf),removeIds=new Set(remove.map(s=>s.id)),logged=new Set((state.workouts||[]).map(w=>w.sessionIntent?.schedule?.id).filter(Boolean));
   const blockers=[];
   if(!remove.length)blockers.push('No unperformed future sessions remain in the original program.');
   if(!add.length)blockers.push('The edited program has no sessions after today.');
   const linked=remove.filter(s=>logged.has(s.id));if(linked.length)blockers.push(linked.length+' future session(s) already have linked workouts; preserve them and review manually.');
   const conflicts=all.filter(s=>s.status==='scheduled'&&!removeIds.has(s.id)&&add.some(n=>n.date===s.date));if(conflicts.length)blockers.push(conflicts.length+' other scheduled Calendar session(s) conflict with the revised dates.');
   const evidence=JSON.stringify({records:records.map(p=>[p.id,p.scheduledAt,p.replacedBy,p.createdAt]),calendar:(state.scheduledSessions||[]).map(s=>[s.id,s.revisions.at(-1)?.recordedAt,s.revisions.length]),linked:[...logged].sort(),target:add.map(s=>[s.date,s.key])});
   let hash=2166136261;for(const c of evidence)hash=Math.imul(hash^c.charCodeAt(0),16777619);
   return {version:1,asOf,childId:child.id,parentId:parent.id,childName:child.config.name,parentName:parent.config.name,remove:remove.map(s=>({id:s.id,date:s.date,name:s.name,revisionAt:s.revisionAt})),add:add.map(s=>({key:s.key,date:s.date,name:child.config.name+' · '+s.name,exercises:s.exercises.length})),preserved:protectedRows.length,blockers,fingerprint:(hash>>>0).toString(36)};
 }
 function replaceFuture(state,preview,{confirmed=false,asOf,now=new Date().toISOString(),draftOpen=false}={}){
   if(!confirmed||draftOpen||!iso(now)||!day(asOf)||asOf!==preview?.asOf||asOf>now.slice(0,10))throw Error('Confirm exact future dates and close any workout draft');
   const fresh=replacementPreview(state,preview.childId,{asOf});if(JSON.stringify(fresh)!==JSON.stringify(preview))throw Error('Program or Calendar changed; review the replacement again');
   if(fresh.blockers.length)throw Error(fresh.blockers.join(' '));
   const records=validate(state.customPrograms||[]),child=records.find(p=>p.id===fresh.childId),parent=records.find(p=>p.id===fresh.parentId);
   const commitAt=new Date(Math.max(Date.parse(now),...fresh.remove.map(s=>Date.parse(s.revisionAt)+1))).toISOString();
   let sessions=state.scheduledSessions||[];for(const s of fresh.remove)sessions=Schedule.change(sessions,s.id,{status:'cancelled',reason:'Future session replaced by reviewed program '+child.config.name.slice(0,100)},commitAt);
   for(const s of child.sessions.filter(s=>s.date>asOf))sessions=Schedule.create(sessions,sessionContext(child,s,commitAt),{id:'custom:'+child.id+':'+s.key,now:commitAt});
   parent.replacedBy=child.id;parent.replacedAt=commitAt;child.scheduledAt=commitAt;
   return {...state,scheduledSessions:sessions,customPrograms:validate(records)};
 }
 function insights(state,id,{asOf}={}){
   if(!day(asOf))throw Error('Choose a valid review date');const p=validate(state.customPrograms||[]).find(r=>r.id===id);if(!p)throw Error('Custom program not found');
   const movements=new Map();for(const e of p.entries){const k=e.name.toLowerCase(),m=movements.get(k)||{name:e.name,exposures:0,sets:0,weeks:new Set(),loads:[]};m.exposures++;m.weeks.add(e.week);if(e.type==='strength'){m.sets+=e.sets;if(e.weightKg!=null)m.loads.push({week:e.week,kg:e.weightKg});}movements.set(k,m);}
   const patterns=[...movements.values()].sort((a,b)=>b.exposures-a.exposures).slice(0,6).map(m=>({name:m.name,exposures:m.exposures,weeks:m.weeks.size,sets:m.sets,firstLoadKg:m.loads.sort((a,b)=>a.week-b.week)[0]?.kg??null,lastLoadKg:m.loads.at(-1)?.kg??null}));
   if(!p.scheduledAt)return {status:'not-scheduled',name:p.config.name,revision:p.revision||null,planned:p.sessions.length,completed:0,skipped:0,unconfirmed:0,linkedSets:0,matchedSets:0,patterns,notes:['Loadnote can describe the reviewed program structure now. Schedule it to compare exact prescriptions with linked workouts.']};
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
   return {status:'ready',name:p.config.name,revision:p.revision||null,planned:rows.length,completed:rows.filter(s=>s.state==='completed').length,skipped:rows.filter(s=>s.state==='skipped').length,unconfirmed:rows.filter(s=>s.state==='unconfirmed').length,linkedSets,matchedSets,patterns,differences:differences.slice(0,8),notes:[...(p.revision&&p.sessions.length!==rows.length?['Only future sessions of this edited program were adopted; earlier dates remain with the original program.']:[]),'Only Calendar-linked workouts provide exact planned-versus-actual comparisons.','These observations can guide a review; they do not demonstrate a program caused a result or authorize automatic changes.']};
 }
 return {dayNames,REASONS,build,compare,validate,save,schedule,replacementPreview,replaceFuture,insights,normalizeRow,copyDraftWeek,bulkEditDraftRows,swapDraftMovement,weeklyOverview};
});
