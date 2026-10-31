/* Shared training/inference features for the small bundled intent classifier. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteCoachTextFeatures=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const STOP=new Set('a an the my me i is am are it that this please can could you do does to of for on with and in have has'.split(' '));
 function words(text){return String(text??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z' ]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w)).slice(0,80);}
 function features(text){const w=words(text);return [...new Set([...w,...w.slice(1).map((v,i)=>w[i]+' '+v)])];}
 return {words,features};
});
