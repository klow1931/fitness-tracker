/* v2.54 — runtime surface detection for browser, installed web and native shells. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LoadnotePlatform=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function detect(env){
    const source=env||{};
    const capacitor=source.Capacitor;
    const native=!!(capacitor&&typeof capacitor.isNativePlatform==='function'&&capacitor.isNativePlatform());
    const nativePlatform=native&&typeof capacitor.getPlatform==='function'?String(capacitor.getPlatform()||'native'):'';
    const standalone=!!(source.navigator?.standalone===true||source.matchMedia?.('(display-mode: standalone)')?.matches);
    const surface=native?'native':standalone?'installed-web':'browser';
    return {version:1,surface,native,nativePlatform:nativePlatform||null,standalone:native||standalone};
  }
  function apply(doc,context){
    if(!doc||!context)return context;
    const root=doc.documentElement,body=doc.body;
    if(root){
      root.dataset.loadnoteSurface=context.surface;
      root.dataset.loadnotePlatform=context.nativePlatform||context.surface;
    }
    if(body?.classList){
      for(const name of ['runtime-browser','runtime-installed-web','runtime-native'])body.classList.remove(name);
      body.classList.add('runtime-'+context.surface);
      if(context.nativePlatform)body.classList.add('runtime-'+context.nativePlatform);
    }
    return context;
  }
  return {detect,apply};
});
