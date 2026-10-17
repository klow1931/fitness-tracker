/* Recover the newest valid local workout draft without changing the v3 payload. */
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
    let redundant=false,saved=false;
    try{storage.setItem(key+suffix,serialized);redundant=true;}catch(_){}
    try{storage.setItem(key,serialized);saved=true;}catch(_){}
    return {saved,redundant};
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
