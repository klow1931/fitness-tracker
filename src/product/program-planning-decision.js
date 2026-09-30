/* Loadnote v2.68 — deterministic meet-prep planning decision.
   Athlete supplies dates/constraints; Decisions derives supported phase structure. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'));
  else root.LoadnoteProgramPlanningDecision=factory(root.LoadnoteProgrammingProfile);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile){
  'use strict';
  const VERSION=1,POLICY='program-planning-decision-v1';
  const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'));
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const canonical=value=>{
    if(value===undefined)return '"__undefined__"';
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  };
  function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
  const fingerprint=value=>hash(canonical(value));
  function daysBetween(a,b){return Math.floor((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);}
  function totalWeeks(start,eventDate){
    if(!validDate(start)||!validDate(eventDate)||eventDate<start)return null;
    return Math.floor(daysBetween(start,eventDate)/7)+1;
  }
  function phaseEvidence(source,profile){
    const objective=source?.objectiveSnapshot?.recommendation||null;
    if(objective&&Number.isInteger(objective.accumulationWeeks)&&Number.isInteger(objective.strengthWeeks)&&objective.accumulationWeeks>=2&&objective.strengthWeeks>=2){
      const total=objective.accumulationWeeks+objective.strengthWeeks;
      return {source:'transition-objective',ratio:objective.accumulationWeeks/total,label:objective.label||'transition-derived block',driver:objective.driver||null,reason:objective.reason||'Frozen transition/goal evidence supplies the development emphasis.'};
    }
    const rows=Object.values(source?.startingPrescriptionSnapshot?.lifts||{}),counts={supported:0,limited:0,gather:0};
    for(const row of rows)if(Object.hasOwn(counts,row?.confidence))counts[row.confidence]++;
    if(counts.gather>=2||profile?.consistency==='inconsistent')return {source:'starting-evidence',ratio:.6,label:'development emphasis',driver:counts.gather>=2?'sparse-recent-evidence':'inconsistent-recent-training',reason:counts.gather>=2?'At least two competition lifts still have sparse recent starting-prescription evidence, so more of the available base is allocated to accumulation.':'Recent consistency is marked inconsistent, so more of the available base is allocated to accumulation.' ,counts};
    if(rows.length===3&&counts.supported===3&&profile?.consistency==='consistent')return {source:'starting-evidence',ratio:.5,label:'balanced development/strength',driver:'supported-consistent-history',reason:'All three lift starting prescriptions have supported recent evidence and training is marked consistent, so the available base is split evenly between accumulation and strength.',counts};
    return {source:'default-guardrail',ratio:.55,label:'slight accumulation emphasis',driver:'bounded-default',reason:'No stronger frozen transition signal is available, so Decisions uses the existing conservative 55/45 accumulation-to-strength base split.',counts};
  }
  function autoPhases(weeks,evidence){
    const taperWeeks=1,peakWeeks=weeks===7?1:2,baseWeeks=weeks-peakWeeks-taperWeeks-1;
    let accumulationWeeks,strengthWeeks;
    if(baseWeeks<=12){
      accumulationWeeks=clamp(Math.round(baseWeeks*evidence.ratio),2,baseWeeks-2);
      strengthWeeks=baseWeeks-accumulationWeeks;
      if(accumulationWeeks>6){accumulationWeeks=6;strengthWeeks=baseWeeks-6;}
      if(strengthWeeks>6){strengthWeeks=6;accumulationWeeks=baseWeeks-6;}
    }else{
      accumulationWeeks=clamp(Math.round(baseWeeks*evidence.ratio),6,baseWeeks-6);
      strengthWeeks=baseWeeks-accumulationWeeks;
    }
    return {accumulationWeeks,strengthWeeks,peakWeeks,taperWeeks,baseWeeks};
  }
  function overridePhases(raw,weeks){
    if(raw==null)return null;
    const names=['accumulationWeeks','strengthWeeks','peakWeeks','taperWeeks'],out={};
    for(const name of names){const n=Number(raw[name]);if(!Number.isInteger(n))throw Error('Custom phase lengths must use whole weeks');out[name]=n;}
    if(out.accumulationWeeks<2||out.strengthWeeks<2||out.peakWeeks<1||out.peakWeeks>4||out.taperWeeks<1||out.taperWeeks>2)throw Error('Custom phases need at least 2 accumulation, 2 strength, 1–4 peak and 1–2 taper weeks');
    if(out.accumulationWeeks+out.strengthWeeks+out.peakWeeks+out.taperWeeks+1!==weeks)throw Error('Custom phase lengths must add up to the meet-date timeline, including one event week');
    return {...out,baseWeeks:out.accumulationWeeks+out.strengthWeeks};
  }
  function decisionPayload(value){const x=copy(value);delete x.decisionFingerprint;return x;}
  function plan(state,source,input,{asOf,now=new Date().toISOString()}={}){
    if(!validDate(asOf)||!iso(now)||now.slice(0,10)<asOf)throw Error('Choose a valid meet-prep planning date');
    if(!source?.config||!validDate(source.config.startDate))throw Error('A reviewed lift setup with a valid start week is required');
    const cutoff=now<asOf+'T23:59:59.999Z'?now:asOf+'T23:59:59.999Z',profileRecord=Profile.current(state?.programmingProfiles||[],cutoff);
    if(!profileRecord?.context)throw Error('Create a programming profile first');
    const profile=profileRecord.context,eventType=input?.eventType||'mock',eventName=String(input?.eventName||'').trim(),eventDate=input?.meetDate||profile.eventDate||null,startDate=source.config.startDate;
    if(!['mock','competition'].includes(eventType))throw Error('Choose mock meet or competition meet');
    if(eventType==='competition'&&!eventName)throw Error('Enter the competition meet name');
    if(!validDate(eventDate))throw Error('Choose the event date. Decisions uses that date to calculate the prep length.');
    if(eventType==='mock'&&![0,6].includes(new Date(eventDate+'T12:00:00Z').getUTCDay()))throw Error('Mock meet must be Saturday or Sunday');
    const weeks=totalWeeks(startDate,eventDate),request={meetDate:eventDate,eventType,eventName:eventType==='competition'?eventName:'',phaseOverride:input?.phaseOverride?copy(input.phaseOverride):null};
    const contextFingerprint=fingerprint({sourceProgramId:source.id||null,sourceConfig:source.config,objectiveSnapshot:source.objectiveSnapshot||null,startingPrescriptionSnapshot:source.startingPrescriptionSnapshot||null,profileId:profileRecord.id||null,profile,asOf,cutoff,request});
    if(weeks==null||weeks<7){
      const out={version:VERSION,policy:POLICY,status:'unsupported-short',mode:'decisions',asOf,cutoff,sourceProgramId:source.id||null,input:request,inputFingerprint:contextFingerprint,startDate,eventDate,totalWeeks:weeks,summary:(weeks==null?'The event date is before the reviewed program start.':weeks+' weeks are available, but Loadnote’s supported meet-prep structure requires at least 7 weeks including the event week.'),reasons:['Loadnote will not silently squeeze accumulation, strength, peak, taper and the event into an unsupported timeline.'],config:null};
      out.decisionFingerprint=fingerprint(decisionPayload(out));return out;
    }
    if(weeks>52){
      const out={version:VERSION,policy:POLICY,status:'unsupported-long',mode:'decisions',asOf,cutoff,sourceProgramId:source.id||null,input:request,inputFingerprint:contextFingerprint,startDate,eventDate,totalWeeks:weeks,summary:weeks+' weeks are available, beyond the current 52-week meet-cycle limit.',reasons:['Use an earlier development block before creating the final meet-prep cycle rather than pretending the current generator individualizes an entire longer horizon.'],config:null};
      out.decisionFingerprint=fingerprint(decisionPayload(out));return out;
    }
    const evidence=phaseEvidence(source,profile),automatic=autoPhases(weeks,evidence),custom=overridePhases(request.phaseOverride,weeks),phases=custom||automatic,mode=custom?'athlete-customized':'decisions';
    const config={version:1,weeks,peakWeeks:phases.peakWeeks,taperWeeks:phases.taperWeeks,accumulationWeeks:phases.accumulationWeeks,strengthWeeks:phases.strengthWeeks,meetDate:eventDate,eventType,eventName:eventType==='competition'?eventName:null};
    const reasons=[
      weeks+' weeks are available from the reviewed start week '+startDate+' through the event week containing '+eventDate+'.',
      custom?'You opened advanced controls and overrode the default phase allocation; the meet date still fixes the total timeline.':evidence.reason,
      custom?'Custom phase lengths passed the same structural minimums as the automatic plan.':(phases.peakWeeks===1?'A 1-week peak preserves the minimum 2-week accumulation and 2-week strength phases in this short supported prep.':'The normal supported structure reserves 2 peaking weeks, 1 taper week and 1 event week before dividing the remaining base time.'),
    ];
    if(phases.accumulationWeeks>6||phases.strengthWeeks>6)reasons.push('This long timeline extends beyond the six-week progressive window in at least one base phase; those extra weeks hold the last supported loading target and will be surfaced by the whole-program quality gate.');
    const out={version:VERSION,policy:POLICY,status:'ready',mode,asOf,cutoff,sourceProgramId:source.id||null,input:request,inputFingerprint:contextFingerprint,startDate,eventDate,totalWeeks:weeks,phaseEvidence:copy(evidence),metrics:{baseWeeks:phases.baseWeeks,startingEvidenceCounts:copy(evidence.counts||null),extendedHoldWeeks:Math.max(0,phases.accumulationWeeks-6)+Math.max(0,phases.strengthWeeks-6)},phases:{accumulationWeeks:phases.accumulationWeeks,strengthWeeks:phases.strengthWeeks,peakWeeks:phases.peakWeeks,taperWeeks:phases.taperWeeks,eventWeeks:1},summary:weeks+' weeks · '+phases.accumulationWeeks+' accumulation → '+phases.strengthWeeks+' strength → '+phases.peakWeeks+' peak → '+phases.taperWeeks+' taper → event',reasons,config,notes:['The athlete supplies the event, availability, equipment and lift identities; Decisions calculates the supported timeline.','This is deterministic program structure, not a prediction of recovery, readiness or meet performance.','Advanced phase overrides remain athlete-controlled and are never applied silently.']};
    out.decisionFingerprint=fingerprint(decisionPayload(out));return out;
  }
  function validate(raw,source,config=null){
    if(!raw||raw.version!==VERSION||raw.policy!==POLICY||!['ready','unsupported-short','unsupported-long'].includes(raw.status)||!validDate(raw.asOf)||!iso(raw.cutoff)||!validDate(raw.startDate)||!validDate(raw.eventDate)||!raw.input||typeof raw.inputFingerprint!=='string'||typeof raw.decisionFingerprint!=='string'||!Array.isArray(raw.reasons))throw Error('Invalid program-planning decision snapshot');
    if(raw.sourceProgramId!==(source?.id||null)||raw.startDate!==source?.config?.startDate)throw Error('Program-planning decision does not match the reviewed lift setup');
    if(raw.decisionFingerprint!==fingerprint(decisionPayload(raw)))throw Error('Program-planning decision fingerprint mismatch');
    if(raw.status==='ready'){
      if(!raw.config||raw.totalWeeks!==raw.config.weeks||raw.config.meetDate!==raw.eventDate||!raw.phases||raw.phases.accumulationWeeks+raw.phases.strengthWeeks+raw.phases.peakWeeks+raw.phases.taperWeeks+1!==raw.totalWeeks)throw Error('Program-planning decision phase structure is inconsistent');
      if(config&&canonical(raw.config)!==canonical(config))throw Error('Program-planning decision does not match the saved cycle configuration');
    }else if(raw.config!==null)throw Error('Unsupported planning decisions cannot contain a generated cycle config');
    return copy(raw);
  }
  return {VERSION,POLICY,totalWeeks,phaseEvidence,autoPhases,plan,validate,fingerprint};
});