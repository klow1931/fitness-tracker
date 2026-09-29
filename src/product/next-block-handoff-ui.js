/* v2.46 — next-program handoff card and launcher. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteNextBlockHandoffUI=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function report(state,asOf){
   const draftOpen=typeof readLoggerDraft==='function'&&!!readLoggerDraft();
   try{return window.LoadnoteNextBlockHandoff?.inspect(state,{asOf,draftOpen})||null;}catch(e){return {status:'blocked',ready:false,summary:e.message,checks:[],blockers:[e.message],warnings:[],objectives:null,prefill:null};}
 }
 function card(state,asOf){
   const r=report(state,asOf);if(!r)return '';
   const checks=(r.checks||[]).map(c=>'<li data-handoff-check="'+esc(c.id)+'">'+(c.ok?'✓ ':'⚠ ')+esc(c.label)+' — '+esc(c.detail)+'</li>').join('');
   const lifts=r.objectives?.status==='ready'?window.LoadnoteNextBlockHandoff.LIFTS.map(l=>{const x=r.objectives.lifts[l];if(!x?.targetKg)return '';return '<p data-handoff-lift="'+l+'"><b>'+esc(x.name)+'</b> · '+esc(x.nextObjective.label)+(x.transition?.changePct==null?'':' · prior block '+(x.transition.changePct>0?'+':'')+x.transition.changePct+'%')+'<br><small>'+esc(x.nextObjective.reason)+'</small></p>';}).join(''):'';
   const range=r.prefill?'<p><b>Proposed handoff window:</b> '+esc(r.prefill.startDate)+'–'+esc(r.prefill.endDate)+' · '+r.prefill.totalWeeks+' weeks · '+r.prefill.accumulationWeeks+' accumulation / '+r.prefill.strengthWeeks+' strength / 1 deload.</p>':'';
   const blockers=(r.blockers||[]).length?'<p><b>Resolve before starting:</b></p><ul>'+r.blockers.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'';
   const warnings=(r.warnings||[]).length?'<details class="more-details"><summary>Handoff warnings · '+r.warnings.length+'</summary><ul>'+r.warnings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>':'';
   const action=r.ready?'<button type="button" class="btn-primary" data-next-block-start>Review next program</button>':'';
   return '<section class="cycle-controller-summary" id="next-block-handoff"><h3>Next program handoff</h3><p>'+esc(r.summary)+'</p>'+range+lifts+'<details class="more-details"><summary>Handoff readiness · '+(r.ready?'ready':'blocked')+'</summary><ul>'+checks+'</ul>'+blockers+'</details>'+warnings+'<p class="more-hint">What Loadnote carries forward: timing, phase emphasis, goals, and prior training-max references. What stays athlete-reviewed: training maxes, exercises, exposures, frequency, set counts, load increment, and the final Calendar schedule.</p>'+action+'</section>';
 }
 function bind(host,state,asOf){
   host?.querySelector('[data-next-block-start]')?.addEventListener('click',()=>{
     const r=report(state,asOf);
     if(!r?.ready||!r.prefill)return;
     window.LoadnotePhaseBuilderUI?.open(r);
   });
 }
 function open(state,asOf){
   const r=report(state,asOf);if(!r?.ready||!r.prefill)return false;
   showTab('coach');showSubTab('coach','co-programs');
   const panel=document.getElementById('phase-builder-panel');if(panel)panel.open=true;
   window.LoadnotePhaseBuilderUI?.open(r);return true;
 }
 return {card,bind,report,open};
});
