/* Shared descriptive evidence; no capacity estimates or automatic prescriptions. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteTrainingKnowledge=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MUSCLES={quadriceps:'Quads',glutes:'Glutes',hamstrings:'Hamstrings',chest:'Chest',lats:'Lats','upper-back':'Upper back',shoulders:'Shoulders',biceps:'Biceps',triceps:'Triceps',calves:'Calves',trunk:'Trunk',adductors:'Adductors'};
 const SOURCES={hypertrophy:{title:'IUSCA hypertrophy position stand (2021)',url:'https://doi.org/10.47206/ijsc.v1i1.81'},athlete:{title:'NSCA weightlifting for sports performance (2023)',url:'https://pubmed.ncbi.nlm.nih.gov/36952649/'}};
 function mapping(raw){
  if(!raw)return null;
  if(raw.confirmed!==true||!['resistance','weightlifting','other'].includes(raw.mode)||!Array.isArray(raw.primary)||!Array.isArray(raw.secondary))throw Error('Confirm a training mode and muscle mapping');
  const primary=[...new Set(raw.primary)],secondary=[...new Set(raw.secondary)];
  if([...primary,...secondary].some(x=>!Object.hasOwn(MUSCLES,x))||primary.some(x=>secondary.includes(x)))throw Error('Choose valid, distinct primary and secondary muscles');
  if(raw.mode==='resistance'&&!primary.length)throw Error('Choose at least one primary muscle');
  return {confirmed:true,mode:raw.mode,primary,secondary};
 }
 function suggestion(name){
  const n=String(name||'').toLowerCase();let primary=[],secondary=[],mode='resistance';
  if(/\b(snatch|clean|jerk)\b/.test(n)&&!/cleaning/.test(n))mode='weightlifting';
  else if(/squat|leg press|leg extension/.test(n)){primary=['quadriceps'];secondary=['glutes','adductors'];}
  else if(/deadlift|romanian|rdl/.test(n)){primary=['glutes','hamstrings'];secondary=['upper-back','trunk'];}
  else if(/bench|larsen|chest press/.test(n)){primary=['chest'];secondary=['triceps','shoulders'];}
  else if(/pulldown|pull.up/.test(n)){primary=['lats'];secondary=['biceps','upper-back'];}
  else if(/row/.test(n)){primary=['upper-back','lats'];secondary=['biceps'];}
  else if(/leg curl/.test(n))primary=['hamstrings'];
  else if(/bicep|curl/.test(n))primary=['biceps'];
  else if(/tricep|pushdown/.test(n))primary=['triceps'];
  else if(/plank|sit.up/.test(n))primary=['trunk'];
  else return null;
  return {confirmed:true,mode,primary,secondary}; // Form suggestion only; caller must confirm.
 }
 const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 function workload(state,{asOf}={}){
  if(!validDate(asOf))throw Error('Choose a valid analysis date');
  const start=new Date(asOf+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-6);const from=start.toISOString().slice(0,10);
  const groups=Object.fromEntries(Object.keys(MUSCLES).map(k=>[k,{direct:0,indirect:0,effortKnown:0,effortUnknown:0,nearFailure:0}]));
  const out={asOf,from,groups,unmappedSets:0,incompleteSets:0,skillSets:0,otherSets:0,excludedSets:0,loggedSets:0,historyCoverage:'unknown',basis:'Current corrected history; seven calendar days; unknown history completeness'};
  const catalog=new Map((state.exerciseCatalog||[]).map(e=>[e.id,e]));
  for(const w of state.workouts||[]){
   if(!validDate(w.date)||w.date<from||w.date>asOf)continue;
   for(const e of w.exercises||[]){
    if(e.type==='cardio')continue;
    let m=null;try{m=mapping(catalog.get(e.exerciseId)?.muscles);}catch{}
    for(const s of e.sets||[]){
     if(s.done===false||s.completed===false||s.skipped===true||s.warmup===true||s.type==='warmup'){out.excludedSets++;continue;}
     if(!Number.isInteger(s.reps)||s.reps<=0||!Number.isFinite(s.weight)||s.weight<0||s.weight>1000||e.trackBy==='duration'){out.incompleteSets++;continue;}
     out.loggedSets++;
     if(!m){out.unmappedSets++;continue;}
     if(m.mode==='weightlifting'){out.skillSets++;continue;}
     if(m.mode==='other'){out.otherSets++;continue;}
     const known=Number.isFinite(s.rpe)&&s.rpe>=1&&s.rpe<=10;
     for(const k of m.primary){const g=groups[k];g.direct++;g[known?'effortKnown':'effortUnknown']++;if(known&&s.rpe>=7)g.nearFailure++;}
     for(const k of m.secondary)groups[k].indirect++;
    }
   }
  }
  return out;
 }
 const GUIDANCE={
  hypertrophy:'Muscle growth can occur across a broad loading range. Choose exercises and rep ranges you can perform consistently. Failure is not required on every set; record actual effort. Rest long enough to preserve performance: generally at least 2 minutes for compounds, with 60–90 seconds sometimes sufficient for isolation or machine work. Distribute workload across sessions when needed. Add work gradually only after reviewing performance and tolerance; a universal set target cannot establish your individual needs. Around 10 weekly sets per muscle is a population-level reference in the 2021 position stand, not a required starting dose or an automatic escalation threshold. Lower volumes can produce growth.',
  athlete:'Start with the sport, position, season, practice and competition schedule, training experience, equipment and priorities. Strength, power and sport skills serve different purposes. Weightlifting derivatives can support power development, but exercise choice depends on skill and coaching. Coordinate gym work with sport demands; a strength log alone cannot establish sport readiness or predict transfer.',
  weightlifting:'Snatch and clean & jerk are technical competition lifts; derivatives have different goals. Prioritize consistent technique and power rather than grinding to failure. Exercise selection, loading and progression require skill context and qualified instruction. Squat or deadlift estimates do not establish a snatch or clean & jerk max. This release explains principles and counts technical sets separately; it does not generate weightlifting cycles or assess technique.'
 };
 function classify(q){
  if(/\b(olympic|weightlifting|snatch|clean(?: and| &) jerk|clean|jerk)\b/i.test(q))return 'weightlifting';
  if(/\b(athlet\w*|sport\w*|sprint\w*|jump\w*|power|speed|agility|in.season|off.season|football|soccer|basketball|rugby|hockey|baseball|tennis|swimming)\b/i.test(q))return 'athlete';
  if(/\b(hypertrophy|bodybuilding|muscle|grow|growth|volume|rep range|rest between|add sets)\w*\b/i.test(q)||Object.entries(MUSCLES).some(([k,v])=>new RegExp('\\b'+(k==='quadriceps'?'quad\\w*':v.toLowerCase())+'\\b','i').test(q)))return 'hypertrophy';
  return null;
 }
 function explain(state,q,{asOf,domain=classify(q)}={}){
  if(!domain)return null;
  if(domain!=='hypertrophy')return {text:GUIDANCE[domain],source:SOURCES.athlete,evidence:null};
  const evidence=workload(state,{asOf});
  const keys=Object.keys(MUSCLES).filter(k=>new RegExp('\\b'+(k==='quadriceps'?'quad\\w*':MUSCLES[k].toLowerCase())+'\\b','i').test(q));
  const rows=keys.length?keys:Object.keys(MUSCLES).filter(k=>evidence.groups[k].direct||evidence.groups[k].indirect);
  const counts=rows.map(k=>{const g=evidence.groups[k];return `${MUSCLES[k]}: ${g.direct} direct sets, ${g.indirect} indirect exposures; actual RPE recorded on ${g.effortKnown}/${g.direct} direct sets (${g.nearFailure} at RPE 7–10).`;}).join(' ');
  return {text:`${evidence.from} through ${asOf}: ${counts||'No confirmed muscle workload available.'} ${evidence.unmappedSets} unmapped sets; ${evidence.incompleteSets} incomplete/hold records; ${evidence.skillSets} technical weightlifting sets counted separately. History completeness is unknown. Indirect exposure is not converted into equivalent direct sets. These counts do not measure growth or prove enough work. ${GUIDANCE.hypertrophy} Review your program and main-lift performance before changing sets or load.`,source:SOURCES.hypertrophy,evidence};
 }
 return {MUSCLES,SOURCES,mapping,suggestion,workload,GUIDANCE,classify,explain};
});
