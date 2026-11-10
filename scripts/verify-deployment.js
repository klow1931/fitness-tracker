/* Fail the Pages deployment job if it serves a mixed or incomplete app shell. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
async function verify(base,expected,{fetcher=fetch,timeout=15000}={}){
 const origin=new URL(base.endsWith('/')?base:base+'/');
 if(origin.protocol!=='https:'&&!(origin.protocol==='http:'&&['127.0.0.1','localhost'].includes(origin.hostname)))throw Error('Use HTTPS for deployment verification');
 async function bytes(asset){
  const url=new URL(asset,origin);url.searchParams.set('release-check',expected.version+'-'+Date.now());
  const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(timeout)});
  if(!response.ok)throw Error(asset+' returned HTTP '+response.status);
  return Buffer.from(await response.arrayBuffer());
 }
 const remote=JSON.parse((await bytes('./release.json')).toString());
 if(JSON.stringify(remote)!==JSON.stringify(expected))throw Error('Deployed release manifest does not match expected v'+expected.version);
 const queue=Object.entries(expected.assets);let cursor=0;const failures=[];
 await Promise.all(Array.from({length:Math.min(8,queue.length)},async()=>{
  while(cursor<queue.length){
   const [asset,hash]=queue[cursor++];
   try{
    if(!/^\.\/[a-zA-Z0-9_./-]*$/.test(asset)||asset.split('/').includes('..'))throw Error('Invalid release asset');
    if(crypto.createHash('sha256').update(await bytes(asset)).digest('hex')!==hash)throw Error('content differs');
   }catch(error){failures.push(asset+': '+error.message);}
  }
 }));
 if(failures.length)throw Error(failures.length+' deployed files failed verification: '+failures.slice(0,8).join('; '));
 return {version:expected.version,assets:queue.length};
}
if(require.main===module){
 (async()=>{
  const base=process.argv[2];if(!base)throw Error('Usage: npm run release:verify -- https://host/loadnote/');
  const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'../release.json'),'utf8'));
  for(let attempt=1;attempt<=3;attempt++){
   try{const result=await verify(base,expected);console.log('Verified deployed v'+result.version+' and '+result.assets+' exact app/offline assets');return;}
   catch(error){if(attempt===3)throw error;console.warn('Deployment not consistent yet ('+attempt+'/3): '+error.message);await new Promise(resolve=>setTimeout(resolve,10000));}
  }
 })().catch(error=>{console.error(error.message);process.exitCode=1;});
}
module.exports={verify};
