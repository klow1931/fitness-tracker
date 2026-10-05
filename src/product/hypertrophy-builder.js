/* Reviewed hypertrophy prescriptions. No estimated maxes or automatic adaptations. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./athlete-goals'),require('./programming-profile'),require('./schedule'),require('./session-intent'),require('./training-knowledge'),require('./muscle-workload-review'),require('./program-cancellation'));else root.LoadnoteHypertrophyBuilder=factory(root.LoadnoteCore,root.LoadnoteGoals,root.LoadnoteProgrammingProfile,root.LoadnoteSchedule,root.LoadnoteIntent,root.LoadnoteTrainingKnowledge,root.LoadnoteMuscleReview,root.LoadnoteProgramCancellation);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Goals,Profile,Schedule,Intent,K,W,Cancellation){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const integer=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,move=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
 const EQUIPMENT={barbell:'Barbell',dumbbells:'Dumbbells',cable:'Cable',machine:'Machine',bodyweight:'Bodyweight'};
 const CONVENTIONS={total:'Total external load','per-hand':'Load per hand',stack:'Machine / cable displayed load',added:'Added bodyweight load'};
 const eligibleGoal=g=>g?.status==='active'&&(g.trainingContext?.primary==='hypertrophy'||g.trainingContext?.secondary?.includes('hypertrophy'));
 function config(raw){
  if(!raw||raw.version!==1||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>120||!Schedule.date(raw.startDate)||new Date(raw.startDate+'T12:00:00Z').getUTCDay()!==1||!integer(raw.weeks,1,24))throw Error('Choose a name, Monday start and 1–24 weeks (software limits)');
  if(!Array.isArray(raw.days)||!raw.days.length||raw.days.length>6||new Set(raw.days).size!==raw.days.length||raw.days.some(d=>!integer(d,0,6))||!integer(raw.sessionMinutes,30,240))throw Error('Choose 1–6 distinct days and a 30–240 minute budget');
  if(!Array.isArray(raw.deloadWeeks)||new Set(raw.deloadWeeks).size!==raw.deloadWeeks.length||raw.deloadWeeks.length>=raw.weeks||raw.deloadWeeks.some(w=>!integer(w,1,raw.weeks)))throw Error('Choose valid lower-volume weeks and retain at least one normal week');
  if(typeof raw.sportCoordinationConfirmed!=='boolean'||!Array.isArray(raw.slots)||!raw.slots.length||raw.slots.length>24)throw Error('Choose exercises and explicitly review sport coordination');
  const seen=new Set(),identities=new Map(),counts={};let sets=0;
  const slots=raw.slots.map(s=>{
   if(!s||!raw.days.includes(s.day)||typeof s.exerciseId!=='string'||!s.exerciseId||s.exerciseId.length>160||typeof s.name!=='string'||!s.name.trim()||s.name.length>160||!Object.hasOwn(EQUIPMENT,s.equipment)||s.equipmentConfirmed!==true||!Object.hasOwn(CONVENTIONS,s.loadConvention))throw Error('Confirm exercise identities, equipment and load conventions for each day');
   if(s.equipment==='bodyweight'&&s.loadConvention!=='added'||s.equipment==='dumbbells'&&!['total','per-hand'].includes(s.loadConvention)||['machine','cable'].includes(s.equipment)&&s.loadConvention!=='stack'||s.equipment==='barbell'&&s.loadConvention!=='total')throw Error('Choose a compatible load convention; do not interchange total, per-hand and stack loads');
   const key=s.day+':'+s.exerciseId;if(seen.has(key))throw Error('Do not duplicate an exercise identity in the same session');seen.add(key);counts[s.day]=(counts[s.day]||0)+1;if(counts[s.day]>8)throw Error('At most eight exercises per day in this builder');
   const muscles=K.mapping(s.muscles),identity={name:s.name.trim(),muscles,loadConvention:s.loadConvention,equipment:s.equipment};if(identities.has(s.exerciseId)&&!same(identities.get(s.exerciseId),identity))throw Error('Use consistent mapping, equipment and load convention for the same exercise identity');identities.set(s.exerciseId,identity);if(muscles?.mode!=='resistance')throw Error('Confirm resistance-training muscle mappings first; technical weightlifting is not a hypertrophy slot');
   if(!integer(s.sets,1,6)||!integer(s.minReps,6,20)||!integer(s.maxReps,s.minReps,20)||!Number.isFinite(s.weightKg)||s.weightKg<0||s.weightKg>1000||s.weightKg===0&&s.equipment!=='bodyweight'||!Number.isFinite(s.incrementKg)||s.incrementKg<.1||s.incrementKg>20||!Number.isFinite(s.targetRpe)||s.targetRpe<6||s.targetRpe>9||!integer(s.restSeconds,60,600))throw Error('Choose 1–6 sets, 6–20 reps, explicit load/increment, RPE cap 6–9 and 60–600 second rest (software bounds, not universal doses)');
   if(typeof s.purpose!=='string'||!s.purpose.trim()||s.purpose.length>300)throw Error('Explain why each exercise is selected; do not infer a weakness');
   if(Math.round(s.weightKg*100)===0&&s.equipment!=='bodyweight')throw Error('Starting load rounds to zero; enter a usable explicit load');
   sets+=s.sets;if(sets>120)throw Error('Weekly pilot ceiling is 120 sets, not a recommended training dose');
   return {day:s.day,exerciseId:s.exerciseId,name:s.name.trim(),muscles,equipment:s.equipment,equipmentConfirmed:true,loadConvention:s.loadConvention,sets:s.sets,minReps:s.minReps,maxReps:s.maxReps,weightKg:Math.round(s.weightKg*100)/100,incrementKg:s.incrementKg,targetRpe:s.targetRpe,restSeconds:s.restSeconds,purpose:s.purpose.trim()};
  }).sort((a,b)=>a.day-b.day);
  if(raw.days.some(d=>!slots.some(s=>s.day===d)))throw Error('Every selected day needs at least one exercise');
  return {version:1,name:raw.name.trim(),startDate:raw.startDate,weeks:raw.weeks,days:[...raw.days].sort((a,b)=>a-b),sessionMinutes:raw.sessionMinutes,deloadWeeks:[...raw.deloadWeeks].sort((a,b)=>a-b),sportCoordinationConfirmed:raw.sportCoordinationConfirmed,slots};
 }
 function build(raw){
  const c=config(raw),sessions=[],weekly=[];
  for(let week=1;week<=c.weeks;week++){
   const deload=c.deloadWeeks.includes(week),phase=deload?'deload':'hypertrophy';
   for(const day of c.days){const exercises=c.slots.filter(s=>s.day===day).map(s=>({exerciseId:s.exerciseId,name:s.name,type:'strength',trackBy:'reps',role:'hypertrophy',format:'straight',restSeconds:s.restSeconds,loadConvention:s.loadConvention,repRange:{min:s.minReps,max:s.maxReps},purpose:s.purpose,progression:`Use ${s.minReps}–${s.maxReps} reps with recorded actual RPE at or below ${deload?Math.min(s.targetRpe,6):s.targetRpe}. Loads stay fixed. Review the chosen ${s.incrementKg} kg increment only after two comparable full sessions reach the top of the range with complete effort and reviewed tolerance/coverage. Never auto-apply.`,sets:Array.from({length:deload?Math.max(1,Math.ceil(s.sets/2)):s.sets},()=>({weight:s.weightKg,reps:s.minReps,minReps:s.minReps,maxReps:s.maxReps,targetRpe:deload?Math.min(s.targetRpe,6):s.targetRpe}))}));
    const estimatedMinutes=Math.ceil(10+exercises.reduce((n,e)=>n+3+e.sets.length*(1+e.restSeconds/60),0));if(estimatedMinutes>c.sessionMinutes)throw Error('Plan exceeds the time budget. Reduce work, adjust rest deliberately, or increase available time; sets are never silently removed');
    sessions.push({key:`w${week}d${day}`,date:move(c.startDate,(week-1)*7+day),week,phase,name:`Week ${week} · ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][day]}${deload?' · Lower-volume week':''}`,estimatedMinutes,exercises});
   }
   const catalog=[...new Map(c.slots.map(s=>[s.exerciseId,{id:s.exerciseId,muscles:s.muscles}])).values()];
   const workload=K.workload({exerciseCatalog:catalog,workouts:sessions.filter(s=>s.week===week).map(s=>({date:s.date,exercises:s.exercises}))},{asOf:move(c.startDate,week*7-1)});
   weekly.push({week,phase,from:move(c.startDate,(week-1)*7),through:move(c.startDate,week*7-1),groups:workload.groups});
  }
  return {config:c,sessions,weekly};
 }
 function context(state,c,goalId,{asOf}={}){
  const goal=Goals.list(state.athleteGoals||[]).find(g=>g.id===goalId);if(!eligibleGoal(goal))throw Error('Choose an active goal with a confirmed hypertrophy priority in Goals');
  if(!goal.availableDays.length||!goal.sessionMinutes||!goal.equipment.trim())throw Error('Confirm goal availability, time and actual equipment before building');
  if(c.days.some(d=>!goal.availableDays.includes(d))||c.sessionMinutes>goal.sessionMinutes)throw Error('Days or time exceed the selected athlete goal');
  const profile=Profile.current(state.programmingProfiles||[]),p=profile?.context,w=W.current(state.workloadProfiles||[]),wc=w?.context;
  if(p&&(c.days.some(d=>!p.availableDays.includes(d))||c.sessionMinutes>p.sessionMinutes))throw Error('Days or time exceed the programming profile');
  if(p&&(p.goal==='return'||p.consistency==='returning'))throw Error('Use a reviewed return/re-entry plan before this hypertrophy builder');
  if(['discomfort','needs-review'].includes(wc?.tolerance))throw Error('Reported tolerance requires review first; no hypertrophy prescription is proposed');
  const end=move(c.startDate,c.weeks*7-1),events=[goal.eventDate,p?.eventDate].filter(Boolean);if(events.some(d=>d>=asOf&&d<=move(end,7)))throw Error('An event is too close to or within this plan. Use its reviewed event program rather than adding a hypertrophy cycle');
  const t=goal.trainingContext,overlap=t.scheduleKnown&&c.days.some(d=>t.practiceDays.includes(d)||t.competitionDays.includes(d));
  if((overlap||t.restrictions)&&!c.sportCoordinationConfirmed)throw Error('Explicitly review sport overlap and narrative restrictions with the responsible coach/professional; this is not medical clearance');
  for(const s of c.slots){const e=state.exerciseCatalog?.find(e=>e.id===s.exerciseId);if(!e||e.name!==s.name||!same(K.mapping(e.muscles),s.muscles))throw Error('Exercise identity or confirmed muscle mapping changed; rebuild the preview');
   if(p?.avoidedExerciseIds.includes(s.exerciseId))throw Error('A selected exercise is marked avoided in the programming profile');
   if(s.equipment==='barbell'&&p&&!p.equipment.includes('barbell'))throw Error('Barbell equipment is unavailable in the programming profile');
   if([...s.muscles.primary,...s.muscles.secondary].some(m=>wc?.targets[m]?.restricted))throw Error('A mapped muscle is restricted; review that restriction before generating this work');
  }
  return {goalSnapshot:{id:goal.id,updatedAt:goal.updatedAt,context:Goals.context(goal)},profileSnapshot:profile,workloadSnapshot:w};
 }
 function prepare(state,raw,{goalId,asOf}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid preview date');const plan=build(raw),c=plan.config;if(c.startDate<asOf)throw Error('Choose a current or future Monday start');
  const snapshots=context(state,c,goalId,{asOf}),evidence=W.analyze(state,{asOf}),targets=snapshots.workloadSnapshot?.context.targets||{};
  const workloadComparison=plan.weekly.map(w=>({week:w.week,phase:w.phase,muscles:Object.entries(w.groups).filter(([m,g])=>g.direct||g.indirect||targets[m]).map(([muscle,g])=>({muscle,direct:g.direct,indirect:g.indirect,target:targets[muscle]||null,outside:!!targets[muscle]&&(g.direct<targets[muscle].min||g.direct>targets[muscle].max)}))}));
  const warnings=['Athlete-selected proposal, not an individually validated dose or a promise of growth. All bounds are software limits.','Starting loads and available increments are explicit inputs, never derived from 1RM or competition-lift estimates. Specify total, per-hand, stack or added load consistently.','Direct sets and indirect exposure stay separate. Muscle assignments are confirmed declarations, not measured stimulus.','Loads remain fixed across all weeks. Rep ranges and RPE caps require actual effort logging; if effort or technique deteriorates, reduce/defer work and review.','Lower-volume weeks halve sets (rounded up) and cap RPE at 6; starting loads stay fixed, so reduce them manually if needed to respect the cap.','Time uses 10 minutes warm-up, 3 minutes setup per movement and 1 minute plus the entered rest per set. It is an allowance, not a guarantee.','Program save does not schedule or activate it. Scheduling never replaces existing training.'];
  if(workloadComparison.some(w=>w.phase!=='deload'&&w.muscles.some(m=>m.outside)))warnings.push('Normal-week direct sets differ from a reviewed target range. Review the discrepancy; neither the program nor target is automatically changed.');
  if(snapshots.workloadSnapshot?.context.tolerance!=='tolerated')warnings.push('Recent tolerance is unknown. Review your actual training and limitations before accepting any dose.');
  if(!snapshots.goalSnapshot.context.trainingContext.scheduleKnown)warnings.push('Sport schedule is unknown; a gym plan does not account for unrecorded practices/games.');
  return {...plan,...snapshots,asOf,workloadComparison,currentWorkload:evidence.weeks.map(w=>({from:w.from,through:w.through,groups:w.actual.groups,coverage:w.coverage,unmapped:w.actual.unmappedSets,incomplete:w.actual.incompleteSets})),warnings,source:K.SOURCES.hypertrophy};
 }
 function validate(records){
  if(!Array.isArray(records)||records.length>200)throw Error('Invalid hypertrophy program collection');const ids=new Set();
  return records.map(r=>{if(!r||r.version!==1||typeof r.id!=='string'||!r.id||r.id.length>160||ids.has(r.id)||!iso(r.createdAt)||!iso(r.review?.recordedAt)||r.review.recordedAt!==r.createdAt||!['athlete','coach-reported'].includes(r.review.by)||typeof r.review.name!=='string'||r.review.name.length>120||r.review.by==='coach-reported'&&!r.review.name.trim()||typeof r.review.notes!=='string'||r.review.notes.length>1000||r.review.workloadConfirmed!==true)throw Error('Invalid hypertrophy review identity/history');ids.add(r.id);
   const plan=build(r.config);if(!same(plan.sessions,r.sessions)||!same(plan.weekly,r.weekly))throw Error('Hypertrophy sessions/workload do not match the reviewed configuration');
   if(!r.goalSnapshot||typeof r.goalSnapshot.id!=='string'||!iso(r.goalSnapshot.updatedAt)||r.goalSnapshot.updatedAt>r.createdAt||!eligibleGoal({...Goals.context(r.goalSnapshot.context),status:r.goalSnapshot.context.status}))throw Error('Invalid hypertrophy goal snapshot');
   if(r.profileSnapshot){Profile.validate([r.profileSnapshot]);if(!r.profileSnapshot.context||r.profileSnapshot.recordedAt>r.createdAt)throw Error('Invalid hypertrophy profile snapshot');}
   if(r.workloadSnapshot){W.validate([r.workloadSnapshot]);if(r.workloadSnapshot.recordedAt>r.createdAt)throw Error('Invalid hypertrophy workload snapshot');}
   if(r.scheduledAt!=null&&(!iso(r.scheduledAt)||r.scheduledAt<r.createdAt))throw Error('Invalid hypertrophy schedule time');
   return {version:1,id:r.id,createdAt:r.createdAt,...plan,goalSnapshot:clone(r.goalSnapshot),profileSnapshot:r.profileSnapshot?clone(r.profileSnapshot):null,workloadSnapshot:r.workloadSnapshot?clone(r.workloadSnapshot):null,review:clone(r.review),scheduledAt:r.scheduledAt||null};
  });
 }
 function save(state,proposal,review,{asOf,now=new Date().toISOString(),id=Core.createId()}={}){
  if(!iso(now)||review?.confirmed!==true||review?.workloadConfirmed!==true)throw Error('Review all weeks, workload, effort, restrictions and load conventions before saving');
  const fresh=prepare(state,proposal.config,{goalId:proposal.goalSnapshot?.id,asOf});if(!same(fresh,proposal))throw Error('Evidence, goal, mappings or profile changed. Generate and review a fresh preview');
  const r={version:1,id,createdAt:now,config:fresh.config,sessions:fresh.sessions,weekly:fresh.weekly,goalSnapshot:fresh.goalSnapshot,profileSnapshot:fresh.profileSnapshot,workloadSnapshot:fresh.workloadSnapshot,review:{by:review.by||'athlete',name:review.name||'',notes:review.notes||'',workloadConfirmed:true,recordedAt:now},scheduledAt:null};
  return {...state,hypertrophyPrograms:validate([...(state.hypertrophyPrograms||[]),r])};
 }
 function schedule(state,id,{asOf,now=new Date().toISOString(),draftOpen=false}={}){
  if(draftOpen)throw Error('Finish or clear the open workout draft before scheduling a new plan');if(!iso(now))throw Error('Invalid schedule time');
  const records=validate(state.hypertrophyPrograms||[]),r=records.find(r=>r.id===id);if(!r||r.scheduledAt)throw Error('Program unavailable or already scheduled');
  const fresh=prepare(state,r.config,{goalId:r.goalSnapshot.id,asOf});if(!same(fresh.goalSnapshot,r.goalSnapshot)||!same(fresh.profileSnapshot,r.profileSnapshot)||!same(fresh.workloadSnapshot,r.workloadSnapshot))throw Error('Reviewed context changed. Build and review a fresh proposal');
  const dates=new Set(r.sessions.map(s=>s.date)),end=move(r.config.startDate,r.config.weeks*7-1);
  if(Schedule.list(state.scheduledSessions||[]).some(s=>s.status==='scheduled'&&dates.has(s.date))||(state.workouts||[]).some(w=>dates.has(w.date)))throw Error('Calendar or logged-training conflict. Existing sessions/workouts are never replaced');
  const others=[...(state.hypertrophyPrograms||[]).filter(p=>!Cancellation.isCancelled(state,p.id,'hypertrophy-program')).filter(p=>p.id!==id),...(state.phasePrograms||[]).filter(p=>!Cancellation.isCancelled(state,p.id,'phase-program')),...(state.meetCycles||[]).filter(p=>!Cancellation.isCancelled(state,p.id,'meet-cycle')),...(state.sportPrograms||[]).filter(p=>!Cancellation.isCancelled(state,p.id,'sport-program'))];
  if(others.some(p=>p.scheduledAt&&p.config?.startDate<=end&&(p.config.meetDate||p.sessions?.at(-1)?.date||p.config.startDate)>=r.config.startDate))throw Error('Another reviewed program overlaps this cycle. Use its accessory workflow or resolve the overlap first');
  let sessions=state.scheduledSessions||[];const links=[];for(const s of r.sessions){const sid=`hypertrophy:${r.id}:${s.key}`;links.push(sid);sessions=Schedule.create(sessions,{name:r.config.name+' · '+s.name,date:s.date,role:s.phase==='deload'?'deload':'volume',goal:r.goalSnapshot.context.name,prescription:Intent.createPrescription(s.exercises,{type:'program',referenceId:r.id,label:r.config.name+' · '+s.name},now)},{id:sid,now});}
  const goal=Goals.list(state.athleteGoals||[]).find(g=>g.id===r.goalSnapshot.id),goals=Goals.upsert(state.athleteGoals||[],{...goal,sessionIds:[...new Set([...goal.sessionIds,...links])]},{id:goal.id,now});r.scheduledAt=now;
  return {...state,hypertrophyPrograms:validate(records),scheduledSessions:sessions,athleteGoals:goals};
 }
 function progression(state,id,{asOf}={}){
  if(!Schedule.date(asOf))throw Error('Choose a valid progression-review date');const r=validate(state.hypertrophyPrograms||[]).find(r=>r.id===id);if(!r||!r.scheduledAt)throw Error('Choose a scheduled hypertrophy program');
  const rows=Schedule.rows(state.scheduledSessions||[],state.workouts||[],{asOf}).filter(s=>s.id.startsWith('hypertrophy:'+id+':'));
  const wc=W.current(state.workloadProfiles||[])?.context,unresolved=rows.some(s=>s.date<=asOf&&s.state==='unconfirmed'),protectedWork=rows.some(s=>s.date>=asOf&&s.date<=move(asOf,7)&&s.role==='deload');let contextGap=false;
  try{const current=context(state,r.config,r.goalSnapshot.id,{asOf}),g=x=>{const y=clone(x);delete y.updatedAt;delete y.context.sessionIds;delete y.context.blockIds;return y;};contextGap=!same(g(current.goalSnapshot),g(r.goalSnapshot))||!same(current.profileSnapshot,r.profileSnapshot);}catch{contextGap=true;}
  const findings=r.config.slots.map(slot=>{
   const reasons=[],accepted=(state.coachingReviews||[]).filter(e=>e.kind==='proposal'&&e.response==='accepted'&&e.asOf<=asOf&&e.proposal.kind==='hypertrophy-load'&&e.proposal.programId===id&&e.proposal.exerciseId===slot.exerciseId&&e.proposal.changes.some(c=>c.sessionId.endsWith('d'+slot.day))).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
   let currentKg=slot.weightKg,revisionAt=r.scheduledAt,chainValid=true;
   for(const e of accepted){if(e.proposal.fromKg!==currentKg||e.proposal.toKg!==Math.round((currentKg+slot.incrementKg)*100)/100||e.proposal.loadConvention!==slot.loadConvention){chainValid=false;break;}currentKg=e.proposal.toKg;revisionAt=e.createdAt;}
   const expected=exercise=>{if(!exercise)return false;const original=r.sessions.find(s=>s.phase!=='deload'&&s.key.endsWith('d'+slot.day))?.exercises.find(e=>e.exerciseId===slot.exerciseId),a=Intent.createPrescription([original]).plannedExercises[0],b=clone(exercise);a.sets.forEach(s=>s.weight=currentKg);return same(a,b);};
   const relevant=rows.filter(s=>s.role!=='deload'&&s.id.endsWith('d'+slot.day)),future=relevant.filter(s=>s.date>asOf&&s.state==='scheduled');
   const approvedRow=s=>{
    if(s.revisionAt<revisionAt||s.prescription?.capturedAt!==s.revisionAt||s.prescription.source?.referenceId!==id||!expected(s.prescription.plannedExercises.find(e=>e.exerciseId===slot.exerciseId)))return false;
    const history=(state.scheduledSessions||[]).find(row=>row.id===s.id)?.revisions||[];
    // An approval for another slot also revises the shared session prescription.
    // Accept only a fully attributable revision chain; manual revisions need review.
    return history[0]?.recordedAt===r.scheduledAt&&history.slice(1).every(v=>(state.coachingReviews||[]).some(e=>e.kind==='proposal'&&e.response==='accepted'&&e.createdAt===v.recordedAt&&e.proposal.kind==='hypertrophy-load'&&e.proposal.changes.some(c=>{if(c.sessionId!==s.id)return false;const after=clone(c.after);after.prescription.capturedAt=e.createdAt;return same(after,v.context);} )));
   };
   const targetValid=chainValid&&future.every(approvedRow);
   const candidates=relevant.filter(s=>s.date<=asOf).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2);
   let complete=candidates.length===2&&targetValid,top=true;
   for(const s of candidates){const linked=(state.workouts||[]).filter(w=>w.sessionIntent?.schedule?.id===s.id&&w.date===s.date);if(linked.length!==1||!approvedRow(s)){complete=false;continue;}const w=linked[0],plan=w.sessionIntent?.prescription;
    if(!plan||w.sessionIntent.schedule.revisionAt!==s.revisionAt||!same(plan,s.prescription)||Intent.planTiming(plan,w.date,w.sessionIntent?.timing)!=='before-training'||!iso(w.createdAt)||plan.capturedAt>w.createdAt||w.createdAt<revisionAt||w.sessionIntent?.deviationReason&&w.sessionIntent.deviationReason!=='none'){complete=false;continue;}
    const actual=(w.exercises||[]).filter(e=>e.exerciseId===slot.exerciseId&&e.type!=='cardio'&&e.trackBy!=='duration');
    if(actual.length!==1||actual[0].sets?.length!==slot.sets){complete=false;continue;}
    for(const a of actual[0].sets){if(a.done===false||a.completed===false||a.skipped||a.warmup||a.type==='warmup'||!Number.isFinite(a.weight)||Math.abs(a.weight-currentKg)>.02||!Number.isInteger(a.reps)||a.reps<slot.minReps||a.reps>slot.maxReps||!Number.isFinite(a.rpe)||a.rpe<1||a.rpe>slot.targetRpe){complete=false;continue;}if(a.reps!==slot.maxReps)top=false;}
   }
   const targetSessions=candidates.filter(s=>approvedRow(s)).length;
   const coverage=candidates.length===2&&wc?.coverage==='complete'&&wc.from<=candidates.at(-1).date&&wc.through>=asOf;
   if(!complete)reasons.push('Two new comparable fully logged sessions at the current approved load/range/effort cap are required; earlier doses do not count.');
   if(!targetValid)reasons.push('Future Calendar targets differ from the approved progression chain; review the changed plan first.');
   if(!coverage||wc?.tolerance!=='tolerated')reasons.push('History coverage or reported tolerance is insufficient for an increase review.');
   if(unresolved||protectedWork||contextGap)reasons.push('Unresolved sessions, protected lower-volume intent or changed/restricted context blocks progression review.');
   if(complete&&!top)reasons.push('Stay within the reviewed rep range; both sessions have not reached its top on every set.');
   if(currentKg+slot.incrementKg>1000){complete=false;reasons.push('Chosen increment exceeds the load software bound.');}
   const status=complete&&coverage&&wc?.tolerance==='tolerated'&&!unresolved&&!protectedWork&&!contextGap?(top?'review-load':'hold'):'gather';
   return {day:slot.day,exerciseId:slot.exerciseId,name:slot.name,status,loadConvention:slot.loadConvention,currentKg,candidateKg:status==='review-load'?Math.round((currentKg+slot.incrementKg)*100)/100:null,revisionAt,approvedIncreases:accepted.length,targetSessions,reasons,dates:candidates.map(s=>s.date)};
  });
  return {version:1,programId:id,name:r.config.name,asOf,findings,readOnly:true,notice:'Descriptive progression review, not an applied change or a growth/recovery measurement. Only new evidence at the effective approved Calendar target counts. Future changes require explicit proposal review; completed workouts and frozen plans stay unchanged.'};
 }
 function explain(report){return report.name+': '+report.findings.map(f=>f.name+' · current approved load '+f.currentKg+' kg ('+CONVENTIONS[f.loadConvention]+') · '+f.approvedIncreases+' accepted increase(s) · '+f.status+(f.candidateKg!=null?' · review the chosen increment from '+f.currentKg+' to '+f.candidateKg+' kg ('+CONVENTIONS[f.loadConvention]+'), not permission to apply it':'')+'. '+f.reasons.join(' ')).join(' ')+' '+report.notice;}
 return {EQUIPMENT,CONVENTIONS,eligibleGoal,config,build,prepare,validate,save,schedule,progression,explain};
});
