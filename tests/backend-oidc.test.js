const assert=require('node:assert/strict');
const crypto=require('crypto'),fs=require('fs'),os=require('os'),path=require('path');
const {createServer}=require('../backend/server');

const issuer='https://id.example',clientId='loadnote-client',redirectUri='https://app.example/api/auth/callback';
const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=publicKey.export({format:'jwk'});jwk.kid='server-test-key';jwk.use='sig';jwk.alg='RS256';
let expectedNonce='';
const nowSec=Math.floor(Date.now()/1000);
const jwt=claims=>{
 const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:jwk.kid})).toString('base64url');
 const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');
 const input=header+'.'+payload;
 return input+'.'+crypto.sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
};
const providerFetch=async(url,options={})=>{
 if(url===issuer+'/.well-known/openid-configuration')return new Response(JSON.stringify({
  issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/token',jwks_uri:issuer+'/jwks',id_token_signing_alg_values_supported:['RS256']
 }),{status:200,headers:{'Content-Type':'application/json'}});
 if(url===issuer+'/jwks')return new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{'Content-Type':'application/json'}});
 if(url===issuer+'/token')return new Response(JSON.stringify({id_token:jwt({
  iss:issuer,aud:clientId,sub:'commercial-user-1',iat:nowSec,exp:nowSec+3600,nonce:expectedNonce,
  email:'user@example.com',email_verified:true,name:'Loadnote Tester'
 })}),{status:200,headers:{'Content-Type':'application/json'}});
 return new Response('',{status:404});
};
const cookies=headers=>typeof headers.getSetCookie==='function'?headers.getSetCookie():[headers.get('set-cookie')].filter(Boolean);

(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-oidc-server-')),storePath=path.join(dir,'accounts.json');
 const env={
  NODE_ENV:'test',
  LOADNOTE_AUTH_SECRET:'server-oidc-secret-'.padEnd(64,'s'),
  LOADNOTE_REQUIRE_AUTH:'1',
  LOADNOTE_ACCOUNT_STORE_PATH:storePath,
  LOADNOTE_OIDC_ISSUER:issuer,
  LOADNOTE_OIDC_CLIENT_ID:clientId,
  LOADNOTE_OIDC_CLIENT_SECRET:'client-secret',
  LOADNOTE_OIDC_REDIRECT_URI:redirectUri,
  LOADNOTE_OIDC_PROVIDER_ID:'commercial-oidc',
  LOADNOTE_OIDC_PROVIDER_NAME:'Continue with Test ID'
 };
 const startServer=async()=>{
  const server=createServer({env,fetchImpl:providerFetch});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return server;
 };
 let server=await startServer();
 let base='http://127.0.0.1:'+server.address().port;
 let sessionCookie;
 try{
  let response=await fetch(base+'/api/auth/providers');
  const providers=await response.json();
  assert.deepEqual(providers.providers,[{id:'commercial-oidc',name:'Continue with Test ID',loginUrl:'/api/auth/login'}]);

  response=await fetch(base+'/api/auth/login?returnTo=%2F%3Fafter%3Dlogin',{redirect:'manual'});
  assert.equal(response.status,302);
  const authUrl=new URL(response.headers.get('location'));
  assert.equal(authUrl.origin,issuer);
  expectedNonce=authUrl.searchParams.get('nonce');
  const state=authUrl.searchParams.get('state');
  const flowCookie=cookies(response.headers).find(value=>value.startsWith('loadnote_oidc_flow=')).split(';')[0];

  response=await fetch(base+'/api/auth/callback?code=provider-code&state='+encodeURIComponent(state),{redirect:'manual',headers:{Cookie:flowCookie}});
  assert.equal(response.status,302);
  assert.equal(response.headers.get('location'),'/?after=login');
  const setCookies=cookies(response.headers);
  sessionCookie=setCookies.find(value=>value.startsWith('loadnote_session=')).split(';')[0];
  assert(setCookies.some(value=>value.startsWith('loadnote_oidc_flow=')&&/Max-Age=0/.test(value)));

  response=await fetch(base+'/api/auth/session',{headers:{Cookie:sessionCookie}});
  const session=await response.json();
  assert.equal(session.authenticated,true);
  assert.equal(session.account.email,'user@example.com');
  assert.equal(session.account.displayName,'Loadnote Tester');
  assert.deepEqual(session.account.providers,['commercial-oidc']);
  assert.equal(session.loginAvailable,true);

  response=await fetch(base+'/api/account',{headers:{Cookie:sessionCookie}});
  const account=await response.json();
  assert.equal(account.account.id,session.account.id);

  response=await fetch(base+'/.env.example');
  assert.equal(response.status,404,'backend must not expose environment templates through static file serving');
  response=await fetch(base+'/backend/server.js');
  assert.equal(response.status,404,'backend source must not be web-served');
 }finally{await new Promise(resolve=>server.close(resolve));}

 assert(fs.existsSync(storePath),'OIDC login must persist the account record');
 server=await startServer();base='http://127.0.0.1:'+server.address().port;
 try{
  const response=await fetch(base+'/api/auth/session',{headers:{Cookie:sessionCookie}});
  const session=await response.json();
  assert.equal(session.authenticated,true,'same signed session and persisted account should survive a server restart');
  assert.equal(session.account.email,'user@example.com');
 }finally{await new Promise(resolve=>server.close(resolve));}

 assert.throws(()=>createServer({env:{
  NODE_ENV:'production',LOADNOTE_AUTH_SECRET:'prod-secret-'.padEnd(64,'p'),LOADNOTE_ACCOUNT_STORE_PATH:storePath
 },fetchImpl:providerFetch}),/OIDC provider/,'production auth must not start without a configured identity provider');

 console.log('v2.57 OIDC login, persistent account, restart session and static-secret boundaries passed');
})().catch(error=>{console.error(error);process.exit(1);});
