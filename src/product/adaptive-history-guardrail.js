/* v2.45 — learned-history guardrails for already-eligible adaptive actions. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteAdaptiveHistoryGuardrail=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const UPWARD=new Set(['increase-load','progress','add-set']);
 function pattern(summary,lift,action){
   return summary?.patterns?.find(p=>p.lift===lift&&p.action===action)||null;
 }
 function classify(p){
   if(!p||Number(p.observed||0)<3)return {state:'collecting',reason:'Not enough exact same-lift, same-action follow-up exists to use learned history as a guardrail.'};
   const med=Number.isFinite(Number(p.medianCapacityChangePct))?Number(p.medianCapacityChangePct):null,improved=Number(p.counts?.improved||0),declined=Number(p.counts?.declined||0);
   if(declined>improved&&med!=null&&med<=-1)return {state:'negative',reason:'Repeated exact follow-ups have more declined than improved observations and a negative median capacity change.'};
   if(improved>declined&&med!=null&&med>=1)return {state:'supportive',reason:'Repeated exact follow-ups have more improved than declined observations and a positive median capacity change.'};
   return {state:'mixed',reason:'Repeated exact follow-ups are mixed or mostly stable.'};
 }
 function apply({lift,action,confidence,signal,why},summary){
   if(action==='keep')return {action,confidence,signal,why,history:{state:'not-applicable',pattern:null,changed:false,reason:'No adaptive change is being proposed.'}};
   const p=pattern(summary,lift,action),c=classify(p);
   if(c.state==='negative'&&UPWARD.has(action)){
     return {action:'keep',confidence:'medium',signal:'history-caution',why:why+' Learned-history guardrail: '+c.reason+' Because this is optional upward progression, keep is preferred until new live evidence and additional follow-up support retrying it.',history:{state:c.state,pattern:p,changed:true,reason:c.reason}};
   }
   if(c.state==='negative'){
     return {action,confidence:confidence==='high'?'medium':confidence,signal,why:why+' Learned-history caution: '+c.reason+' Current evidence still supports this bounded reduction, so history does not block the safety-oriented adjustment.',history:{state:c.state,pattern:p,changed:false,reason:c.reason}};
   }
   if(c.state==='supportive'){
     return {action,confidence,signal,why:why+' Learned-history support: '+c.reason+' This history supports confidence only; it did not create or expand the action.',history:{state:c.state,pattern:p,changed:false,reason:c.reason}};
   }
   if(c.state==='mixed'){
     return {action,confidence:confidence==='high'?'medium':confidence,signal,why:why+' Learned-history caution: '+c.reason+' The live deterministic rule remains primary.',history:{state:c.state,pattern:p,changed:false,reason:c.reason}};
   }
   return {action,confidence,signal,why:why+' Learned history is still collecting for this exact lift and action.',history:{state:c.state,pattern:p,changed:false,reason:c.reason}};
 }
 return {UPWARD,pattern,classify,apply};
});
