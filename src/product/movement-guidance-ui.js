(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function open(name=null){
  const existing=document.getElementById('movement-guidance-dialog');if(existing?.open)return;existing?.remove();
  const ctx=window.LoadnoteTrainingCockpitUI?.current?.(),current=name||ctx?.row?.querySelector('.ex-name')?.value.trim(),names=[...new Set([...(data.exerciseCatalog||[]).map(e=>e.name),...LoadnoteMovementGuidance.names(),...(current?[current]:[])])].sort();
  const d=document.createElement('dialog');d.id='movement-guidance-dialog';d.className='card schedule-dialog';d.innerHTML='<h2>Exercise guidance</h2><label>Movement<select class="input" id="movement-guidance-name">'+names.map(n=>'<option '+(n===current?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label><div id="movement-guidance-content"></div><button type="button" class="btn-secondary" id="movement-guidance-close">Close</button>';document.body.append(d);
  function render(){const n=d.querySelector('select').value,c=LoadnoteMovementGuidance.find(n),note=data.exerciseNotes?.[n];d.querySelector('#movement-guidance-content').innerHTML=(c?'<h3>Setup</h3><p>'+esc(c.setup)+'</p><h3>Short cues</h3><ul>'+c.cues.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><a href="'+c.source+'" target="_blank" rel="noopener noreferrer">ACE instruction and demonstration (external)</a>':'<p>No curated instruction is available for this exact movement. Use your reviewed protocol or qualified coaching; cues from a similarly named movement are not substituted.</p>')+(note?'<h3>Your saved notes</h3><p>'+esc(note)+'</p>':'')+'<p>'+esc(LoadnoteMovementGuidance.notice)+'</p>';}
  d.querySelector('select').onchange=render;d.querySelector('#movement-guidance-close').onclick=()=>d.close();d.onclose=()=>d.remove();render();d.showModal();
 }
 window.LoadnoteMovementGuidanceUI={open};
})();
