const assert=require('node:assert/strict');
const Account=require('../src/product/account-session');

(async()=>{
 Account._resetForTest('unknown');
 const calls=[];
 const fakeFetch=async(url,options={})=>{
  calls.push({url,options});
  if(url==='/api/auth/session')return new Response(JSON.stringify({authenticated:true,account:{id:'acct_test',provider:'oidc'},expiresAt:'2026-09-29T00:00:00.000Z',csrf:'csrf-token',transport:'cookie'}),{status:200,headers:{'Content-Type':'application/json'}});
  if(url==='/api/coach')return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
  if(url==='/api/auth/logout')return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
  return new Response('',{status:404});
 };
 let snapshot=await Account.refresh(fakeFetch);
 assert.equal(snapshot.status,'authenticated');
 assert.equal(snapshot.account.id,'acct_test');
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

 Account._resetForTest('unknown');
 const unavailable=await Account.refresh(async()=>new Response('',{status:404}));
 assert.equal(unavailable.status,'unavailable');
 console.log('v2.56 in-memory account session client and CSRF request handling passed');
})().catch(error=>{console.error(error);process.exit(1);});
