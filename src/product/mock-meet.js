/* v2.34 — athlete-entered mock-meet attempts and read-only post-cycle context.
   Attempts are actual meet-day entries, never automatic opener recommendations. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./meet-cycle'),require('./cycle-response'),require('./schedule'));
 else root.LoadnoteMockMeet=factory(root.LoadnoteCore,root.LoadnoteMeetCycle,root.LoadnoteCycleResponse,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Cycle,Response,Schedule){
 'use strict';
 const LIFTS=['squat','bench','deadlift'],STATES=['unrecorded','made','missed','passed'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const round=n=>Math.round(n*100)/100;
 function attempts(raw){
   if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!LIFTS.includes(k)))throw Error('Record attempts for the three competition lifts');
   return Object.fromEntries(LIFTS.map(lift=>{
     const entries=raw[lift];if(!Array.isArray(entries)||entries.length!==3)throw Error('Provide three attempt slots for '+lift);
     return [lift,entries.map((a,i)=>{
       if(!a||!STATES.includes(a.status))throw Error('Choose a valid outcome for '+lift+' attempt '+(i+1));
       const weight=a.weightKg;
       if(a.status==='made'||a.status==='missed'){
         if(typeof weight!=='number'||!Number.isFinite(weight)||weight<1||weight>1000||Math.abs(round(weight)-weight)>.000001)throw Error('Enter a valid kg load for '+lift+' attempt '+(i+1));
         return {status:a.status,weightKg:weight};
       }
       if(weight!=null)throw Error('Only made and missed attempts can contain a load');
       return {status:a.status,weightKg:null};
     })];
   }));
 }
 const empty=()=>Object.fromEntries(LIFTS.map(l=>[l,Array.from({length:3},()=>({status:'unrecorded',weightKg:null}))]));
 function context(raw,cycle){
   if(!raw||raw.date!==cycle.config.meetDate)throw Error('Mock-meet results must belong to the approved event date');
   if(typeof raw.notes!=='string'||raw.notes.length>1000)throw Error('Notes must be 1,000 characters or fewer');
   const recorded=attempts(raw.attempts);
   if(!LIFTS.some(l=>recorded[l].some(a=>a.status!=='unrecorded')))throw Error('Record at least one attempt before saving results');
   return {date:raw.date,attempts:recorded,notes:raw.notes.trim()};
 }
 function validate(state){
   const cycles=Cycle.validate(state.meetCycles||[]);
   for(const cycle of cycles){
     if(cycle.mockMeet==null)continue;
     if(!cycle.scheduledAt||cycle.mockMeet.version!==1||!Array.isArray(cycle.mockMeet.revisions)||!cycle.mockMeet.revisions.length||cycle.mockMeet.revisions.length>50)throw Error('Invalid mock-meet results history');
     let prev='';
     for(const v of cycle.mockMeet.revisions){
       if(!iso(v.recordedAt)||v.recordedAt<=prev||v.recordedAt<cycle.config.meetDate+'T00:00:00.000Z'||v.recordedAt<cycle.scheduledAt)throw Error('Invalid mock-meet revision chronology');
       const normalized=context(v.context,cycle);
       if(JSON.stringify(normalized)!==JSON.stringify(v.context))throw Error('Invalid mock-meet result fields');
       prev=v.recordedAt;
     }
   }
   return cycles;
 }
 function save(state,cycleId,raw,{confirmed=false,now=new Date().toISOString(),expectedRevision=null}={}){
   if(!confirmed||!iso(now))throw Error('Review and confirm your actual mock-meet attempts');
   const cycles=validate(state),cycle=cycles.find(c=>c.id===cycleId);
   if(!cycle||!cycle.scheduledAt||now<cycle.config.meetDate+'T00:00:00.000Z'||now<cycle.scheduledAt)throw Error('Results can only be recorded on or after the scheduled mock meet');
   const prev=cycle.mockMeet?.revisions.at(-1)||null;
   if((prev?.recordedAt||null)!==expectedRevision)throw Error('Results changed on another device or tab. Reload before saving.');
   if(prev&&now<=prev.recordedAt)throw Error('A later timestamp is needed for a result correction');
   const result=context(raw,cycle);
   if(prev&&JSON.stringify(prev.context)===JSON.stringify(result))throw Error('No result changes to save');
   const revision={recordedAt:now,context:result};
   cycle.mockMeet={version:1,revisions:[...(cycle.mockMeet?.revisions||[]),revision]};
   return {...state,meetCycles:validate({...state,meetCycles:cycles})};
 }
 function inspect(state,{cycleId,asOf,now=new Date().toISOString()}={}){
   if(!Schedule.date(asOf)||!iso(now)||asOf>now.slice(0,10))throw Error('Choose a valid mock-meet report date');
   const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',cycle=validate(state).find(c=>c.id===cycleId);
   if(!cycle||!cycle.scheduledAt||cycle.scheduledAt>cutoff)return null;
   const rev=cycle.mockMeet?.revisions.filter(r=>r.recordedAt<=cutoff).at(-1)||null;
   const results=rev?.context.attempts||empty(),lifts={};let total=0,allThree=true;
   for(const lift of LIFTS){
     const entries=results[lift],made=entries.filter(a=>a.status==='made'),best=made.length?Math.max(...made.map(a=>a.weightKg)):null;
     if(best==null)allThree=false;else total+=best;
     lifts[lift]={name:cycle.sourceProgram.config.lifts[lift].name,exerciseId:cycle.sourceProgram.config.lifts[lift].exerciseId,
       attempts:copy(entries),made:made.length,missed:entries.filter(a=>a.status==='missed').length,passed:entries.filter(a=>a.status==='passed').length,
       unrecorded:entries.filter(a=>a.status==='unrecorded').length,bestKg:best,sourceTrainingMaxKg:cycle.sourceProgram.config.lifts[lift].trainingMaxKg};
   }
   const phaseContext=asOf>=cycle.config.meetDate?Response.inspect(state,{cycleId,asOf,now}):null;
   return {version:1,cycleId:cycle.id,asOf,cutoff,meetDate:cycle.config.meetDate,revisionAt:rev?.recordedAt||null,notes:rev?.context.notes||'',resultRecorded:!!rev,
     lifts,totalKg:allThree?round(total):null,phaseContext:phaseContext?{completedWeeks:phaseContext.completedWeeks,totalWeeks:phaseContext.totalWeeks,phases:phaseContext.phases.map(p=>({phase:p.phase,weekCount:p.weekCount,plannedSessions:p.plannedSessions,linkedSessions:p.linkedSessions,unconfirmedSessions:p.unconfirmedSessions,explicitSkips:p.explicitSkips,lifts:Object.fromEntries(LIFTS.map(l=>[l,{originalSets:p.lifts[l].originalSets,loggedSets:p.lifts[l].loggedSets,capacityDates:p.lifts[l].capacityDates,observedChangePct:p.lifts[l].observedChangePct}]))}))}:null,
     notice:'Only athlete-entered made attempts establish meet results. The total appears only when all three lifts have a made attempt. Training maxes and estimated submaximal capacity are not measured mock-meet bests. No attempt advice, causal claims, training edits or readiness diagnoses.'};
 }
 return {empty,attempts,validate,save,inspect};
});
