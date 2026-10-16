/* Conversational requests are drafts, not prescriptions or authority to write data. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'),require('./coach-support'),require('./exercise-reference'),require('./session-intent'),require('./adaptive-session'),require('./athlete-intake'),require('./decision-readiness'));
 else root.LoadnoteOfflinePlanner=factory(root.LoadnoteProgrammingProfile,root.LoadnoteCoachSupport,root.LoadnoteExerciseReference,root.LoadnoteIntent,root.LoadnoteAdaptiveSession,root.LoadnoteAthleteIntake,root.LoadnoteReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile,Support,Ref,Intent,Adaptive,Intake,Roles){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),words={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20};
 const normalize=q=>String(q||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[-–]/g,' ').replace(new RegExp('\\b('+Object.keys(words).join('|')+')\\b','g'),w=>words[w]).replace(/\s+/g,' ').trim().slice(0,500);
 const profile=state=>Profile.current(state.programmingProfiles||[])?.context||null;
 function parse(question,previous=null){
  const q=normalize(question),start=/\b(build|create|write|make|design|generate|draft|want|need)\b.*\b(program|plan|routine|workout|session)\b/.test(q)||/\b(workout|session) for (today|tomorrow)\b/.test(q);
  if(/\b(explain|understand|learn|know|what|why|how)\b/.test(q)&&!/\b(build|create|write|make|design|generate|draft)\b/.test(q))return null;
  const follow=previous&&!/\b(explain|why|what|how|last|previous|history|cancel|delete|save|schedule|progress|evidence|hello|thanks)\b/.test(q)&&(/\b(\d+|strength|powerlifting|muscle|hypertrophy|full body|upper body|lower body|dumbbells?|barbell|bodyweight|gym|bench|squat|deadlift|linear|wave|undulating)\b/.test(q));
  if(!start&&!follow)return null;
  const r=start?{version:1,kind:/\b(workout|session)\b/.test(q)&&!/\b(program|routine|\d+\s*week)\b/.test(q)?'daily':'program',goal:null,weeks:null,frequency:null,minutes:null,equipment:[],focus:null,priority:null,periodization:null,excluded:[],tomorrow:false}:copy(previous);
  if(/\b(powerlifting|strength|get stronger|stronger)\b/.test(q))r.goal='strength';
  if(/\b(hypertrophy|muscle growth|build muscle|gain muscle|bigger muscles|bodybuilding)\b/.test(q))r.goal='hypertrophy';
  const n=pattern=>{const m=q.match(pattern);return m?Number(m[1]):null;};
  const weeks=n(/\b(\d+)\s*weeks?\b/),frequency=n(/\b(\d+)\s*(?:days?|times?)(?:\s*(?:a|per|each)\s*week)?\b/)??n(/\b(\d+)\s*x\s*(?:per|a|\/)?\s*week\b/),minutes=n(/\b(\d+)\s*(?:minutes?|mins?)\b/)??(n(/\b(\d+)\s*hours?\b/)!=null?n(/\b(\d+)\s*hours?\b/)*60:/\bhalf an hour\b/.test(q)?30:null);
  if(weeks!==null)r.weeks=weeks;if(frequency!==null)r.frequency=frequency;if(minutes!==null)r.minutes=minutes;
  const equipment=[];for(const key of Object.keys(Ref.EQUIPMENT)){const name=key==='dumbbells'?'(?:dumbbells?|dbs?)':key==='bodyweight'?'body\\s*weight':key==='pullup'?'pull\\s*up bar':['barbell','cable','machine'].includes(key)?key+'s?':key;if(new RegExp('\\b'+name+'\\b').test(q)&&!new RegExp('(?:no|without|avoid|don.t have|do not have)\\s+(?:a\\s+|any\\s+)?'+name+'\\b').test(q))equipment.push(key);}
  if(/\bfull gym\b/.test(q))equipment.push('barbell','dumbbells','cable','machine','bodyweight');
  if(equipment.length)r.equipment=[...new Set(equipment)];
  if(/\bno (equipment|weights)\b/.test(q))r.equipment=['bodyweight'];
  if(/\bupper body\b/.test(q))r.focus='upper';else if(/\blower body|leg workout\b/.test(q))r.focus='lower';else if(/\bfull body\b/.test(q))r.focus='full';
  else if(/\bbench (?:workout|session)\b/.test(q))r.focus='upper';
  if(/\b(bench|pressing|press)\b/.test(q)&&/\b(priority|prioritize|focus|extra|improve|stuck)\b/.test(q))r.priority='bench';
  else if(/\b(squat|deadlift)\b/.test(q)&&/\b(priority|prioritize|focus|extra|improve|stuck)\b/.test(q))r.priority=q.includes('squat')?'squat':'deadlift';
  if(/\bweekly undulating\b/.test(q)){r.periodization='weekly-undulating';r.styleUnclear=false;}else if(/\bwave\b/.test(q)){r.periodization='wave';r.styleUnclear=false;}else if(/\bdaily undulating|\bdup\b/.test(q)){r.periodization='undulating';r.styleUnclear=false;}else if(/\bnonlinear|non linear|undulating\b/.test(q))r.styleUnclear=true;else if(/\blinear\b/.test(q)){r.periodization='linear';r.styleUnclear=false;}
  for(const m of q.matchAll(/\b(?:no|avoid|without|can't do|cannot do)\s+(squats?|bench|deadlifts?|lunges?|push\s*ups?|rows?)\b/g))r.excluded=[...new Set([...r.excluded,m[1].replace(/s$/,'').replace(/\s/g,'')])];
  if(/\btomorrow\b/.test(q))r.tomorrow=true;else if(/\btoday\b/.test(q))r.tomorrow=false;
  if(/\b(olympic|snatch|clean and jerk|sprint|jumping|sport specific)\b/.test(q))r.unsupportedDomain=true;
  if(r.kind==='program'&&/\b(meet|competition|peaking|taper)\b/.test(q))r.meet=true;
  if(r.kind==='daily'&&/\bnext week\b|\b(?:next|on) (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{4} \d{2} \d{2}\b/.test(q))r.dateUnsupported=true;
  else if(/\btoday|tomorrow\b/.test(q))r.dateUnsupported=false;
  if(!start&&JSON.stringify(r)===JSON.stringify(previous))return null;
  return r;
 }
 function gaps(r,state){
  if(!r||r.version!==1||!['program','daily'].includes(r.kind)||!Array.isArray(r.equipment)||r.equipment.some(e=>!Object.hasOwn(Ref.EQUIPMENT,e))||!Array.isArray(r.excluded)||r.excluded.some(x=>typeof x!=='string')||r.goal!==null&&!['strength','hypertrophy'].includes(r.goal)||r.focus!==null&&!['upper','lower','full'].includes(r.focus)||r.priority!==null&&!['bench','squat','deadlift'].includes(r.priority)||[r.weeks,r.frequency,r.minutes].some(n=>n!==null&&!Number.isInteger(n)))return ['This planning request is incomplete or invalid. Start a new request.'];
  const p=profile(state),out=[];
  if(r.styleUnclear)out.push('Which loading style do you mean: daily undulating, weekly undulating, or waves?');
  if(r.unsupportedDomain||r.meet)out.push('Use the dedicated reviewed sport or meet planner for this request. This chat draft path does not substitute general resistance work for technical practice or meet peaking.');
  if(r.dateUnsupported)out.push('Daily chat drafts currently support today or tomorrow. Use Calendar for another date; I will not silently change it.');
  if(r.kind==='program'&&!r.goal)out.push('Should this be a strength/powerlifting program or a muscle-growth program?');
  if(r.kind==='program'&&r.weeks==null)out.push('How many weeks should the program last?');
  if(r.kind==='program'&&r.frequency==null)out.push('How many training days per week do you want? Availability alone does not set frequency.');
  if(r.minutes==null)out.push('How many minutes do you have per workout?');
  if(!r.equipment.length)out.push('What equipment can you use: dumbbells, bodyweight, barbell, cable, or machines?');
  if(r.kind==='daily'&&!r.focus)out.push('Do you want full-body, upper-body, or lower-body training?');
  if(r.minutes!=null&&(r.minutes<(r.kind==='program'?30:10)||r.minutes>240))out.unshift('Use '+(r.kind==='program'?'30':'10')+'–240 minutes for this supported planning path.');
  if(r.kind==='program'&&r.weeks!=null&&(r.weeks<1||r.weeks>24||r.goal==='strength'&&(r.weeks<5||r.weeks>13)))out.unshift('The standalone strength designer supports 5–13 weeks; muscle-growth supports 1–24. For longer meet prep, use the reviewed meet timeline. I will not silently shorten your request.');
  if(r.kind==='program'&&r.frequency!=null&&(r.frequency<(r.goal==='strength'?2:1)||r.frequency>(r.goal==='strength'?5:7)))out.unshift('This program path needs '+(r.goal==='strength'?'2–5':'1–7')+' training days per week.');
  if(r.kind==='program'&&r.goal==='strength'&&r.excluded.some(x=>['squat','bench','deadlift'].includes(x)))out.unshift('The strength designer includes all three competition lifts. Use the muscle-growth path for a request excluding one of them; exclusions are not ignored.');
  if(p&&Intake.active(p.intake))out.unshift('Your saved intake requires a training review. Review it with a qualified professional; I cannot draft a new training dose as medical clearance.');
  return out;
 }
 function summary(r){return [r.kind==='daily'?'Daily workout request':(r.goal||'Unspecified goal')+' program request',r.weeks!=null?r.weeks+' weeks':null,r.frequency!=null?r.frequency+' days/week':null,r.minutes!=null?r.minutes+' minutes':null,r.focus?r.focus+' body':null,r.equipment.length?r.equipment.join(', '):null,r.priority?r.priority+' priority':null,r.excluded.length?'avoid '+r.excluded.join(', '):null,r.periodization].filter(Boolean).join(' · ');}
 function answer(state,question,{history=[]}={}){
  if(Support.kind(question)==='health'||Support.kind(question)==='urgent-support')return null;
  const last=history.at(-1),previous=last?.role==='assistant'?last.planning:null;
  const r=parse(question,previous);if(!r)return null;
  const missing=gaps(r,state),text=summary(r)+'. '+(missing[0]||'Review this draft request, then confirm exact movements, equipment and fresh loads. Nothing is saved, scheduled or marked completed by chat.');
  return {text,source:'Shared coaching · offline planning',readOnly:true,planning:r,intent:{topic:'offline-planning'},evidence:[],actions:missing.length?(r.unsupportedDomain||r.meet?[{kind:'programming',label:'Open the reviewed planners'}]:[]):[{kind:'offline-plan',label:r.kind==='daily'?'Draft my workout':'Review program request',request:copy(r)}]};
 }
 function candidates(state,r,{excludedExerciseIds=[],requireMapped=false}={}){
  const p=profile(state),preferred=new Set(p?.preferredExerciseIds||[]),excluded=new Set([...(p?.avoidedExerciseIds||[]),...excludedExerciseIds]),roleRows=Roles.list(state.exerciseRoles||[]);
  const groups=r.focus==='upper'?['chest','upper-back','arms']:r.focus==='lower'?['quadriceps','posterior-chain','trunk']:['quadriceps','chest','upper-back',...(r.minutes>=45?['posterior-chain']:[])];
  const barbellGroups={back_squat:'quadriceps',bench_press:'chest',deadlift:'posterior-chain',romanian_deadlift:'posterior-chain',barbell_row:'upper-back',barbell_curl:'arms'};
  const library=[...Ref.accessories,...Ref.entries.filter(e=>barbellGroups[e.key]).map(e=>({...e,group:barbellGroups[e.key]}))];
  return groups.map(group=>library.filter(e=>e.group===group&&r.equipment.includes(e.equipment)&&e.group!=='conditioning'&&!['plank','side_plank'].includes(e.key)&&!r.excluded.some(x=>normalize(e.name).replace(/\s/g,'').includes(x))).map(e=>{const lift={back_squat:'squat',bench_press:'bench',deadlift:'deadlift'}[e.key],ids=roleRows.filter(role=>lift&&role.role==='competition'&&role.competitionLift===lift).map(role=>role.exerciseId);const matches=(state.exerciseCatalog||[]).filter(k=>ids.includes(k.id)||[k.name,...(k.aliases||[])].some(n=>Ref.resolve(n)?.key===e.key));if(matches.length>1)return null;const known=matches[0];if(requireMapped&&(!known?.muscles?.confirmed||known.muscles.mode!=='resistance'))return null;return {...copy(e),name:known?.name||e.name,exerciseId:known?.id||null,preferred:preferred.has(known?.id)};}).filter(e=>e&&!excluded.has(e.exerciseId)).sort((a,b)=>Number(b.preferred)-Number(a.preferred)||Number(!!b.exerciseId)-Number(!!a.exerciseId))[0]).filter(Boolean);
 }
 function workout(state,r,rows,{confirmed=false,now=new Date().toISOString(),excludedExerciseIds=[]}={}){
  if(!profile(state))throw Error('Review your training setup before drafting a workout');
  if(r.kind!=='daily'||gaps(r,state).length)throw Error('Complete the workout request before generating targets');
  if(!confirmed)throw Error('Confirm equipment, movement suitability and explicit starting loads');
  if(!Array.isArray(rows)||!rows.length||rows.length>6)throw Error('Choose 1–6 movements');
  const allowed=candidates(state,r,{excludedExerciseIds}),seen=new Set();
  const exercises=rows.map(row=>{const e=allowed.find(e=>e.key===row.key);if(!e||seen.has(e.key))throw Error('Movement choices changed; reopen the draft');seen.add(e.key);
   if(!Number.isInteger(row.sets)||row.sets<1||row.sets>4||!Number.isInteger(row.reps)||row.reps<(e.equipment==='barbell'?1:6)||row.reps>15||!Number.isFinite(row.weightKg)||row.weightKg<0||row.weightKg>1000||row.weightKg===0&&e.equipment!=='bodyweight'||!Number.isFinite(row.rpe)||row.rpe<6||row.rpe>8||!Number.isInteger(row.rest)||row.rest<60||row.rest>300)throw Error('Enter explicit loads, 1–4 sets, 1–15 barbell or 6–15 accessory reps, RPE cap 6–8 and rest 60–300 seconds');
   return {name:e.name,...(e.exerciseId?{exerciseId:e.exerciseId}:{}),type:'strength',trackBy:'reps',loadConvention:e.equipment==='bodyweight'?'added':e.equipment==='dumbbells'?'per-hand':['cable','machine'].includes(e.equipment)?'stack':'total',restSeconds:row.rest,sets:Array.from({length:row.sets},()=>({weight:row.weightKg,reps:row.reps,targetRpe:row.rpe}))};});
  const prescription=Intent.createPrescription(exercises,{type:'manual',label:'Reviewed offline workout draft'},now),estimate=Adaptive.timePreview(prescription,{minutes:r.minutes,optionalExerciseIds:[],assumptions:{defaultRestSeconds:120}});
  return {request:copy(r),prescription,estimate:estimate.estimateAfter,notice:'Editable starting structure, not a measured individual dose. The time estimate excludes warm-up, queues and interruptions. No actual effort or completion has been entered.'};
 }
 return {parse,gaps,summary,answer,candidates,workout};
});
