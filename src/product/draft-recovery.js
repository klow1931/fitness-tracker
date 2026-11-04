/* v6.7 — recover the newest local draft with truthful checkpoint health.
 * One successful write is recoverable; two successful writes provide redundancy.
 * The existing v3 payload and keys remain unchanged.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LoadnoteDraftRecovery=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const suffix='-recovery';
  function read(storage,key,normalize){
    const valid=[];
    for(const [source,slot] of [['primary',key],['recovery',key+suffix]]){
      try{
        const raw=storage.getItem(slot);
        if(!raw)continue;
        const value=normalize(JSON.parse(raw));
        if(value)valid.push({source,value,updatedAt:Number(value.updatedAt)||0});
      }catch(_){/* A partial/corrupt record cannot hide a valid second copy. */}
    }
    valid.sort((a,b)=>b.updatedAt-a.updatedAt||(a.source==='primary'?-1:1));
    return valid[0]?.value||null;
  }
  function write(storage,key,draft){
    const serialized=JSON.stringify(draft);
    let recoverySaved=false,primarySaved=false;
    try{storage.setItem(key+suffix,serialized);recoverySaved=true;}catch(_){}
    try{storage.setItem(key,serialized);primarySaved=true;}catch(_){}
    // A successful recovery copy is recoverable, not a total loss.
    // "Redundant" means both slots contain the latest checkpoint.
    return {saved:primarySaved||recoverySaved,redundant:primarySaved&&recoverySaved,
      recoveryOnly:recoverySaved&&!primarySaved};
  }
  function clear(storage,key){
    let ok=true;
    for(const slot of [key+suffix,key]){
      try{storage.removeItem(slot);}catch(_){ok=false;}
    }
    return ok;
  }
  return {read,write,clear};
});
