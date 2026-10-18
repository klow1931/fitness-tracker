/* Phase 5 — read-only longitudinal coaching from established training engines.
 * No independent progression policy, inferred medical readiness or hidden writes.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./program-lifecycle'),require('./adaptive-outcome-learning'),require('./programming-profile'),require('./adaptive-handoff'),require('./schedule'));
 else root.LoadnoteLongitudinalCoach=factory(root.LoadnoteProgramLifecycle,root.LoadnoteAdaptiveOutcomeLearning,root.LoadnoteProgrammingProfile,root.LoadnoteAdaptiveHandoff,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Lifecycle,Learning,Profile,Handoff,Schedule){
 'use strict';
 const clean=x=>String(x||'').trim().replace(/\s+/g,' ').slice(0,500);
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const dayEnd=d=>d+'T23:59:59.999Z';
 const actions=new Set(['review-week','review-phase','resolve-overdue','start-workout','next-session','program-upcoming','resume-workout','resume-draft','review-next-program','review-handoff','save-transition','review-programs','review-hypertrophy','review-sport','wait-event','record-event','no-program','error']);
 const types={
  journey:/\b(where am i in (?:my |the )?(?:training |current )?(?:program|cycle|block)|what phase am i in|how far (?:am i|along) in my (?:training )?(?:program|cycle)|what comes after (?:this|my) (?:training )?(?:phase|block)|where is my training heading)\b/i,
  outcomes:/\b(what (?:have we|has loadnote) learned from (?:my |our )?(?:program|training|adaptation|progression) changes|how (?:have|did) my (?:program|training|adaptation) changes work|have my (?:past )?adjustments helped|what worked from (?:past|previous) (?:program|training) changes)\b/i,
  memory:/\b(what do you remember about my training|what (?:have you|has loadnote) saved about my training preferences|which (?:exercise|training) preferences (?:have i|are) saved|what are my saved coaching preferences)\b/i,
  next:/\b(should (?:we|i|my coach) (?:adapt|change|modify|adjust) (?:my |the )?next workout|how (?:will|should) (?:my |the )?next workout adapt|what changes are proposed for (?:my |the )?next (?:workout|session)|what does (?:my|the) last workout mean for (?:my|the) next|what is the next reviewed coaching action)\b/i
 };
 function intent(question){
  const q=clean(question);return Object.entries(types).find(([,rule])=>rule.test(q))?.[0]||null;
 }
 function inspect(state,{asOf,now=new Date().toISOString()}={}){
  if(!Schedule.date(asOf)||!iso(now))throw Error('A valid dated coaching review is required');
  const cutoff=now<dayEnd(asOf)?now:dayEnd(asOf);
  const snapshotDate=cutoff.slice(0,10);
  // Never use training, preferences or accepted adjustments recorded after the request cutoff.
  const record=Profile.current(state?.programmingProfiles||[],cutoff);
  const p=record?.context||null, catalog=Array.isArray(state?.exerciseCatalog)?state.exerciseCatalog:[];
  const movementNames=ids=>Array.isArray(ids)?ids.slice(0,12).map(id=>catalog.find(e=>e.id===id)?.name||'Unmapped exercise'):[],
    setup=p?{status:'confirmed',recordedAt:record.recordedAt,goal:p.goal||null,experience:p.experience||null,consistency:p.consistency||null,
      availableDays:[...(p.availableDays||[])],sessionMinutes:p.sessionMinutes??null,equipment:[...(p.equipment||[])],preferredMovements:movementNames(p.preferredExerciseIds),excludedMovements:movementNames(p.avoidedExerciseIds)}
     :{status:'unconfirmed',recordedAt:null,goal:null,availableDays:[],equipment:[],preferredMovements:[],excludedMovements:[]};
  let life=null,lifecycleIssue=null;
  try{life=Lifecycle.inspect(state,{asOf:snapshotDate,draft:null,draftOpen:false});}catch(e){lifecycleIssue='Program lifecycle could not be validated: '+e.message;}
  const program=life?.program?{id:life.program.id,kind:life.program.kind,name:life.program.name,startDate:life.program.startDate,endDate:life.program.endDate,
    status:life.status,week:life.progress?.week||null,totalWeeks:life.progress?.totalWeeks||null,phase:life.progress?.phaseLabel||null,
    phaseWeek:life.progress?.phaseWeek||null,missedReviewWindows:(life.missedReviews||[]).length}:null;
  const nextAction=life?.nextAction&&actions.has(life.nextAction.kind)?{kind:life.nextAction.kind,label:life.nextAction.label,detail:life.nextAction.detail}:null;
  const nextSession=life?.schedule?.next?{date:life.schedule.next.date,name:life.schedule.next.name,id:life.schedule.next.id}:null;
  let learning=null,learningIssue=null;
  try{
   const reviewed=Learning.analyze(state,{asOf:snapshotDate,now:cutoff}),patterns=reviewed.summary.patterns||[];
   learning={recorded:reviewed.summary.recorded,observed:reviewed.summary.observed,unobserved:reviewed.summary.unobserved,
      patterns:patterns.map(p=>({lift:p.lift,action:p.action,recorded:p.recorded,observed:p.observed,evidence:p.evidence,
        counts:{...p.counts},medianCapacityChangePct:p.medianCapacityChangePct,description:p.pattern}))};
  }catch(e){learningIssue='Accepted outcome history could not be validated: '+e.message;}
  const workouts=(state?.workouts||[]).filter(w=>w?.date<=snapshotDate&&w?.createdAt<=cutoff&&w?.sessionIntent?.schedule?.id)
   .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||String(b.id).localeCompare(String(a.id)));
  let handoff=null,handoffIssue=null;
  if(workouts[0]&&life?.status!=='ambiguous'){
   try{
    const h=Handoff.inspect(state,{asOf:snapshotDate,workoutId:workouts[0].id});
    if(h?.next?.date>=snapshotDate&&h?.next?.id===nextSession?.id){
     handoff={workoutId:h.workoutId,status:h.status,label:h.label,reason:h.reason,
       pairedRpeSets:h.performance?.comparableRpeSets||0,averageRpeDelta:h.performance?.averageRpeDelta??null,
       changedExercises:h.changes?.length||0};
    }
   }catch(e){handoffIssue='Saved workout handoff could not be validated: '+e.message;}
  }
  return {version:1,asOf:snapshotDate,knownAt:cutoff,readOnly:true,setup,program,nextAction,nextSession,learning,handoff,
   conflicts:life?.status==='ambiguous'?life.candidates||[]:[],
   unavailable:[lifecycleIssue,learningIssue,handoffIssue].filter(Boolean),
   notice:'Saved preferences are explicit athlete settings, not inferred memory. Repeated observed responses are associations, not proof of cause. Any next-workout change requires the existing review and athlete approval; the Coach never changes a schedule from this report.'};
 }
 function explain(report,kind='journey'){
  const p=report.program,a=report.nextAction,o=report.learning,m=report.setup;
  if(kind==='memory'){
   if(m.status!=='confirmed')return 'I have no confirmed saved training setup at this date. Review Profile → Training setup before I rely on goals, equipment or schedule preferences.';
   return 'Saved training setup (confirmed '+m.recordedAt.slice(0,10)+'): goal '+m.goal+'; experience '+(m.experience||'unconfirmed')+
    '; availability '+(m.availableDays.length?m.availableDays.join(', ')+' (Mon=0)':'unconfirmed')+
    '; session length '+(m.sessionMinutes??'unconfirmed')+' minutes; equipment '+(m.equipment.join(', ')||'unconfirmed')+
    '; preferred exercises '+(m.preferredMovements.join(', ')||'none confirmed')+
    '; excluded exercises '+(m.excludedMovements.join(', ')||'none confirmed')+
    '. These are confirmed saved preferences, not memories inferred from chat. Update them in Profile before future programming.';
  }
  if(kind==='outcomes'){
   if(!o)return 'Accepted adaptation history could not be validated. Review Decision Performance rather than inferring what worked.';
   if(!o.recorded)return 'No eligible approved adaptation follow-ups are recorded yet; there is no outcome-based training pattern to evaluate.';
   const consistent=o.patterns.filter(x=>x.observed>=3);
   const words=consistent.length?consistent.slice(0,4).map(x=>x.lift+' · '+x.action+': '+x.observed+'/'+x.recorded+
    ' exact observed follow-ups, '+x.counts.improved+' improved / '+x.counts.stable+' stable / '+x.counts.declined+' declined; median '+x.medianCapacityChangePct+'% (RPE-aware capacity). '+x.description).join(' '):
    'No lift-and-action combination has three exact observed follow-ups, so a repeated pattern cannot yet be described.';
   return o.observed+'/'+o.recorded+' accepted adjustment observations have usable exact follow-up; '+o.unobserved+' remain unobserved. '+words+
    ' This is descriptive association, not proof the change caused a strength result. It never independently authorizes a progression.';
  }
  if(kind==='next'){
   if(report.conflicts.length)return 'Multiple programs overlap. Resolve the active program before using a next-workout coaching suggestion.';
   if(!a)return 'No validated next action is available. Review your saved program and calendar; no change is proposed.';
   const next=report.nextSession?' Next scheduled: '+report.nextSession.date+' · '+report.nextSession.name+'.':'';
   const handoff=report.handoff?' Last linked workout: '+report.handoff.label+'. '+report.handoff.reason+
    (report.handoff.pairedRpeSets?' '+report.handoff.pairedRpeSets+' sets have matched target/actual RPE evidence.':''):''; 
   return 'The reviewed next step is '+a.label+'. '+a.detail+next+handoff+
    ' A saved session alone does not authorize a new dose. Open the existing reviewed workflow to inspect and approve a supported change.';
  }
  if(!p)return report.conflicts.length?'Overlapping training programs prevent a single current-cycle interpretation. Review programs in Decisions.':
   'No active reviewed training cycle is available at this date. Choose a plan in Decisions to establish the training sequence.';
  return p.name+': '+(p.week?'week '+p.week+' of '+p.totalWeeks:'program dates '+p.startDate+' to '+p.endDate)+
   (p.phase?' · current phase '+p.phase+(p.phaseWeek?' (phase week '+p.phaseWeek+')':''):'')+
   '. '+(a?'Next reviewed action: '+a.label+'. '+a.detail:'No validated next action is available.')+
   (p.missedReviewWindows?' '+p.missedReviewWindows+' past review windows were not recorded; these do not retroactively change prescriptions.':'')+
   ' The training phase is a saved program structure, not a forecast of performance.';
 }
 function answer(state,question,options={}){
  const requested=intent(String(question||''));if(!requested)return null;
  try{const report=inspect(state,options),kind=requested;
   return {text:explain(report,kind)+'\n\n'+report.notice,
    source:'Offline Coach · longitudinal training',readOnly:true,
    intent:{topic:'longitudinal-training',kind},evidence:[report],
    actions:kind==='memory'?[]:[{kind:'lifecycle',label:'Review current program'}],
    followUps:kind==='journey'?['What have we learned from my program changes?','Should my next workout adapt?']:
      kind==='outcomes'?['Where am I in my program?','Should my next workout adapt?']:
      ['Where am I in my program?']};
  }catch{return {text:'I could not validate the saved training timeline. Review your program, training history and dates; no prescription was changed.',
   source:'Offline Coach · longitudinal training unavailable',readOnly:true,evidence:[]};}
 }
 return {intent,inspect,explain,answer};
});
