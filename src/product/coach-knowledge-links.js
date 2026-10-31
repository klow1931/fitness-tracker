/* Reviewed links between existing original coaching summaries. Traversal is
 * bounded and explanatory; it never infers an athlete's cause or prescription. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./coaching-library'),require('./coach-support'));else root.LoadnoteCoachKnowledgeLinks=factory(root.LoadnoteCoachingLibrary,root.LoadnoteCoachSupport);})(typeof globalThis!=='undefined'?globalThis:this,function(Library,Support){
 'use strict';
 const NODES={volume:{match:/\b(?:volume|workload|total work)\b/i,card:'workload'},effort:{match:/\b(?:effort|intensity|failure|rpe)\b/i,card:'workout-quality'},fatigue:{match:/\b(?:fatigue|recovery|tiredness)\b/i,card:'deload-purpose'},frequency:{match:/\b(?:frequency|days per week|how often)\b/i,card:'training-frequency'},specificity:{match:/\b(?:specificity|competition practice|specific practice)\b/i,card:'specificity'},accessories:{match:/\b(?:accessories|assistance|accessory work)\b/i,card:'accessory-priorities'},phase:{match:/\b(?:phase|periodization|taper|deload)\b/i,card:'phase-purpose'},growth:{match:/\b(?:hypertrophy|muscle growth|size)\b/i,card:'hypertrophy'}};
 const EDGES=[
  ['volume','effort','Workload and effort describe different parts of a training dose; more work alone does not establish a better session.'],
  ['volume','frequency','Frequency distributes training opportunities across the week; it should be considered alongside the work assigned to each session.'],
  ['volume','fatigue','Workload and recovery variation belong in the same review; a workload total alone cannot establish recovery or diagnose fatigue.'],
  ['effort','growth','Muscle growth does not require every set to reach failure; effort and workload need to be considered together.'],
  ['fatigue','phase','Deload and taper phases have distinct purposes; feeling tired alone does not select a phase or authorize a dose change.'],
  ['specificity','accessories','Assistance movements support stated priorities, while competition practice retains its own exercise identity. Variation records are not competition-lift records.'],
  ['phase','specificity','The phase purpose helps explain the emphasis of reviewed work; a general template does not automatically prepare every sport or event.'],
  ['volume','growth','Workload is relevant to muscle-growth training, but individual needs vary and indirect exposure is not equivalent to direct work.']
 ];
 const reset=q=>/^(?:new topic|start over|hello|hi|thanks|thank you)[.!?]*$/i.test(q);
 const follow=q=>/^(?:tell me more|explain that|why|show sources|what sources support that|how are (?:they|those) connected)[.!?]*$/i.test(q);
 function nodes(q){return Object.keys(NODES).filter(k=>NODES[k].match.test(q));}
 function match(q){return /\b(?:connect\w*|relat\w*|interact\w*|link\w*|balance|together|trade.?off)\b/i.test(q)&&nodes(q).length===2;}
 function anchor(question,history){if(!follow(question))return question;for(const r of history.slice(-8).reverse()){if(r?.role!=='user')continue;const q=String(r.content||'');if(reset(q)||Support.health(q)||Support.kind(q)==='urgent-support')return '';if(follow(q))continue;return match(q)?q:'';}return '';}
 function path(a,b){const direct=EDGES.find(e=>e.includes(a)&&e.includes(b));if(direct)return [direct];for(const e of EDGES.filter(e=>e[0]===a||e[1]===a)){const mid=e[0]===a?e[1]:e[0],next=EDGES.find(n=>(n[0]===mid&&n[1]===b)||(n[1]===mid&&n[0]===b));if(next)return [e,next];}return [];}
 function answer(_state,question,{history=[]}={}){
  const original=String(question??'');
  if(Support.health(original)||Support.kind(original)==='urgent-support'||/\b(?:my|mine|logged|recorded|increase|decrease|prescribe|build|create|change|save)\b/i.test(original))return null;
  const q=anchor(original,Array.isArray(history)?history:[]);if(!match(q))return null;
  const selected=nodes(q),links=path(...selected),catalog=Library.catalog();
  if(!links.length)return {text:'I do not have a reviewed connection between those topics yet. Which one would you like to explore first?',readOnly:true,evidence:[],source:'Shared coaching · knowledge connections',intent:{topic:'knowledge-connections'}};
  const ids=[...new Set(links.flatMap(e=>e.slice(0,2)).map(k=>NODES[k].card))],cards=ids.map(id=>catalog.cards.find(c=>c.id===id)),sources=[...new Set(cards.flatMap(c=>c.sources))];
  return {text:links.map(e=>e[2]).join('\n\n')+'\n\nThese are connections between curated training principles, not an explanation of your personal performance. Logged evidence and approved plans remain the basis for individual changes.',readOnly:true,evidence:[],knowledgeConnections:true,source:'Shared coaching · knowledge connections',intent:{topic:'knowledge-connections',referenceQuestion:q},knowledgeIds:ids,citations:sources.map(id=>({id,...catalog.sources[id]})),followUps:['What sources support that?','Explain my next workout'],actions:[{kind:'library',label:'Explore coaching references'}]};
 }
 return {nodes,path,answer};
});
