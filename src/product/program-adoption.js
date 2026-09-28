/* v2.37 — adopt user-authored legacy programs into an auditable scheduled/adaptive plan. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../programming-adaptive'),require('./data-integrity'),require('./schedule'),require('./session-intent'));
 else root.LoadnoteProgramAdoption=factory(root.LoadnoteAdaptivePrograms,root.LoadnoteIntegrity,root.LoadnoteSchedule,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Adaptive,Integrity,Schedule,Intent){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const defaults={1:[1],2:[1,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6],6:[1,2,3,4,5,6],7:[0,1,2,3,4,5,6]};
 const key=x=>String(x??'');
 function nextDow(start,dow,week){
   const base=new Date(move(start,(week-1)*7)+'T12:00:00Z'),delta=(dow-base.getUTCDay()+7)%7;base.setUTCDate(base.getUTCDate()+delta);return base.toISOString().slice(0,10);
 }
 function authoredRpe(line){const m=String(line||'').match(/@\s*RPE\s*(\d+(?:\.\d+)?)/i);const n=Number(m?.[1]);return n>=1&&n<=10?n:null;}
 function normalizedConfig(raw,program){
   const days=program?.days||[],weekdays=Array.isArray(raw?.weekdays)?raw.weekdays.map(Number):defaults[days.length];
   if(!date(raw?.startDate)||!Number.isInteger(Number(raw?.weeks))||Number(raw.weeks)<1||Number(raw.weeks)>52||!Array.isArray(weekdays)||weekdays.length!==days.length||new Set(weekdays).size!==weekdays.length||weekdays.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Choose a valid start date, 1–52 weeks and a unique weekday for every program day');
   const target=Number(raw?.defaultTargetRpe);if(!(target>=1&&target<=10))throw Error('Choose a default RPE cap from 1–10');
   return {version:1,startDate:raw.startDate,weeks:Number(raw.weeks),weekdays,defaultTargetRpe:target,inferLoads:raw?.inferLoads!==false};
 }
 function latestLoad(state,name,startDate){
   const hit=Adaptive.findLastExercise(state.workouts||[],name,startDate);if(!hit)return null;
   const values=hit.sets.map(s=>Number(s.weight)).filter(Number.isFinite);return values.length?Math.max(...values):null;
 }
 function exercise(state,line,config){
   const def=Adaptive.parseLine(line),name=String(def.name||'').trim();
   if(!name||!Number.isInteger(def.sets)||def.sets<1||!Number.isInteger(def.reps)||def.reps<1)return {raw:String(line||''),name,unsupported:true};
   const catalog=Integrity.resolveExercise(state.exerciseCatalog||[],name),load=config.inferLoads?latestLoad(state,name,config.startDate):null,rpe=authoredRpe(line),cap=rpe??config.defaultTargetRpe;
   const sets=Array.from({length:def.sets},()=>{const s={reps:def.reps,targetRpe:cap};if(load!=null)s.weight=load;return s;});
   return {raw:String(line),name,exerciseId:catalog?.id||null,sets,loadSource:load==null?'unspecified':'recent-log',rpeSource:rpe==null?'adoption-default':'user-authored'};
 }
 function build(state,source,raw){
   if(!source||!source.id||!Array.isArray(source.days)||!source.days.length||source.days.length>7)throw Error('Choose a saved program with 1–7 training days');
   const config=normalizedConfig(raw,source),sessions=[],warnings=[],seenDates=new Set();
   for(let week=1;week<=config.weeks;week++)for(let dayIndex=0;dayIndex<source.days.length;dayIndex++){
     const src=source.days[dayIndex],day=nextDow(config.startDate,config.weekdays[dayIndex],week);
     if(seenDates.has(day))throw Error('Two adopted program days resolve to the same date');seenDates.add(day);
     const exercises=(src.exercises||[]).map(line=>exercise(state,line,config)),supported=exercises.filter(e=>!e.unsupported);
     if(!supported.length)throw Error('Program day '+(src.day||dayIndex+1)+' has no parseable set × rep exercises');
     if(exercises.some(e=>e.unsupported))warnings.push('Some entries on '+(src.day||'program day')+' could not be converted to structured set × rep targets and are preserved only in the source snapshot.');
     sessions.push({key:'w'+week+'d'+dayIndex,week,dayIndex,date:day,name:String(src.day||('Day '+(dayIndex+1))),exercises:supported});
   }
   const inferred=sessions.flatMap(s=>s.exercises).filter(e=>e.loadSource==='recent-log').length,missing=sessions.flatMap(s=>s.exercises).filter(e=>e.loadSource==='unspecified').length,defaultRpe=sessions.flatMap(s=>s.exercises).filter(e=>e.rpeSource==='adoption-default').length;
   if(inferred)warnings.push(inferred+' exercise exposure(s) use the most recent pre-program logged load as an adoption-time execution target; that load was not authored in the saved program.');
   if(missing)warnings.push(missing+' exercise exposure(s) have no exact load target. Loadnote will compare reps/RPE without inventing a weight.');
   if(defaultRpe)warnings.push(defaultRpe+' exercise exposure(s) use the adoption-time default RPE cap because the saved program did not specify one.');
   return {version:1,sourceProgramId:key(source.id),sourceSnapshot:copy(source),config,sessions,warnings};
 }
 function validate(records){
   if(!Array.isArray(records)||records.length>100)throw Error('Invalid adopted programs');const ids=new Set();
   return records.map(r=>{if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||!iso(r.createdAt)||r.review?.confirmed!==true||r.review.recordedAt!==r.createdAt||typeof r.review.notes!=='string'||r.review.notes.length>1000||!r.sourceSnapshot)throw Error('Invalid adopted program');ids.add(r.id);
     const cfg=normalizedConfig(r.config,r.sourceSnapshot);if(JSON.stringify(cfg)!==JSON.stringify(r.config))throw Error('Invalid adopted program configuration');
     if(!Array.isArray(r.sessions)||!r.sessions.length||r.sessions.some(s=>!Number.isInteger(s.week)||!date(s.date)||!Array.isArray(s.exercises)||!s.exercises.length))throw Error('Invalid adopted program sessions');
     if(r.scheduledAt!=null&&!iso(r.scheduledAt))throw Error('Invalid adopted program schedule time');
     if(r.weeklyReviews!=null&&!Array.isArray(r.weeklyReviews))throw Error('Invalid adopted program review history');
     return copy(r);
   });
 }
 function prepare(state,sourceId,raw){
   const source=(state.programs||[]).find(p=>key(p.id)===key(sourceId));if(!source)throw Error('Saved program no longer exists');
   const result=build(state,source,raw),existing=Schedule.list(state.scheduledSessions||[]).filter(s=>result.sessions.some(x=>x.date===s.date)&&s.status==='scheduled');
   if(existing.length)result.warnings.push(existing.length+' existing Calendar session(s) conflict with proposed dates.');
   return result;
 }
 function save(state,proposal,{confirmed=false,notes='',now=new Date().toISOString(),id}={}){
   if(!confirmed||!iso(now)||typeof notes!=='string'||notes.length>1000)throw Error('Review and confirm the adopted program');
   const source=(state.programs||[]).find(p=>key(p.id)===proposal?.sourceProgramId);if(!source)throw Error('Saved program no longer exists');
   const fresh=build(state,source,proposal.config);if(JSON.stringify(fresh.sessions)!==JSON.stringify(proposal.sessions)||JSON.stringify(fresh.sourceSnapshot)!==JSON.stringify(proposal.sourceSnapshot))throw Error('Program or training context changed; preview adoption again');
   const record={...fresh,id:String(id||('adopted_'+Date.now().toString(36))),createdAt:now,review:{confirmed:true,recordedAt:now,notes:notes.trim()},scheduledAt:null,weeklyReviews:[]};
   const catalog=copy(state.exerciseCatalog||[]);for(const session of record.sessions)for(const ex of session.exercises)if(!ex.exerciseId){let exerciseId=Integrity.stableExerciseId(ex.name),n=1;while(catalog.some(row=>row.id===exerciseId&&Integrity.compactKey(row.name)!==Integrity.compactKey(ex.name)))exerciseId=Integrity.stableExerciseId(ex.name)+'_'+n++;if(!catalog.some(row=>row.id===exerciseId))catalog.push({id:exerciseId,name:ex.name,aliases:[]});ex.exerciseId=exerciseId;}
   return {...state,exerciseCatalog:catalog,adoptedPrograms:validate([...(state.adoptedPrograms||[]),record])};
 }
 function schedule(state,id,{now=new Date().toISOString()}={}){
   const records=validate(state.adoptedPrograms||[]),record=records.find(r=>r.id===id);if(!record||record.scheduledAt)throw Error('Adopted program unavailable or already scheduled');
   if(!iso(now))throw Error('Invalid schedule time');
   const existing=Schedule.list(state.scheduledSessions||[]);if(existing.some(s=>s.status==='scheduled'&&record.sessions.some(x=>x.date===s.date)))throw Error('Calendar conflict: resolve existing scheduled dates first');
   let sessions=state.scheduledSessions||[];
   for(const s of record.sessions){
     const exercises=s.exercises.map(e=>({name:e.name,exerciseId:e.exerciseId||undefined,type:'strength',sets:e.sets.map(set=>({...set}))}));
     const plan=Intent.createPrescription(exercises,{type:'program',referenceId:record.id,label:record.sourceSnapshot.name+' · '+s.name},now);
     sessions=Schedule.create(sessions,{name:record.sourceSnapshot.name+' · '+s.name,date:s.date,role:'mixed',goal:'Follow adopted program baseline',prescription:plan},{id:'adopted:'+record.id+':'+s.key,now});
   }
   record.scheduledAt=now;return {...state,adoptedPrograms:validate(records),scheduledSessions:sessions};
 }
 function analyzeWeek(state,{programId,week,asOf,now=new Date().toISOString()}={}){
   if(!date(asOf)||!iso(now)||asOf>now.slice(0,10)||!Number.isInteger(week))throw Error('Choose a valid completed program week');
   const records=validate(state.adoptedPrograms||[]),program=records.find(p=>p.id===programId);if(!program?.scheduledAt)throw Error('Choose a scheduled adopted program');
   const current=program.sessions.filter(s=>s.week===week),next=program.sessions.filter(s=>s.week===week+1);if(!current.length||!next.length||current.some(s=>s.date>asOf))throw Error('Choose a completed week with a following program week');
   if((program.weeklyReviews||[]).some(r=>r.week===week))throw Error('This adopted-program week already has an accepted review');
   const rows=Schedule.rows(state.scheduledSessions||[],state.workouts||[],{asOf,knownAt:now}),findings={};
   for(const target of current)for(const ex of target.exercises){
     const id=ex.exerciseId||('name:'+ex.name.toLowerCase()),f=findings[id]||(findings[id]={exerciseId:ex.exerciseId||null,name:ex.name,comparableRpeSets:0,aboveCap:0,completedExposures:0,plannedExposures:0,nextExposures:0,canReduceOne:false,reasons:[]});f.plannedExposures++;
     const row=rows.find(r=>r.id==='adopted:'+program.id+':'+target.key),workoutId=row?.workoutIds?.[0],w=(state.workouts||[]).find(x=>String(x.id)===String(workoutId));
     if(!w)continue;const actual=(w.exercises||[]).find(a=>ex.exerciseId?a.exerciseId===ex.exerciseId:String(a.name||'').toLowerCase()===ex.name.toLowerCase());if(!actual)continue;f.completedExposures++;
     for(let i=0;i<Math.min(ex.sets.length,actual.sets?.length||0);i++){const p=ex.sets[i],a=actual.sets[i],sameReps=Number(p.reps)===Number(a.reps),sameLoad=p.weight==null||Math.abs(Number(p.weight)-Number(a.weight))<=0.01,rpe=Number(a.rpe);if(sameReps&&sameLoad&&rpe>=1&&rpe<=10&&p.targetRpe>=1){f.comparableRpeSets++;if(rpe>p.targetRpe)f.aboveCap++;}}
   }
   for(const target of next)for(const ex of target.exercises){const id=ex.exerciseId||('name:'+ex.name.toLowerCase()),f=findings[id]||(findings[id]={exerciseId:ex.exerciseId||null,name:ex.name,comparableRpeSets:0,aboveCap:0,completedExposures:0,plannedExposures:0,nextExposures:0,canReduceOne:false,reasons:[]});f.nextExposures++;if(ex.sets.length<3)f.reasons.push('Next-week exposure has fewer than three sets.');}
   for(const f of Object.values(findings)){if(f.completedExposures<f.plannedExposures)f.reasons.push('Not every reviewed-week exposure has linked completed work.');if(f.comparableRpeSets<2||f.aboveCap<2)f.reasons.push('At least two comparable sets above the approved RPE cap are required.');if(!f.nextExposures)f.reasons.push('No matching next-week exposure.');f.canReduceOne=f.reasons.length===0;}
   return {version:1,policy:'adopted-program-week-v1',programId:program.id,week,nextWeek:week+1,asOf,findings,notes:['Keep is the default. Only one set per matching next-week exposure can be removed.','Unspecified adopted loads are not invented; those sets are comparable by reps and RPE only.','No load increase, exercise substitution, frequency change or retrospective workout edit is performed.']};
 }
 function applyWeekReview(state,report,choices,{confirmed=false,notes='',now=new Date().toISOString()}={}){
   if(!confirmed||!iso(now)||typeof notes!=='string'||notes.length>1000)throw Error('Review and confirm the adopted-program adjustment');
   const fresh=analyzeWeek(state,{programId:report.programId,week:report.week,asOf:report.asOf,now});if(JSON.stringify(fresh)!==JSON.stringify(report))throw Error('Training evidence changed; regenerate the review');
   const records=validate(state.adoptedPrograms||[]),program=records.find(p=>p.id===report.programId),selected=Object.entries(choices||{}).filter(([,v])=>v==='reduce-one').map(([k])=>k);
   for(const k of selected)if(!report.findings[k]?.canReduceOne)throw Error('A selected reduction is not supported by the reviewed evidence');
   let sessions=Schedule.validate(state.scheduledSessions||[]),changes=[];
   for(const target of program.sessions.filter(s=>s.week===report.nextWeek)){
     const rec=sessions.find(r=>r.id==='adopted:'+program.id+':'+target.key);if(!rec)throw Error('Next-week scheduled session is missing');
     const before=rec.revisions.at(-1);if(before.context.status!=='scheduled'||before.context.date<=report.asOf||(state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===rec.id))throw Error('Next-week session changed or already has recorded training');
     const after=copy(before.context);let changed=false;
     for(const ex of after.prescription.plannedExercises){const k=ex.exerciseId||('name:'+ex.name.toLowerCase());if(!selected.includes(k))continue;if(ex.sets.length<3)throw Error('Cannot reduce an exposure below two planned sets');ex.sets.pop();changed=true;}
     if(changed){after.prescription.capturedAt=now;after.reason='Athlete-approved adopted-program week '+report.week+' review';rec.revisions.push({recordedAt:now,context:after});changes.push(rec.id);}
   }
   program.weeklyReviews=[...(program.weeklyReviews||[]),{version:1,id:'adopt_review_'+Date.now().toString(36),week:report.week,createdAt:now,asOf:report.asOf,choices:copy(choices||{}),notes:notes.trim(),report:copy(report),changes}];
   return {...state,adoptedPrograms:validate(records),scheduledSessions:Schedule.validate(sessions)};
 }
 return {defaults,build,prepare,validate,save,schedule,analyzeWeek,applyWeekReview};
});
