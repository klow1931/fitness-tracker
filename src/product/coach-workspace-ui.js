/* Full and quick Coach share context; navigation never fills or completes sets. */
(function(){
 'use strict';
 let revision=0;
 const policy=()=>window.LoadnoteCoachWorkspace;
 function environment(){return {localAI:window.LoadnoteLocalCoachAI?.snapshot?.()||null,native:!!window.Capacitor?.isNativePlatform?.(),online:navigator.onLine!==false};}
 function paint(value){
  const status=document.getElementById('coach-online-status'),account=document.getElementById('coach-account-link');
  if(status){status.textContent=value.text;status.className=value.ready?'text-xs text-emerald-600 font-medium mt-1':'text-xs text-slate-500 mt-1';}
  if(account)account.hidden=!value.account;
 }
 async function connection({force=false}={}){
  const ticket=++revision,client=window.LoadnoteCoachClient;
  if(!policy())return;
  const immediate=environment();
  if(immediate.localAI?.conversationConsent||immediate.native||!immediate.online){paint(policy().connection(immediate));return;}
  paint({text:'Checking online availability · offline coaching is ready.',account:false});
  let signedIn=false,availability={online:false};
  try{signedIn=await client?.ensureSignedIn?.();availability=await client?.availability?.({force})||availability;}catch{/* Offline guidance stays available. */}
  if(ticket!==revision)return;
  const session=client?.session?.()||{};
  if(['authenticated','anonymous','unavailable'].includes(session.status))signedIn=session.status==='authenticated';
  paint(policy().connection({...environment(),signedIn,loginAvailable:session.loginAvailable===true,availability}));
 }
 function refresh(){
  const companion=window.LoadnoteCoachCompanionUI,host=document.getElementById('coach-context-questions');
  if(!companion||!policy()||!host)return;
  const questions=companion.suggestedQuestions(),key=JSON.stringify(questions);
  // Polling must not detach a pressed/focused shortcut between pointer events.
  if(host.dataset.questions!==key){
   host.dataset.questions=key;host.replaceChildren();
   for(const question of questions){const b=document.createElement('button');b.type='button';b.className='btn-secondary';b.textContent=question;b.addEventListener('mousedown',e=>{if(e.button===0)e.preventDefault();});b.onclick=()=>void companion.ask(question);host.append(b);}
  }
  const continuity=document.getElementById('coach-workout-continuity');if(!continuity)return;
  const hasDraft=typeof loggerHasContent==='function'&&loggerHasContent();
  const state=policy().continuity({hasDraft,failed:window.LoadnoteDraftSaveHealth==='failed',degraded:window.LoadnoteDraftSaveHealth==='degraded',workout:companion.liveContext()?.liveWorkout});
  continuity.hidden=!state.visible;
  const text=continuity.querySelector('p');if(text&&text.textContent!==state.text)text.textContent=state.text;
 }
 function resume(){
  if(typeof loggerHasContent!=='function'||!loggerHasContent()){refresh();return;}
  window.LoadnoteCoachCompanionUI?.close();
  window.openFastStartLogger?.({compact:true});
 }
 function init(){
  document.getElementById('coach-resume-workout')?.addEventListener('click',resume);
  window.addEventListener('online',()=>void connection({force:true}));window.addEventListener('offline',()=>void connection());
  refresh();
 }
 window.LoadnoteCoachWorkspaceUI={refresh,connection,resume};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
