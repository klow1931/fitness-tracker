/* Loadnote v2.68 — deterministic programming workspace routing and date helpers. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'),require('./phase-builder'),require('./meet-cycle'),require('./hypertrophy-builder'),require('./athlete-goals'));
  else root.LoadnoteProgrammingWorkspace=factory(root.LoadnoteProgrammingProfile,root.LoadnotePhaseBuilder,root.LoadnoteMeetCycle,root.LoadnoteHypertrophyBuilder,root.LoadnoteGoals);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile,Phase,Meet,Hyp,Goals){
  'use strict';
  const POLICY='programming-workspace-v1';
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const validDate=day=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T12:00:00Z'));
  function weekStartOnOrAfter(day){
    if(!validDate(day))throw Error('Choose a valid date');
    const d=new Date(day+'T12:00:00Z'),weekday=d.getUTCDay(),add=weekday===1?0:(8-weekday)%7;
    d.setUTCDate(d.getUTCDate()+add);return d.toISOString().slice(0,10);
  }
  function weeksToEvent(start,eventDate){
    if(!validDate(start)||!validDate(eventDate)||eventDate<start)return null;
    const delta=Math.floor((Date.parse(eventDate+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000),weeks=Math.floor(delta/7)+1;
    return weeks>=7&&weeks<=52?weeks:null;
  }
  function profileSummary(record){
    const p=record?.context;if(!p)return null;
    return {goal:p.goal,goalLabel:Profile.GOALS[p.goal]||p.goal,eventDate:p.eventDate||null,experience:p.experience,consistency:p.consistency,availableDays:[...p.availableDays],availableDayLabels:p.availableDays.map(d=>days[d]),sessionMinutes:p.sessionMinutes,equipment:[...p.equipment]};
  }
  function route(state,{asOf}={}){
    if(!validDate(asOf))throw Error('Choose a valid programming workspace date');
    const cutoff=asOf+'T23:59:59.999Z',profile=Profile.current(state?.programmingProfiles||[],cutoff),summary=profileSummary(profile);
    const allPhases=Phase.validate(state?.phasePrograms||[]).filter(p=>p.createdAt<=cutoff).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),phases=allPhases.filter(p=>!p.scheduledAt&&p.config.startDate>=asOf);
    const cycles=Meet.validate(state?.meetCycles||[]).filter(c=>c.createdAt<=cutoff).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const activeCycle=cycles.find(c=>c.scheduledAt&&c.config.startDate<=asOf&&c.config.meetDate>=asOf)||null;
    const upcomingCycle=cycles.find(c=>c.scheduledAt&&c.config.startDate>asOf)||null;
    const scheduledPhase=allPhases.find(p=>p.scheduledAt&&(p.sessions||[]).some(s=>s.date>=asOf))||null;
    const reviewedCycle=cycles.find(c=>!c.scheduledAt&&c.config.meetDate>=asOf)||null;
    const hyp=Hyp.validate(state?.hypertrophyPrograms||[]).filter(r=>r.createdAt<=cutoff),scheduledHyp=hyp.find(r=>r.scheduledAt&&r.config.startDate<=asOf&&r.weekly.at(-1).through>=asOf)||hyp.find(r=>r.scheduledAt&&r.config.startDate>asOf),reviewedHyp=hyp.slice().reverse().find(r=>!r.scheduledAt&&r.config.startDate>=asOf);
    if(activeCycle||upcomingCycle||scheduledPhase||scheduledHyp){
      const cycle=activeCycle||upcomingCycle;
      return {version:1,policy:POLICY,status:'scheduled',profile:summary,primaryAction:'view-current',title:activeCycle?'Current cycle is already scheduled':upcomingCycle||scheduledPhase?'Your next/current program is already scheduled':'Program scheduled',reason:'Use the current-program controls above for training and reviews. New program tools stay tucked away unless you intentionally want another plan.',cycleId:cycle?.id||null,sourceId:cycle?.sourceProgram?.id||scheduledPhase?.id||scheduledHyp?.id||null};
    }
    if(reviewedHyp)return {version:1,policy:POLICY,status:'reviewed-hypertrophy',profile:summary,primaryAction:'review-hypertrophy',sourceId:reviewedHyp.id,title:'Review your saved hypertrophy plan',reason:'Saving and scheduling are separate; inspect its frozen targets before adding sessions.'};
    const hypertrophyGoal=Goals.list(state?.athleteGoals||[]).some(g=>g.status==='active'&&g.trainingContext?.primary==='hypertrophy');
    if(profile?.context.goal==='hypertrophy'||!profile&&hypertrophyGoal)return {version:1,policy:POLICY,status:'hypertrophy',profile:summary,primaryAction:'hypertrophy',title:'Build a reviewed hypertrophy plan',reason:'Choose confirmed exercises, explicit loads, rep ranges and rest. Review direct sets, indirect exposure and context before saving; schedule separately.'};
    if(!profile)return {version:1,policy:POLICY,status:'needs-profile',profile:null,primaryAction:'profile',title:'Set up your training once',reason:'Tell Loadnote your goal, available days, session time and equipment. The program planner will reuse those settings instead of asking you to reconcile multiple builders.'};
    const p=profile.context;
    if(p.goal==='return'||p.consistency==='returning')return {version:1,policy:POLICY,status:'quick-return',profile:summary,primaryAction:'quick',title:'Build a simple 4-week return block',reason:'The short builder is reserved for return/re-entry. It no longer competes with the main program designer.'};
    if(reviewedCycle)return {version:1,policy:POLICY,status:'reviewed-cycle',profile:summary,primaryAction:'view-reviewed-cycle',title:'Your cycle is reviewed and ready to schedule',reason:'The full cycle already exists. Review or schedule it instead of starting another generator.',cycleId:reviewedCycle.id,sourceId:reviewedCycle.sourceProgram?.id||null};
    const meetIntent=p.goal==='meet'||!!p.eventDate;
    if(meetIntent){
      const linked=new Set(cycles.map(c=>c.sourceProgram?.id||c.config?.sourceProgramId).filter(Boolean));
      const source=phases.find(p=>!linked.has(p.id))||null;
      if(source)return {version:1,policy:POLICY,status:'meet-timeline',profile:summary,primaryAction:'meet',title:'Continue your meet-prep cycle',reason:'Your lift setup is already reviewed. Choose the event date next; Decisions calculates the available prep length and phase allocation automatically.',sourceId:source.id};
      return {version:1,policy:POLICY,status:'meet-setup',profile:summary,primaryAction:'phase-meet',title:'Build your meet-prep cycle',reason:'One guided path: confirm lift setup, then choose the event. Decisions calculates prep length, accumulation, strength, peak and taper from that timeline. Your profile event date is only a default.'};
    }
    return {version:1,policy:POLICY,status:'phase',profile:summary,primaryAction:'phase',title:'Build your next training cycle',reason:'Use the main program designer for accumulation, strength and deload. The old 4-week builder is kept only as an alternate return/base tool.'};
  }
  return {POLICY,days,weekStartOnOrAfter,weeksToEvent,profileSummary,route};
});
