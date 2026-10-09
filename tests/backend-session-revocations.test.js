const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createSessionRevocations}=require('../backend/session-revocations'),{createServer}=require('../backend/server');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-revoke-')),filePath=path.join(dir,'revocations.json');let clock=1000;
 const store=createSessionRevocations({filePath,now:()=>clock});store.revoke('one',new Date(2000).toISOString());assert(store.revoked('one'));assert(createSessionRevocations({filePath,now:()=>clock}).revoked('one'));clock=2000;assert(!store.revoked('one'));
 fs.writeFileSync(filePath,'{}');assert.throws(()=>createSessionRevocations({filePath}),/Invalid/);
 const env={NODE_ENV:'test',LOADNOTE_ACCOUNT_STORE_PATH:path.join(dir,'accounts.json'),LOADNOTE_AUTH_SECRET:'test-secret'.padEnd(64,'x'),LOADNOTE_DEV_AUTH:'1',LOADNOTE_DEV_AUTH_KEY:'development-key-12345'};
 let server,base;const start=async()=>{server=createServer({env});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const login=async()=>{const res=await fetch(base+'/api/auth/dev-session',{method:'POST',headers:{'Content-Type':'application/json','X-Loadnote-Dev-Auth':env.LOADNOTE_DEV_AUTH_KEY},body:JSON.stringify({subject:'same-athlete'})});return {cookie:res.headers.get('set-cookie').split(';')[0],...(await res.json())};};
 const session=async headers=>(await (await fetch(base+'/api/auth/session',{headers})).json()).authenticated;
 try{
  await start();const first=await login(),second=await login(),bearer={Authorization:'Bearer '+first.cookie.split('=')[1]};
  assert.equal((await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:first.cookie}})).status,403);assert(await session(bearer));
  assert.equal((await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:first.cookie,'X-Loadnote-CSRF':first.csrf}})).status,200);
  assert.equal(await session({Cookie:first.cookie}),false);assert.equal(await session(bearer),false);assert(await session({Cookie:second.cookie}));
  await new Promise(r=>server.close(r));await start();assert.equal(await session(bearer),false);assert(await session({Cookie:second.cookie}));
  const secondBearer={Authorization:'Bearer '+second.cookie.split('=')[1]};assert.equal((await fetch(base+'/api/auth/logout',{method:'POST',headers:secondBearer})).status,200);assert.equal(await session(secondBearer),false);
  const third=await login(),revocations=env.LOADNOTE_ACCOUNT_STORE_PATH+'.revocations.json';fs.writeFileSync(revocations,'invalid');
  assert.equal((await fetch(base+'/api/auth/session',{headers:{Cookie:third.cookie}})).status,500,'corrupt durable store must fail closed');
  assert.equal((await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:third.cookie,'X-Loadnote-CSRF':third.csrf}})).status,500,'failed persistence must not report logout success');
 }finally{if(server?.listening)await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
 console.log('Durable cookie/bearer revocation, restart, CSRF and fail-closed storage passed');
})().catch(e=>{console.error(e);process.exit(1);});
