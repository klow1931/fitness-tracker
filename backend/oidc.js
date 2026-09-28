/* v2.57 — generic OIDC authorization-code + PKCE verifier.
 * Supports RS256 ID tokens and server-side code exchange. Provider secrets never reach the browser.
 */
'use strict';
const crypto=require('crypto');
const {parseCookies,safeEqual}=require('./auth');

const FLOW_COOKIE='loadnote_oidc_flow';
const FLOW_TTL_SECONDS=600;
const clean=value=>String(value??'').trim();
const b64=value=>Buffer.from(value).toString('base64url');
const unb64=value=>Buffer.from(value,'base64url');
const nowSeconds=now=>Math.floor((typeof now==='function'?now():Date.now())/1000);
const sha256=value=>crypto.createHash('sha256').update(value).digest('base64url');
function safeReturnTo(value){
 const raw=clean(value)||'/';
 if(!raw.startsWith('/')||raw.startsWith('//'))return '/';
 try{const u=new URL(raw,'https://loadnote.local');return u.origin==='https://loadnote.local'?u.pathname+u.search+u.hash:'/';}catch{return '/';}
}
function parseJsonSegment(segment){
 try{return JSON.parse(unb64(segment).toString('utf8'));}catch{throw Error('Malformed OIDC token');}
}
function createOidc(options={}){
 const issuer=clean(options.issuer).replace(/\/$/,'');
 const clientId=clean(options.clientId);
 const clientSecret=clean(options.clientSecret);
 const redirectUri=clean(options.redirectUri);
 const providerId=clean(options.providerId||(()=>{try{return new URL(issuer).hostname.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').slice(0,80);}catch{return '';}})());
 const providerName=clean(options.providerName)||'Account provider';
 if(providerId&&!/^[a-z0-9._-]{2,80}$/.test(providerId))throw Error('OIDC provider id is invalid');
 const authSecret=clean(options.authSecret);
 const secure=options.secure===true;
 const fetchImpl=options.fetchImpl||globalThis.fetch;
 const now=options.now||Date.now;
 const configured=!!issuer&&!!clientId&&!!redirectUri&&!!providerId&&Buffer.byteLength(authSecret,'utf8')>=32&&typeof fetchImpl==='function';
 if(issuer&&(!/^https:\/\//i.test(issuer)))throw Error('OIDC issuer must use HTTPS');
 if(redirectUri&&options.production===true&&!/^https:\/\//i.test(redirectUri))throw Error('Production OIDC redirect URI must use HTTPS');
 const flowKey=configured?crypto.createHmac('sha256',authSecret).update('loadnote-oidc-flow-v1').digest():null;
 let discoveryCache=null,jwksCache=null;

 function flowSign(encoded){return crypto.createHmac('sha256',flowKey).update(encoded).digest('base64url');}
 function flowToken(payload){
  const encoded=b64(JSON.stringify(payload));
  return encoded+'.'+flowSign(encoded);
 }
 function verifyFlow(token){
  if(!configured||typeof token!=='string')return null;
  const [encoded,sig,...extra]=token.split('.');
  if(!encoded||!sig||extra.length||!safeEqual(flowSign(encoded),sig))return null;
  try{
   const payload=JSON.parse(unb64(encoded).toString('utf8')),nowSec=nowSeconds(now);
   if(payload.v!==1||typeof payload.state!=='string'||typeof payload.nonce!=='string'||typeof payload.verifier!=='string'||typeof payload.exp!=='number'||payload.exp<=nowSec||payload.iat>nowSec+300)return null;
   if(payload.exp-payload.iat>FLOW_TTL_SECONDS+5)return null;
   return payload;
  }catch{return null;}
 }
 function cookie(token,maxAge=FLOW_TTL_SECONDS){
  const attrs=[FLOW_COOKIE+'='+token,'Path=/api/auth','HttpOnly','SameSite=Lax','Max-Age='+Math.max(0,Math.floor(maxAge))];
  if(secure)attrs.push('Secure');
  return attrs.join('; ');
 }
 function clearCookie(){
  const attrs=[FLOW_COOKIE+'=','Path=/api/auth','HttpOnly','SameSite=Lax','Max-Age=0'];
  if(secure)attrs.push('Secure');
  return attrs.join('; ');
 }
 async function discovery(force=false){
  if(!configured)throw Error('OIDC login is not configured');
  if(discoveryCache&&!force&&discoveryCache.expiresAt>Date.now())return discoveryCache.value;
  const response=await fetchImpl(issuer+'/.well-known/openid-configuration',{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('OIDC discovery failed');
  const value=await response.json();
  if(value.issuer!==issuer||!/^https:\/\//i.test(value.authorization_endpoint||'')||!/^https:\/\//i.test(value.token_endpoint||'')||!/^https:\/\//i.test(value.jwks_uri||''))throw Error('OIDC discovery document is invalid');
  if(Array.isArray(value.id_token_signing_alg_values_supported)&&!value.id_token_signing_alg_values_supported.includes('RS256'))throw Error('OIDC provider does not advertise RS256 ID tokens');
  discoveryCache={value,expiresAt:Date.now()+10*60*1000};
  return value;
 }
 async function jwks(uri,force=false){
  if(jwksCache&&jwksCache.uri===uri&&!force&&jwksCache.expiresAt>Date.now())return jwksCache.keys;
  const response=await fetchImpl(uri,{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('OIDC signing-key lookup failed');
  const json=await response.json(),keys=Array.isArray(json.keys)?json.keys:[];
  if(!keys.length)throw Error('OIDC signing-key set is empty');
  jwksCache={uri,keys,expiresAt:Date.now()+10*60*1000};
  return keys;
 }
 async function verifyIdToken(token,expectedNonce){
  if(typeof token!=='string')throw Error('OIDC token response is missing an ID token');
  const parts=token.split('.');
  if(parts.length!==3)throw Error('Malformed OIDC ID token');
  const header=parseJsonSegment(parts[0]),claims=parseJsonSegment(parts[1]);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||!header.kid)throw Error('Unsupported OIDC ID-token signature');
  const disc=await discovery();
  const eligible=key=>key.kid===header.kid&&key.kty==='RSA'&&(!key.use||key.use==='sig')&&(!key.alg||key.alg==='RS256');
  let keys=await jwks(disc.jwks_uri),jwk=keys.find(eligible);
  if(!jwk){keys=await jwks(disc.jwks_uri,true);jwk=keys.find(eligible);}
  if(!jwk)throw Error('OIDC signing key was not found');
  let publicKey;
  try{publicKey=crypto.createPublicKey({key:jwk,format:'jwk'});}catch{throw Error('OIDC signing key is invalid');}
  const valid=crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),publicKey,unb64(parts[2]));
  if(!valid)throw Error('OIDC ID-token signature is invalid');
  const nowSec=nowSeconds(now),skew=300;
  if(claims.iss!==disc.issuer)throw Error('OIDC issuer mismatch');
  const audience=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(!audience.includes(clientId))throw Error('OIDC audience mismatch');
  if(audience.length>1&&claims.azp!==clientId)throw Error('OIDC authorized-party mismatch');
  if(!Number.isFinite(claims.exp)||claims.exp<=nowSec-skew)throw Error('OIDC ID token is expired');
  if(!Number.isFinite(claims.iat)||claims.iat>nowSec+skew)throw Error('OIDC ID token time is invalid');
  if(typeof claims.sub!=='string'||!claims.sub||claims.sub.length>512)throw Error('OIDC subject is missing');
  if(!safeEqual(claims.nonce,expectedNonce))throw Error('OIDC nonce mismatch');
  return claims;
 }
 async function begin(returnTo='/'){
  if(!configured)throw Error('OIDC login is not configured');
  const disc=await discovery();
  const state=crypto.randomBytes(24).toString('base64url'),nonce=crypto.randomBytes(24).toString('base64url'),verifier=crypto.randomBytes(48).toString('base64url');
  const iat=nowSeconds(now),payload={v:1,state,nonce,verifier,returnTo:safeReturnTo(returnTo),iat,exp:iat+FLOW_TTL_SECONDS};
  const url=new URL(disc.authorization_endpoint);
  url.searchParams.set('response_type','code');
  url.searchParams.set('client_id',clientId);
  url.searchParams.set('redirect_uri',redirectUri);
  url.searchParams.set('scope','openid email profile');
  url.searchParams.set('state',state);
  url.searchParams.set('nonce',nonce);
  url.searchParams.set('code_challenge',sha256(verifier));
  url.searchParams.set('code_challenge_method','S256');
  return {url:url.toString(),cookie:cookie(flowToken(payload)),state,nonce,returnTo:payload.returnTo};
 }
 async function complete({code,state,cookieHeader}={}){
  if(!configured)throw Error('OIDC login is not configured');
  const flow=verifyFlow(parseCookies(cookieHeader||'')[FLOW_COOKIE]);
  if(!flow)throw Error('OIDC sign-in state is missing or expired');
  if(!safeEqual(state,flow.state))throw Error('OIDC state mismatch');
  if(!clean(code))throw Error('OIDC authorization code is missing');
  const disc=await discovery();
  const params=new URLSearchParams({grant_type:'authorization_code',code:clean(code),redirect_uri:redirectUri,client_id:clientId,code_verifier:flow.verifier});
  const headers={'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'};
  if(clientSecret){
   const methods=Array.isArray(disc.token_endpoint_auth_methods_supported)?disc.token_endpoint_auth_methods_supported:['client_secret_basic'];
   if(methods.includes('client_secret_basic')){
    const formEncode=value=>new URLSearchParams({v:String(value)}).toString().slice(2);
    headers.Authorization='Basic '+Buffer.from(formEncode(clientId)+':'+formEncode(clientSecret)).toString('base64');
    params.delete('client_id');
   }else if(methods.includes('client_secret_post')){
    params.set('client_secret',clientSecret);
   }else throw Error('OIDC provider does not support a configured client authentication method');
  }
  const response=await fetchImpl(disc.token_endpoint,{method:'POST',headers,body:params.toString()});
  if(!response.ok)throw Error('OIDC code exchange failed');
  const tokens=await response.json(),claims=await verifyIdToken(tokens.id_token,flow.nonce);
  const emailVerified=claims.email_verified===true;
  const identity={
   provider:providerId,
   subject:claims.sub,
   email:emailVerified&&typeof claims.email==='string'?claims.email:null,
   emailVerified,
   displayName:typeof claims.name==='string'?claims.name:null,
   avatarUrl:typeof claims.picture==='string'?claims.picture:null
  };
  return {identity,returnTo:safeReturnTo(flow.returnTo),clearCookie:clearCookie(),claims:{issuer:claims.iss,subject:claims.sub}};
 }
 return {configured,issuer,clientId,redirectUri,providerId,providerName,begin,complete,verifyIdToken,clearCookie};
}

module.exports={FLOW_COOKIE,FLOW_TTL_SECONDS,createOidc,safeReturnTo};
