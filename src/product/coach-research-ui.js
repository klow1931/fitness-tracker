/* Public reference cards are kept separate from personal training evidence. */
(function(){
 'use strict';
 const R=()=>window.LoadnoteCoachResearch;
 const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 function button(text,run){const b=element('button',text);b.type='button';b.className='btn-secondary';b.onclick=run;return b;}
 function showResult(host,result,{cached=false,canSave=true}={}){
  host.replaceChildren();const heading=element('h3',result.label+' · '+(cached?'saved references':'web research'));host.append(heading);
  host.append(element('p','Europe PMC · retrieved '+result.retrievedAt.slice(0,10)+'. Publication dates appear below. Indexed research is not a personalized prescription or proof that a finding applies to you.'));
  if(cached&&Date.now()-Date.parse(result.retrievedAt)>90*86400000)host.append(element('p','These saved references are over ninety days old. They have not been checked for newer findings or changes in publication status.'));
  if(!result.items.length){host.append(element('p','No eligible indexed publications were returned. Try another training topic; built-in Coach remains available.'));return;}
  for(const item of result.items){
   const card=element('article'),title=element('h4'),link=element('a',item.title);link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';title.append(link);
   card.append(title,element('p',(item.date||item.year)+(item.review?' · review publication':' · indexed publication')+(item.journal?' · '+item.journal:'')),element('p',item.authors));
   const details=element('details'),summary=element('summary','Abstract excerpt and limits');details.append(summary,element('p',item.excerpt?item.excerpt+' […]':'No abstract excerpt is available. Open the source to inspect the publication.'),element('p','This is an excerpt from the indexed abstract, not a Loadnote conclusion, full-text review, or medical advice. Methods, population, limitations and later corrections need checking at the source.'));card.append(details);host.append(card);
  }
  attachExplanation(host,result);
  if(canSave){const status=element('p');status.setAttribute('role','status');host.append(button('Save these references offline',()=>{try{R().save(result);status.textContent='References saved on this device. Training records were not changed.';}catch(e){status.textContent=e.message;}}),status);}
 }
 function attachExplanation(host,result){
   // Research is never sent to Online Coach. Optional on-device explanation is
   // supplementary; source excerpts and exact citations remain authoritative.
   const ai=window.LoadnoteLocalCoachAI;
   if(ai?.snapshot().status==='ready'&&result.items.some(i=>i.excerpt)){
    const explain=button('Explain these sources on this device',async()=>{
     explain.disabled=true;const generation=R().revision(),note=element('p','Preparing an experimental local explanation…');note.setAttribute('role','status');host.append(note);
     try{const cards=result.items.filter(i=>i.excerpt).slice(0,2).map(i=>({title:i.title,summary:i.excerpt,application:'Research abstract excerpt; population, methods and limitations require source review. No personal training dose is established.'}));const value=await ai.explain('Explain only what these research excerpts support. State uncertainty and do not prescribe training.',cards);if(generation!==R().revision()){note.remove();return;}note.textContent=value?'Experimental local explanation: '+value:'A validated local explanation is unavailable. Read the source excerpts and limitations.';}catch{note.textContent='Local explanation unavailable. Source excerpts remain readable.';}finally{explain.disabled=false;}
    });host.append(explain);
   }
 }
 async function run(host,topicId,{confirmed=false}={}){
  host.replaceChildren();const status=element('p','Searching Europe PMC using training-topic keywords only…');status.setAttribute('role','status');const cancel=button('Cancel research',()=>R().cancel());host.append(status,cancel);
  const ticket=R().revision();
  try{const result=await R().search(topicId,{confirmed});if(ticket!==R().revision())return;
   showResult(host,result);
   return result;
  }catch(e){status.textContent=e.message;cancel.remove();}
 }
 function open({topicId=null}={}){
  const U=window.LoadnoteReviewedPlanningUI;if(!U||!R())return;
  const dialog=U.dialog('coach-research-dialog','Coach research','<p>Find training research while Coach stays local. Europe PMC receives topic keywords and your network address. Your chat and training records stay on this device.</p><label>Internet permission<select class="input" id="research-mode"><option value="ask">Ask before searching</option><option value="off">Offline only</option><option value="auto">Automatic research</option></select></label><details><summary>Permission, privacy and limits</summary><p>Ask before searching is the default. Automatic research looks up recognized general training topics alongside Coach replies. Recognized health and injury questions do not trigger research. Research does not retrain the model or change your plan. No chat, workout records, injury notes, account cookies or training summaries are sent. Opening a publication link connects to that site separately.</p></details><label>Research topic<select class="input" id="research-topic"></select></label><details><summary>Search keywords</summary><p id="research-query"></p></details><button type="button" class="btn-primary" id="research-search">Search online</button><p id="research-notice" role="status"></p><div id="research-results"></div><h3>Saved references on this device</h3><p>Save citations and short excerpts on this device. They are excluded from training backups and cloud sync; clear them here when you choose.</p><div id="research-saved"></div><button type="button" class="btn-secondary" id="research-clear">Clear saved references</button>');if(!dialog)return;
  const mode=dialog.querySelector('#research-mode'),select=dialog.querySelector('#research-topic'),query=dialog.querySelector('#research-query'),notice=dialog.querySelector('#research-notice'),results=dialog.querySelector('#research-results'),saved=dialog.querySelector('#research-saved');
  mode.value=R().mode();for(const t of R().topics()){const option=element('option',t.label);option.value=t.id;select.append(option);}if(R().topics().some(t=>t.id===topicId))select.value=topicId;
  function update(){const t=R().topics().find(t=>t.id===select.value);query.textContent='Search keywords: '+t.terms;dialog.querySelector('#research-search').disabled=R().mode()==='off';}
  mode.onchange=()=>{try{R().setMode(mode.value);results.replaceChildren();notice.textContent=mode.value==='off'?'Web research is off. Built-in Coach and saved references remain available.':'Permission saved on this device. No search has been sent.';}catch(e){notice.textContent=e.message;}update();};select.onchange=update;update();
  function renderSaved(){saved.replaceChildren();const rows=R().saved();if(!rows.length)saved.append(element('p','No references saved yet.'));for(const r of rows)saved.append(button(r.label+' · '+r.retrievedAt.slice(0,10),()=>{R().cancel();showResult(results,r,{cached:true,canSave:false});}));}
  renderSaved();const existing=R().saved().find(r=>r.topic===topicId);if(existing)showResult(results,existing,{cached:true,canSave:false});dialog.querySelector('#research-clear').onclick=()=>{try{R().clear();results.replaceChildren();renderSaved();notice.textContent='Saved research references cleared. Training records were not changed.';}catch(e){notice.textContent=e.message;}};
  dialog.querySelector('#research-search').onclick=async()=>{const b=dialog.querySelector('#research-search');b.disabled=true;try{await run(results,select.value,{confirmed:true});renderSaved();}finally{update();}};
  dialog.addEventListener('close',()=>R().cancel(),{once:true});
 }
 function attach(message,question){
  const t=R()?.suggest(question);if(!message||!t)return;
  const cached=R().saved().find(r=>r.topic===t.id),offline=navigator.onLine===false;
  if(R().mode()==='off'&&!cached)return;
  const areas=[message,message.fullView].filter(Boolean).map(host=>{const area=element('section');area.className='coach-research-offer';host.append(area);area.append(button((cached?'Saved research: ':'Research: ')+t.label,()=>{window.LoadnoteCoachCompanionUI?.close();open({topicId:t.id});}));return area;});
  if(cached&&(offline||R().mode()==='off')){for(const area of areas)showResult(area,cached,{cached:true,canSave:false});return;}
  if(R().mode()==='auto'){
   const ticket=R().revision();void run(areas[0],t.id).then(result=>{if(result&&ticket===R().revision())for(const area of areas.slice(1))showResult(area,result);});
  }
 }

 window.LoadnoteCoachResearchUI={open,attach,showResult};
})();
