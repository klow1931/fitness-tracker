/* Optional public research retrieval. No athlete records or raw chat leave this module. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./coach-support'));else root.LoadnoteCoachResearch=factory(root.LoadnoteCoachSupport);})(typeof globalThis!=='undefined'?globalThis:this,function(Support){
 'use strict';
 const ENDPOINT='https://www.ebi.ac.uk/europepmc/webservices/rest/search',PREF='loadnote.research.mode.v1',SAVED='loadnote.research.saved.v1';
 const TOPICS=Object.freeze([
  {id:'hypertrophy',label:'Muscle growth',match:/hypertrophy|muscle growth|build(?:ing)? muscle/i,terms:'"resistance training" AND hypertrophy'},
  {id:'strength',label:'Strength development',match:/strength development|build(?:ing)? strength|get(?:ting)? stronger|strength gains/i,terms:'"resistance training" AND strength'},
  {id:'frequency',label:'Training frequency',match:/training frequency|how (?:often|many days)|days (?:a|per) week/i,terms:'"resistance training" AND frequency'},
  {id:'volume',label:'Training volume',match:/training volume|weekly (?:sets|volume)|how many sets/i,terms:'"resistance training" AND volume'},
  {id:'effort',label:'Effort and autoregulation',match:/\brpe\b|reps in reserve|autoregulat|proximity to failure|training to failure/i,terms:'"resistance training" AND (autoregulation OR "repetitions in reserve")'},
  {id:'rest',label:'Rest between sets',match:/rest (?:period|interval|between|time)|between sets/i,terms:'"resistance training" AND "rest interval"'},
  {id:'periodization',label:'Periodization',match:/periodization|undulating|wave loading|conjugate/i,terms:'"resistance training" AND periodization'},
  {id:'taper',label:'Meet tapering',match:/taper|peaking|meet prep/i,terms:'powerlifting AND taper'},
  {id:'powerlifting',label:'Powerlifting',match:/powerlifting/i,terms:'powerlifting'},
  {id:'power',label:'Power and speed training',match:/dynamic effort|explosive|power training|speed strength/i,terms:'"resistance training" AND power'},
  {id:'detraining',label:'Detraining',match:/detraining|time off training|losing strength/i,terms:'"resistance training" AND detraining'},
  {id:'beginner',label:'Starting resistance training',match:/new lifter|beginner|start lifting|learn to lift/i,terms:'"resistance training" AND (novice OR beginner OR untrained)'}
 ]);
 const text=(v,n)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[m])).replace(/\s+/g,' ').trim().slice(0,n);
 const topics=()=>TOPICS.map(({id,label,terms})=>({id,label,terms}));
 const topic=id=>TOPICS.find(t=>t.id===id)||null;
 function suggest(question){const q=String(question||'');if(Support?.health(q)||/\b(medic\w*|cancer|diabet\w*|pregnan\w*|disease|surgery|surgical|fractur\w*|arthritis|hypertens\w*|stroke|disorder|syndrome|illness|concussion)\b/i.test(q)||['health','urgent-support'].includes(Support?.kind(q))||/last (?:time|workout|session)|my (?:logs|records)|should i (?:add|increase).*weight/i.test(q))return null;const t=TOPICS.find(t=>t.match.test(q));return t?{id:t.id,label:t.label,terms:t.terms}:null;}
 function normalizeResult(payload,topicId,now=Date.now()){
  const t=topic(topicId);if(!t)throw Error('Choose an available research topic');
  if(!Array.isArray(payload?.resultList?.result))throw Error('Research service returned unreadable results; built-in Coach still works.');
  const seen=new Set(),items=[];
  for(const r of (Array.isArray(payload?.resultList?.result)?payload.resultList.result:[]).slice(0,20)){
   const source=r?.source,id=String(r?.id||'');if(!(source==='MED'&&/^\d{1,12}$/.test(id)||source==='PMC'&&/^PMC\d{1,12}$/.test(id)))continue;
   const types=(Array.isArray(r.pubTypeList?.pubType)?r.pubTypeList.pubType:[]).map(v=>text(v,70));
   if(r.isRetracted==='Y'||types.some(v=>/retract|preprint|erratum|correction|expression of concern/i.test(v)))continue;
   const year=String(r.pubYear||''),date=/^\d{4}-\d{2}-\d{2}$/.test(r.firstPublicationDate||'')?r.firstPublicationDate:null;
   if(!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>new Date(now).getUTCFullYear()||date&&(!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||Date.parse(date)>now))continue;
   const title=text(r.title,260);if(!title)continue;
   const key=source+':'+id;if(seen.has(key)||seen.has(title.toLowerCase()))continue;seen.add(key);seen.add(title.toLowerCase());
   const abstract=text(r.abstractText,750),journal=text(r.journalInfo?.journal?.title,120);
   items.push({id:key,title,year,date,authors:text(r.authorString,200),journal,types:types.slice(0,4),review:types.some(v=>/review|meta-analysis/i.test(v)),excerpt:abstract,url:source==='MED'?'https://pubmed.ncbi.nlm.nih.gov/'+id+'/':'https://europepmc.org/articles/'+id});
  }
  const terms=t.label.toLowerCase().split(/\W+/).filter(w=>w.length>3);
  items.sort((a,b)=>{const relevance=x=>terms.filter(w=>(x.title+' '+x.excerpt).toLowerCase().includes(w)).length;return relevance(b)-relevance(a)||Number(b.review)-Number(a.review)||Number(b.year)-Number(a.year);});
  return {version:1,topic:t.id,label:t.label,terms:t.terms,retrievedAt:new Date(now).toISOString(),provider:'Europe PMC',items:items.slice(0,4)};
 }
 function cleanSaved(value,now){
  if(!value||!topic(value.topic)||!Number.isFinite(Date.parse(value.retrievedAt))||Date.parse(value.retrievedAt)>now||!Array.isArray(value.items))return null;
  // Revalidate cached URLs and text through the same source/identifier rules.
  const payload={resultList:{result:value.items.map(r=>({source:String(r.id||'').split(':')[0],id:String(r.id||'').split(':')[1],title:r.title,pubYear:r.year,firstPublicationDate:r.date,authorString:r.authors,abstractText:r.excerpt,journalInfo:{journal:{title:r.journal}},pubTypeList:{pubType:r.types}}))}};
  const result=normalizeResult(payload,value.topic,now);result.retrievedAt=value.retrievedAt;return result.items.length?result:null;
 }
 function create({storage=()=>globalThis.localStorage,request=(...args)=>globalThis.fetch(...args),now=Date.now,online=()=>globalThis.navigator?.onLine!==false,timeoutMs=12000}={}){
  let revision=0,active=null,sessionMode=null;const recent=new Map();
  globalThis.addEventListener?.('storage',event=>{if([PREF,SAVED,null].includes(event.key)){sessionMode=null;cancel();}});
  function mode(){if(sessionMode)return sessionMode;try{const value=storage()?.getItem(PREF);return ['off','ask','auto'].includes(value)?value:'ask';}catch{return 'ask';}}
  function cancel(){revision++;if(active){active.controller.abort();active.reject(Error('Research cancelled'));active=null;}}
  function setMode(value){if(!['off','ask','auto'].includes(value))throw Error('Unknown research mode');cancel();try{storage().setItem(PREF,value);sessionMode=value;}catch{sessionMode='off';throw Error('Research stopped for this session; the preference could not be saved');}return mode();}
  function saved(){try{const raw=storage()?.getItem(SAVED);if(!raw||raw.length>100000)return [];return (JSON.parse(raw)||[]).slice(0,12).map(v=>cleanSaved(v,now())).filter(Boolean);}catch{return [];}}
  function save(result){const value=cleanSaved(result,now());if(!value)throw Error('No valid references to save');const rows=[value,...saved().filter(v=>v.topic!==value.topic)].slice(0,12);try{storage().setItem(SAVED,JSON.stringify(rows));}catch{throw Error('References could not be saved; device storage may be full');}return value;}
  function clear(){cancel();try{storage().removeItem(SAVED);}catch{throw Error('Could not remove saved references');}}
  async function search(topicId,{confirmed=false}={}){
   const t=topic(topicId);if(!t)throw Error('Choose an available research topic');
   if(mode()==='off')throw Error('Web research is off');if(mode()==='ask'&&!confirmed)throw Error('Review the topic and confirm this search first');
   if(!online())throw Error('You are offline. Open saved references or keep using built-in Coach.');
   if(active)throw Error('A research request is already running');
   const previous=recent.get(topicId);if(previous&&now()-Date.parse(previous.retrievedAt)<15*60000)return JSON.parse(JSON.stringify(previous));
   const ticket=revision,controller=new AbortController();let timer;
   const cancelled=new Promise((_,reject)=>{active={controller,reject};});
   const task=(async()=>{
    const url=new URL(ENDPOINT);url.searchParams.set('query','('+t.terms+') AND (SRC:MED OR SRC:PMC) NOT PUB_TYPE:preprint NOT PUB_TYPE:"retracted publication"');url.searchParams.set('format','json');url.searchParams.set('resultType','core');url.searchParams.set('pageSize','8');
    const response=await request(url.href,{method:'GET',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response.ok)throw Error(response.status===429?'Research service is busy; try later.':'Research service is unavailable; built-in Coach still works.');
    const declared=Number(response.headers?.get?.('content-length')||0);if(declared>512000)throw Error('Research response is too large');
    let raw='';if(response.body?.getReader){const reader=response.body.getReader(),decoder=new TextDecoder();let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>512000)throw Error('Research response is too large');raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}finally{reader.releaseLock();}}else{raw=await response.text();if(raw.length>512000)throw Error('Research response is too large');}
    return normalizeResult(JSON.parse(raw),topicId,now());
   })();
   try{const result=await Promise.race([task,cancelled,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Research timed out; built-in Coach still works.'));},timeoutMs);})]);if(ticket!==revision)throw Error('Research cancelled');recent.set(topicId,JSON.parse(JSON.stringify(result)));return result;}catch(e){if(ticket!==revision)throw Error('Research cancelled');if(e?.name==='TypeError')throw Error('Research connection failed. Built-in Coach and saved references still work.');if(e?.name==='SyntaxError')throw Error('Research service returned unreadable results; built-in Coach still works.');throw e;}finally{clearTimeout(timer);controller.abort();if(ticket===revision)active=null;}
  }
  return {mode,setMode,cancel,search,saved,save,clear,revision:()=>revision};
 }
 return {...create(),create,topics,suggest,normalizeResult,ENDPOINT};
});
