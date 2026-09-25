/* v2.19 meet-preparation foundation: pure, review-only timeline. No scheduling or history writes. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./phase-builder'),require('./schedule'));
  else root.LoadnoteMeetPreparation=factory(root.LoadnotePhaseBuilder,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Phase,Schedule){
  'use strict';
  const LIFTS=['squat','bench','deadlift'];
  const dayNumber=date=>Math.floor(Date.parse(date+'T12:00:00Z')/86400000);
  const addDays=(date,days)=>new Date((dayNumber(date)+days)*86400000).toISOString().slice(0,10);
  function plan(raw,{meetDate,peakWeeks=3}={}){
    const config=Phase.config(raw);
    if(!Schedule.date(meetDate)||!Number.isInteger(peakWeeks)||peakWeeks<2||peakWeeks>4)throw Error('Choose a valid meet date and 2–4 peak weeks');
    const meetDay=new Date(meetDate+'T12:00:00Z').getUTCDay();
    if(meetDay!==0&&meetDay!==6)throw Error('Meet date must be Saturday or Sunday; confirm the actual competition day');
    const baseWeeks=config.phases.reduce((sum,phase)=>sum+phase.weeks,0);
    const baseEnd=addDays(config.startDate,baseWeeks*7-1);
    const peakStart=addDays(meetDate,-peakWeeks*7-(meetDay===0?6:5));
    if(dayNumber(peakStart)<=dayNumber(baseEnd))throw Error('Meet peak overlaps the existing phase sequence. Shorten or move the base sequence; no sessions are changed automatically.');
    const gapDays=dayNumber(peakStart)-dayNumber(baseEnd)-1;
    const weeks=[];
    for(let i=0;i<peakWeeks;i++){
      const taper=i===peakWeeks-1;
      weeks.push({week:i+1,startDate:addDays(peakStart,i*7),endDate:addDays(peakStart,i*7+6),emphasis:taper?'taper':'competition-specific strength',guidance:taper?'Reduce working-set volume and preserve familiar competition-lift practice; choose final exposures with the athlete.':'Prioritize familiar competition-lift technique and appropriately reviewed heavier exposures; do not infer a safe single from training max alone.'});
    }
    const warnings=[
      'Planning preview only: no sets, loads, heavy singles, opener attempts or calendar sessions are generated.',
      'Training maxes are not verified competition maxes; no attempt selection or automatic taper dose is inferred.',
      'Meet-week training and weigh-in/recovery logistics require an individually reviewed plan.',
      'The existing phase sequence includes a deload; review its timing relative to this separate peak.'
    ];
    if(gapDays>0)warnings.push(`There are ${gapDays} unscheduled days between the phase sequence and peak; review continuity manually.`);
    if(config.lifts.deadlift.exposures.length>1)warnings.push('Review deadlift exposure spacing and taper individually; this preview does not infer recovery from lift frequency.');
    return {version:1,meetDate,peakWeeks,baseEnd,peakStart,gapDays,competitionLifts:Object.fromEntries(LIFTS.map(l=>[l,{exerciseId:config.lifts[l].exerciseId,name:config.lifts[l].name}])),weeks,meetWeek:{startDate:addDays(peakStart,peakWeeks*7),meetDate,emphasis:'competition'},warnings};
  }
  return {plan};
});
