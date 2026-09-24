(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./programming-profile'),require('./decision-readiness'),require('./schedule'),require('./session-intent'));
  else root.LoadnotePhaseBuilder=factory(root.LoadnoteCore,root.LoadnoteProgrammingProfile,root.LoadnoteReadiness,root.LoadnoteSchedule,root.LoadnoteIntent);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Profile,Readiness,Schedule,Intent){
  'use strict';
  const LIFTS=['squat','bench','deadlift'],TYPES=['accumulation','strength','deload'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const move=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  function exercise(raw){if(!raw||typeof raw.exerciseId!=='string'||!raw.exerciseId||raw.exerciseId.length>160||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>160||!Number.isFinite(raw.trainingMaxKg)||raw.trainingMaxKg<10||raw.trainingMaxKg>1000)throw Error('Every selected exercise needs an identity and explicit 10–1000 kg training max');return {exerciseId:raw.exerciseId,name:raw.name.trim(),trainingMaxKg:raw.trainingMaxKg};}
  function config(raw){
    if(!raw||raw.version!==1||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>100||!Schedule.date(raw.startDate)||new Date(raw.startDate+'T12:00:00Z').getUTCDay()!==1)throw Error('Choose a name and Monday start date');
    const days=raw.days;if(!Array.isArray(days)||days.length<2||days.length>5||days.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(days).size!==days.length)throw Error('Choose 2–5 distinct training days');
    if(!Number.isInteger(raw.sessionMinutes)||raw.sessionMinutes<30||raw.sessionMinutes>240||!Number.isFinite(raw.incrementKg)||raw.incrementKg<.1||raw.incrementKg>10)throw Error('Choose 30–240 minutes and a 0.1–10 kg load increment');
    if(!Array.isArray(raw.phases)||raw.phases.length!==3||raw.phases.some((p,i)=>p.type!==TYPES[i]||!Number.isInteger(p.weeks)||p.weeks<(i===2?1:2)||p.weeks>(i===2?1:6)))throw Error('Use accumulation (2–6 weeks), strength (2–6 weeks), then one deload week');
    const lifts={},used=new Set(),exerciseIds=new Set();
    for(const lift of LIFTS){
      const v=raw.lifts?.[lift],main=exercise(v);if(exerciseIds.has(main.exerciseId))throw Error('Competition lifts need distinct identities');exerciseIds.add(main.exerciseId);
      if(!Number.isInteger(v.sets)||v.sets<2||v.sets>4||!Number.isFinite(v.stepPct)||v.stepPct<0||v.stepPct>2.5)throw Error('Choose 2–4 sets and 0–2.5 percentage-point steps per lift');
      if(!Array.isArray(v.exposures)||v.exposures.length<1||v.exposures.length>3||v.exposures.some(e=>!days.includes(e.day)||!['primary','light','variation'].includes(e.role)||!['straight','top-backoff'].includes(e.format))||new Set(v.exposures.map(e=>e.day)).size!==v.exposures.length||v.exposures.filter(e=>e.role==='primary').length!==1)throw Error('Each lift needs exactly one primary exposure and up to two light/variation exposures on distinct selected days');
      let variation=null;if(v.exposures.some(e=>e.role==='variation')){variation=exercise(v.variation);if(variation.exerciseId===main.exerciseId||v.variationEquipmentConfirmed!==true)throw Error('Select a distinct variation, its own training max, and confirm equipment access');}
      v.exposures.forEach(e=>used.add(e.day));lifts[lift]={...main,sets:v.sets,stepPct:v.stepPct,variation,variationEquipmentConfirmed:!!variation,exposures:v.exposures.map(e=>({day:e.day,role:e.role,format:e.format})).sort((a,b)=>a.day-b.day)};
    }
    const all=[...exerciseIds,...LIFTS.map(l=>lifts[l].variation?.exerciseId).filter(Boolean)];if(new Set(all).size!==all.length)throw Error('Do not reuse an exercise identity across lift roles');
    if(days.some(d=>!used.has(d)))throw Error('Each selected training day needs at least one lift exposure');
    return {version:1,name:raw.name.trim(),startDate:raw.startDate,days:[...days].sort((a,b)=>a-b),sessionMinutes:raw.sessionMinutes,incrementKg:raw.incrementKg,phases:raw.phases.map(p=>({type:p.type,weeks:p.weeks})),lifts};
  }
  function build(raw){
    const c=config(raw),sessions=[],weekly=[],warnings=['Rule-based phase proposal, not an individually validated coaching prescription.','Percentages refer to separately chosen training maxes, not measured 1RMs or estimated capacity.','RPE values are caps, not predictions. Review actual effort before progressing; no increase is automatically earned.','No meet taper, max test, attempt selection or automatic accessory prescription is included.','Existing four-week review/adjustment rules do not apply to phase programs. Review these manually in Calendar and training history.'];let week=0;
    const rounded=(tm,pct)=>{const weight=Math.round(Math.floor((tm*pct/100+1e-9)/c.incrementKg)*c.incrementKg*100)/100;if(!(weight>0))throw Error('Load increment is too large for a selected training max');return weight;};
    for(const phase of c.phases)for(let pw=0;pw<phase.weeks;pw++){
      week++;const metrics=Object.fromEntries(LIFTS.map(l=>[l,{sets:0,volumeKg:0}]));
      for(const day of c.days){
        const exercises=[];
        for(const lift of LIFTS){const l=c.lifts[lift],exposure=l.exposures.find(e=>e.day===day);if(!exposure)continue;
          const selected=exposure.role==='variation'?l.variation:l,deload=phase.type==='deload';
          const pct=(deload?60:phase.type==='accumulation'?65+pw*l.stepPct:75+pw*l.stepPct)-(exposure.role==='light'?7.5:0);
          if(pct>85)throw Error('Progression exceeds the supported 85% training-max ceiling. Reduce the step or phase duration.');
          const count=deload?Math.max(1,Math.ceil(l.sets/2)):l.sets,reps=phase.type==='accumulation'?5:3,cap=(deload?6:phase.type==='accumulation'?7:8)-(exposure.role==='light'&&!deload?1:0);
          const sets=Array.from({length:count},(_,i)=>{const backoff=!deload&&exposure.format==='top-backoff'&&i>0;return {weight:rounded(selected.trainingMaxKg,pct-(backoff?7.5:0)),reps:backoff&&phase.type==='strength'?5:reps,targetRpe:cap-(backoff?1:0)};});
          exercises.push({lift,exerciseId:selected.exerciseId,name:selected.name,type:'strength',trackBy:'reps',role:exposure.role,format:deload?'straight':exposure.format,trainingMaxKg:selected.trainingMaxKg,percentOfTrainingMax:pct,purpose:exposure.role==='primary'?'Competition-lift practice':exposure.role==='light'?'Lower-load competition practice':'Athlete-selected variation; no weakness diagnosis',sets});
          metrics[lift].sets+=sets.length;metrics[lift].volumeKg+=sets.reduce((n,s)=>n+s.weight*s.reps,0);
        }
        const estimatedMinutes=15+exercises.reduce((n,e)=>n+6*e.sets.length,0)+Math.max(0,exercises.length-1)*5;
        if(estimatedMinutes>c.sessionMinutes)throw Error(`Week ${week}, day ${day+1} needs about ${estimatedMinutes} minutes. Reduce sets, redistribute exposures or review your time budget.`);
        sessions.push({key:`w${week}d${day}`,date:move(c.startDate,(week-1)*7+day),week,phase:phase.type,phaseWeek:pw+1,name:`Week ${week} · ${phase.type} · Day ${day+1}`,estimatedMinutes,exercises});
      }
      for(const lift of LIFTS){metrics[lift].volumeKg=Math.round(metrics[lift].volumeKg*100)/100;const previous=weekly.at(-1)?.lifts[lift];if(previous&&metrics[lift].volumeKg>previous.volumeKg*1.2)warnings.push(`Week ${week} ${lift}: prescribed tonnage rises more than 20% from the prior week. Review the transition; tonnage is not capacity or recovery.`);}
      weekly.push({week,phase:phase.type,lifts:metrics});
    }
    for(const lift of LIFTS){const d=c.lifts[lift].exposures.map(e=>e.day);if(d.some((day,i)=>i&&day-d[i-1]===1)||d.length>1&&d[0]+7-d.at(-1)===1)warnings.push(`${lift}: adjacent-day exposures need manual recovery review.`);}
    warnings.push('Time estimates use 15 minutes preparation, 6 minutes per working set and 5 minutes per exercise transition; actual needs vary.');
    return {config:c,sessions,weekly,warnings};
  }
  function constraints(profile,c){
    if(!profile?.context)throw Error('Create a programming profile before using the phase builder');const p=profile.context;
    Profile.assess(profile,{...c,structure:'strength'});
    if(LIFTS.some(l=>c.lifts[l].variation&&p.avoidedExerciseIds.includes(c.lifts[l].variation.exerciseId)))throw Error('A selected variation is marked avoided in your profile');
    const weeks=c.phases.reduce((n,p)=>n+p.weeks,0);if(p.eventDate&&p.eventDate<=move(c.startDate,weeks*7+6))throw Error('This sequence is too close to the meet date. No meet peak is generated.');
  }
  function prepare(state,raw,{asOf,now=new Date().toISOString()}={}){
    if(!Schedule.date(asOf)||!iso(now))throw Error('A valid current date is required');const result=build(raw),c=result.config;if(c.startDate<asOf)throw Error('Choose a start date today or later');const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z';
    const profileSnapshot=Profile.current(state.programmingProfiles||[],cutoff);constraints(profileSnapshot,c);
    const roles=Readiness.list(state.exerciseRoles||[],cutoff),roleSnapshot=[];
    for(const lift of LIFTS){const l=c.lifts[lift],primary=roles.filter(r=>r.role==='competition'&&r.competitionLift===lift);if(primary.length!==1||primary[0].exerciseId!==l.exerciseId)throw Error('Confirm exactly one competition exercise per lift in Decisions');
      for(const [e,role]of [[l,'competition'],...(l.variation?[[l.variation,'close-variation']]:[])]){const mapping=roles.find(r=>r.exerciseId===e.exerciseId&&r.role===role&&r.competitionLift===lift),entry=(state.exerciseCatalog||[]).find(x=>x.id===e.exerciseId);if(!mapping||entry?.name!==e.name)throw Error('Exercise identity or role changed. Review the mapping and rebuild.');roleSnapshot.push(clone(mapping));}
    }
    const used=new Set(result.sessions.flatMap(s=>s.exercises.map(e=>e.exerciseId)));if(profileSnapshot.context.preferredExerciseIds.some(id=>!used.has(id)))result.warnings.push('Some preferred exercises are not selected; no accessories or substitutions are added automatically.');
    const recent=Readiness.workoutsAt(state,asOf,cutoff,false).workouts.filter(w=>iso(w.createdAt)&&w.createdAt<=cutoff&&w.date>=move(asOf,-27));
    for(const lift of LIFTS){const ids=new Set([c.lifts[lift].exerciseId,c.lifts[lift].variation?.exerciseId].filter(Boolean));const observations=recent.filter(w=>(w.exercises||[]).some(e=>ids.has(e.exerciseId)));const dates=[...new Set(observations.map(w=>w.date))].sort();if(dates.length<3||dates.at(-1)<move(dates[0],14)){result.warnings.push(`${lift}: not enough dated recent history to compare starting workload.`);continue;}
      const count=observations.reduce((n,w)=>n+(w.exercises||[]).filter(e=>ids.has(e.exerciseId)&&e.type!=='cardio'&&e.trackBy!=='duration').reduce((m,e)=>m+(e.sets||[]).filter(s=>Number.isFinite(s.weight)&&s.weight>0&&Number.isInteger(s.reps)&&s.reps>0).length,0),0),average=count/4;
      if(average>0&&result.weekly[0].lifts[lift].sets>average*1.25)result.warnings.push(`${lift}: first-week sets exceed the recorded 28-day weekly average by over 25%. History may be incomplete; review this workload, not a presumed capacity limit.`);
    }
    return {...result,profileSnapshot,roleSnapshot};
  }
  function validate(records){
    if(!Array.isArray(records)||records.length>100)throw Error('Invalid phase programs');const ids=new Set();return records.map(r=>{
      if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||!iso(r.createdAt)||!r.review||r.review.confirmed!==true||r.review.recordedAt!==r.createdAt||typeof r.review.notes!=='string'||r.review.notes.length>1000||!Array.isArray(r.roleSnapshot))throw Error('Invalid phase-program review');ids.add(r.id);
      const built=build(r.config);if(JSON.stringify(r.sessions)!==JSON.stringify(built.sessions))throw Error('Phase sessions differ from the reviewed configuration');const profile=Profile.validate([r.profileSnapshot])[0];if(profile.recordedAt>r.createdAt)throw Error('Profile was not known at review');constraints(profile,built.config);
      if(r.scheduledAt!=null&&(!iso(r.scheduledAt)||r.scheduledAt<r.createdAt))throw Error('Invalid phase scheduling time');
      if(!Array.isArray(r.warnings)||r.warnings.some(w=>typeof w!=='string'||w.length>1000)||r.warnings.length>100)throw Error('Invalid phase quality report');
      for(const role of r.roleSnapshot){Readiness.context(role);if(!iso(role.updatedAt)||role.updatedAt>r.createdAt)throw Error('Invalid role snapshot');}
      const expected=LIFTS.flatMap(l=>[{exerciseId:built.config.lifts[l].exerciseId,role:'competition',competitionLift:l},...(built.config.lifts[l].variation?[{exerciseId:built.config.lifts[l].variation.exerciseId,role:'close-variation',competitionLift:l}]:[])]);
      if(r.roleSnapshot.length!==expected.length||expected.some(e=>r.roleSnapshot.filter(role=>role.exerciseId===e.exerciseId&&role.role===e.role&&role.competitionLift===e.competitionLift).length!==1))throw Error('Incomplete or conflicting phase exercise-role snapshot');
      return {version:1,id:r.id,createdAt:r.createdAt,config:built.config,sessions:built.sessions,profileSnapshot:profile,roleSnapshot:clone(r.roleSnapshot),warnings:[...r.warnings],review:clone(r.review),scheduledAt:r.scheduledAt||null};
    });
  }
  function save(state,proposal,{confirmed=false,notes=''}={}, {asOf,now=new Date().toISOString(),id=Core.createId()}={}){
    if(!confirmed||typeof notes!=='string'||notes.length>1000)throw Error('Review every phase and quality warning before saving');const fresh=prepare(state,proposal.config,{asOf,now});if(JSON.stringify(fresh)!==JSON.stringify(proposal))throw Error('Profile, exercise context or recent evidence changed; generate a fresh preview');
    const record={version:1,id,createdAt:now,config:fresh.config,sessions:fresh.sessions,profileSnapshot:fresh.profileSnapshot,roleSnapshot:fresh.roleSnapshot,warnings:fresh.warnings,review:{confirmed:true,recordedAt:now,notes:notes.trim()},scheduledAt:null};
    return {...state,phasePrograms:validate([...(state.phasePrograms||[]),record])};
  }
  function schedule(state,id,{asOf,now=new Date().toISOString()}={}){
    const records=validate(state.phasePrograms||[]),record=records.find(r=>r.id===id);if(!record||record.scheduledAt)throw Error('Phase program unavailable or already scheduled');const fresh=prepare(state,record.config,{asOf,now});
    if(JSON.stringify(fresh.profileSnapshot)!==JSON.stringify(record.profileSnapshot)||JSON.stringify(fresh.roleSnapshot)!==JSON.stringify(record.roleSnapshot)||JSON.stringify(fresh.warnings)!==JSON.stringify(record.warnings))throw Error('Programming context or evidence changed since review; build and review a fresh proposal');
    const existing=Schedule.list(state.scheduledSessions||[]);if(existing.some(s=>s.status==='scheduled'&&record.sessions.some(p=>p.date===s.date)))throw Error('Calendar conflict: resolve existing scheduled dates first');
    let sessions=state.scheduledSessions||[];for(const s of record.sessions)sessions=Schedule.create(sessions,{name:record.config.name+' · '+s.name,date:s.date,role:s.phase==='deload'?'deload':'mixed',goal:record.config.name,prescription:Intent.createPrescription(s.exercises,{type:'program',referenceId:record.id,label:record.config.name+' · '+s.name},now)},{id:`phase:${record.id}:${s.key}`,now});
    record.scheduledAt=now;return {...state,phasePrograms:validate(records),scheduledSessions:sessions};
  }
  return {LIFTS,TYPES,config,build,prepare,validate,save,schedule};
});
