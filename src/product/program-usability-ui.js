(function(){
 'use strict';
 const Model=window.LoadnoteProgramUsability;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function progress(stage){return (stage==='Cancelled'?'<p class="program-status-cancelled">Cancelled · no remaining program workouts are active</p>':'')+'<ol class="program-status-path" aria-label="Program progress">'+Model.stages.map(label=>'<li'+(label===stage?' aria-current="step"':'')+'>'+esc(label)+'</li>').join('')+'</ol>';}
 function recordStage(record,kind){try{return Model.recordStatus(record,data,{kind,asOf:today(),cancelled:window.LoadnoteProgramCancellation?.isCancelled?.(data,record.id,kind==='meet'?'meet-cycle':kind==='phase'?'phase-program':kind+'-program')});}catch{return 'Status needs review';}}
 function recordProgress(record,kind){return progress(recordStage(record,kind));}
 function help(host,terms=Object.keys(Model.terms)){
  if(!host||host.querySelector('[data-program-terms]'))return;
  const detail=document.createElement('details');detail.dataset.programTerms='';detail.className='program-term-help';
  detail.innerHTML='<summary>Training terms</summary><dl>'+terms.map(term=>'<dt>'+esc(term)+'</dt><dd>'+esc(Model.terms[term])+'</dd>').join('')+'</dl>';
  (host.querySelector('h2,h3')||host.firstElementChild)?.after(detail);
 }
 function fieldError(form,message,field){
  form.querySelectorAll('[data-field-error]').forEach(el=>el.remove());
  form.querySelectorAll('[data-ux-invalid]').forEach(el=>{el.removeAttribute('aria-invalid');const id=el.dataset.uxInvalid;el.setAttribute('aria-describedby',(el.getAttribute('aria-describedby')||'').split(' ').filter(x=>x!==id).join(' '));delete el.dataset.uxInvalid;});
  if(!field||!message)return;
  const target=typeof field==='string'?form.querySelector(field):field;if(!target)return;
  form._programWizard?.reveal(target);
  for(let p=target.parentElement;p&&p!==form;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
  const note=document.createElement('p');note.dataset.fieldError='';note.className='program-field-error';note.id=(target.id||(form.closest('[id]')?.id||'program-form')+'-field')+'-error';note.textContent=message;
  (target.closest('label')||target).after(note);target.setAttribute('aria-invalid','true');target.dataset.uxInvalid=note.id;
  target.setAttribute('aria-describedby',[target.getAttribute('aria-describedby'),note.id].filter(Boolean).join(' '));target.focus();
 }
 function watchErrors(form,error,resolve){
  if(!error)return;
  const observer=new MutationObserver(()=>{const message=error.textContent.trim();fieldError(form,message,message?resolve(message):null);});
  observer.observe(error,{childList:true,characterData:true,subtree:true});
  form.addEventListener('invalid',e=>{if(form._uxReportingInvalid)return;form._uxReportingInvalid=true;fieldError(form,e.target.validationMessage,e.target);queueMicrotask(()=>{form._uxReportingInvalid=false;});},true);
  form.addEventListener('input',e=>{if(e.target.matches('input,select,textarea')&&e.target.hasAttribute('data-ux-invalid'))fieldError(form,'',null);});
  return observer;
 }
 function wizard(form,{titles,group,enabled=false,summary=null,validateStep=null}){
  if(form._programWizard)return form._programWizard;
  const header=document.createElement('div');header.className='program-wizard-header';
  const status=document.createElement('p');status.className='program-wizard-progress';status.setAttribute('aria-live','polite');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='btn-secondary';toggle.dataset.wizardToggle='';
  header.append(status,toggle);form.querySelector('h2')?.after(header);
  const original=[...form.children].filter(el=>el!==header&&!el.matches('h2,.eyebrow,[data-program-terms]'));
  const panels=titles.map((title,i)=>{const section=document.createElement('section');section.className='program-wizard-step';section.dataset.wizardStep=String(i);const h=document.createElement('h3');h.textContent=title;h.tabIndex=-1;section.append(h);form.append(section);return section;});
  const controls=[];
  for(const el of original){const index=group(el);if(index===null){controls.push(el);continue;}panels[Math.max(0,Math.min(panels.length-1,index))].append(el);}
  const review=document.createElement('section');review.className='program-selected-summary';review.setAttribute('aria-label','Your selected setup');panels.at(-1).querySelector('h3').after(review);
  const nav=document.createElement('div');nav.className='program-wizard-actions';
  const back=document.createElement('button'),next=document.createElement('button');
  for(const [button,label,key] of [[back,'Back','back'],[next,'Next','next']]){button.type='button';button.className='btn-secondary';button.textContent=label;button.dataset.wizardAction=key;nav.append(button);}
  form.append(nav,...controls);
  let active=0,guided=enabled;
  function render(focus=false){
   panels.forEach((p,i)=>p.hidden=guided&&i!==active);
   status.textContent=guided?'Step '+(active+1)+' of '+panels.length+' · '+titles[active]:'All setup fields · change to guided steps anytime';
   toggle.textContent=guided?'Show all fields':'Use step-by-step setup';toggle.setAttribute('aria-pressed',String(guided));
   nav.hidden=!guided;back.hidden=active===0;next.hidden=active===panels.length-1;
   form.querySelectorAll('button[type=submit]').forEach(b=>b.hidden=guided&&active!==panels.length-1);
   if(summary)summary(review);
   if(focus&&guided)panels[active].querySelector('h3').focus();
  }
  function reveal(target){const p=target.closest('[data-wizard-step]');if(p){active=Number(p.dataset.wizardStep);render();}}
  function valid(){for(const input of panels[active].querySelectorAll('input,select,textarea')){if(!input.disabled&&!input.checkValidity()){reveal(input);input.reportValidity();return false;}}const allowed=validateStep?validateStep(active)!==false:true;if(allowed)fieldError(form,'',null);return allowed;}
  toggle.onclick=()=>{guided=!guided;render();};back.onclick=()=>{active=Math.max(0,active-1);render(true);};next.onclick=()=>{if(valid()){active=Math.min(panels.length-1,active+1);render(true);}};
  form.addEventListener('invalid',e=>{if(form._uxReportingInvalid)return;reveal(e.target);for(let p=e.target.parentElement;p&&p!==form;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;},true);
  form.addEventListener('submit',e=>{if(guided&&active!==panels.length-1){e.preventDefault();e.stopImmediatePropagation();if(valid()){active++;render(true);}}},true);
  form.addEventListener('input',()=>{if(summary)summary(review);});form.addEventListener('change',()=>{if(summary)summary(review);});
  const api={reveal,review:()=>{active=panels.length-1;render(true);},render,isGuided:()=>guided};form._programWizard=api;render();if(enabled)panels[0].querySelector('input:not([type=checkbox]):not(:disabled),select:not(:disabled),textarea')?.setAttribute('autofocus','');return api;
 }
 function selectedSummary(form,host){
  const rows=[...form.querySelectorAll('input:not([type=checkbox]):not([type=hidden]),select,textarea')].filter(el=>!el.closest('[id$="-preview"]')&&!el.disabled&&!el.closest('[data-program-terms]'));
  const named=rows.filter(el=>el.id&&/profile-(goal|experience|consistency|minutes|event)|phase-(start|minutes|periodization|squat-tm|bench-tm|deadlift-tm)|cycle-(meet-date|event-type|event-name)|(?:hyp|sp)-(goal|name|start|weeks|minutes)/.test(el.id));
  host.innerHTML='<h4>Review your selected setup</h4><dl>'+named.map(el=>{const label=el.closest('label')?.childNodes[0]?.textContent?.trim()||el.id;const value=el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:el.value;return '<dt>'+esc(label)+'</dt><dd>'+esc(value||'Not provided — no value inferred')+'</dd>';}).join('')+'</dl><p>These are your current choices. Review generated recommendations, reasons, missing information and warnings before saving. Nothing is scheduled by continuing through these steps.</p>';
  const dl=host.querySelector('dl');
  for(const [label,selector] of [['Training days','[data-profile-day]:checked,[data-phase-day]:checked,[data-hyp-day]:checked,[data-sp-day]:checked'],['Equipment','[data-profile-equipment]:checked,[data-profile-accessory-equipment]:checked']]){
   const values=[...form.querySelectorAll(selector)].map(el=>el.closest('label')?.textContent.trim()||el.value);
   if(form.querySelector(selector.replaceAll(':checked',''))){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=values.length?[...new Set(values)].join(', '):'None selected';dl.append(dt,dd);}
  }
 }
 function profile(form,{guided=false}={}){
  for(const [id,label] of [['profile-goal','Training goal'],['profile-experience','Training experience (self-reported)'],['profile-consistency','Recent consistency']]){const el=form.querySelector('#'+id)?.closest('label');if(el?.firstChild?.nodeType===3)el.firstChild.textContent=label;}
  help(form,['RPE','Training max']);
  const classify=el=>{if(el.matches('button,#profile-error'))return null;if(el.matches('[role=status]')||el.querySelector('#profile-goal,#profile-experience,#profile-consistency'))return 0;if(el.querySelector('[data-profile-day],#profile-minutes,#profile-event')||el.matches('p')&&el.textContent.includes('event date'))return 1;if(el.matches('fieldset'))return 2;return 3;};
  wizard(form,{titles:['Your training goal','Your schedule','Available equipment','Preferences & review'],group:classify,enabled:guided,summary:h=>selectedSummary(form,h),validateStep:index=>{
   if(index===1&&!form.querySelector('[data-profile-day]:checked')){fieldError(form,'Choose at least one day when you are available to train.','[data-profile-day]');return false;}
  }});
  watchErrors(form,form.querySelector('#profile-error'),m=>/days/i.test(m)?'[data-profile-day]':/minutes/i.test(m)?'#profile-minutes':/date/i.test(m)?'#profile-event':/equipment/i.test(m)?'[data-profile-equipment]':/notes|characters/i.test(m)?'#profile-notes':null);
 }
 function phase(form,{guided=false}={}){
  if(!form.querySelector('.phase-main-lifts')){
   const basics=document.createElement('fieldset');basics.className='phase-main-lifts';basics.innerHTML='<legend>Your chosen training maxes</legend><p>Choose these reference weights yourself. Unknown maxes are never filled from goals or guessed from experience.</p>';
   for(const lift of ['squat','bench','deadlift']){const label=form.querySelector('#phase-'+lift+'-tm')?.closest('label');if(label){label.firstChild.textContent=lift.charAt(0).toUpperCase()+lift.slice(1)+' training max ('+unitLabel()+')';basics.append(label);}}
   form.querySelector('.phase-lift')?.before(basics);
  }
  const maxHelp=document.createElement('details');maxHelp.className='program-term-help';maxHelp.innerHTML='<summary>What is a training max?</summary><p>'+esc(Model.terms['Training max'])+'</p>';form.querySelector('.phase-main-lifts')?.append(maxHelp);
  for(const [id,label] of [['phase-accumulation','Build training volume · weeks (accumulation, 2–6)'],['phase-strength','Practice heavier lifting · weeks (strength, 2–6)'],['phase-periodization','How loads change over time (periodization)']]){const el=form.querySelector('#'+id)?.closest('label');if(el?.firstChild?.nodeType===3)el.firstChild.textContent=label;}
  if(guided){
   const recommendations=document.createElement('details');recommendations.dataset.programRecommendations='';recommendations.className='more-details';recommendations.innerHTML='<summary>Suggested settings &amp; reasons</summary><p>Suggestions use the existing program rules and saved evidence. Your chosen training maxes stay explicit; missing information is not filled with guesses.</p>';
   for(const el of [...form.children])if(el.matches('.cycle-controller-summary')||el.querySelector('#phase-starting-apply,[data-starting-prescription]'))recommendations.append(el);
   form.querySelector('button[type=submit]')?.before(recommendations);
  }
  help(form);
  wizard(form,{titles:['Schedule & loading style','Lifts & chosen training maxes','Accessories & review'],enabled:guided,summary:h=>selectedSummary(form,h),validateStep:index=>{
   if(index===0){const count=form.querySelectorAll('[data-phase-day]:checked').length;if(count<2||count>5){fieldError(form,'Choose 2–5 training days within your saved availability.','[data-phase-day]:not(:disabled)');return false;}}
   if(index===1)for(const lift of ['squat','bench','deadlift']){const input=form.querySelector('#phase-'+lift+'-tm'),kg=Number(input.value)*(currentUnit()==='lb'?.45359237:1);if(!input.value.trim()||!Number.isFinite(kg)||kg<10||kg>1000){fieldError(form,'Choose an explicit '+lift+' training max between '+toDisplay(10)+' and '+toDisplay(1000)+' '+unitLabel()+'. Unknown maxes are not filled automatically.',input);return false;}}
  },group:el=>{
   if(el.matches('button,#phase-error'))return null;
   if(el.matches('.phase-lift,.phase-main-lifts')||el.querySelector('.phase-lift'))return 1;
   if(el.matches('[data-accessory-editor],#phase-preview,[data-program-recommendations]')||el.querySelector('#phase-starting-apply')||el.matches('.cycle-controller-summary'))return 2;
   return 0;
  }});
  watchErrors(form,form.querySelector('#phase-error'),m=>{
   const lift=['squat','bench','deadlift'].find(l=>m.toLowerCase().includes(l));
   if(lift)return '#phase-'+lift+(/variation.*max/i.test(m)?'-variation-tm':/max/i.test(m)?'-tm':/set/i.test(m)?'-sets':/step/i.test(m)?'-step':'-tm');
   return /confirm|reviewed every/i.test(m)?'#phase-confirm':/minute|time budget/i.test(m)?'#phase-minutes':/days|frequency|availability/i.test(m)?'[data-phase-day]':/start|date/i.test(m)?'#phase-start':/name/i.test(m)?'#phase-name':null;
  });
  if(!form.closest('.meet-setup-dialog')){
   const alignDays=()=>{if(!form._programWizard.isGuided())return;const days=[...form.querySelectorAll('[data-phase-day]:checked')].map(el=>Number(el.value));
    ['squat','bench','deadlift'].forEach((lift,i)=>form.querySelectorAll('[data-phase-slot^="'+lift+':"]').forEach(el=>{const day=Number(el.dataset.phaseSlot.split(':')[1]);el.disabled=!days.includes(day);el.value=day===days[i%Math.max(1,days.length)]?'primary:straight':days.length>=3&&day===days[(i+1)%days.length]?'light:straight':'off';}));
   };
   form.querySelectorAll('[data-phase-day]').forEach(el=>el.addEventListener('change',alignDays));if(guided)alignDays();
   const hint=document.createElement('p');hint.className='more-hint';hint.textContent='In guided steps, changing training days rebuilds the suggested lift layout. Review lift days and variations afterward.';form.querySelector('[data-phase-day]')?.closest('fieldset')?.append(hint);
  }
 }
 function cycle(form){
  help(form,['Training max','Accumulation','Strength','Peaking','Taper']);
  watchErrors(form,form.querySelector('#cycle-error'),m=>{
   if(/confirm|review the complete/i.test(m))return '#cycle-confirm';if(/name/i.test(m))return '#cycle-event-name';
   if(form.querySelector('#cycle-customize').checked){const phase=['accumulation','strength','peak','taper'].find(p=>m.toLowerCase().includes(p));if(phase)return '#cycle-'+phase;if(/phase|weeks|override/i.test(m))return '#cycle-customize';}
   return /date|weekend|Saturday|Sunday|timeline|weeks/i.test(m)?'#cycle-meet-date':null;
  });
 }
 function specialized(form,prefix){
  help(form,['RPE','Deload','Periodization']);
  wizard(form,{titles:['Goal & schedule','Movements & chosen doses','Review your plan'],summary:h=>selectedSummary(form,h),group:el=>{
   if(el.matches('#'+prefix+'-add')||el.id===prefix+'-slots')return 1;
   if(el.id===prefix+'-preview')return 2;
   if(el.matches('button')||el.id===prefix+'-error')return null;
   return 0;
  }});
  const missing=selector=>[...form.querySelectorAll(selector)].find(el=>!el.value.trim());
  watchErrors(form,form.querySelector('#'+prefix+'-error'),m=>{
   if(/reviewer name|named.*review/i.test(m))return '#'+prefix+'-review-name';
   if(/goal/i.test(m))return '#'+prefix+'-goal';
   if(/identity|confirmed exercise/i.test(m))return missing('[data-slot=exercise],[data-sp-field=exercise]');
   if(/starting load|increments/i.test(m))return missing('[data-slot=load],[data-slot=increment],[data-sp-field=load]');
   if(/why.*exercise|purpose|infer a weakness/i.test(m))return missing('[data-slot=purpose],[data-sp-field=purpose]');
   if(/minutes|time budget/i.test(m))return '#'+prefix+'-minutes';
   if(/days|availability/i.test(m))return '[data-'+prefix+'-day]';
   if(/start|Monday/i.test(m))return '#'+prefix+'-start';
   if(/weeks/i.test(m))return '#'+prefix+'-weeks';
   return null;
  });
 }
 function overview(sessions,config){
  const p=Model.overview(sessions,config),days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const first=p.first;
  const describe=e=>{
   if(e.type==='practice')return 'Review exact practice/drill targets below';
   const text=e.type==='cardio'?window.LoadnoteAccessoriesUI?.describe?.(e)||'Review duration below':!e.sets?.length?'Review exact targets below':window.LoadnoteAccessoriesUI?.describe?.(e)||'Review exact targets below';
   return text+(e.loadConvention?' · '+(window.LoadnoteHypertrophyBuilder?.CONVENTIONS?.[e.loadConvention]||e.loadConvention):'');
  };
  return '<section class="program-overview" aria-label="Your program at a glance"><h3>Your program at a glance</h3><dl><dt>When will I train?</dt><dd>'+esc(p.days.map(d=>days[d]).join(', ')||'No sessions available')+' · '+p.count+' proposed workouts</dd><dt>How long will sessions take?</dt><dd>'+esc(p.minutes?p.minutes.min+'–'+p.minutes.max+' minutes estimated':'Estimate unavailable; review session details')+'</dd><dt>What is my first workout?</dt><dd>'+esc(first?first.date+' · '+(first.name||'Workout'):'No first workout available')+(first?'<ul>'+(first.exercises||[]).map(e=>'<li>'+esc(e.name)+' · '+esc(describe(e))+'</li>').join('')+'</ul>':'')+'</dd><dt>How does training change?</dt><dd>'+esc(p.phases.map(Model.phase).join(' → ')||'Review the generated weeks')+(p.event?' · event '+esc(p.event):'')+'</dd><dt>What happens when I confirm?</dt><dd>Save the reviewed plan on this device. Then explicitly choose Schedule to add workouts to Calendar. No completed workouts or meet attempts are created.</dd></dl></section>';
 }
 window.LoadnoteProgramUsabilityUI={progress,recordStage,recordProgress,help,profile,phase,cycle,specialized,overview,fieldError,watchErrors};
})();
