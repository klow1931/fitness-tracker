/* Loadnote v2.66 — cycle decision observability, reproducibility and read-only journal. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'));
  else root.LoadnoteCycleObservability=factory(root.LoadnoteCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
  'use strict';
  const VERSION=1,LIFTS=['squat','bench','deadlift'];
  const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'));
  const finite=x=>x===null||x===undefined||x===''?null:Number.isFinite(Number(x))?Number(x):null;
  const canonical=value=>{
    if(value===undefined)return '"__undefined__"';
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  };
  function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
  const fingerprint=value=>hash(canonical(value));
  function environment({capturedAt,purpose='cycle-decision',policies={}}={}){
    if(!iso(capturedAt))throw Error('Decision environment needs an ISO capture time');
    if(typeof purpose!=='string'||!purpose||purpose.length>80)throw Error('Decision environment needs a purpose');
    const clean={};
    for(const [key,value] of Object.entries(policies||{})){if(value==null)continue;if(typeof value!=='string'||!value||value.length>120)throw Error('Invalid decision policy identity');clean[key]=value;}
    return {version:1,releaseVersion:String(Core.RELEASE_VERSION||''),schemaVersion:Number(Core.SCHEMA_VERSION)||null,capturedAt,purpose,policies:clean};
  }
  function validateEnvironment(raw,{capturedAt=null,purpose=null}={}){
    if(!raw||raw.version!==1||typeof raw.releaseVersion!=='string'||!raw.releaseVersion||!Number.isInteger(raw.schemaVersion)||raw.schemaVersion<1||!iso(raw.capturedAt)||typeof raw.purpose!=='string'||!raw.purpose||!raw.policies||typeof raw.policies!=='object'||Array.isArray(raw.policies))throw Error('Invalid decision environment');
    if(capturedAt&&raw.capturedAt!==capturedAt)throw Error('Decision environment time does not match its saved record');
    if(purpose&&raw.purpose!==purpose)throw Error('Decision environment purpose does not match its saved record');
    for(const [key,value] of Object.entries(raw.policies))if(typeof key!=='string'||!key||typeof value!=='string'||!value)throw Error('Invalid decision policy identity');
    return copy(raw);
  }
  function programEnvironment({capturedAt,purpose='program-review',policies={}}={}){
    return environment({capturedAt,purpose,policies});
  }
  function responseInput(response,phase){
    if(!response)return null;
    const found=(response.phases||[]).find(p=>p.phase===phase)||null;
    return {version:response.version??null,asOf:response.asOf??null,cutoff:response.cutoff??null,phases:found?[copy(found)]:[]};
  }
  function learningInput(summary,controller){
    if(!summary)return null;
    const wanted=new Set();
    for(const lift of LIFTS){const action=controller?.lifts?.[lift]?.history?.pattern?.action||controller?.lifts?.[lift]?.action;if(action&&action!=='keep')wanted.add(lift+'|'+action);}
    const patterns=(summary.patterns||[]).filter(p=>wanted.has(p.lift+'|'+p.action)).map(copy);
    return {recorded:finite(summary.recorded),observed:finite(summary.observed),unobserved:finite(summary.unobserved),patterns};
  }
  function captureController({report,controller,response=null,learningSummary=null,generatedAt}={}){
    if(!report||!controller||!iso(generatedAt))throw Error('A reviewed report, controller result and generation time are required');
    if(controller.cycleId!==report.cycleId||controller.week!==report.week||controller.asOf!==report.asOf||controller.phase!==report.phase||controller.nextPhase!==report.nextPhase)throw Error('Controller result does not match the reviewed cycle week');
    if(!controller.policy||!report.policy||!report.phasePolicy?.id)throw Error('Controller and review policy identities are required');
    const inputs={response:responseInput(response,report.phase),learningSummary:learningInput(learningSummary,controller)};
    const recommendation=copy(controller);
    const env=environment({capturedAt:generatedAt,purpose:'cycle-controller',policies:{cycleReview:report.policy,cycleAdaptive:controller.policy,phasePolicy:report.phasePolicy.id}});
    const base={version:1,cycleId:report.cycleId,week:report.week,asOf:report.asOf,knowledgeCutoff:report.cutoff,generatedAt,environment:env,reviewFingerprint:fingerprint(report),inputFingerprint:fingerprint(inputs),recommendationFingerprint:fingerprint(recommendation),inputs,recommendation};
    return base;
  }
  function validateControllerSnapshot(raw,report,{savedAt=null}={}){
    if(!raw||raw.version!==1||!report||raw.cycleId!==report.cycleId||raw.week!==report.week||raw.asOf!==report.asOf||raw.knowledgeCutoff!==report.cutoff||!iso(raw.generatedAt)||!iso(raw.knowledgeCutoff)||raw.knowledgeCutoff>raw.generatedAt||raw.reviewFingerprint!==fingerprint(report)||!raw.inputs||raw.inputFingerprint!==fingerprint(raw.inputs)||!raw.recommendation||raw.recommendationFingerprint!==fingerprint(raw.recommendation))throw Error('Invalid or stale controller snapshot');
    validateEnvironment(raw.environment,{capturedAt:raw.generatedAt,purpose:'cycle-controller'});
    if(raw.recommendation.cycleId!==report.cycleId||raw.recommendation.week!==report.week||raw.recommendation.asOf!==report.asOf||raw.recommendation.policy!==raw.environment.policies.cycleAdaptive||report.policy!==raw.environment.policies.cycleReview||report.phasePolicy?.id!==raw.environment.policies.phasePolicy)throw Error('Controller snapshot policy or cycle identity mismatch');
    if(!raw.recommendation.choices||LIFTS.some(l=>!['keep','reduce-one','reduce-load','increase-load'].includes(raw.recommendation.choices[l])))throw Error('Controller snapshot has invalid lift recommendations');
    if(savedAt&&(!iso(savedAt)||raw.generatedAt>savedAt))throw Error('Controller snapshot was generated after the saved review');
    return copy(raw);
  }
  function verifyReplay(snapshot,report,recommender){
    const saved=validateControllerSnapshot(snapshot,report);
    if(!recommender||typeof recommender.recommendFromReports!=='function')throw Error('A controller recommender is required for replay');
    const replayed=recommender.recommendFromReports(report,saved.inputs.response?saved.inputs.response:null,saved.inputs.learningSummary||null);
    const actual=fingerprint(replayed),expected=saved.recommendationFingerprint;
    return {version:1,status:actual===expected?'match':'mismatch',expectedFingerprint:expected,actualFingerprint:actual,replayed};
  }
  function nextOutcome(state,cycle,review,lift,cutoff){
    const exerciseId=review.report?.findings?.[lift]?.exerciseId,nextWeek=review.report?.nextWeek;
    if(!exerciseId||!Number.isInteger(nextWeek))return {status:'unavailable',reason:'Saved review lacks a competition-lift identity or next-week reference.'};
    const targets=(cycle.sessions||[]).filter(s=>s.week===nextWeek&&s.exercises?.some(e=>e.exerciseId===exerciseId)).sort((a,b)=>a.date.localeCompare(b.date));
    const workouts=(state.workouts||[]).filter(w=>iso(w.createdAt)&&w.createdAt<=cutoff&&date(w.date)&&w.date<=cutoff.slice(0,10)),chosen=review.choices?.[lift]||'keep';
    let sawNonAttributable=false;
    const exercisePlan=(prescription,id)=>(prescription?.plannedExercises||[]).filter(e=>e.exerciseId===id);
    for(const target of targets){
      const scheduleId='meet:'+cycle.id+':'+target.key,linked=workouts.filter(w=>w.sessionIntent?.schedule?.id===scheduleId);
      if(linked.length!==1){if(linked.length>1)sawNonAttributable=true;continue;}
      const w=linked[0],record=(state.scheduledSessions||[]).find(s=>s.id===scheduleId),revision=record?.revisions?.find(r=>r.recordedAt===w.sessionIntent?.schedule?.revisionAt);
      if(!revision||revision.recordedAt>w.createdAt||revision.context?.date!==w.date||!revision.context?.prescription||!w.sessionIntent?.prescription||fingerprint(w.sessionIntent.prescription)!==fingerprint(revision.context.prescription)){sawNonAttributable=true;continue;}
      const reviewChange=(review.changes||[]).find(change=>change.id===scheduleId)||null;
      if(chosen!=='keep'){
        if(!reviewChange||revision.recordedAt!==reviewChange.after?.recordedAt){sawNonAttributable=true;continue;}
      }else{
        const original=record?.revisions?.[0]?.context?.prescription;
        if(fingerprint(exercisePlan(original,exerciseId))!==fingerprint(exercisePlan(revision.context?.prescription,exerciseId))){sawNonAttributable=true;continue;}
      }
      const values=[],rpes=[];
      for(const ex of w.exercises||[])if(ex.exerciseId===exerciseId&&ex.type!=='cardio'&&ex.trackBy!=='duration')for(const set of ex.sets||[]){
        const ev=Core.capacityEvidence(set.weight,set.reps,set.rpe);if(ev.estimate!=null)values.push(ev.estimate);
        const effort=finite(set.rpe);if(effort!=null&&effort>=1&&effort<=10)rpes.push(effort);
      }
      return {status:'observed',workoutId:w.id||null,date:w.date||target.date,scheduleId,revisionAt:w.sessionIntent?.schedule?.revisionAt||null,capacityKg:values.length?Math.max(...values):null,capacityStatus:values.length?'usable':'missing-or-ineligible-rpe',averageRpe:rpes.length?Core.round(rpes.reduce((a,b)=>a+b,0)/rpes.length,1):null};
    }
    const pastTargets=targets.filter(t=>t.date<=cutoff.slice(0,10));
    if(sawNonAttributable&&pastTargets.length)return {status:'revised-or-deviated',reason:'A linked next-week workout exists, but its captured prescription cannot be attributed cleanly to this saved lift decision.'};
    return {status:pastTargets.length?'unobserved':'awaiting',reason:pastTargets.length?'No unique linked workout is available for the next matching competition-lift exposure.':'The next matching competition-lift exposure is still in the future.'};
  }
  function eventResult(cycle,cutoff){
    const type=cycle.config?.eventType==='competition'?'competition':'mock',record=type==='competition'?cycle.meetResult:cycle.mockMeet;
    const revisions=(record?.revisions||[]).filter(r=>iso(r.recordedAt)&&r.recordedAt<=cutoff);
    const rev=revisions.at(-1);if(!rev)return null;
    const bestKg={};
    for(const lift of LIFTS){const made=(rev.context?.attempts?.[lift]||[]).filter(a=>a.status==='made'&&finite(a.weightKg)>0);bestKg[lift]=made.length?Math.max(...made.map(a=>finite(a.weightKg))):null;}
    const totalKg=LIFTS.every(l=>bestKg[l]>0)?Core.round(LIFTS.reduce((n,l)=>n+bestKg[l],0),2):null;
    return {type,date:cycle.config.meetDate,recordedAt:rev.recordedAt,bestKg,totalKg};
  }
  function timeline(state,{cycleId,asOf,knownAt}={}){
    if(typeof cycleId!=='string'||!cycleId||!date(asOf))throw Error('Choose a cycle and valid journal date');
    const cutoff=knownAt||asOf+'T23:59:59.999Z';if(!iso(cutoff))throw Error('Choose a valid journal knowledge cutoff');
    const cycle=(state.meetCycles||[]).find(c=>c.id===cycleId);if(!cycle)throw Error('Cycle not found');if(!iso(cycle.createdAt)||cycle.createdAt>cutoff)throw Error('Cycle was not known at the journal cutoff');
    const events=[];
    const source=cycle.sourceProgram||null;
    if(source?.createdAt&&source.createdAt<=cutoff)events.push({kind:'starting-program',at:source.createdAt,date:source.config?.startDate||null,label:'Starting program reviewed',environment:copy(source.decisionEnvironment||null),startingPrescription:copy(source.startingPrescriptionSnapshot||null)});
    if(cycle.createdAt&&cycle.createdAt<=cutoff)events.push({kind:'cycle-reviewed',at:cycle.createdAt,date:cycle.config?.startDate||null,label:'Meet cycle reviewed',environment:copy(cycle.decisionEnvironment||null),qualityGate:copy(cycle.qualityGate||null),weeks:cycle.config?.weeks||null,eventType:cycle.config?.eventType||'mock'});
    for(const review of (cycle.weeklyReviews||[]).filter(r=>r.createdAt<=cutoff).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){
      const controller=review.controllerSnapshot?validateControllerSnapshot(review.controllerSnapshot,review.report,{savedAt:review.createdAt}):null;
      const lifts={};
      for(const lift of LIFTS){
        const recommended=controller?.recommendation?.choices?.[lift]||null,chosen=review.choices?.[lift]||null;
        lifts[lift]={lift,recommended,chosen,athleteDecision:recommended==null?'legacy-unknown':recommended===chosen?'accepted':'overridden',outcome:nextOutcome(state,cycle,review,lift,cutoff)};
      }
      events.push({kind:'weekly-review',at:review.createdAt,date:review.asOf,label:'Week '+review.week+' review',week:review.week,phase:review.report?.phase||null,nextPhase:review.report?.nextPhase||null,choices:copy(review.choices),controllerSnapshot:copy(controller),calendarChanges:(review.changes||[]).map(c=>({scheduleId:c.id,beforeRevisionAt:c.before?.recordedAt||null,afterRevisionAt:c.after?.recordedAt||null})),lifts,notes:review.notes||''});
    }
    const event=eventResult(cycle,cutoff);if(event)events.push({kind:'event-result',at:event.recordedAt,date:event.date,label:event.type==='competition'?'Competition results recorded':'Mock-meet results recorded',result:event});
    const transition=(state.transitionSnapshots||[]).filter(t=>t.programId===cycleId&&t.createdAt<=cutoff).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).at(-1)||null;
    if(transition)events.push({kind:'transition',at:transition.createdAt,date:transition.asOf,label:'Transition baseline frozen',transitionId:transition.id,schedule:copy(transition.schedule),lifts:copy(transition.lifts),event:copy(transition.event||null)});
    events.sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))||String(a.kind).localeCompare(String(b.kind)));
    const reviews=events.filter(e=>e.kind==='weekly-review'),decisions=reviews.flatMap(e=>Object.values(e.lifts));
    return {version:1,cycleId,cycleName:cycle.sourceProgram?.config?.name||'Meet cycle',asOf,cutoff,events,summary:{reviews:reviews.length,controllerSnapshots:reviews.filter(r=>r.controllerSnapshot).length,acceptedRecommendations:decisions.filter(d=>d.athleteDecision==='accepted').length,overriddenRecommendations:decisions.filter(d=>d.athleteDecision==='overridden').length,legacyUnknownRecommendations:decisions.filter(d=>d.athleteDecision==='legacy-unknown').length,calendarRevisions:reviews.reduce((n,r)=>n+r.calendarChanges.length,0),eventRecorded:!!event,transitionFrozen:!!transition},notes:['Journal entries are assembled from authoritative saved program, review, Calendar, workout, event and transition records; this is not a duplicate training database.','Later outcomes are observational. They do not prove that a recommendation or athlete choice caused the result.','Unknown, unobserved and awaiting evidence remain distinct from a measured zero or stable result.']};
  }
  function audit(state,{cycleId=null,asOf=new Date().toISOString().slice(0,10)}={}){
    if(!date(asOf))throw Error('Choose a valid audit date');
    const issues=[];let blocking=0,warnings=0;
    const add=(code,severity,detail,extra={})=>{issues.push({code,severity,detail,...extra});if(severity==='blocking')blocking++;else warnings++;};
    const cutoff=asOf+'T23:59:59.999Z',allCycles=state.meetCycles||[],cycles=allCycles.filter(c=>(!cycleId||c.id===cycleId)&&(!c.createdAt||c.createdAt<=cutoff)),sourceIds=new Set(cycles.map(c=>c.sourceProgram?.id||c.config?.sourceProgramId).filter(Boolean)),programs=(state.phasePrograms||[]).filter(p=>(!cycleId||sourceIds.has(p.id))&&(!p.createdAt||p.createdAt<=cutoff));
    for(const p of programs){
      if(p.decisionEnvironment){try{const env=validateEnvironment(p.decisionEnvironment,{capturedAt:p.createdAt,purpose:'phase-program-review'});if(env.policies.phaseBuilder!=='phase-builder-v1'||env.policies.startingPrescription!=='starting-prescription-v1')throw Error('Phase-program policy identities do not match this recorded program format');}catch(e){add('invalid-program-environment','blocking',e.message,{programId:p.id});}}
      else add('legacy-program-without-environment','warning','This phase program predates frozen decision-environment metadata.',{programId:p.id});
    }
    for(const cycle of cycles){
      if(cycle.decisionEnvironment){try{const env=validateEnvironment(cycle.decisionEnvironment,{capturedAt:cycle.createdAt,purpose:'meet-cycle-review'});if(env.policies.meetCycle!=='meet-cycle-v1')throw Error('Meet-cycle policy identity does not match this recorded cycle format');}catch(e){add('invalid-cycle-environment','blocking',e.message,{cycleId:cycle.id});}}
      else add('legacy-cycle-without-environment','warning','This meet cycle predates frozen decision-environment metadata.',{cycleId:cycle.id});
      if(cycle.qualityGate){try{
        const gate=cycle.qualityGate,expected=fingerprint({config:copy(cycle.config||null),sourceProgram:{id:cycle.sourceProgram?.id||null,config:copy(cycle.sourceProgram?.config||null)},sessions:copy(cycle.sessions||[]),weekly:copy(cycle.weekly||[])});
        if(gate.version!==1||gate.policy!=='program-quality-gate-v1'||gate.inputFingerprint!==expected||!['pass','review','blocking'].includes(gate.status)||!Array.isArray(gate.findings)||!gate.counts)throw Error('Program quality-gate snapshot does not match the saved original cycle');
        const gateBlocking=gate.findings.filter(f=>f.severity==='blocking').length,gateReview=gate.findings.filter(f=>f.severity==='review').length,gateStatus=gateBlocking?'blocking':gateReview?'review':'pass';
        if(gateBlocking!==gate.counts.blocking||gateReview!==gate.counts.review||gateStatus!==gate.status)throw Error('Program quality-gate status/counts are inconsistent');
        if(cycle.decisionEnvironment?.policies?.programQualityGate!==gate.policy)throw Error('Program quality-gate policy identity is missing or mismatched in the cycle decision environment');
        if(gate.status==='blocking')throw Error('A saved approved cycle contains a blocking program quality-gate result');
      }catch(e){add('invalid-program-quality-gate','blocking',e.message,{cycleId:cycle.id});}}
      else if(cycle.decisionEnvironment?.policies?.programQualityGate)add('missing-program-quality-gate','blocking','The cycle decision environment names a quality-gate policy but the frozen gate snapshot is missing.',{cycleId:cycle.id});
      else add('legacy-cycle-without-quality-gate','warning','This meet cycle predates frozen whole-cycle quality-gate metadata.',{cycleId:cycle.id});
      const auditedReviews=(cycle.weeklyReviews||[]).filter(r=>!r.createdAt||r.createdAt<=cutoff);
      for(const review of auditedReviews){
        if(review.controllerSnapshot){try{
          const snap=validateControllerSnapshot(review.controllerSnapshot,review.report,{savedAt:review.createdAt});
          for(const lift of LIFTS){
            const shown=snap.recommendation?.lifts?.[lift]?.observedChangePct,input=snap.inputs?.response?.phases?.[0]?.lifts?.[lift]?.observedChangePct;
            if(shown===0&&(input===null||input===undefined))add('unknown-capacity-coerced-zero','blocking','A saved controller snapshot shows 0% capacity change even though its frozen response input was unknown.',{cycleId:cycle.id,reviewId:review.id,lift});
          }
        }catch(e){add('invalid-controller-snapshot','blocking',e.message,{cycleId:cycle.id,reviewId:review.id});}}
        else if(review.version>=5)add('missing-controller-snapshot','blocking','A v2.66 weekly review is missing its frozen controller recommendation.',{cycleId:cycle.id,reviewId:review.id});
        else add('legacy-review-without-controller','warning','An older weekly review predates frozen controller recommendations; athlete choice remains valid but recommendation replay is unavailable.',{cycleId:cycle.id,reviewId:review.id});
        for(const change of review.changes||[]){
          const record=(state.scheduledSessions||[]).find(row=>row.id===change.id),revision=record?.revisions?.find(row=>row.recordedAt===change.after?.recordedAt);
          if(!revision||fingerprint(revision)!==fingerprint(change.after))add('calendar-effect-mismatch','blocking','A saved weekly-review Calendar effect is missing or differs from the referenced Calendar revision.',{cycleId:cycle.id,reviewId:review.id,scheduleId:change.id});
        }
      }
      const transition=(state.transitionSnapshots||[]).filter(t=>t.programId===cycle.id&&(!t.createdAt||t.createdAt<=cutoff)).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))).at(-1)||null;
      if(transition){
        for(const review of auditedReviews.filter(r=>r.version>=5)){
          const carried=transition.decisionHistory?.weeklyReviews?.find(r=>r.id===review.id);
          if(!carried?.controllerSnapshot)add('transition-controller-missing','blocking','The frozen transition handoff is missing a v2.66 weekly controller snapshot.',{cycleId:cycle.id,reviewId:review.id,transitionId:transition.id});
          else if(fingerprint(carried.controllerSnapshot)!==fingerprint(review.controllerSnapshot))add('transition-controller-mismatch','blocking','The transition handoff controller snapshot differs from the accepted weekly-review snapshot.',{cycleId:cycle.id,reviewId:review.id,transitionId:transition.id});
        }
      }
    }
    return {version:1,asOf,cycleId,status:blocking?'review':warnings?'warnings':'clean',blocking,warnings,issues,notes:['Blocking issues can compromise decision replay or historical interpretation.','Legacy missing observability metadata is a warning, not evidence that the original training record is wrong.']};
  }
  return {VERSION,LIFTS,canonical,fingerprint,environment,validateEnvironment,programEnvironment,captureController,validateControllerSnapshot,verifyReplay,nextOutcome,timeline,audit};
});