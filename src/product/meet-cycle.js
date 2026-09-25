/* v2.30 — flexible, reviewed meet-cycle proposals built on the existing phase-plan engine. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./phase-builder'),require('./programming-profile'),require('./decision-readiness'),require('./schedule'),require('./session-intent'));
 else root.LoadnoteMeetCycle=factory(root.LoadnoteCore,root.LoadnotePhaseBuilder,root.LoadnoteProgrammingProfile,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Phase,Profile,Readiness,Schedule,Intent){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const move=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
 const dates=(start,end)=>start<=end;
 function config(raw,source){
   const original=Phase.validate([source])[0],base=original.config;
   if(!raw||raw.version!==1||!Number.isInteger(raw.weeks)||raw.weeks<7||raw.weeks>52)throw Error('Choose 7–52 total weeks, including the mock-meet week');
   if(!Number.isInteger(raw.peakWeeks)||raw.peakWeeks<1||raw.peakWeeks>4||!Number.isInteger(raw.taperWeeks)||raw.taperWeeks<1||raw.taperWeeks>2)throw Error('Choose 1–4 peak weeks and 1–2 taper weeks');
   const baseWeeks=raw.weeks-raw.peakWeeks-raw.taperWeeks-1;
   if(baseWeeks<4)throw Error('Reserve at least two accumulation weeks and two strength weeks before peaking');
   const accumulationWeeks=Math.max(2,Math.min(baseWeeks-2,Math.round(baseWeeks*.55))),strengthWeeks=baseWeeks-accumulationWeeks;
   const meetWeekStart=move(base.startDate,(raw.weeks-1)*7),meetDate=raw.meetDate;
   if(!Schedule.date(meetDate)||meetDate<meetWeekStart||meetDate>move(meetWeekStart,6)||![0,6].includes(new Date(meetDate+'T12:00:00Z').getUTCDay()))throw Error('Mock meet must be Saturday or Sunday of the final program week');
   if(meetDate<move(base.startDate,6))throw Error('Mock meet is before the base sequence');
   return {version:1,sourceProgramId:original.id,weeks:raw.weeks,peakWeeks:raw.peakWeeks,taperWeeks:raw.taperWeeks,meetDate,accumulationWeeks,strengthWeeks,startDate:base.startDate};
 }
 function build(source,raw){
   const sourceRecord=Phase.validate([source])[0],c=config(raw,sourceRecord),base=sourceRecord.config;
   const prototypes=Phase.build({...base,phases:[{type:'accumulation',weeks:Math.min(c.accumulationWeeks,6)},{type:'strength',weeks:Math.min(c.strengthWeeks,6)},{type:'deload',weeks:1}]});
   const warnings=['Original reviewed lift identities, variations, working-set counts, days and explicit training maxes are retained in the base weeks.','Weeks beyond the six-week phase engine window hold its last supported prescription; there is no indefinite automatic intensity increase.','Peak and taper examples use competition exercises only. They do not infer readiness for heavy singles, meet attempts or recovery.','Mock-meet day is a dated event marker, not an automatically selected attempt prescription or scheduled training workout.','Each Calendar session requires separate approval through the cycle scheduling action. Future revisions remain separate from this saved original.'];
   const parts=[['accumulation',c.accumulationWeeks],['strength',c.strengthWeeks],['peaking',c.peakWeeks],['taper',c.taperWeeks],['mock-meet',1]];
   const sessions=[],weekly=[];let week=0;
   const floor=(tm,pct)=>{const w=Math.round(Math.floor((tm*pct/100+1e-9)/base.incrementKg)*base.incrementKg*100)/100;if(w<=0)throw Error('Load increment is too large for a selected max');return w;};
   for(const [phase,length] of parts)for(let pw=1;pw<=length;pw++){
     week++;
     const startDate=move(base.startDate,(week-1)*7),endDate=move(startDate,6),rows=[];
     if(phase==='accumulation'||phase==='strength'){
       const templateWeek=Math.min(pw,6),template=prototypes.sessions.filter(s=>s.phase===phase&&s.phaseWeek===Math.min(templateWeek,phase==='accumulation'?Math.min(c.accumulationWeeks,6):Math.min(c.strengthWeeks,6)));
       for(const item of template){const day=base.days.find(d=>item.key.endsWith('d'+d));rows.push({...copy(item),key:'w'+week+'d'+day,date:move(startDate,day),week,phase,phaseWeek:pw,name:'Week '+week+' · '+phase+' · Day '+(day+1)});}
     }else if(phase!=='mock-meet'){
       for(const day of base.days){
         const exercises=[];
         for(const lift of Phase.LIFTS){const l=base.lifts[lift],exp=l.exposures.find(e=>e.day===day&&e.role==='primary');if(!exp)continue;
           const pct=phase==='taper'?60:Math.min(80,75+(pw-1)*5);
           const sets=Array.from({length:phase==='taper'?1:Math.min(2,l.sets)},()=>({weight:floor(l.trainingMaxKg,pct),reps:phase==='taper'?3:2,targetRpe:phase==='taper'?6:8}));
           exercises.push({lift,exerciseId:l.exerciseId,name:l.name,type:'strength',trackBy:'reps',role:'primary',format:'straight',trainingMaxKg:l.trainingMaxKg,percentOfTrainingMax:pct,purpose:'Competition-lift practice · reviewed meet-cycle example',sets});
         }
         if(!exercises.length)continue;
         const estimatedMinutes=15+exercises.reduce((n,e)=>n+6*e.sets.length,0)+Math.max(0,exercises.length-1)*5;
         if(estimatedMinutes>base.sessionMinutes)throw Error('Peak or taper session exceeds the selected time budget');
         rows.push({key:'w'+week+'d'+day,date:move(startDate,day),week,phase,phaseWeek:pw,name:'Week '+week+' · '+phase+' · Day '+(day+1),estimatedMinutes,exercises});
       }
     }
     sessions.push(...rows);
     weekly.push({week,phase,phaseWeek:pw,startDate,endDate,meetDate:phase==='mock-meet'?c.meetDate:null,sessionCount:rows.length,lifts:Object.fromEntries(Phase.LIFTS.map(lift=>{const entries=rows.flatMap(s=>s.exercises.filter(e=>e.lift===lift));return [lift,{exposures:entries.length,sets:entries.reduce((n,e)=>n+e.sets.length,0),volumeKg:Math.round(entries.reduce((n,e)=>n+e.sets.reduce((sum,set)=>sum+set.weight*set.reps,0),0)*100)/100}];}))});
   }
   if(c.accumulationWeeks>6||c.strengthWeeks>6)warnings.push('An extended phase exceeds six progressive weeks; its final supported training-max target repeats until a reviewed adjustment.');
   if(sourceRecord.scheduledAt)warnings.push('The source phase program is already scheduled; its Calendar sessions must not overlap this new cycle.');
   return {version:1,config:c,sourceProgram:copy(sourceRecord),sessions,weekly,warnings};
 }
 function prepare(state,source,raw,{asOf,now=new Date().toISOString()}={}){
   if(!Schedule.date(asOf)||!iso(now)||now.slice(0,10)<asOf)throw Error('Choose a valid current review date');
   const result=build(source,raw),c=result.config,base=result.sourceProgram.config,cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
   if(c.startDate<asOf)throw Error('Start the cycle today or later');
   const profile=Profile.current(state.programmingProfiles||[],cutoff);if(!profile)throw Error('Create a programming profile first');
   const p=profile.context;
   if(!['strength','general','meet'].includes(p.goal)||p.consistency==='returning')throw Error('Choose a suitable strength, general powerlifting or meet preparation profile');
   if(base.days.some(day=>!p.availableDays.includes(day))||base.sessionMinutes>p.sessionMinutes||!['barbell','plates','rack','bench'].every(e=>p.equipment.includes(e)))throw Error('Cycle exceeds available days, equipment or time budget');
   if(p.eventDate&&p.eventDate!==c.meetDate)throw Error('Mock-meet date differs from the profile event date; confirm or update your profile');
   const roles=Readiness.list(state.exerciseRoles||[],cutoff),snapshot=[];
   for(const lift of Phase.LIFTS){
     const l=base.lifts[lift],matches=roles.filter(r=>r.role==='competition'&&r.competitionLift===lift);
     if(matches.length!==1||matches[0].exerciseId!==l.exerciseId)throw Error('Confirm the current competition '+lift+' mapping in Decisions');
     for(const [exercise,role] of [[l,'competition'],...(l.variation?[[l.variation,'close-variation']]:[])]){
       if(p.avoidedExerciseIds.includes(exercise.exerciseId))throw Error('A selected exercise is marked avoided');
       const found=roles.find(r=>r.exerciseId===exercise.exerciseId&&r.competitionLift===lift&&r.role===role),item=(state.exerciseCatalog||[]).find(e=>e.id===exercise.exerciseId);
       if(!found||item?.name!==exercise.name)throw Error('Review changed exercise names and role mappings before generating');
       snapshot.push(copy(found));
     }
   }
   const existing=Schedule.list(state.scheduledSessions||[],cutoff).filter(s=>s.status==='scheduled'&&s.date>=c.startDate&&s.date<=c.meetDate);
   if(existing.length)result.warnings.push(existing.length+' existing Calendar session(s) fall within this proposed cycle; conflicts must be resolved before scheduling.');
   if(result.weekly.some(w=>w.phase==='mock-meet'&&w.sessionCount))throw Error('Mock meet must not receive inferred training attempts');
   return {...result,profileSnapshot:copy(profile),roleSnapshot:snapshot};
 }
 function validate(records){
   if(!Array.isArray(records)||records.length>40)throw Error('Invalid meet cycles');
   const ids=new Set();return records.map(r=>{
     if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||!iso(r.createdAt)||r.review?.confirmed!==true||r.review.recordedAt!==r.createdAt||typeof r.review.notes!=='string'||r.review.notes.length>1000)throw Error('Invalid reviewed meet cycle');
     ids.add(r.id);
     const built=build(r.sourceProgram,r.config);
     if(JSON.stringify(built.sessions)!==JSON.stringify(r.sessions)||JSON.stringify(built.weekly)!==JSON.stringify(r.weekly))throw Error('Meet cycle differs from the approved original');
     if(r.profileSnapshot&&Profile.validate([r.profileSnapshot])[0].recordedAt>r.createdAt)throw Error('Profile was not known at approval');
     if(!Array.isArray(r.roleSnapshot)||r.roleSnapshot.some(role=>role.updatedAt>r.createdAt))throw Error('Invalid competition exercise snapshot');
     if(r.scheduledAt!=null&&(!iso(r.scheduledAt)||r.scheduledAt<r.createdAt))throw Error('Invalid scheduling timestamp');
     return copy(r);
   });
 }
 function save(state,proposal,{confirmed=false,notes=''}={}, {asOf,now=new Date().toISOString(),id=Core.createId()}={}){
   if(!confirmed||typeof notes!=='string'||notes.length>1000)throw Error('Review and approve the full cycle before saving');
   const fresh=prepare(state,proposal.sourceProgram,proposal.config,{asOf,now});
   if(JSON.stringify(fresh)!==JSON.stringify(proposal))throw Error('Training context, dates or Calendar evidence changed; regenerate the cycle');
   const row={...copy(fresh),id,createdAt:now,review:{confirmed:true,recordedAt:now,notes:notes.trim()},scheduledAt:null};
   return {...state,meetCycles:validate([...(state.meetCycles||[]),row])};
 }
 function schedule(state,id,{asOf,now=new Date().toISOString()}={}){
   if(!Schedule.date(asOf)||!iso(now)||now.slice(0,10)<asOf)throw Error('Choose a valid scheduling date');
   const all=validate(state.meetCycles||[]),record=all.find(r=>r.id===id);if(!record||record.scheduledAt)throw Error('Reviewed meet cycle unavailable or already scheduled');
   const fresh=prepare(state,record.sourceProgram,record.config,{asOf,now});
   if(JSON.stringify(fresh.profileSnapshot)!==JSON.stringify(record.profileSnapshot)||JSON.stringify(fresh.roleSnapshot)!==JSON.stringify(record.roleSnapshot))throw Error('Profile or exercise roles changed; review a fresh cycle');
   const scheduled=Schedule.list(state.scheduledSessions||[]);
   if(scheduled.some(s=>s.status==='scheduled'&&s.date>=record.config.startDate&&s.date<=record.config.meetDate))throw Error('Calendar conflict: resolve existing sessions before scheduling the meet cycle');
   if((state.meetCycles||[]).some(r=>r.id!==id&&r.scheduledAt&&r.config.startDate<=record.config.meetDate&&r.config.meetDate>=record.config.startDate))throw Error('An existing scheduled meet cycle overlaps this cycle');
   let sessions=state.scheduledSessions||[];
   for(const s of record.sessions){
     const plan=Intent.createPrescription(s.exercises,{type:'program',referenceId:id,label:record.sourceProgram.config.name+' · '+s.name},now);
     sessions=Schedule.create(sessions,{name:record.sourceProgram.config.name+' · '+s.name,date:s.date,role:s.phase==='taper'?'deload':'mixed',goal:record.sourceProgram.config.name,prescription:plan},{id:'meet:'+id+':'+s.key,now});
   }
   record.scheduledAt=now;
   return {...state,meetCycles:validate(all),scheduledSessions:sessions};
 }
 return {config,build,prepare,validate,save,schedule};
});
