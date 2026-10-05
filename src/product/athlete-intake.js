/* Explicit athlete reports. No inferred diagnosis, clearance or rehabilitation dose. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteAthleteIntake=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const AREAS={tendon:'Tendon concern',pelvis:'SI / pelvic or glute concern',pecMinor:'Pectoralis minor concern',pecMajor:'Pectoralis major concern',traps:'Trapezius concern',serratus:'Serratus priority',soleus:'Soleus / calf priority',other:'Other'};
 const SIDES={unknown:'Not recorded',left:'Left',right:'Right',bilateral:'Both sides',central:'Central'};
 const REFERENCE={title:'NHS tendon symptoms and care',url:'https://www.nhs.uk/conditions/tendonitis/'};
 const clean=(x,max)=>{if(typeof x!=='string'||x.length>max)throw Error('Keep intake text within '+max+' characters');return x.trim();};
 const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
 const ids=x=>{if(!Array.isArray(x)||x.length>100||new Set(x).size!==x.length||x.some(v=>typeof v!=='string'||!v||v.length>160))throw Error('Choose distinct exercise identities');return [...x];};
 function context(raw){
  if(!raw||raw.version!==1||!['unknown','none','active','past'].includes(raw.issueStatus)||!Array.isArray(raw.issues)||raw.issues.length>20)throw Error('Review explicit injury history; unknown is allowed');
  if(raw.years!=null&&(!Number.isFinite(raw.years)||raw.years<0||raw.years>80))throw Error('Training years must be 0–80 or left unknown');
  if(raw.breakWeeks!=null&&!integer(raw.breakWeeks,0,520))throw Error('Time away must be 0–520 weeks or unknown');
  if(raw.cardioMinutes!=null&&!integer(raw.cardioMinutes,0,1000))throw Error('Current weekly cardio minutes must be 0–1000 or unknown');
  const issues=raw.issues.map(r=>{if(!r||!Object.hasOwn(AREAS,r.area)||!Object.hasOwn(SIDES,r.side)||!['past','active','resolved'].includes(r.status)||!['self-reported','clinician-reported'].includes(r.basis)||!['unknown','none','stable','worsening'].includes(r.symptoms))throw Error('Review concern, side, status, source and current symptoms');
   if(r.pain!=null&&(!Number.isFinite(r.pain)||r.pain<0||r.pain>10))throw Error('Pain report must be 0–10 or unknown');
   if(r.symptoms==='none'&&r.pain>0)throw Error('Current pain and no-symptom reports disagree');
   if(r.status!=='active'&&(['stable','worsening'].includes(r.symptoms)||r.pain>0))throw Error('Current symptoms need a current concern status');
   return {area:r.area,side:r.side,status:r.status,basis:r.basis,symptoms:r.symptoms,pain:r.pain??null,aggravatingExerciseIds:ids(r.aggravatingExerciseIds||[]),notes:clean(r.notes||'',500)};});
  if(raw.issueStatus==='none'&&issues.length||raw.issueStatus==='past'&&issues.some(r=>r.status==='active')||raw.issueStatus==='active'&&!issues.some(r=>r.status==='active'))throw Error('Reported injury history and concern status disagree');
  if(!Array.isArray(raw.priorities)||raw.priorities.length>8||new Set(raw.priorities).size!==raw.priorities.length||raw.priorities.some(p=>!Object.hasOwn(AREAS,p)))throw Error('Choose distinct reported priorities');
  if(!['unknown','review-needed','within-reported-limits'].includes(raw.activity))throw Error('Choose current activity guidance');
  const restrictions=clean(raw.restrictions||'',1000);if(raw.activity==='within-reported-limits'&&!restrictions)throw Error('Record the clinician instructions or activity limits you are following');
  if(typeof raw.urgentSymptoms!=='boolean')throw Error('Explicitly review sudden severe symptoms');
  return {version:1,years:raw.years??null,breakWeeks:raw.breakWeeks??null,history:clean(raw.history||'',1000),issueStatus:raw.issueStatus,issues,priorities:[...raw.priorities],activity:raw.activity,restrictions,urgentSymptoms:raw.urgentSymptoms,cardioMinutes:raw.cardioMinutes??null};
 }
 function active(raw){const i=raw?context(raw):null;return !!i&&(i.urgentSymptoms||i.activity==='review-needed'||i.issues.some(r=>r.status==='active'&&r.symptoms!=='none'));}
 function excluded(raw){return raw?context(raw).issues.filter(r=>r.status==='active').flatMap(r=>r.aggravatingExerciseIds):[];}
 function assess(raw){if(!raw)return {hold:false,messages:[]};const i=context(raw),messages=[];
  if(i.urgentSymptoms)messages.push('Sudden severe symptoms or a suspected rupture need urgent clinical assessment; stop training and seek local urgent help.');
  if(active(i))messages.push('Current reported symptoms hold automated increases. Record exact aggravating movements and use an individually reviewed plan; this intake is not a diagnosis or clearance.');
  if(i.issueStatus==='unknown')messages.push('Injury history is unknown; no absence of injury or clearance is inferred.');
  if(i.restrictions)messages.push('Reported activity instructions: '+i.restrictions+' Free text is context; use exact avoided movements for enforced exclusions.');
  return {hold:active(i),urgent:i.urgentSymptoms,messages,excludedExerciseIds:[...new Set(excluded(i))]};
 }
 function guard(raw,exerciseIds,{generation=false}={}){const a=assess(raw);if(a.urgent)throw Error(a.messages[0]);if(exerciseIds.some(id=>a.excludedExerciseIds?.includes(id)))throw Error('An exercise is recorded as aggravating a current concern. Review the intake and your clinician restrictions.');if(generation&&a.hold)throw Error('Current symptoms require an individually reviewed plan before generated programming; intake does not prescribe rehabilitation.');return a;}
 function summary(raw){if(!raw)return 'Athlete intake has not been completed. History and symptoms remain unknown.';const i=context(raw);return 'Reported training: '+(i.years==null?'years unknown':i.years+' years')+', '+(i.breakWeeks==null?'time away unknown':i.breakWeeks+' weeks away')+'. '+i.issues.map(r=>AREAS[r.area]+' · '+SIDES[r.side]+' · '+r.status+' · '+r.basis).join('; ')+'. Priorities: '+(i.priorities.map(p=>AREAS[p]).join(', ')||'not recorded')+'. '+assess(i).messages.join(' ');}
 const EDUCATION={
  tendon:'Tendon symptoms have several causes. Progressive loading may be part of clinician-led rehabilitation, but location, onset and tolerance determine the plan. Do not infer a protocol, pain threshold or eccentric dose from the word tendinitis. Avoid the exact movements you report as aggravating it and seek assessment for persistent or worsening symptoms.',
  pelvis:'SI-area pain does not establish SI dysfunction or a weak glute. A clinician can assess the pain source and neurological or other warning signs. Record what aggravates symptoms; a generic glute-strengthening plan is not an assessment or treatment.',
  pecMinor:'Feeling tight around the pectoralis minor does not prove that it is shortened or causing shoulder symptoms. Gentle comfortable movement and qualified assessment can guide exercise selection; do not automatically prescribe aggressive stretching.',
  pecMajor:'Pectoralis major symptoms after a sudden heavy press, a pop or marked loss of function need prompt assessment. A chat cannot distinguish soreness from injury. Keep pressing restrictions explicit rather than replacing it with another press automatically.',
  traps:'Unilateral and bilateral trapezius complaints should be recorded separately. Feeling tight does not establish weakness, imbalance or a need for extra shrug volume. Record triggers and seek assessment for persistent symptoms.',
  serratus:'For a pain-free, self-reported serratus training priority, a push-up-plus can be considered as an exercise option with qualified setup guidance. This is not proof of serratus weakness, a dose prescription or treatment for scapular winging.',
  soleus:'For a pain-free calf-training priority, a seated or bent-knee calf raise can be considered as an exercise option. It is not an Achilles rehabilitation protocol or proof of soleus weakness. Confirm the exact movement and choose a fresh reviewed dose.'
 };
 function answer(state,q){const question=String(q||'');const latest=(state.programmingProfiles||[]).at(-1)?.context?.intake;let area=Object.keys(AREAS).find(k=>question.toLowerCase().includes(k.toLowerCase()));
  if(/tendin|tendon/i.test(question))area='tendon';if(/\bsi\b|glute.*dysfunc|sacroiliac/i.test(question))area='pelvis';if(/pec.*minor/i.test(question))area='pecMinor';if(/pec.*major/i.test(question))area='pecMajor';if(/trap(ezius)?s?\b/i.test(question))area='traps';
  if(!area&&!/intake|injury history|training history|my restrictions|my weaknesses/i.test(question))return null;
  const text=(area?EDUCATION[area]||'Record your concern and seek qualified assessment.':summary(latest))+' Review Athlete intake in Profile and exact future targets in Decisions. Chat does not apply training changes.';
  return {text,source:'Shared coaching · athlete intake',readOnly:true,evidence:[],actions:[{kind:'intake',label:'Review athlete intake'}],...(area?{sources:[area==='tendon'?REFERENCE:area==='serratus'?{title:'Push-up-plus muscle activation review (not clinical outcomes)',url:'https://pubmed.ncbi.nlm.nih.gov/31584855/'}:area==='soleus'?{title:'Standing and seated calf training study (healthy untrained adults)',url:'https://pubmed.ncbi.nlm.nih.gov/38156065/'}:area==='pelvis'?{title:'NHS back pain guidance',url:'https://www.nhs.uk/conditions/back-pain/'}:{title:'NHS shoulder pain guidance',url:'https://www.nhs.uk/symptoms/shoulder-pain/'}]}:{})};
 }
 return {AREAS,SIDES,REFERENCE,context,active,excluded,assess,guard,summary,answer};
});
