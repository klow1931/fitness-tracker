const assert=require('node:assert/strict');
const fs=require('fs'),os=require('os'),path=require('path');
const {createServer}=require('../backend/server');

(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-server-auth-'));
 const env={
  NODE_ENV:'test',
  LOADNOTE_ACCOUNT_STORE_PATH:path.join(dir,'accounts.json'),
  LOADNOTE_AUTH_SECRET:'integration-secret-'.padEnd(64,'y'),
  LOADNOTE_REQUIRE_AUTH:'1',
  LOADNOTE_DEV_AUTH:'1',
  LOADNOTE_DEV_AUTH_KEY:'dev-auth-test-key-12345',
  LOADNOTE_AI_API_KEY:''
 };
 const server=createServer({env});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address(),base='http://127.0.0.1:'+address.port;
 try{
  let response=await fetch(base+'/api/auth/session');
  assert.equal(response.status,200);
  assert.equal((await response.json()).authenticated,false);

  response=await fetch(base+'/api/account');
  assert.equal(response.status,401);

  response=await fetch(base+'/api/auth/dev-session',{method:'POST',headers:{'Content-Type':'application/json','X-Loadnote-Dev-Auth':'wrong'},body:JSON.stringify({subject:'user-1'})});
  assert.equal(response.status,401);

  response=await fetch(base+'/api/auth/dev-session',{method:'POST',headers:{'Content-Type':'application/json','X-Loadnote-Dev-Auth':env.LOADNOTE_DEV_AUTH_KEY},body:JSON.stringify({provider:'development',subject:'user-1'})});
  assert.equal(response.status,200);
  const login=await response.json(),cookie=response.headers.get('set-cookie').split(';')[0];
  assert.equal(login.authenticated,true);
  assert.match(login.account.id,/^acct_/);
  assert(login.csrf);
  assert.match(response.headers.get('set-cookie'),/HttpOnly/);

  response=await fetch(base+'/api/auth/session',{headers:{Cookie:cookie}});
  const session=await response.json();
  assert.equal(session.authenticated,true);
  assert.equal(session.account.id,login.account.id);
  assert.equal(session.csrf,login.csrf);

  response=await fetch(base+'/api/account',{headers:{Cookie:cookie}});
  assert.equal(response.status,200);
  assert.equal((await response.json()).account.id,login.account.id);

  response=await fetch(base+'/api/coach',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'test'}]})});
  assert.equal(response.status,403,'authenticated cookie POST must require CSRF');

  response=await fetch(base+'/api/coach',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json','X-Loadnote-CSRF':login.csrf},body:JSON.stringify({messages:[{role:'user',content:'test'}]})});
  assert.equal(response.status,503,'after auth succeeds the missing AI provider key should be the next boundary');

  response=await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:cookie}});
  assert.equal(response.status,403);
  response=await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:cookie,'X-Loadnote-CSRF':login.csrf}});
  assert.equal(response.status,200);
  assert.match(response.headers.get('set-cookie'),/Max-Age=0/);

  response=await fetch(base+'/api/health');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  response=await fetch(base+'/api/health',{headers:{Origin:'https://evil.example'}});
  assert.equal(response.status,403,'unconfigured cross-origin callers must be rejected');
  response=await fetch(base+'/api/health',{headers:{Origin:'capacitor://'+address.address+':'+address.port}});
  assert.equal(response.status,403,'native/custom-scheme origins require explicit allow-listing even when the host text matches');
 }finally{await new Promise(resolve=>server.close(resolve));}

 assert.throws(()=>createServer({env:{NODE_ENV:'production',LOADNOTE_REQUIRE_AUTH:'1'}}),/AUTH_SECRET/);
 const prod=createServer({env:{NODE_ENV:'production',LOADNOTE_REQUIRE_AUTH:'0',LOADNOTE_AUTH_SECRET:'prod-secret-'.padEnd(64,'z'),LOADNOTE_DEV_AUTH:'1',LOADNOTE_DEV_AUTH_KEY:'should-never-enable'}});
 assert.equal(prod.loadnote.devAuthEnabled,false,'development session issuance must stay disabled in production');

 console.log('v2.56 backend session, protected account, CSRF, CORS and production guardrails passed');
})().catch(error=>{console.error(error);process.exit(1);});
