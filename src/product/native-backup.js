/* v2.85 — explicit local file sharing; never an automatic cloud upload. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteNativeBackup=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 async function share(filename,text,capacitor=globalThis.Capacitor){
  if(!capacitor?.isNativePlatform?.())return {native:false};
  if(!/^loadnote-[A-Za-z0-9_-]+\.json$/.test(filename))throw Error('Invalid backup filename');
  if(!capacitor.registerPlugin)throw Error('Native file bridge unavailable');
  const filesystem=capacitor.registerPlugin('Filesystem'),sharing=capacitor.registerPlugin('Share');
  const path='loadnote-exports/'+filename;
  // CACHE is temporary. A successful share-sheet return is not proof that a
  // recipient saved a durable backup; do not dismiss reminders automatically.
  await filesystem.writeFile({path,directory:'CACHE',data:String(text),encoding:'utf8',recursive:true});
  const result=await filesystem.getUri({path,directory:'CACHE'});
  await sharing.share({title:'Save Loadnote backup',dialogTitle:'Save your backup to Files',files:[result.uri]});
  return {native:true,verifiedDestination:false};
 }
 return {share};
});
