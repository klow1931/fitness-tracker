/* Ranked local retrieval. Source text is education, never personal training evidence. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./coaching-library'),require('./coach-support'));else root.LoadnoteCoachReferences=factory(root.LoadnoteCoachingLibrary,root.LoadnoteCoachSupport);})(typeof globalThis!=='undefined'?globalThis:this,function(Library,Support){
 'use strict';
 const STOP=new Set('a an the and or to of in on for my me i you is are do does how what why can could should would please explain tell about from with that this more research evidence training show paper papers source sources supports support help helps useful about main mean means'.split(' '));
 const aliases={bigger:'hypertrophy',size:'hypertrophy',growth:'hypertrophy',muscle:'hypertrophy',muscular:'hypertrophy',assistance:'accessory',accessories:'accessory',periodisation:'periodization',dup:'undulating',exertion:'effort',rir:'effort',rpe:'effort',stalled:'plateau',stuck:'plateau',explosive:'speed',tapering:'taper',deloading:'deload',frequency:'frequency',freqency:'frequency',strenght:'strength'};
 const clean=(v,n=1200)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
 const tokens=q=>[...new Set(clean(q).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).map(w=>aliases[w]||w).filter(w=>w.length>2&&!STOP.has(w)))];
 function blocked(q){return /\bmy\b.{0,60}\b(?:recent|logged|recorded|last|evidence|history|progress)\b/i.test(q)||/\b(?:rpe|rir)\s*\d|why (?:this|my) (?:set|load)/i.test(q)||Support.health(q)||Support.kind(q)==='urgent-support'||/\b(?:diagnos\w*|medic\w*|pregnan\w*|cancer|diabet\w*|rehab\w*|cancel|delete|schedule|build|create|draft|prescribe|swap|replace|increase|decrease)\b|\bmy\b.*\b(?:workout|program|plan|sets|reps|load|history|progress|training max)\b/i.test(q);}
 function resolve(q,history=[]){
  if(!/^(?:why|tell me more|explain that|what sources support that|show sources|what does the evidence say)[?.!]*$/i.test(String(q||'').trim()))return clean(q,500);
  for(const r of history.slice(-8).reverse().filter(r=>r.role==='user')){if(blocked(r.content)||/^(?:new topic|start over|hello|thanks)[.!?]*$/i.test(r.content))return '';if(!/^(?:why|tell me more|explain that|show sources)[?.!]*$/i.test(r.content))return clean(r.content,500);}return '';
 }
 function retrieve(question,{history=[],saved=[],asOf=new Date().toISOString().slice(0,10),limit=4}={}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isFinite(Date.parse(asOf))||new Date(asOf+'T12:00:00Z').toISOString().slice(0,10)!==asOf)return {status:'none',query:'',hits:[],notice:'A valid reference review date is required.'};
  const query=resolve(question,history);if(!query||blocked(question)||blocked(query))return {status:'none',query,hits:[],notice:'Research cannot establish personal targets or medical clearance.'};
  const words=tokens(query);if(!words.length)return {status:'none',query,hits:[]};
  const catalog=Library.catalog(),docs=catalog.cards.map(c=>({id:c.id,kind:'curated',title:c.title,summary:c.summary,application:c.application,tags:c.tags,sources:c.sources.map(id=>({id,...catalog.sources[id]})),limitation:'Curated educational summary; not an individual prescription.'}));
  for(const collection of (Array.isArray(saved)?saved:[]).slice(0,12)){
   if(!collection||!Number.isFinite(Date.parse(collection.retrievedAt))||collection.retrievedAt.slice(0,10)>asOf)continue;
   for(const item of (Array.isArray(collection.items)?collection.items:[]).slice(0,4)){
    if(!item)continue;const m=String(item.id||'').match(/^(MED):(\d{1,12})$|^(PMC):(PMC\d{1,12})$/);if(!m||!/^\d{4}$/.test(String(item.year))||Number(item.year)>Number(asOf.slice(0,4))||item.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||item.date>asOf))continue;
    const url=m[1]?'https://pubmed.ncbi.nlm.nih.gov/'+m[2]+'/':'https://europepmc.org/articles/'+m[4];
    docs.push({id:'saved:'+item.id,kind:'saved-paper',title:clean(item.title,260),summary:clean(item.excerpt,750)||'No abstract excerpt was saved. Open the cited source to inspect it.',application:'Check the study population, methods and full source before interpreting this abstract excerpt.',tags:tokens(collection.label||''),sources:[{id:item.id,title:clean(item.title,260),url,kind:'saved abstract excerpt',coverage:'Publication '+clean(item.date||item.year,10)+'; retrieved '+collection.retrievedAt.slice(0,10)}],retrievedAt:collection.retrievedAt,limitation:'Saved abstract excerpt; it has not been checked for later corrections or newer evidence.'});
   }
  }
  const frequency=new Map(),indexed=docs.map(d=>{const titleTokens=tokens(d.title+' '+(d.tags||[]).join(' ')),bodyTokens=tokens(d.summary+' '+d.application);for(const w of new Set([...titleTokens,...bodyTokens]))frequency.set(w,(frequency.get(w)||0)+1);return {d,titleTokens,bodyTokens};});
  const ranked=indexed.map(({d,titleTokens,bodyTokens},index)=>{
   const matches=words.filter(w=>titleTokens.includes(w)||bodyTokens.includes(w));
   const score=matches.reduce((n,w)=>n+(titleTokens.includes(w)?3:1)*Math.log(1+docs.length/(1+(frequency.get(w)||0))),0);
   return {...d,score:Math.round(score*100)/100,matchedTerms:matches,index};
  }).filter(d=>d.matchedTerms.length&&d.score>=1.5).sort((a,b)=>b.score-a.score||a.index-b.index);
  const covered=new Set(ranked.flatMap(d=>d.matchedTerms));if(covered.size<Math.min(2,words.length))return {status:'none',query,hits:[]};
  const seen=new Set(),unique=ranked.filter(d=>{const key=d.kind+'|'+d.title.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}),hits=unique.slice(0,Math.max(1,Math.min(6,limit)));
  const paper=unique.find(d=>d.kind==='saved-paper');if(paper&&hits.length>1&&!hits.some(d=>d.kind==='saved-paper'))hits[hits.length-1]=paper;
  return {status:hits.length?'matched':'none',query,hits,notice:'Relevance ranking is lexical, not a scientific quality or certainty score. Educational sources stay separate from logged athlete evidence.'};
 }
 function answer(_state,question,options={}){
  if(!/\b(?:explain|what|how|why|teach|learn|research|evidence|sources|references)\b/i.test(question)||blocked(question))return null;
  const r=retrieve(question,options);if(!r.hits.length)return null;
  return {text:r.hits.slice(0,2).map(h=>h.title+': '+h.summary+' '+h.application+' '+h.limitation).join('\n\n')+'\n\n'+r.notice,source:'Shared coaching · ranked references',readOnly:true,referenceMatches:r.hits.map(h=>({id:h.id,kind:h.kind,matchedTerms:h.matchedTerms})),citations:[...new Map(r.hits.flatMap(h=>h.sources).map(s=>[s.url,s])).values()],knowledgeIds:r.hits.filter(h=>h.kind==='curated').map(h=>h.id),intent:{topic:'ranked-knowledge',referenceQuestion:r.query},followUps:['Show sources']};
 }
 return {tokens,resolve,retrieve,answer,blocked};
});
