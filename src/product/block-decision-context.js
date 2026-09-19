/* v2.6 Part 1 — explicit training-block context, never learned from feedback. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LoadnoteBlockDecisionContext=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION=1;
 const KNOWN=new Set(['return-reentry','accumulation','hypertrophy','strength','peaking','deload','testing','general','custom']);
 function interpret(block){
   if(!block)return {version:VERSION,phase:'unclassified',basis:[],conflicts:[],notes:['No active training block is recorded.'],guard:'none',dataCompleteness:'unknown',benchmarks:{trainingMaxes:0,known1RMs:0}};
   const type=String(block.blockType||'general'),intent=String(block.progressionIntent||'unknown'),strategy=String(block.loadStrategy||'unknown');
   const basis=[],conflicts=[],notes=[];
   let phase='general',guard='none';
   // An explicit intent takes priority over a generic block type, but do not guess
   // that a goal or arbitrary notes turn a general block into a named phase.
   if(intent==='deload'||type==='deload'){phase='deload';guard='protect-plan';basis.push(intent==='deload'?'progression intent: deload':'block type: deload');}
   else if(intent==='testing'||type==='testing'){phase='testing';guard='protect-plan';basis.push(intent==='testing'?'progression intent: testing':'block type: testing');}
   else if(type==='peaking'){phase='peaking';guard='protect-plan';basis.push('block type: peaking');}
   else if(type==='return-reentry'||intent==='return-ramp'){phase='return';basis.push(type==='return-reentry'?'block type: return / re-entry':'progression intent: return ramp');}
   else if(type==='accumulation'||type==='hypertrophy'){phase='accumulation';basis.push('block type: '+type);}
   else if(type==='strength'){phase='strength';basis.push('block type: strength');}
   else {phase='general';basis.push(KNOWN.has(type)?'block type: '+type:'unrecognized block type: '+type);}
   if(strategy==='conservative'||intent==='maintain') {if(guard==='none')guard='conservative';basis.push(strategy==='conservative'?'loading strategy: conservative':'progression intent: maintain');}
   if((type==='general'||type==='custom')&&['testing','deload','return-ramp'].includes(intent))notes.push('The explicitly selected progression intent is more specific than the general block type.');
   if(type==='peaking'&&intent==='deload'||type==='deload'&&intent==='testing'||type==='testing'&&intent==='deload')conflicts.push('Block type and progression intent describe different phases; confirm your intended phase.');
   if(!KNOWN.has(type))conflicts.push('This custom block type has no specialized decision rule.');
   if(block.dataCompleteness!=='complete')notes.push('Block history coverage is '+(block.dataCompleteness||'unknown')+'; do not interpret absence of workouts as missed training.');
   if(!(block.trainingMaxes||[]).length)notes.push('No block training max is recorded; an RPE-based capacity estimate is not a training max.');
   if(!(block.known1RMs||[]).length)notes.push('No known 1RM is recorded; an RPE-based capacity estimate is not a tested max.');
   const phaseNotes={
     deload:'Preserve the athlete’s planned recovery intent; avoid initiating an unplanned loading increase from capacity estimates.',
     testing:'Preserve the planned test protocol; submaximal singles do not establish tested strength or estimate capacity.',
     peaking:'Preserve the planned taper and exposure structure; a recent capacity rise alone does not justify an extra progression.',
     return:'Distinguish restored performance from new strength; prefer the chosen return ramp.',
     accumulation:'Compare repeated competition-lift capacity at controlled effort while preserving accumulation workload intent.',
     strength:'Interpret competition-lift capacity and RPE alongside the stated strength block.',
     general:'No specific training phase is established from the saved fields.'
   };
   notes.unshift(phaseNotes[phase]);
   return {version:VERSION,phase,guard,basis,conflicts,notes,dataCompleteness:block.dataCompleteness||'unknown',
     benchmarks:{trainingMaxes:(block.trainingMaxes||[]).length,known1RMs:(block.known1RMs||[]).length}};
 }
 function contextualize(decision,block){
   const ctx=interpret(block),next={...decision,blockContext:ctx,signals:[...(decision.signals||[])]};
   next.signals.push('Block phase: '+ctx.phase+' ('+ctx.basis.join('; ')+').');
   next.signals.push(...ctx.conflicts,...ctx.notes.filter(note=>/coverage|training max|known 1RM/.test(note)));
   if(!decision.decisionAllowed)return next;
   if(ctx.conflicts.length){next.decision='insufficient-evidence';next.decisionAllowed=false;next.reason='Training-block fields disagree about the intended phase; confirm the block before using a directional decision.';next.nextExposure='Follow the existing plan while you confirm the training-block purpose.';next.watchNext=ctx.conflicts[0];return next;}
   if(ctx.guard==='protect-plan'&&decision.decision==='increase'){
     next.decision='hold';
     const label=ctx.phase==='deload'?'recovery':ctx.phase==='testing'?'testing':'peaking';
     next.reason='The underlying competition-lift evidence supports progression, but the saved '+label+' block calls for preserving its planned structure rather than adding an unplanned increase.';
     next.nextExposure='Follow the saved '+label+' plan; no additional increase is suggested by this model.';
     next.watchNext=ctx.phase==='testing'?'Record the test result separately from RPE-estimated capacity.':'Review the next planned exposure and effort before changing block direction.';
   }else if(ctx.guard==='protect-plan'&&decision.decision==='reduce'){
     next.reason+=' Block context: review the planned '+ctx.phase+' exposure rather than automatically rewriting recovery or test loads.';
     next.nextExposure='Review the next '+ctx.phase+' exposure against the plan and recent effort; this model does not edit it.';
   }else if(ctx.guard==='protect-plan'){
     next.nextExposure='Keep the planned '+ctx.phase+' exposure structure; do not interpret Hold as an instruction to skip or repeat a planned test or taper.';
   }else if(ctx.phase==='return'&&decision.decision==='increase'){
     next.nextExposure='A modest progression may fit the recorded return ramp if it is already planned; restored capacity is not a new tested maximum.';
   }else if(ctx.phase==='accumulation'&&decision.decision==='increase'){
     next.nextExposure='Progress only within the saved accumulation plan; an improved evidence set alone does not prescribe extra workload.';
   }
   return next;
 }
 return {VERSION,interpret,contextualize};
});
