/* v7.3 — read-only descriptions of the existing History filter controls. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteHistoryView=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function describe(options={}){
  const labels=[],query=String(options.query||'').trim();
  if(query)labels.push('Search: '+query);
  if(options.from)labels.push('From '+options.from);
  if(options.to)labels.push('To '+options.to);
  const source={scheduled:'Calendar-linked',planned:'Planned manual',repeated:'Repeated workout',manual:'Manual'}[options.sourceKind];
  const quality={review:'Needs review',clear:'No current flags'}[options.quality];
  if(source)labels.push('Source: '+source);
  if(quality)labels.push('Status: '+quality);
  const filtered=labels.length>0;
  if(options.sort==='oldest')labels.push('Oldest first');
  return {labels,filtered,changed:labels.length>0,invalidRange:!!(options.from&&options.to&&options.from>options.to)};
 }
 return {describe};
});
