/* Deadline-based rest timer; background throttling never extends the rest. */
const REST_KEY='loadnote-rest-v1';
let restInterval=null,restState=null;
function restRemaining(state,now=Date.now()){return !state?0:Math.max(0,state.paused?state.remaining:state.deadline-now);}
function saveRestState(){
 try{if(restState)localStorage.setItem(REST_KEY,JSON.stringify(restState));else localStorage.removeItem(REST_KEY);}
 catch(_){const el=document.getElementById('rest-storage-hint');if(el)el.textContent='Timer cannot be recovered after refresh on this device.';}
}
function setRestLabels(text){for(const id of ['rest-timer','rest-timer-sticky']){const el=document.getElementById(id);if(el)el.textContent=text;}}
function paintRest(){
 const left=restRemaining(restState);setRestLabels(restState?(Math.ceil(left/1000)+'s'+(restState.paused?' · paused':'')):'—');
 const ring=document.getElementById('rest-ring');
 if(ring){ring.style.setProperty('--rest-progress',restState?String(Math.min(1,left/restState.total)):'0');ring.setAttribute('aria-valuenow',String(Math.ceil(left/1000)));ring.setAttribute('aria-valuemax',String(Math.ceil((restState?.total||1000)/1000)));}
 const pause=document.getElementById('rest-pause');if(pause){pause.disabled=!restState;pause.textContent=restState?.paused?'Resume':'Pause';}
 const add=document.getElementById('rest-add');if(add)add.disabled=!restState;
}
function tickRest(){
 if(restState&&!restState.paused&&restRemaining(restState)===0){stopRest();setRestLabels('Done!');showToast('Rest done','success');try{navigator.vibrate?.(200);}catch(_){}}
 else paintRest();
}
function scheduleRest(){clearInterval(restInterval);restInterval=restState&&!restState.paused?setInterval(tickRest,250):null;paintRest();}
function startRest(seconds){if(!Number.isFinite(seconds)||seconds<=0)return;restState={total:seconds*1000,deadline:Date.now()+seconds*1000,paused:false,remaining:seconds*1000};saveRestState();scheduleRest();}
function pauseRest(){
 if(!restState)return;if(!restState.paused&&restRemaining(restState)===0){tickRest();return;}
 if(restState.paused){restState.deadline=Date.now()+restState.remaining;restState.paused=false;}
 else{restState.remaining=restRemaining(restState);restState.paused=true;}saveRestState();scheduleRest();
}
function addRestTime(){if(!restState)return;if(!restState.paused&&restRemaining(restState)===0){tickRest();return;}restState.total+=30000;restState.remaining+=30000;restState.deadline+=30000;saveRestState();paintRest();}
function stopRest(){clearInterval(restInterval);restInterval=null;restState=null;saveRestState();paintRest();}
function initRestTimer(){
 try{const s=JSON.parse(localStorage.getItem(REST_KEY));if(s&&typeof s.paused==='boolean'&&[s.total,s.deadline,s.remaining].every(Number.isFinite)&&s.total>0&&s.remaining>=0&&s.remaining<=s.total)restState=s;}catch(_){}
 scheduleRest();tickRest();document.addEventListener('visibilitychange',()=>{if(!document.hidden)tickRest();});
}
if(typeof module==='object'&&module.exports)module.exports={restRemaining};
