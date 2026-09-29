const assert=require('node:assert/strict');
const Account=require('../src/product/account-session');

(async()=>{
 Account._resetForTest('unknown');
 const calls=[];
 const fakeFetch=async(url,options={})=>{
  calls.push({url,options});
  if(url==='/api/auth/session')return new Response(JSON.stringify({authenticated:true,account:{id:'acct_test',displayName:'Athlete',email:'athlete@example.com',emailVerified:true,providers:['oidc']},expiresAt:'2026-09-29T00:00:00.000Z',csrf:'csrf-token',transport:'cookie',loginAvailable:true,provider:{id:'oidc',name:'Continue with OIDC'}}),{status:200,headers:{'Content-Type':'application/json'}});
  if(url==='/api/coach')return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
  if(url==='/api/auth/logout')return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
  if(url==='/api/account'&&String(options.method||'GET').toUpperCase()==='DELETE')return new Response(JSON.stringify({deleted:true}),{status:200,headers:{'Content-Type':'application/json'}});
  return new Response('',{status:404});
 };
 let snapshot=await Account.refresh(fakeFetch);
 assert.equal(snapshot.status,'authenticated');
 assert.equal(snapshot.account.id,'acct_test');
 assert.equal(snapshot.account.displayName,'Athlete');
 assert.equal(snapshot.account.email,'athlete@example.com');
 assert.deepEqual(snapshot.account.providers,['oidc']);
 assert.equal(snapshot.loginAvailable,true);
 assert.equal(snapshot.provider.name,'Continue with OIDC');
 assert.equal(snapshot.csrf,'csrf-token');

 await Account.request('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'},fakeFetch);
 const coach=calls.find(call=>call.url==='/api/coach');
 assert.equal(coach.options.credentials,'include');
 assert.equal(coach.options.headers.get('X-Loadnote-CSRF'),'csrf-token');

 await Account.signOut(fakeFetch);
 snapshot=Account.snapshot();
 assert.equal(snapshot.status,'anonymous');
 assert.equal(snapshot.account,null);
 assert.equal(snapshot.csrf,null);
 assert.equal(snapshot.loginAvailable,true,'signing out should keep the configured provider available');
 assert.equal(snapshot.provider.name,'Continue with OIDC');

 await Account.refresh(fakeFetch);
 await Account.deleteAccount(fakeFetch);
 snapshot=Account.snapshot();
 assert.equal(snapshot.status,'anonymous');
 const deletion=calls.find(call=>call.url==='/api/account'&&call.options.method==='DELETE');
 assert.equal(deletion.options.headers.get('X-Loadnote-CSRF'),'csrf-token');

 Account._resetForTest('unknown');
 const unavailable=await Account.refresh(async()=>new Response('',{status:404}));
 assert.equal(unavailable.status,'unavailable');
 assert.equal(unavailable.loginAvailable,false);
 assert.equal(unavailable.provider,null);
 console.log('v2.60 in-memory account profile, CSRF, sign-out and account deletion handling passed');
})().catch(error=>{console.error(error);process.exit(1);});
