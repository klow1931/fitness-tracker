const assert=require('node:assert/strict');
const crypto=require('crypto');
const {createOidc,safeReturnTo}=require('../backend/oidc');

const issuer='https://id.example',clientId='loadnote-client',redirectUri='https://app.example/api/auth/callback';
const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=publicKey.export({format:'jwk'});jwk.kid='test-key';jwk.use='sig';jwk.alg='RS256';
let currentNonce='',tokenRequest=null;
const jwt=claims=>{
 const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:'test-key'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');
 const input=header+'.'+payload;
 const signature=crypto.sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
 return input+'.'+signature;
};
const nowMs=Date.parse('2026-09-28T22:30:00.000Z'),nowSec=Math.floor(nowMs/1000);
const fetchImpl=async(url,options={})=>{
 if(url===issuer+'/.well-known/openid-configuration')return new Response(JSON.stringify({
  issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/token',jwks_uri:issuer+'/jwks',id_token_signing_alg_values_supported:['RS256']
 }),{status:200,headers:{'Content-Type':'application/json'}});
 if(url===issuer+'/jwks')return new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{'Content-Type':'application/json'}});
 if(url===issuer+'/token'){
  tokenRequest=options;
  return new Response(JSON.stringify({id_token:jwt({iss:issuer,aud:clientId,sub:'subject-1',iat:nowSec,exp:nowSec+3600,nonce:currentNonce,email:'verified@example.com',email_verified:true,name:'Verified Athlete',picture:'https://cdn.example/avatar.png'})}),{status:200,headers:{'Content-Type':'application/json'}});
 }
 return new Response('',{status:404});
};
const oidc=createOidc({
 issuer,clientId,clientSecret:'client-secret',redirectUri,providerId:'test-provider',providerName:'Test Provider',
 authSecret:'oidc-flow-secret-'.padEnd(64,'s'),secure:true,production:true,fetchImpl,now:()=>nowMs
});

(async()=>{
 assert.equal(oidc.configured,true);
 const start=await oidc.begin('/?from=account');
 currentNonce=start.nonce;
 const authUrl=new URL(start.url);
 assert.equal(authUrl.origin,'https://id.example');
 assert.equal(authUrl.searchParams.get('response_type'),'code');
 assert.equal(authUrl.searchParams.get('client_id'),clientId);
 assert.equal(authUrl.searchParams.get('code_challenge_method'),'S256');
 assert.equal(authUrl.searchParams.get('state'),start.state);
 assert.equal(authUrl.searchParams.get('nonce'),start.nonce);
 assert.match(start.cookie,/HttpOnly/);
 assert.match(start.cookie,/SameSite=Lax/);
 assert.match(start.cookie,/Secure/);

 const cookieValue=start.cookie.split(';')[0].split('=')[1];
 const flow=JSON.parse(Buffer.from(cookieValue.split('.')[0],'base64url').toString('utf8'));
 assert.equal(crypto.createHash('sha256').update(flow.verifier).digest('base64url'),authUrl.searchParams.get('code_challenge'),'PKCE challenge must match the signed verifier');

 const complete=await oidc.complete({code:'authorization-code',state:start.state,cookieHeader:start.cookie});
 assert.equal(complete.identity.provider,'test-provider');
 assert.equal(complete.identity.subject,'subject-1');
 assert.equal(complete.identity.email,'verified@example.com');
 assert.equal(complete.identity.emailVerified,true);
 assert.equal(complete.returnTo,'/?from=account');
 assert.match(complete.clearCookie,/Max-Age=0/);
 assert.equal(tokenRequest.method,'POST');
 assert.match(tokenRequest.headers.Authorization,/^Basic /);
 const tokenBody=new URLSearchParams(tokenRequest.body);
 assert.equal(tokenBody.get('code'),'authorization-code');
 assert.equal(tokenBody.get('code_verifier'),flow.verifier);
 assert.equal(tokenBody.has('client_id'),false,'confidential clients authenticate with Basic auth');

 await assert.rejects(()=>oidc.complete({code:'x',state:'wrong-state',cookieHeader:start.cookie}),/state mismatch/);
 assert.equal(safeReturnTo('https://evil.example/'),'/');
 assert.equal(safeReturnTo('//evil.example/path'),'/');
 assert.equal(safeReturnTo('/safe?x=1'),'/safe?x=1');

 const publicClient=createOidc({issuer,clientId,redirectUri,providerId:'test-provider',authSecret:'public-flow-secret-'.padEnd(64,'p'),secure:true,production:true,fetchImpl,now:()=>nowMs});
 const publicStart=await publicClient.begin('/');currentNonce=publicStart.nonce;tokenRequest=null;
 await publicClient.complete({code:'public-code',state:publicStart.state,cookieHeader:publicStart.cookie});
 const publicBody=new URLSearchParams(tokenRequest.body);
 assert.equal(publicBody.get('client_id'),clientId);
 assert.equal(tokenRequest.headers.Authorization,undefined);

 assert.throws(()=>createOidc({issuer:'http://id.example',clientId,redirectUri,authSecret:'x'.repeat(64)}),/HTTPS/);
 assert.throws(()=>createOidc({issuer,clientId,redirectUri:'http://app.example/cb',authSecret:'x'.repeat(64),production:true}),/HTTPS/);
 console.log('v2.57 OIDC discovery, PKCE/state/nonce, RS256 verification and safe return handling passed');
})().catch(error=>{console.error(error);process.exit(1);});
