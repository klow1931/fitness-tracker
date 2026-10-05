(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const KINDS=new Set(['review','calendar','programming','proposals','check-in','wave','manage','lifecycle','adapt','preferences','guidance']);
 function route(a){if(!a||!KINDS.has(a.kind))return;
  window.LoadnoteCoachCompanionUI?.close?.();document.querySelector('#sp-record-dialog[open]')?.close();
  if(a.kind==='adapt'){window.LoadnoteAdaptiveSessionUI?.open?.();return;}
  if(a.kind==='preferences'){window.LoadnoteAdaptiveSessionUI?.preferences?.();return;}
  if(a.kind==='guidance'){window.LoadnoteMovementGuidanceUI?.open?.();return;}
  if(a.kind==='calendar'){showTab('calendar');return;}
  showTab('coach');showSubTab('coach','co-programs');
  if(a.kind==='manage'){window.LoadnoteProgramCancellationUI?.open?.();return;}
  if(a.kind==='wave'){window.LoadnotePhaseBuilderUI?.open?.(null,{periodization:'wave'});return;}
  if(a.kind==='lifecycle'){window.LoadnoteProgramLifecycleUI?.route?.(window.LoadnoteProgramLifecycleUI.currentReport());return;}
  const target=a.kind==='programming'?'programming-workspace':a.kind==='proposals'?'coaching-proposals':a.kind==='check-in'?'coaching-week-form':'shared-coaching-review';
  const el=document.getElementById(target);if(el){for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});}
 }
 function attach(host,reply,ask=null){if(!host||!reply?.actions?.length&&!reply?.followUps?.length)return;const group=document.createElement('div');group.className='smart-coach-actions';
  for(const a of (reply.actions||[]).filter(a=>KINDS.has(a.kind)).slice(0,4)){const b=document.createElement('button');b.type='button';b.className='btn-secondary';b.textContent=a.label;b.addEventListener('click',()=>route(a));group.append(b);}
  if(ask)for(const q of (reply.followUps||[]).slice(0,3)){const b=document.createElement('button');b.type='button';b.className='coach-follow-up';b.textContent=q;b.addEventListener('click',()=>ask(q));group.append(b);}host.append(group);
 }
 function render(host){if(!host||!window.LoadnoteSmartCoach)return;try{const b=window.LoadnoteSmartCoach.brief(data,{asOf:today()}),section=document.createElement('section');section.id='smart-coach-brief';section.className='card smart-coach-brief';section.setAttribute('aria-label','Daily coaching brief');section.innerHTML='<p class="eyebrow">DAILY COACHING BRIEF · '+esc(b.asOf)+'</p><h3>'+esc(b.title)+'</h3><p>'+esc(b.reason)+'</p><div class="smart-coach-metrics">'+b.evidence.slice(0,3).map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>'+(b.liftInsights.length?'<details><summary>Lift evidence · '+b.liftInsights.length+'</summary>'+b.liftInsights.map(r=>'<p><b>'+esc(r.name)+'</b> · '+esc(r.status)+' · '+r.sessions+' matching training days<br>'+esc(r.reasons.join(' '))+'</p>').join('')+'</details>':'')+(b.concerns.length?'<details><summary>What needs attention · '+b.concerns.length+'</summary>'+b.concerns.map(x=>'<p>'+esc(x)+'</p>').join('')+'</details>':'')+'<details><summary>Evidence and unknowns</summary><p>'+esc(b.gaps.join('; ')||'No listed gaps; logs describe only recorded training.')+'</p><p>'+esc(b.notice)+'</p></details>';attach(section,{...b,actions:b.actions.slice(0,2),followUps:['What should I focus on today?']},q=>{window.LoadnoteCoachCompanionUI?.open?.();window.LoadnoteCoachCompanionUI?.ask?.(q);});host.prepend(section);}catch(e){const p=document.createElement('p');p.className='more-hint';p.textContent='Daily brief needs validated training records: '+e.message;host.prepend(p);}}
 window.LoadnoteSmartCoachUI={route,attach,render};
})();
