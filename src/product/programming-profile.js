(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../core/loadnote-core'),require('./schedule'));
  else root.LoadnoteProgrammingProfile=factory(root.LoadnoteCore,root.LoadnoteSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Schedule){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  const GOALS={return:'Return / rebuild training',strength:'Build strength',general:'General powerlifting',hypertrophy:'Hypertrophy emphasis',meet:'Prepare for a meet'};
  const EQUIPMENT={barbell:'Barbell',plates:'Suitable plates',rack:'Squat rack',bench:'Bench'};
  function context(raw){
    if(!raw||!Object.hasOwn(GOALS,raw.goal)||!['unknown','beginner','intermediate','advanced'].includes(raw.experience)||!['unknown','returning','inconsistent','consistent'].includes(raw.consistency))throw Error('Choose valid programming context');
    if(!Array.isArray(raw.availableDays)||!raw.availableDays.length||raw.availableDays.length>7||raw.availableDays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(raw.availableDays).size!==raw.availableDays.length)throw Error('Choose distinct available training days');
    if(!Number.isInteger(raw.sessionMinutes)||raw.sessionMinutes<30||raw.sessionMinutes>240)throw Error('Choose 30–240 available minutes');
    if(!Array.isArray(raw.equipment)||raw.equipment.some(e=>!Object.hasOwn(EQUIPMENT,e))||new Set(raw.equipment).size!==raw.equipment.length)throw Error('Invalid equipment selection');
    const eventDate=raw.eventDate||null;if(eventDate!==null&&!Schedule.date(eventDate))throw Error('Choose a valid meet date');
    const result={goal:raw.goal,eventDate,experience:raw.experience,consistency:raw.consistency,availableDays:[...raw.availableDays].sort((a,b)=>a-b),sessionMinutes:raw.sessionMinutes,equipment:[...raw.equipment].sort()};
    for(const k of ['preferredExerciseIds','avoidedExerciseIds']){const ids=raw[k]??[];if(!Array.isArray(ids)||ids.length>100||ids.some(id=>typeof id!=='string'||!id||id.length>160)||new Set(ids).size!==ids.length)throw Error('Invalid exercise preferences');result[k]=[...ids].sort();}
    if(result.preferredExerciseIds.some(id=>result.avoidedExerciseIds.includes(id)))throw Error('An exercise cannot be both preferred and avoided');
    for(const k of ['priorities','notes']){if(typeof(raw[k]??'')!=='string'||(raw[k]||'').length>1000)throw Error('Keep programming notes within 1000 characters');result[k]=(raw[k]||'').trim();}
    return result;
  }
  function validate(records){
    if(!Array.isArray(records)||records.length>500)throw Error('Invalid programming profile history');const ids=new Set();let last='';
    return records.map(r=>{if(!r||r.version!==1||typeof r.id!=='string'||!r.id||ids.has(r.id)||!iso(r.recordedAt)||r.recordedAt<=last)throw Error('Invalid programming profile revision');ids.add(r.id);last=r.recordedAt;return {version:1,id:r.id,recordedAt:r.recordedAt,context:r.context===null?null:context(r.context)};});
  }
  function current(records,knownAt){if(knownAt&&!iso(knownAt))throw Error('Invalid profile knowledge cutoff');const r=validate(records||[]).filter(r=>!knownAt||r.recordedAt<=knownAt).at(-1);return r?.context?r:null;}
  function save(records,raw,{now=new Date().toISOString(),id=Core.createId()}={}){return validate([...(records||[]),{version:1,id,recordedAt:now,context:raw===null?null:context(raw)}]);}
  function assess(record,config){
    if(!record)return [];const p=context(record.context),warnings=[];
    if(config.days.some(d=>!p.availableDays.includes(d)))throw Error('Program days exceed your programming-profile availability');
    if(config.sessionMinutes>p.sessionMinutes)throw Error('Program time budget exceeds your programming profile');
    if(Object.keys(EQUIPMENT).some(e=>!p.equipment.includes(e)))throw Error('This builder requires a barbell, suitable plates, rack and bench. Update actual access or use a different program.');
    if(Object.values(config.lifts).some(e=>p.avoidedExerciseIds.includes(e.exerciseId)))throw Error('A competition lift is marked avoided in your programming profile. Review your exercise selection; no substitution is made automatically.');
    if(p.goal==='return'&&config.structure!=='return')throw Error('Your return-to-training goal requires the return/base structure in this builder');
    if(p.goal==='hypertrophy'||p.goal==='meet')throw Error('This builder does not yet generate dedicated hypertrophy or meet-preparation programs. Keep your goal and use an individually reviewed plan.');
    if(p.consistency==='returning'&&config.structure!=='return')throw Error('Returning consistency requires the return/base structure in this builder');
    const end=new Date(config.startDate+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+34);
    if(p.eventDate&&p.eventDate<=end.toISOString().slice(0,10))throw Error('The meet date is too close for this base/strength builder. Use a reviewed meet-preparation plan.');
    const unused=p.preferredExerciseIds.filter(id=>!Object.values(config.lifts).some(e=>e.exerciseId===id));
    if(unused.length)warnings.push('Preferred variations/accessories are recorded but not included by this competition-lift-only builder.');
    warnings.push('Experience, consistency and reported priorities are context, not diagnosed weaknesses or a validated individual training dose.');
    return warnings;
  }
  return {GOALS,EQUIPMENT,context,validate,current,save,assess};
});
