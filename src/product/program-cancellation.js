/* Explicit, reversible program cancellation. Frozen plans and completed work survive. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./schedule'));
 else root.LoadnoteProgramCancellation=factory(root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(S){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),canonical=x=>x==null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',same=(a,b)=>canonical(a)===canonical(b);
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const TYPES={'legacy-program':['programs','legacy'],'phase-program':['phasePrograms','phase'],'meet-cycle':['meetCycles','meet'],'hypertrophy-program':['hypertrophyPrograms','hypertrophy'],'sport-program':['sportPrograms','sport'],'reviewed-program':['reviewedPrograms','builder'],'adopted-program':['adoptedPrograms','adopted']};
 function validate(records){
  if(!Array.isArray(records)||records.length>1000)throw Error('Invalid program cancellation history');const ids=new Set();
  return records.map(r=>{if(!r||r.version!==1||typeof r.id!=='string'||!r.id||r.id.length>240||ids.has(r.id)||r.id!==r.kind+':'+r.programId||!TYPES[r.kind]||typeof r.programId!=='string'||!r.programId||r.programId.length>160||!Array.isArray(r.revisions)||!r.revisions.length||r.revisions.length>100)throw Error('Invalid program cancellation record');ids.add(r.id);
   let previous=null;for(const v of r.revisions){if(!iso(v.recordedAt)||previous&&v.recordedAt<=previous.recordedAt||!S.date(v.asOf)||v.asOf>v.recordedAt.slice(0,10)||typeof v.reason!=='string'||!v.reason.trim()||v.reason.length>500||!['cancelled','restored'].includes(v.status)||!previous&&v.status!=='cancelled'||previous&&v.status===previous.status||!Array.isArray(v.sessions)||v.sessions.length>1000)throw Error('Invalid program cancellation revision');const seen=new Set();for(const s of v.sessions){if(typeof s.id!=='string'||seen.has(s.id)||!s.id.startsWith(TYPES[r.kind][1]+':'+r.programId+':')||!iso(s.revisionAt)||!s.before||s.before.status!=='scheduled'||!S.date(s.before.date))throw Error('Invalid cancellation session snapshot');S.validate([{id:s.id,revisions:[{recordedAt:s.revisionAt,context:s.before}]}]);seen.add(s.id);}previous=v;}
   return clone(r);
  });
 }
 function validateState(state){
  const records=validate(state?.programCancellations||[]);for(const r of records){const p=(state[TYPES[r.kind][0]]||[]).find(p=>String(p.id)===r.programId);if(!p||r.kind!=='legacy-program'&&!p.scheduledAt)throw Error('Cancellation references a missing scheduled program');for(const v of r.revisions)for(const s of v.sessions){const row=(state.scheduledSessions||[]).find(x=>x.id===s.id),before=row?.revisions.find(x=>x.recordedAt===s.revisionAt),after=row?.revisions.find(x=>x.recordedAt===v.recordedAt);if(!before||!same(before.context,s.before)||!after||after.context.status!==(v.status==='cancelled'?'cancelled':'scheduled')||s.before.date<v.asOf||s.revisionAt>=v.recordedAt)throw Error('Cancellation does not match its Calendar history');const expected=clone(s.before);expected.status=after.context.status;expected.reason=after.context.reason;if(!same(expected,after.context))throw Error('Cancellation changed a reviewed prescription');}}return records;
 }
 function isCancelled(state,id,kind){return validate(state?.programCancellations||[]).some(r=>r.programId===String(id)&&(!kind||r.kind===kind)&&r.revisions.at(-1).status==='cancelled');}
 function programs(state){return Object.entries(TYPES).flatMap(([kind,[collection,prefix]])=>(state[collection]||[]).filter(p=>kind==='legacy-program'?String(state.activeProgramId)===String(p.id)||(state.programCancellations||[]).some(r=>r.kind===kind&&r.programId===String(p.id)):p.scheduledAt).map(p=>({kind,id:String(p.id),name:p.config?.name||p.sourceProgram?.config?.name||p.sourceSnapshot?.name||p.name||'Reviewed program',prefix:prefix+':'+p.id+':'})));}
 function inspect(state,{programId,kind,asOf,draftOpen=false}={}){
  if(!S.date(asOf))throw Error('Choose a valid cancellation date');const p=programs(state).find(p=>p.id===programId&&p.kind===kind);if(!p)throw Error('Choose a scheduled program');
  const history=validate(state.programCancellations||[]).find(r=>r.programId===p.id&&r.kind===kind),cancelled=history?.revisions.at(-1).status==='cancelled',rows=S.list(state.scheduledSessions||[]).filter(s=>s.id.startsWith(p.prefix)),logged=new Set((state.workouts||[]).map(w=>w.sessionIntent?.schedule?.id));
  const sessions=rows.filter(s=>s.date>=asOf&&s.status==='scheduled'&&!logged.has(s.id)).map(s=>({id:s.id,revisionAt:s.revisionAt,before:{date:s.date,name:s.name,status:s.status,blockId:s.blockId,role:s.role,goal:s.goal,prescription:clone(s.prescription),reason:s.reason}}));
  return {version:1,asOf,program:p,cancelled,blocked:!!draftOpen,sessions,completed:rows.filter(s=>logged.has(s.id)).length,pastUnconfirmed:rows.filter(s=>s.date<asOf&&s.status==='scheduled'&&!logged.has(s.id)).length,history:history||null};
 }
 function cancel(state,preview,{reason,confirmed=false,asOf,now=new Date().toISOString(),draftOpen=false}={}){
  if(!confirmed||!iso(now)||asOf>now.slice(0,10)||typeof reason!=='string'||!reason.trim()||reason.trim().length>500)throw Error('Confirm cancellation and enter a reason');const fresh=inspect(state,{programId:preview.program.id,kind:preview.program.kind,asOf,draftOpen});
  if(fresh.program.kind==='legacy-program'&&String(state.activeProgramId)!==fresh.program.id)throw Error('This legacy program is no longer active');
  if(fresh.blocked)throw Error('Finish or clear the open workout draft first');if(fresh.cancelled)throw Error('Program is already cancelled');if(!same(fresh,preview))throw Error('Program or Calendar changed; reopen cancellation');
  let sessions=state.scheduledSessions||[];for(const s of fresh.sessions){if(now<=s.revisionAt)throw Error('Cancellation must follow the current Calendar revision');sessions=S.change(sessions,s.id,{status:'cancelled',reason:'Program cancelled: '+reason.trim().slice(0,470)},now);}
  const records=validate(state.programCancellations||[]),id=fresh.program.kind+':'+fresh.program.id;let r=records.find(r=>r.id===id);if(!r){r={version:1,id,kind:fresh.program.kind,programId:fresh.program.id,revisions:[]};records.push(r);}if(r.revisions.at(-1)?.recordedAt>=now)throw Error('Cancellation time must follow its history');r.revisions.push({recordedAt:now,asOf,status:'cancelled',reason:reason.trim(),sessions:fresh.sessions});
  return {...state,...(fresh.program.kind==='legacy-program'?{activeProgramId:null}:{}),scheduledSessions:sessions,programCancellations:validate(records)};
 }
 function restore(state,recordId,{asOf,now=new Date().toISOString(),confirmed=false,draftOpen=false,expected}={}){
  if(draftOpen||!confirmed||!S.date(asOf)||!iso(now)||asOf>now.slice(0,10))throw Error('Confirm restoration and finish any open draft');const records=validate(state.programCancellations||[]),r=records.find(r=>r.id===recordId),v=r?.revisions.at(-1);if(v?.status!=='cancelled'||now<=v.recordedAt)throw Error('Cancellation is unavailable for restoration');
  if(expected!==undefined&&!same(r,expected))throw Error('Program cancellation changed; reopen restoration');
  if(r.kind==='legacy-program'&&state.activeProgramId!=null&&String(state.activeProgramId)!==r.programId)throw Error('Another legacy program is active; cancel it first');
  const rows=S.list(state.scheduledSessions||[]),logged=new Set((state.workouts||[]).map(w=>w.sessionIntent?.schedule?.id));
  const restoreIds=new Set(v.sessions.map(s=>s.id)),dates=new Set(v.sessions.map(s=>s.before.date));if(rows.some(s=>!restoreIds.has(s.id)&&dates.has(s.date)&&s.status==='scheduled'))throw Error('Another session conflicts with restoration');
  for(const s of v.sessions){const row=rows.find(x=>x.id===s.id);if(s.before.date<asOf||!row||row.status!=='cancelled'||row.revisionAt!==v.recordedAt||logged.has(s.id)||now<=row.revisionAt)throw Error('Cancelled dates expired or Calendar changed; create a new reviewed plan');}
  // A replacement program can span this interval even when its training days differ.
  const p=programs(state).find(p=>p.id===r.programId&&p.kind===r.kind),own=rows.filter(s=>s.id.startsWith(p?.prefix||'\0'));const start=own[0]?.date,end=own.at(-1)?.date;if(r.kind!=='legacy-program'&&(!end||end<asOf))throw Error('Program dates expired; create a new reviewed plan');
  if(programs(state).some(q=>q.id!==r.programId&&!isCancelled(state,q.id,q.kind)&&rows.some(s=>s.id.startsWith(q.prefix)&&s.status==='scheduled'&&s.date>=start&&s.date<=end)))throw Error('A replacement program overlaps; cancel it before restoration');
  let sessions=state.scheduledSessions||[];for(const s of v.sessions)sessions=S.change(sessions,s.id,{status:'scheduled',reason:'Program restored after cancellation'},now);
  r.revisions.push({recordedAt:now,asOf,status:'restored',reason:'Athlete restored the cancelled program',sessions:clone(v.sessions)});return {...state,...(r.kind==='legacy-program'?{activeProgramId:(state.programs||[]).find(p=>String(p.id)===r.programId)?.id}:{}),scheduledSessions:sessions,programCancellations:validate(records)};
 }
 return {TYPES,validate,validateState,isCancelled,programs,inspect,cancel,restore};
});
