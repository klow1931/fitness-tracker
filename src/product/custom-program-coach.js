/* v3.67 — read-only athlete-authored program check and consented edit history.
 * This is a descriptive review, never a new training prescription or a model update.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./custom-program'),require('./programming-profile'),require('./schedule'),require('./custom-program-weekly-review'));
 else root.LoadnoteCustomProgramCoach=factory(root.LoadnoteCustomProgram,root.LoadnoteProgrammingProfile,root.LoadnoteSchedule,root.LoadnoteCustomProgramWeeklyReview);
})(typeof globalThis!=='undefined'?globalThis:this,function(Custom,Profile,Schedule,Weekly){
 'use strict';
 const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 const clean=x=>String(x||'').replace(/\s+/g,' ').trim().slice(0,500);
 const dayNames=Custom.dayNames;
 function questionKind(question){
  const q=clean(question);
  if(/\b(?:uploaded|imported|custom|athlete.authored|my own)\s+(?:training\s+)?(?:program|plan|routine)\b/i.test(q))return /\b(?:weekly review|how did .*\bweek\b|review .*\bweek\b|training feedback|adherence)\b/i.test(q)?'weekly':/\b(?:today|tomorrow|next|upcoming|this week|session|workout)\b/i.test(q)?'session':/\b(?:edit|change|learn|preference|reason|remember)\w*\b/i.test(q)?'edits':'review';
  // General "program changes" questions belong to longitudinal coaching.
  // Reserve this route for explicit custom programs or athlete-authored edits.
  if(/\b(?:my\s+)?(?:program|plan)\s+edits\b/i.test(q))return 'edits';
  return null;
 }
 function eligible(state,asOf){
  if(!day(asOf))throw Error('Choose a valid program review date');
  const cutoff=asOf+'T23:59:59.999Z';
  return Custom.validate(state?.customPrograms||[]).filter(r=>r.createdAt<=cutoff);
 }
 function select(state,{asOf,question='',id=null}={}){
  const records=eligible(state,asOf);
  if(id){const record=records.find(r=>r.id===id);return record?{record,choices:[]}:{record:null,choices:[]};}
  const q=clean(question).toLowerCase();
  const matched=records.filter(r=>q.includes(r.config.name.toLowerCase()));
  if(matched.length===1)return {record:matched[0],choices:[]};
  if(matched.length>1){const longest=Math.max(...matched.map(r=>r.config.name.length)),long=matched.filter(r=>r.config.name.length===longest);if(long.length===1)return {record:long[0],choices:[]};}
  const active=records.filter(r=>r.scheduledAt&&r.scheduledAt<=asOf+'T23:59:59.999Z'&&(!r.replacedBy||r.replacedAt>asOf+'T23:59:59.999Z')&&r.sessions.some(s=>s.date>=asOf));
  if(active.length===1)return {record:active[0],choices:[]};
  if(records.length===1)return {record:records[0],choices:[]};
  return {record:null,choices:records.slice(-6).reverse().map(r=>({id:r.id,name:r.config.name}))};
 }
 function inspect(state,id,{asOf}={}){
  const record=select(state,{asOf,id}).record;
  if(!record)throw Error('The selected program was not available on that date');
  const weekly=Array.from({length:record.config.weeks},(_,i)=>({week:i+1,days:new Set(),sets:0,exercises:0}));
  const prescribedDays=new Set(),unloaded=[],noEffort=[];
  for(const e of record.entries){const w=weekly[e.week-1];w.days.add(e.weekday);w.exercises++;prescribedDays.add(e.weekday);if(e.type==='strength'){w.sets+=e.sets;if(e.weightKg===null)unloaded.push(e);if(e.rpe===null)noEffort.push(e);}}
  const profile=Profile.current(state?.programmingProfiles||[],asOf+'T23:59:59.999Z');
  const unavailable=profile?[...prescribedDays].filter(d=>!profile.context.availableDays.includes(d)).sort((a,b)=>a-b):[];
  const excluded=new Set(profile?.context.avoidedExerciseIds||[]),conflicting=[];
  if(excluded.size)for(const s of record.sessions)for(const e of s.exercises)if(e.exerciseId&&excluded.has(e.exerciseId)&&!conflicting.some(c=>c.name===e.name))conflicting.push({name:e.name,date:s.date});
  const records=eligible(state,asOf),reasons=[],visited=new Set();let node=record;
  // Follow only this program's ancestor chain. Never expose reasons the athlete kept private.
  while(node?.revision&&!visited.has(node.id)&&reasons.length<8){visited.add(node.id);const rev=node.revision;
   if(rev.reason.coachVisible)reasons.push({category:Custom.REASONS[rev.reason.kind],detail:clean(rev.reason.detail),changes:rev.changeCount,exerciseReasons:(rev.exerciseReasons||[]).slice(0,3).map(x=>({category:Custom.REASONS[x.kind],detail:clean(x.detail)}))});
   node=records.find(r=>r.id===rev.parentId);
  }
  const cutoff=asOf+'T23:59:59.999Z',scheduled=!!record.scheduledAt&&record.scheduledAt<=cutoff;
  // A backdated session recorded after the review cutoff must not become
  // historical evidence. The original athlete state is never modified.
  const historical={...state,
   workouts:(state.workouts||[]).filter(w=>w.date<=asOf&&(!w.createdAt||w.createdAt<=cutoff)),
   scheduledSessions:(state.scheduledSessions||[]).map(s=>({...s,revisions:(s.revisions||[]).filter(v=>v.recordedAt<=cutoff)})).filter(s=>s.revisions.length)};
  const insights=scheduled?Custom.insights(historical,record.id,{asOf}):{completed:0,planned:record.sessions.length,unconfirmed:0,matchedSets:0,linkedSets:0};
  const notes=[];
  if(!profile)notes.push('No confirmed training setup was available for comparison. Add one in Profile to check calendar availability and excluded movements.');
  if(unavailable.length)notes.push('Planned sessions use '+unavailable.map(d=>dayNames[d]).join(', ')+', outside the days in your confirmed training setup. Review before scheduling.');
  if(conflicting.length)notes.push(conflicting.length+' movement(s) also appear on your confirmed avoided-exercise list. Review your selections; Coach does not substitute exercises automatically.');
  if(unloaded.length)notes.push(unloaded.length+' strength row(s) have no load target. These are intentionally unspecified.');
  if(noEffort.length)notes.push(noEffort.length+' strength row(s) have no RPE target. Coach cannot infer an effort cap.');
  if(!scheduled)notes.push('This program was saved but not scheduled by this review date. Workout outcomes cannot be attributed to it yet.');
  const days=weekly.map(w=>w.days.size),sets=weekly.map(w=>w.sets);
  const overview=Custom.weeklyOverview(record);
  if(overview.emptyWeeks.length)notes.push('Weeks '+overview.emptyWeeks.join(', ')+' have no exercises in the reviewed file. Confirm that this is intentional.');
  if(overview.largeSetIncreases.length)notes.push('Review strength-set jumps: '+overview.largeSetIncreases.slice(0,6).map(x=>'week '+x.week+' ('+x.from+' to '+x.to+' sets)').join('; ')+'. This is a descriptive change in programmed sets, not a claim of excessive training or an instruction to deload.');
  const report={version:1,asOf,id:record.id,name:record.config.name,weeks:record.config.weeks,scheduled,
   sessions:record.sessions.length,exerciseRows:record.entries.length,plannedDays:dayNames.filter((_,i)=>prescribedDays.has(i)),
   weekly:weekly.map(w=>({week:w.week,days:w.days.size,strengthSets:w.sets,exerciseRows:w.exercises})),
   emptyWeeks:overview.emptyWeeks,largeSetIncreases:overview.largeSetIncreases,
   range:{sessionDays:[Math.min(...days),Math.max(...days)],strengthSets:[Math.min(...sets),Math.max(...sets)]},
   missingLoad:unloaded.length,missingRpe:noEffort.length,profileChecked:!!profile,
   outsideAvailability:unavailable.map(d=>dayNames[d]),excludedMovements:conflicting.slice(0,8),
   execution:{completed:insights.completed,planned:insights.planned,unconfirmed:insights.unconfirmed,matchedSets:insights.matchedSets,linkedSets:insights.linkedSets},
   sharedReasons:reasons,privateReasonCount:0,notes,
   notice:'This is a read-only comparison of reviewed prescriptions, confirmed athlete preferences and exactly linked workout records. Edit reasons are shown only with permission. Neither a successful workout nor an observed association authorizes a training change.'};
  // Private reasons remain undisclosed, including their categories and free text.
  node=record;visited.clear();
  while(node?.revision&&!visited.has(node.id)){visited.add(node.id);if(!node.revision.reason.coachVisible)report.privateReasonCount++;node=records.find(r=>r.id===node.revision.parentId);}
  return report;
 }
 function explain(report,kind='review'){
  const r=report,lines=[r.name+': '+r.weeks+' weeks, '+r.sessions+' planned sessions and '+r.exerciseRows+' exercise rows.',
   'Weekly plan: '+r.range.sessionDays.join('–')+' training day(s), '+r.range.strengthSets.join('–')+' prescribed strength sets. These counts describe the plan; they do not establish an optimal dose.'];
  if(kind==='edits'){
   if(r.sharedReasons.length)lines.push('Reasons you explicitly shared with Coach: '+r.sharedReasons.slice(0,4).map(x=>x.category+(x.detail?': '+x.detail:'')+' ('+x.changes+' saved changes)').join('; ')+'.');
   else lines.push('No program-edit explanations are currently shared with Coach. Saved prescriptions and their differences can still be reviewed.');
   if(r.privateReasonCount)lines.push(r.privateReasonCount+' revision(s) have private reasons, which I will not read or summarize.');
   lines.push('These are athlete-reported choices, not inferred long-term preferences or proof a change improved performance.');
  }
  if(r.profileChecked)lines.push(r.outsideAvailability.length?'Availability mismatch: '+r.outsideAvailability.join(', ')+'.':'Every programmed weekday falls within the days you confirmed as available.');
  if(r.excludedMovements.length)lines.push('Review excluded movements: '+r.excludedMovements.map(x=>x.name).join(', ')+'.');
  if(r.missingLoad||r.missingRpe)lines.push('Unspecified targets: '+r.missingLoad+' load(s), '+r.missingRpe+' RPE cap(s). I will not fill them in without your review.');
  if(r.scheduled)lines.push('Linked session evidence: '+r.execution.completed+'/'+r.execution.planned+' completed; '+r.execution.unconfirmed+' unconfirmed; '+r.execution.matchedSets+'/'+r.execution.linkedSets+' exact comparable planned sets. Missing or unlinked work is not counted as a result.');
  else lines.push('No linked workout outcomes yet because this reviewed program has not been scheduled.');
  return lines.join(' ')+' Review any proposed edit in Custom Program Studio; nothing has been changed.';
 }
 function dailySession(state,record,{asOf,question,unit='kg'}={}){
  const base={source:'Offline Coach · reviewed custom session',readOnly:true,intent:{topic:'custom-program',kind:'session'},actions:[{kind:'custom-programs',label:'Review Custom Program Studio'}]};
  const name=record.config.name,cutoff=asOf+'T23:59:59.999Z';
  if(!record.scheduledAt||record.scheduledAt>cutoff)return {...base,text:name+' is reviewed but was not scheduled on Calendar by '+asOf+'. Save and explicitly schedule it in Custom Program Studio before using it as a daily workout. No training was changed.',evidence:[]};
  if(record.replacedBy&&record.replacedAt<=cutoff)return {...base,text:name+' was superseded by a reviewed edit. Open Custom Program Studio and use the active Calendar version; I will not quote outdated session targets.',evidence:[]};
  const all=Schedule.list(state.scheduledSessions||[],cutoff).filter(s=>s.id.startsWith('custom:'+record.id+':')&&s.status==='scheduled').sort((a,b)=>a.date.localeCompare(b.date));
  const tomorrow=/\btomorrow\b/i.test(question),next=/\b(?:next|upcoming)\b/i.test(question),requested=tomorrow?(()=>{const d=new Date(asOf+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);})():asOf;
  const session=next?all.find(s=>s.date>=requested):all.find(s=>s.date===requested);
  if(!session){const upcoming=all.find(s=>s.date>requested);return {...base,text:'No scheduled session from '+name+' is listed for '+requested+'. '+(upcoming?'The next active Calendar session is '+upcoming.date+'. ':'No later active session is available in this program. ')+'I have not created a substitute workout.',evidence:[]};}
  const weight=kg=>Math.round(kg*(unit==='lb'?2.20462262185:1)*100)/100+' '+(unit==='lb'?'lb':'kg');
  const exercises=session.prescription?.plannedExercises||[];
  const lines=exercises.map(e=>{
   if(e.type==='cardio')return e.name+' — '+(e.duration==null?'duration unspecified':e.duration+' minutes');
   const sets=e.sets||[],reps=[...new Set(sets.map(x=>x.reps))],loads=[...new Set(sets.map(x=>x.weight??null))],rpes=[...new Set(sets.map(x=>x.targetRpe??null))];
   const repText=reps.length===1?reps[0]+' reps':'reps vary by set';
   const loadText=loads.length===1?(loads[0]===null?'load unspecified':weight(loads[0])):'loads vary by set';
   const rpeText=rpes.length===1?(rpes[0]===null?'RPE unspecified':'RPE '+rpes[0]):'RPE varies by set';
   return e.name+' — '+sets.length+' sets, '+repText+', '+loadText+', '+rpeText;
  });
  return {...base,text:name+' · '+session.date+' · '+session.name+'. Reviewed Calendar prescription: '+lines.slice(0,12).join('; ')+(lines.length>12?'; plus '+(lines.length-12)+' more exercise(s) in Calendar':'')+'. These are planned targets, not proof of completion or an updated load recommendation. Log your actual sets separately; no program was changed.',evidence:[{id:session.id,date:session.date,revisionAt:session.revisionAt,plannedExercises:exercises}]};
 }
 function answer(state,question,{asOf,unit='kg'}={}){
  const kind=questionKind(question);if(!kind)return null;
  try{
   const selected=select(state,{asOf,question});
   if(!selected.record)return {text:selected.choices.length?'Which saved custom program should I review? '+selected.choices.map(x=>x.name).join('; ')+'.':'There is no reviewed custom program saved yet. Write or import one in Custom Program Studio, then review it before scheduling.',source:'Offline Coach · custom program check',readOnly:true,evidence:[],actions:[{kind:'custom-programs',label:'Open Custom Program Studio'}]};
   if(kind==='session')return dailySession(state,selected.record,{asOf,question,unit});
   if(kind==='weekly'){
    const weekly=Weekly.inspect(state,selected.record.id,{asOf});
    return {text:Weekly.explain(weekly),source:'Offline Coach · custom weekly review',readOnly:true,evidence:weekly.status==='ready'?[weekly]:[],intent:{topic:'custom-program',kind:'weekly'},actions:[{kind:'custom-programs',label:'Review weekly training evidence'}],followUps:['Review my uploaded program']};
   }
   const report=inspect(state,selected.record.id,{asOf});
   return {text:explain(report,kind)+' '+report.notice,source:'Offline Coach · custom program check',readOnly:true,evidence:[report],intent:{topic:'custom-program',kind},actions:[{kind:'custom-programs',label:'Review the saved program'}],followUps:kind==='edits'?['Review my uploaded program']:['What have you learned from my program edits?']};
  }catch{return {text:'I could not validate the saved custom program for this date. Open Custom Program Studio and review the program and its history; no training was changed.',source:'Offline Coach · custom program unavailable',readOnly:true,evidence:[],actions:[{kind:'custom-programs',label:'Open Custom Program Studio'}]};}
 }
 return {questionKind,select,inspect,explain,dailySession,answer};
});
