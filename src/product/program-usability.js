(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'));
 else root.LoadnoteProgramUsability=factory(root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Schedule){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const stages=['Draft','Reviewed','Scheduled','In progress','Finished'];
 const terms={
  'Training max':'A reference weight you choose for calculating program loads. It is not automatically your tested one-rep max. Leave it unknown until you can choose it; manual workout logging does not require one.',
  'RPE':'How hard a completed set felt on a 1–10 scale. An RPE of 10 means no more repetitions were possible. Leave actual effort blank if unsure; a planned RPE is only a target or cap.',
  'Accumulation':'Build training volume: a phase with more practice and working sets before heavier strength work.',
  'Strength':'Practice heavier lifting: a phase that shifts the reviewed program toward heavier loads.',
  'Peaking':'Prepare for the event: more specific lifting before the taper. This does not choose meet attempts.',
  'Taper':'Reduce training before the event. The reviewed plan sets the actual sessions and loads.',
  'Deload':'A planned easier training week. It is different from a meet taper.',
  'Exposure':'One planned practice of a lift within a session.',
  'Periodization':'How the program changes sets, repetitions and loads over time.'
 };
 function phase(value){return ({accumulation:'Build training volume',strength:'Practice heavier lifting',peaking:'Prepare for the event',taper:'Reduce training before the event',deload:'Easier training week'})[value]||value;}
 function status(report){
  if(!report?.program)return 'Draft';
  const s=report.schedule||{},resolved=(s.completed||0)+(s.skipped||0)+(s.cancelled||0);
  const closure=['record-event','save-transition','resolve-overdue','resume-workout','resume-draft'].includes(report.nextAction?.kind);
  if(report.status==='completed'&&s.planned>0&&resolved===s.planned&&!(s.unconfirmed||[]).length&&!closure)return 'Finished';
  return s.completed>0||report.nextAction?.kind==='resume-workout'?'In progress':'Scheduled';
 }
 function overview(sessions=[],config={}){
  const rows=sessions.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const minutes=rows.map(r=>r.estimatedMinutes).filter(Number.isFinite);
  const weekday=day=>new Date(day+'T12:00:00Z').getUTCDay();
  return {count:rows.length,days:[...new Set(rows.map(r=>weekday(r.date)).filter(Number.isFinite))],
   minutes:minutes.length===rows.length&&minutes.length?{min:Math.min(...minutes),max:Math.max(...minutes)}:null,
   first:rows[0]?clone(rows[0]):null,phases:[...new Set(rows.map(r=>r.phase).filter(Boolean))],
   start:config.startDate||rows[0]?.date||null,event:config.meetDate||null};
 }
 function recordStatus(record,state,{kind='phase',asOf,cancelled=false}={}){
  if(cancelled)return 'Cancelled';if(!record.scheduledAt)return 'Reviewed';
  const prefix=kind+':'+record.id+':',rows=Schedule.rows(state.scheduledSessions||[],state.workouts||[],{asOf}).filter(r=>r.id.startsWith(prefix));
  const linked=rows.some(r=>r.state==='completed');
  const weeks=record.config.weeks||(record.config.phases||[]).reduce((n,p)=>n+p.weeks,0);
  const end=new Date(record.config.startDate+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+weeks*7-1);
  const through=record.config.meetDate||end.toISOString().slice(0,10);
  const eventDone=kind!=='meet'||!!(record.config.eventType==='competition'?record.meetResult:record.mockMeet)?.revisions?.length;
  const closed=!['phase','meet'].includes(kind)||(state.transitionSnapshots||[]).some(r=>r.programId===record.id);
  if(rows.length&&rows.every(r=>['completed','skipped','cancelled'].includes(r.state))&&asOf>through&&eventDone&&closed)return 'Finished';
  return linked?'In progress':'Scheduled';
 }
 function undoSchedule(state,before,after,{now=new Date().toISOString(),draft=null,sportDraft=null}={}){
  if(!before?.id||before.id!==after?.id)throw Error('This calendar change cannot be restored.');
  const records=Schedule.validate(state.scheduledSessions||[]),current=records.find(r=>r.id===before.id);
  if(JSON.stringify(current)!==JSON.stringify(after))throw Error('This session changed again. Review Calendar before making another change.');
  if((state.workouts||[]).some(w=>w.sessionIntent?.schedule?.id===before.id)||draft?.sessionIntent?.schedule?.id===before.id||sportDraft?.sessionId===before.id)throw Error('This session has recorded or unfinished work. Finish reviewing it before changing its schedule.');
  const priorRecord=Schedule.validate([before])[0];
  if(current.revisions.length!==priorRecord.revisions.length+1||JSON.stringify(current.revisions.slice(0,-1))!==JSON.stringify(priorRecord.revisions))throw Error('The previous calendar revision does not match this change.');
  const prior=priorRecord.revisions.at(-1).context;
  const at=new Date(Math.max(Date.parse(now),Date.parse(current.revisions.at(-1).recordedAt)+1)).toISOString();
  return {...state,scheduledSessions:Schedule.change(records,before.id,{date:prior.date,status:prior.status,reason:'Undo calendar change: restore '+prior.date+' / '+prior.status},at)};
 }
 return {stages,terms,phase,status,recordStatus,overview,undoSchedule};
});
