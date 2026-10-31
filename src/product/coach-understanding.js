/* Statistical routing hints, never evidence or authority to change training. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-text-features'),require('./coach-intent-model'),require('./coach-support'));else root.LoadnoteCoachUnderstanding=factory(root.LoadnoteCoachTextFeatures,root.LoadnoteCoachIntentModel,root.LoadnoteCoachSupport);})(typeof globalThis!=='undefined'?globalThis:this,function(F,Model,Support){
 'use strict';
 const index=new Map(Model.vocabulary.map((v,i)=>[v,i]));
 function classify(question){
  const raw=String(question??'');
  if(Support.health(raw)||Support.kind(raw)==='urgent-support')return {intent:'safety',accepted:false,reason:'safety'};
  const terms=F.features(raw),known=terms.filter(t=>index.has(t)),unigrams=F.words(raw),coverage=unigrams.length?unigrams.filter(t=>index.has(t)).length/unigrams.length:0;
  const scores=Object.entries(Model.weights).map(([intent,w])=>({intent,score:known.reduce((s,f)=>s+w[index.get(f)],0)})).sort((a,b)=>b.score-a.score);
  const first=scores[0],margin=first.score-scores[1].score;
  // Margin and coverage are routing heuristics, not calibrated probabilities.
  const accepted=known.length>=2&&coverage>=0.6&&margin>=1.1&&first.intent!=='other';
  return {intent:accepted?first.intent:'unknown',candidate:first.intent,accepted,margin:Math.round(margin*100)/100,coverage:Math.round(coverage*100)/100,reason:accepted?'supported-language':'clarify-or-existing-route'};
 }
 function interpret(question){
  const q=String(question??'').replace(/[’‘]/g,"'").trim(),hint=classify(q),lifts=['squat','bench','deadlift'].filter(l=>new RegExp('\\b'+l+'\\b','i').test(q));
  // Do not rewrite commands, quantities, multiple requests, negative evidence,
  // or named variations. Exact exercise identity belongs to existing tools.
  if(!hint.accepted||q.length>160||/\d|\b(?:and|but|or|no|not|never|cannot|\w+n't|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|hundred|thousand|save|build|create|draft|change|increase|decrease|replace|swap|delete|cancel|remember|incline|decline|dumbbell|pause|paused|front|safety|romanian|sumo|overhead|timer|remaining|left|current|target|prescribed|today)\b/i.test(q))return {question:q,hint,changed:false};
  // Unknown lift qualifiers can name an unrecognized variation. Statistical
  // coverage is insufficient authority to erase them from an exercise query.
  if(lifts.length&&F.words(q).some(w=>!index.has(w)&&w!=='competition'))return {question:q,hint,changed:false};
  let canonical=null;
  // A plateau route must retain an actual stagnation report. Word overlap
  // with a negated training example must not turn improvement into a stall.
  const stagnation=/\b(?:stuck|stall\w*|plateau\w*|flatlin\w*|stagnat\w*|standstill|nowhere|frozen|dried up|hit a wall|stopped|no longer)\b/i.test(q);
  if(lifts.length===1){if(hint.intent==='plateau'&&stagnation)canonical='Why is my '+lifts[0]+' progress stalled?';if(hint.intent==='progress')canonical='How is my '+lifts[0]+' progress?';}
  if(lifts.length===0){if(hint.intent==='effort')canonical='What does RPE mean?';if(hint.intent==='rest')canonical='How long should I rest between sets?';if(hint.intent==='failure')canonical='Do I need every set to reach failure?';}
  return {question:canonical||q,hint,changed:!!canonical&&canonical!==q};
 }
 return {classify,interpret};
});
