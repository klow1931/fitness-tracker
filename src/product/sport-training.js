/* Shared, read-only sport-context review. Counts never establish sport readiness. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./sport-context'),require('./athlete-goals'),require('./training-blocks'),require('./training-knowledge'),require('./muscle-workload-review'));else root.LoadnoteSportTraining=factory(root.LoadnoteSportContext,root.LoadnoteGoals,root.LoadnoteBlocks,root.LoadnoteTrainingKnowledge,root.LoadnoteMuscleReview);})(typeof globalThis!=='undefined'?globalThis:this,function(C,Goals,Blocks,K,Workload){
 'use strict';
 const shift=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
 function select(state,{goalId,domain}={}){
  const active=Goals.list(state.athleteGoals||[]).filter(g=>g.status==='active');
  if(goalId){const goal=active.find(g=>g.id===goalId);return {goal:goal||null,candidates:goal?[goal]:[],reason:goal?'selected':'Selected goal is no longer active.'};}
  const candidates=active.filter(g=>!domain||g.trainingContext?.primary===domain||g.trainingContext?.secondary.includes(domain));
  return {goal:candidates.length===1?candidates[0]:null,candidates,reason:candidates.length>1?'Multiple active goals match. Choose the goal to review; no priority is inferred.':'Create or update an athlete goal with structured training priorities.'};
 }
 function review(state,{asOf,goalId,domain}={}){
  if(!C.date(asOf))throw Error('Choose a valid sport-review date');const selection=select(state,{goalId,domain}),goal=selection.goal,c=goal?.trainingContext||null,from=shift(asOf,-6),questions=[],constraints=[];
  if(!goal)questions.push(selection.reason);
  else if(!c)questions.push('What is your primary training priority? Edit the goal; a free-text sport name is not a confirmed priority.');
  else if(c.primary==='athlete'&&(!goal.sport.trim()||/^powerlifting$/i.test(goal.sport.trim())))questions.push('Which sport and position are you preparing for?');
  else if(['athlete','weightlifting'].includes(c.primary)&&c.season==='unknown')questions.push('Which season are you in: off-season, pre-season, in-season or transition?');
  else if(!c.scheduleKnown)questions.push('Which days have sport practices or games? Confirm none if gym work is your only scheduled training.');
  else if(!goal.availableDays.length||!goal.sessionMinutes||!goal.equipment.trim())questions.push('What gym days, session time and equipment are actually available?');
  else if(!goal.experience.trim())questions.push('What training experience and coaching support do you have for your primary goal?');
  if(c?.scheduleKnown){const overlaps=goal.availableDays.filter(d=>c.practiceDays.includes(d)||c.competitionDays.includes(d));if(overlaps.length)constraints.push('Gym and declared sport days overlap: '+overlaps.map(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')+'. Coordinate timing and priorities with your coach; overlap is not automatically unsafe or a reason to cancel.');}
  if(c?.restrictions)constraints.push('Athlete-confirmed restrictions: '+c.restrictions+'. No loading change or medical clearance is inferred.');
  if(goal?.eventDate&&goal.eventDate>=asOf&&goal.eventDate<=shift(asOf,7))constraints.push('An event is within the next seven days. Preserve the reviewed event plan; do not add work automatically.');
  const week=goal?Goals.week(state,{asOf,goalId:goal.id}):null;
  const blocks=Blocks.list(state.trainingBlocks||[]),sessionIds=new Set([...(goal?.sessionIds||[]),...(week?.sessions||[]).map(s=>s.id)]);
  const scoped=(state.workouts||[]).filter(w=>C.date(w.date)&&w.date>=from&&w.date<=asOf&&goal&&(sessionIds.has(w.sessionIntent?.schedule?.id)||goal.blockIds.includes(blocks.find(b=>b.startDate<=w.date&&(!b.endDate||b.endDate>=w.date))?.id)));
  const conditioning={records:0,minutes:0,missingDuration:0,distances:{}};
  for(const w of scoped)for(const e of w.exercises||[])if(e.type==='cardio'){
   conditioning.records++;if(Number.isFinite(e.duration)&&e.duration>0)conditioning.minutes+=e.duration;else conditioning.missingDuration++;
   if(Number.isFinite(e.distance)&&e.distance>0&&['km','mi','m'].includes(e.distanceUnit))conditioning.distances[e.distanceUnit]=(conditioning.distances[e.distanceUnit]||0)+e.distance;
  }
  const entries=C.listPractice(state.olympicPractice||[]).filter(p=>p.date>=from&&p.date<=asOf&&(!goal||p.goalId===goal.id));
  const catalog=new Map((state.exerciseCatalog||[]).map(e=>[e.id,e])),groups=new Map();let missingIdentity=0;
  for(const p of entries){if(!catalog.has(p.exerciseId)){missingIdentity++;continue;}const key=JSON.stringify([p.exerciseId,p.family,p.variation]);let row=groups.get(key);
   if(!row){row={exerciseId:p.exerciseId,name:catalog.get(p.exerciseId).name,family:p.family,variation:p.variation,made:0,missed:0,unknown:0,qualityKnown:0,inconsistent:0,loads:{}};groups.set(key,row);}
   for(const a of p.attempts){row[a.outcome]++;if(a.quality!=='unknown')row.qualityKnown++;if(a.quality==='inconsistent')row.inconsistent++;const l=row.loads[a.kg]||(row.loads[a.kg]={made:0,missed:0,unknown:0});l[a.outcome]++;}
  }
  const technical={sessions:entries.length,groups:[...groups.values()],missingIdentity,unlinked:C.listPractice(state.olympicPractice||[]).filter(p=>p.date>=from&&p.date<=asOf&&!p.goalId).length};
  const goalIds=new Set(Goals.list(state.athleteGoals||[]).map(g=>g.id));technical.unavailableGoalLinks=C.listPractice(state.olympicPractice||[]).filter(p=>p.date>=from&&p.date<=asOf&&p.goalId&&!goalIds.has(p.goalId)).length;
  if(c?.primary==='weightlifting'&&!entries.length&&!questions.length)questions.push('Which exact lift variation are you practicing, and what outcomes have you recorded?');
  const muscle=Workload.analyze(state,{asOf});
  return {version:1,asOf,from,selection,goal,context:c,questions,constraints,week,conditioning,technical,muscle,readOnly:true,notice:'Current corrected goals and logs; history completeness is unknown unless separately declared in workload review. Practice outcomes and technical quality are athlete reports, not video assessment, judged competition results, measured power or medical clearance. No program targets are changed.'};
 }
 function explain(r,{domain}={}){
  if(!r.goal)return r.selection.reason+' '+r.notice;
  const c=r.context;if(!c)return r.questions[0]+' '+r.notice;
  let text=r.goal.name+' — primary: '+C.DOMAINS[c.primary]+(c.secondary.length?'; secondary: '+c.secondary.map(k=>C.DOMAINS[k]).join(', '):'')+'. Sport: '+r.goal.sport+'; position: '+(c.position||'not recorded')+'; season: '+c.season+'. '+r.from+' through '+r.asOf+'. ';
  text+='Strength evidence: '+r.week.loggedWorkouts+' goal-linked workout records. Counts do not establish increased strength, sport transfer or readiness. ';
  if(domain==='weightlifting'||c.primary==='weightlifting')text+='Technical practice: '+r.technical.sessions+' goal-linked sessions. '+(r.technical.groups.map(g=>g.name+' ('+C.FAMILIES[g.family]+(g.variation?', '+g.variation:'')+'): '+g.made+' made, '+g.missed+' missed, '+g.unknown+' unknown outcomes; quality reported on '+g.qualityKnown+'/'+(g.made+g.missed+g.unknown)+' attempts, '+g.inconsistent+' reported inconsistent.').join(' ')||'No usable linked attempt evidence.')+' Families, identities and variations remain separate; no estimated 1RM or load increase is inferred. '+r.technical.unlinked+' unlinked practice records are not silently assigned to this goal. ';
  if(domain==='hypertrophy'||c.primary==='hypertrophy')text+='Hypertrophy: use the shared four-week muscle review for all logged training, not just this goal. '+Workload.explain(r.muscle)+' ';
  if(domain==='athlete'||c.primary==='athlete')text+='Conditioning: '+r.conditioning.records+' goal-linked cardio records; '+r.conditioning.minutes+' recorded minutes, '+r.conditioning.missingDuration+' records without usable duration. Sport practices are schedule declarations, not completed workload. No sprint, jump, agility or power performance is inferred from lifting or cardio totals. ';
  text+=r.constraints.join(' ')+' '+(r.questions.length?'Next question: '+r.questions[0]:'Next checkpoint: review the next comparable exposure and any changes to practices, events or tolerance.');
  if(r.technical.missingIdentity||r.technical.unavailableGoalLinks)text+=' Practice data gaps: '+r.technical.missingIdentity+' missing exercise identities; '+r.technical.unavailableGoalLinks+' unavailable goal links. Correct the journal before interpreting these records.';
  text+=c.restrictions?' Alternative: clarify the stated restrictions with the appropriate professional before continuing affected work; this review is not clearance. ':' Alternative: keep the reviewed gym plan unchanged while collecting missing context, or coordinate competing priorities with your coach. ';
  text+=r.notice;
  return text;
 }
 return {select,review,explain};
});
