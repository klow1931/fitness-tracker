/* v2.44 — compact adaptive outcome learning view for Decision Performance. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteAdaptiveOutcomeLearningUI=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const signed=n=>n==null?'—':(n>0?'+':'')+n+'%';
 const label={squat:'Squat',bench:'Bench',deadlift:'Deadlift','reduce-load':'Reduce load','reduce-sets':'Reduce sets','add-set':'Add set','progress':'Increase load','reduce-one':'Reduce one set','increase-load':'Increase load'};
 function markup(report,scope='all'){
   if(!report)return '';
   const patterns=report.summary.patterns.filter(p=>scope==='all'||p.lift===scope),rows=report.rows.filter(r=>scope==='all'||r.lift===scope);
   return `<details class="more-details" id="adaptive-outcome-learning"><summary>Adaptive decision outcome learning · ${patterns.length} pattern${patterns.length===1?'':'s'}</summary>
    <p>${esc(report.notice)}</p>
    <p class="more-hint">${report.summary.observed}/${report.summary.recorded} approved adaptive changes have exact usable follow-up. At least three observed follow-ups for the same lift + action are required before Loadnote describes a repeated pattern.</p>
    ${patterns.map(p=>`<article data-adaptive-pattern="${esc(p.lift+':'+p.action)}"><h4>${esc(label[p.lift]||p.lift)} · ${esc(label[p.action]||p.action)} · ${esc(p.evidence)}</h4><p>${p.observed}/${p.recorded} observed · ${p.counts.improved} improved / ${p.counts.stable} stable / ${p.counts.declined} declined · median ${signed(p.medianCapacityChangePct)}</p><p>${esc(p.pattern)}</p></article>`).join('')||'<p>No approved adaptive changes recorded for this lift yet.</p>'}
    <details><summary>Audit adaptive follow-ups · ${rows.length}</summary>${rows.map(r=>`<p><b>${esc(label[r.lift]||r.lift)} · ${esc(label[r.action]||r.action)}</b> · ${esc(r.scope)} · ${esc(r.acceptedAt)} · ${esc(r.status)}${r.capacityChangePct==null?'':' · '+signed(r.capacityChangePct)} · ${esc(r.outcomeClass)}</p>`).join('')||'<p>No adaptive follow-ups yet.</p>'}</details>
   </details>`;
 }
 return {markup};
});
