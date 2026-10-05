/* v2.82.1 — persistent Coach Companion surface.
 * Text-first foundation for realtime voice. The companion reads live workout
 * state and may control only reversible rest-timer actions here.
 */
(function(){
 'use strict';
 const Core=()=>window.LoadnoteCoachCompanion;
 const Client=()=>window.LoadnoteCoachClient;
  // One session-only conversation, presented in the full Coach and quick panel.
  const history=[];
 let refreshTimer=null,queued=false,asking=false;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function displayUnit(){try{return typeof unitLabel==='function'?unitLabel():'kg';}catch{return 'kg';}}
 function toKg(value){
  const n=Number(value);if(!Number.isFinite(n))return null;
  try{if(typeof toStorage==='function')return Number(toStorage(n));}catch{}
  return displayUnit()==='lb'?Math.round((n/2.2046226218)*100)/100:n;
 }
 function surface(){
  const rows=[['dashboard','home'],['workouts','train'],['prs','progress'],['coach','coach'],['profile','profile']];
  for(const [id,label] of rows){const el=document.getElementById('panel-'+id);if(el&&!el.classList.contains('hidden'))return label;}
  return 'other';
 }
 function strengthRows(){return [...document.querySelectorAll('#exercise-rows > div')].filter(row=>row.dataset.type!=='cardio');}
 function setRows(row){return row?[...row.querySelectorAll('.sets-container > div')]:[];}
 function setComplete(set){return !!set?.querySelector('.set-done-check')?.checked;}
 function currentWorkout(){
  const rows=strengthRows().filter(row=>row.querySelector('.ex-name')?.value.trim()||setRows(row).some(set=>set.querySelector('.set-weight,.set-reps,.set-duration,.set-rpe')?.value!==''));
  if(!rows.length)return null;
  let currentRow=null,currentSet=null,currentIndex=-1,setIndex=-1;
  const active=document.querySelector('#exercise-rows .logger-active-set');
  if(active&&!setComplete(active)){currentRow=active.closest('#exercise-rows > div');currentIndex=rows.indexOf(currentRow);currentSet=active;setIndex=setRows(currentRow).indexOf(active);}
  if(!currentRow){
   for(let i=0;i<rows.length;i++){
    const sets=setRows(rows[i]);const j=sets.findIndex(set=>!setComplete(set));
    if(j>=0){currentRow=rows[i];currentSet=sets[j];currentIndex=i;setIndex=j;break;}
   }
  }
  const cockpit=document.getElementById('training-cockpit');
  const currentComparison=cockpit&&!cockpit.hidden?cockpit.querySelector('.training-cockpit-comparison'):null;
  const comparisonRows=currentComparison?[...currentComparison.children]:[];
  const target=comparisonRows[0]?.querySelector('b')?.textContent?.trim()||null;
  const previous=comparisonRows[1]?.querySelector('b')?.textContent?.trim()||null;
  const count=currentRow?setRows(currentRow).length:0;
  const weightInput=currentSet?.querySelector('.set-weight');
  const repsInput=currentSet?.querySelector('.set-reps');
  const durationInput=currentSet?.querySelector('.set-duration');
  const rpeInput=currentSet?.querySelector('.set-rpe');
  const displayWeight=weightInput?.value===''?null:Number(weightInput?.value);
  const exerciseSummaries=rows.slice(0,12).map(row=>{
   const sets=setRows(row);return {name:row.querySelector('.ex-name')?.value.trim()||'Exercise',completedSets:sets.filter(setComplete).length,totalSets:sets.length};
  });
  const meta=cockpit&&!cockpit.hidden?cockpit.querySelector('.training-cockpit-title'):null;
  return {
   active:true,
   date:document.getElementById('wo-date')?.value||null,
   name:meta?.querySelector('b')?.textContent?.trim()||document.getElementById('session-goal')?.value.trim()||'Workout',
   position:meta?.querySelector('small')?.textContent?.trim()||null,
   currentExercise:currentRow?{
    name:currentRow.querySelector('.ex-name')?.value.trim()||'Exercise',index:currentIndex,count:rows.length,
    set:currentSet?{index:setIndex,count,reps:repsInput?.value===''?null:Number(repsInput?.value),durationSeconds:durationInput?.value===''?null:Number(durationInput?.value),weightKg:displayWeight==null?null:toKg(displayWeight),displayWeight,displayUnit:displayUnit(),rpe:rpeInput?.value===''?null:Number(rpeInput?.value),completed:setComplete(currentSet),target,previous}:null
   }:null,
   exercises:exerciseSummaries
  };
 }
 function companionContext(){
  const live=Core()?.buildContext({surface:surface(),workout:currentWorkout(),rest:window.LoadnoteRestTimer?.snapshot?.()||null});
  return live||{version:1,surface:surface(),liveWorkout:null,restTimer:{active:false}};
 }
 function coachContext(){
  let base={version:'0.6',unit:displayUnit(),units:{storageWeight:'kg',displayWeight:displayUnit()}};
  try{if(typeof buildCoachContext==='function')base=buildCoachContext()||base;}catch{}
  return {...base,companion:companionContext()};
 }
 function style(){
  if(document.getElementById('coach-companion-style'))return;
  const el=document.createElement('style');el.id='coach-companion-style';el.textContent=`
  #coach-companion-launcher{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(76px + env(safe-area-inset-bottom));z-index:58;border:0;border-radius:999px;padding:11px 15px;background:#312e81;color:#fff;font:700 14px/1 system-ui;box-shadow:0 10px 28px rgba(15,23,42,.22);cursor:pointer}
  #coach-companion-launcher[data-live="true"]::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399;margin-right:7px}
  #coach-companion-backdrop{position:fixed;inset:0;z-index:59;border:0;padding:0;background:rgba(15,23,42,.14);cursor:default}
  #coach-companion-panel{position:fixed;z-index:60;right:max(12px,env(safe-area-inset-right));bottom:calc(72px + env(safe-area-inset-bottom));width:min(390px,calc(100vw - 24px));max-height:min(680px,calc(100vh - 100px));max-height:min(680px,calc(100dvh - 100px));background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:18px;box-shadow:0 24px 60px rgba(15,23,42,.28);overflow:hidden}
  #coach-companion-panel:not([hidden]){display:flex;flex-direction:column}
  #coach-companion-panel[hidden],#coach-companion-panel [hidden]{display:none!important}
  body.dark #coach-companion-panel{background:#0f172a;color:#e2e8f0;border-color:#334155}
  .cc-head{display:flex;flex:0 0 auto;justify-content:space-between;align-items:flex-start;gap:12px;padding:10px 10px 8px 14px;border-bottom:1px solid #e2e8f0;background:#fff}.cc-head b{display:block}.cc-head small{display:block;color:#64748b;margin-top:3px}.cc-close{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;border:0;border-radius:999px;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:inherit}
  .cc-context{display:flex;flex:0 0 auto;gap:6px;flex-wrap:wrap;padding:9px 14px;border-bottom:1px solid #e2e8f0}.cc-chip{font-size:11px;padding:4px 7px;border-radius:999px;background:#eef2ff;color:#3730a3}.cc-chip.live{background:#ecfdf5;color:#047857}
  .cc-messages{height:auto;min-height:120px;flex:1 1 300px;overflow:auto;overscroll-behavior:contain;padding:12px 14px;display:flex;flex-direction:column;gap:9px}.cc-msg{max-width:88%;padding:9px 11px;border-radius:13px;background:#f1f5f9;color:#0f172a;font-size:13px;line-height:1.4}.cc-msg.user{align-self:flex-end;background:#312e81;color:#fff}.cc-msg small{display:block;margin-top:5px;color:#64748b}.cc-msg.user small{color:#c7d2fe}
  .cc-quick{display:flex;flex:0 0 auto;gap:6px;overflow:auto;padding:0 14px 10px}.cc-quick button{white-space:nowrap;border:1px solid #cbd5e1;background:transparent;border-radius:999px;padding:6px 9px;font-size:11px;color:inherit}
  .cc-form{display:flex;flex:0 0 auto;gap:7px;padding:10px 14px 12px;border-top:1px solid #e2e8f0}.cc-form input{min-width:0;flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px;background:transparent;color:inherit}.cc-form button{border:0;border-radius:10px;background:#312e81;color:white;padding:9px 12px;font-weight:700}.cc-foot{display:flex;flex:0 0 auto;justify-content:space-between;align-items:center;padding:0 14px 12px;font-size:11px;color:#64748b}.cc-foot button{border:0;background:transparent;color:#4f46e5;font-weight:700;cursor:pointer}
  body.dark .cc-head{background:#0f172a;border-color:#334155}body.dark .cc-head small{color:#94a3b8}body.dark .cc-close:hover{background:#1e293b}
  body.dark .cc-context,body.dark .cc-form{border-color:#334155}body.dark .cc-chip{background:#312e81;color:#e0e7ff}body.dark .cc-chip.live{background:#064e3b;color:#d1fae5}
  body.dark .cc-msg{background:#1e293b;color:#e2e8f0}body.dark .cc-msg small{color:#94a3b8}body.dark .cc-msg.user{background:#3730a3;color:#fff}body.dark .cc-msg.user small{color:#c7d2fe}
  body.dark .cc-quick button{border-color:#475569}body.dark .cc-form input{border-color:#475569;background:#0b1220;color:#f8fafc}body.dark .cc-form input::placeholder{color:#94a3b8}body.dark .cc-foot{color:#94a3b8}body.dark .cc-foot button{color:#818cf8}
  @media(max-width:640px){#coach-companion-launcher{bottom:calc(78px + env(safe-area-inset-bottom))}body.gym-floor-dock-visible #coach-companion-launcher{bottom:calc(166px + env(safe-area-inset-bottom))}#coach-companion-panel{left:8px;right:8px;bottom:calc(72px + env(safe-area-inset-bottom));width:auto;max-height:calc(100vh - 88px);max-height:calc(100dvh - 88px);border-radius:16px}.cc-messages{height:auto;min-height:96px;flex:1 1 auto}body.gym-floor-dock-visible #coach-companion-panel{bottom:calc(152px + env(safe-area-inset-bottom));max-height:calc(100vh - 168px);max-height:calc(100dvh - 168px)}}`;
  document.head.appendChild(el);
 }
 function ensure(){
  if(document.getElementById('coach-companion-launcher'))return;
  style();
  const launcher=document.createElement('button');launcher.id='coach-companion-launcher';launcher.type='button';launcher.textContent='Coach';launcher.setAttribute('aria-controls','coach-companion-panel');launcher.setAttribute('aria-expanded','false');launcher.addEventListener('click',toggle);document.body.appendChild(launcher);
  const backdrop=document.createElement('button');backdrop.id='coach-companion-backdrop';backdrop.type='button';backdrop.hidden=true;backdrop.tabIndex=-1;backdrop.setAttribute('aria-label','Close Coach Companion');backdrop.addEventListener('click',close);document.body.appendChild(backdrop);
  const panel=document.createElement('aside');panel.id='coach-companion-panel';panel.hidden=true;panel.setAttribute('aria-label','Coach Companion');panel.setAttribute('aria-modal','true');panel.innerHTML=`<div class="cc-head"><div><b>Coach Companion</b><small id="cc-status">Available anywhere in Loadnote</small></div><button class="cc-close" type="button" aria-label="Close Coach Companion">×</button></div><div class="cc-context" id="cc-context"></div><div class="cc-messages" id="cc-messages" aria-live="polite"></div><div class="cc-quick" id="cc-quick"></div><form class="cc-form" id="cc-form"><input id="cc-input" autocomplete="off" placeholder="Ask about your training…" aria-label="Message Coach Companion"><button type="submit">Send</button></form><div class="cc-foot"><span>Training changes stay with Decisions.</span><button type="button" id="cc-full">Open Coach</button></div>`;
  panel.querySelector('.cc-close').addEventListener('click',close);
  panel.querySelector('#cc-form').addEventListener('submit',event=>{event.preventDefault();const input=panel.querySelector('#cc-input');const text=input.value.trim();if(!text||asking)return;input.value='';void serialAsk(text);});
  panel.querySelector('#cc-full').addEventListener('click',()=>{close();document.querySelector('#sp-record-dialog[open]')?.close();try{showTab('coach');showSubTab('coach','co-chat');}catch{}});
  document.body.appendChild(panel);
  append('I’m here throughout Loadnote. During a workout I can read your current set, answer questions from your training context, and control the rest timer.','assistant');
  refresh();
  document.addEventListener('input',queueRefresh,true);document.addEventListener('change',queueRefresh,true);document.addEventListener('click',queueRefresh,true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close();}});
 }
  function append(text,role='assistant',meta=''){
  const host=document.getElementById('cc-messages');if(!host)return;
  const row=document.createElement('div');row.className='cc-msg '+(role==='user'?'user':'assistant');row.textContent=String(text||'');
  if(meta){const small=document.createElement('small');small.textContent=meta;row.appendChild(small);}
  host.appendChild(row);host.scrollTop=host.scrollHeight;
  const full=document.getElementById('chat-messages');if(full){row.fullView=row.cloneNode(true);full.append(row.fullView);full.scrollTop=full.scrollHeight;}
  return row;
 }
 function attachReply(message,reply){for(const host of [message,message?.fullView])window.LoadnoteSmartCoachUI?.attach?.(host,reply,q=>void serialAsk(q));}
 function quickButtons(context){
  const items=context.sportWorkout?['Why this drill?','What is the stop protocol?','Weekly coaching review']:context.liveWorkout?.active?['What’s next?','Why this set?','How did I do last time?']:['How is my training going?','What should I focus on next?'];
  if(context.restTimer?.active)items.unshift('How much rest is left?');
  return items;
 }
 function refresh(){
  const context=companionContext(),launcher=document.getElementById('coach-companion-launcher'),host=document.getElementById('cc-context'),status=document.getElementById('cc-status'),quick=document.getElementById('cc-quick');
  if(!launcher||!host)return;
  launcher.hidden=context.surface==='coach'&&!document.querySelector('[data-panel="coach"][data-sub="co-chat"]')?.classList.contains('hidden');
  launcher.dataset.live=context.liveWorkout?.active||context.sportWorkout?'true':'false';
  const current=Core()?.currentSetSummary(context);
  status.textContent=context.coaching?.currentTask?.name||current||('Viewing '+context.surface);
  const chips=[`<span class="cc-chip">${esc(context.surface)}</span>`];
  if(context.sportWorkout)chips.push('<span class="cc-chip live">Sport session active</span>');
  if(context.liveWorkout?.active)chips.push('<span class="cc-chip live">Workout active</span>');
  if(context.restTimer?.active)chips.push(`<span class="cc-chip">Rest ${esc(context.restTimer.remainingSeconds)}s${context.restTimer.paused?' paused':''}</span>`);
  const chipHtml=chips.join('');
  if(host.innerHTML!==chipHtml)host.innerHTML=chipHtml;
  // Live rest/context polling must not detach a focused or pressed question.
  // Replace controls only when the available questions actually change.
  const questions=[...quickButtons(context),'Give me encouragement'],key=JSON.stringify(questions);
  if(quick.dataset.questions!==key){
   quick.dataset.questions=key;
   quick.innerHTML=questions.map(text=>`<button type="button" data-cc-q="${esc(text)}">${esc(text)}</button>`).join('');
   quick.querySelectorAll('[data-cc-q]').forEach(button=>button.addEventListener('click',()=>void serialAsk(button.dataset.ccQ)));
  }
 }
 function queueRefresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});}
 function execute(command){
  const timer=window.LoadnoteRestTimer;if(!timer)return 'Rest timer controls are unavailable on this screen.';
  const snap=timer.snapshot?.()||{active:false,paused:false};
  if(command.kind==='rest_start'){timer.start?.(command.args.seconds);return 'Rest timer started for '+command.args.seconds+' seconds.';}
  if(command.kind==='rest_pause'){if(!snap.active)return 'No rest timer is running.';if(snap.paused)return 'Rest timer is already paused.';timer.pause?.();return 'Rest timer paused.';}
  if(command.kind==='rest_resume'){if(!snap.active)return 'No rest timer is running.';if(!snap.paused)return 'Rest timer is already running.';timer.pause?.();return 'Rest timer resumed.';}
  if(command.kind==='rest_add_30'){if(!snap.active)return 'No rest timer is running.';timer.add?.();return 'Added 30 seconds to your rest.';}
  if(command.kind==='rest_stop'){if(!snap.active)return 'No rest timer is running.';timer.stop?.();return 'Rest timer stopped.';}
  return 'That action is not available yet.';
 }
 function stripHtml(value){const tmp=document.createElement('div');tmp.innerHTML=String(value||'');return tmp.textContent||tmp.innerText||'';}
 function formatOnline(snapshot){
  if(!snapshot)return 'I could not build a coaching response.';
  let text=String(snapshot.summary||'Coach response ready.').trim();
  const rec=snapshot.recommendation||{};
  if(rec.action&&rec.action!=='none'&&rec.reason)text+=' '+String(rec.reason).trim();
  return text;
 }
 async function ask(text){
  ensure();append(text,'user');
  const live=companionContext(),command=Core()?.classifyCommand(text);
  if(command){const reply=execute(command);append(reply,'assistant','Local companion action');refresh();return reply;}
  let local=null;try{local=window.LoadnoteCoachConversation?.answer(data,text,{asOf:today(),unit:currentUnit(),history,live,intelligence:live.intelligence});}catch{}
  const offline=local?.text||Core()?.offlineReply(live,text);
  const authoritative=local?.source?.startsWith('Shared coaching');
  const client=authoritative?null:Client();
  let signedIn=false;try{signedIn=!!client&&await client.ensureSignedIn();}catch{}
  if(!signedIn){
   let reply=offline;
   if(!reply)try{if(typeof getChatResponse==='function')reply=stripHtml(getChatResponse(text,history));}catch{}
   reply=reply||(window.Capacitor?.isNativePlatform?.()?'I can answer live workout questions offline. Online Coach is unavailable in this native beta.':'I can answer live workout questions offline. Sign in from Profile for broader personalized Coach conversation.');
   const message=append(reply,'assistant',local?.source||'Built-in companion');attachReply(message,local);history.push({role:'user',content:text.slice(0,500)},{role:'assistant',content:reply.slice(0,2000)});if(history.length>24)history.splice(0,history.length-24);refresh();return reply;
  }
  try{
   const snapshot=await client.ask({question:text,context:coachContext(),history:history.slice(-8)});
   const reply=formatOnline(snapshot);append(reply,'assistant',live.liveWorkout?.active?'Live workout context':'Loadnote training context');
   if(typeof renderCoachSnapshot==='function')renderCoachSnapshot(snapshot);
   history.push({role:'user',content:text},{role:'assistant',content:reply});if(history.length>24)history.splice(0,history.length-24);refresh();return reply;
  }catch(error){
   let reply=offline;try{if(!reply&&typeof getChatResponse==='function')reply=stripHtml(getChatResponse(text,history));}catch{}
   reply='Online Coach unavailable. '+(reply||'Your workout logger and deterministic Decisions remain available.');append(reply,'assistant','Local fallback');history.push({role:'user',content:text.slice(0,500)},{role:'assistant',content:reply.slice(0,2000)});if(history.length>24)history.splice(0,history.length-24);refresh();return reply;
  }
 }
 function open(){ensure();const panel=document.getElementById('coach-companion-panel'),launcher=document.getElementById('coach-companion-launcher'),backdrop=document.getElementById('coach-companion-backdrop');const modal=document.querySelector('#sp-record-dialog[open]');if(modal){modal.append(panel);if(backdrop)modal.append(backdrop);}panel.hidden=false;if(backdrop)backdrop.hidden=false;launcher.setAttribute('aria-expanded','true');refresh();clearInterval(refreshTimer);refreshTimer=setInterval(refresh,1000);if(window.matchMedia?.('(min-width: 641px)').matches)setTimeout(()=>document.getElementById('cc-input')?.focus({preventScroll:true}),0);}
 function close(){const panel=document.getElementById('coach-companion-panel'),launcher=document.getElementById('coach-companion-launcher'),backdrop=document.getElementById('coach-companion-backdrop');if(panel){panel.hidden=true;document.body.append(panel);}if(backdrop){backdrop.hidden=true;document.body.append(backdrop);}if(launcher)launcher.setAttribute('aria-expanded','false');clearInterval(refreshTimer);refreshTimer=null;}
 function toggle(){const panel=document.getElementById('coach-companion-panel');if(!panel||panel.hidden)open();else close();}
 function init(){ensure();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 async function serialAsk(text){if(asking||!String(text??'').trim())return null;asking=true;const buttons=[document.querySelector('#cc-form button'),document.getElementById('chat-send-btn')];for(const b of buttons)if(b)b.disabled=true;try{return await ask(String(text).trim().slice(0,500));}finally{asking=false;for(const b of buttons)if(b)b.disabled=false;}}
 function clearConversation(){if(asking)return;history.length=0;document.getElementById('cc-messages')?.replaceChildren();document.getElementById('chat-messages')?.replaceChildren();append('Conversation cleared. Ask about your current training evidence.');}
 function appendTranscript(text,role='assistant',meta='Voice Companion'){if(['user','assistant'].includes(role)){history.push({role,content:String(text??'').slice(0,role==='user'?500:2000)});if(history.length>24)history.splice(0,history.length-24);}return append(text,role,meta);}
 window.LoadnoteCoachCompanionUI={open,close,toggle,refresh,ask:serialAsk,append:appendTranscript,clearConversation,history:()=>history.map(r=>({...r})),context:coachContext,liveContext:companionContext};
})();
