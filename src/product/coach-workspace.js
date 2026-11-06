/* Read-only presentation policy for Coach connection and workout continuity. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCoachWorkspace=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function connection({signedIn=false,loginAvailable=false,availability={},localAI=null,native=false,online=true}={}){
  const result=(text,account=false,ready=false)=>({text,account,ready});
  if(localAI?.conversationConsent)return result('Local conversation selected · '+String(localAI.status||'unavailable')+'. Online Coach is paused.');
  if(native||availability.reason==='native_beta_local_only')return result('Offline coaching is available. This native beta is local-only; online conversation and voice are unavailable.');
  if(!online)return result('Offline coaching is available. Online conversation and live research need a connection; saved sources remain readable.');
  if(!availability.online)return result('Offline coaching is available. Online conversation is not configured or reachable here. Research is a separate option.');
  if(!signedIn)return loginAvailable?result('Offline coaching is available now. Sign in from Profile to use the secure online Coach.',true):result('Offline coaching is available. Online Coach requires an account, but sign-in is unavailable here.');
  return result('Secure online Coach available · choose Online chat in Coach options to use it.',false,true);
 }
 function continuity({hasDraft=false,failed=false,degraded=false,workout=null}={}){
  if(!hasDraft)return {visible:false,text:'',label:''};
  const name=String(workout?.name||'Your workout').slice(0,120);
  return {visible:true,label:'Return to workout',text:failed?'Draft needs attention. Return to Train to retry saving.':degraded?name+' · one local checkpoint is available. Continue logging or retry the second copy in Train.':name+' · unfinished draft. Continue where you left off.'};
 }
 return {connection,continuity};
});
