(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LoadnoteAppVersion=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 function compare(a,b){
  if(!/^\d+\.\d+\.\d+$/.test(a)||!/^\d+\.\d+\.\d+$/.test(b))throw Error('Invalid app version');
  const left=a.split('.').map(Number),right=b.split('.').map(Number);
  for(let i=0;i<3;i++)if(left[i]!==right[i])return Math.sign(left[i]-right[i]);
  return 0;
 }
 function describe(installed,latest,state){
  const prefix='Installed v'+installed+' · ';
  if(state==='native')return prefix+'Updates arrive through a new app build.';
  if(state==='offline')return prefix+'Connect to check the live version.';
  if(state==='checking')return prefix+'Checking the live version…';
  if(state==='failed')return prefix+'Live version could not be verified. Try again online.';
  if(state==='waiting')return prefix+(latest&&compare(latest,installed)>0?'Live v'+latest+'. ':'')+'An update is ready. Save and update when ready.';
  if(!latest)return prefix+'Tap Check for updates to check the live version.';
  const difference=compare(latest,installed);
  if(difference>0)return prefix+'Live v'+latest+'. An update is available; keep Loadnote online until it is ready.';
  if(difference<0)return prefix+'Live v'+latest+'. This installation is newer than the live release.';
  return prefix+'Live v'+latest+'. You have the current version.';
 }
 async function fetchLatest(fetcher,signal){
  const response=await fetcher('./release.json?check='+Date.now(),{cache:'no-store',signal});
  if(!response.ok)throw Error('Live version unavailable');
  const value=await response.json();compare(value.version,value.version);
  return value.version;
 }
 return {compare,describe,fetchLatest};
});
