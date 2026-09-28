/* v2.56 — server-side account/session primitives.
 * This module does not authenticate an external identity provider. It accepts only
 * identities that a trusted server-side verifier has already established.
 */
'use strict';
const crypto=require('crypto');

const COOKIE_NAME='loadnote_session';
const VERSION=1;
const b64=value=>Buffer.from(value).toString('base64url');
const unb64=value=>Buffer.from(value,'base64url').toString('utf8');
const clean=value=>String(value||'').trim();

function safeEqual(a,b){
 const left=Buffer.from(String(a||'')),right=Buffer.from(String(b||''));
 return left.length===right.length&&crypto.timingSafeEqual(left,right);
}
function parseCookies(header){
 const out={};
 for(const part of String(header||'').split(';')){
  const at=part.indexOf('=');if(at<1)continue;
  const key=part.slice(0,at).trim(),value=part.slice(at+1).trim();
  if(key)out[key]=value;
 }
 return out;
}
function createAuth(options={}){
 const secret=clean(options.secret);
 const configured=Buffer.byteLength(secret,'utf8')>=32;
 const ttlSeconds=Math.max(300,Math.min(Number(options.ttlSeconds)||43200,60*60*24*30));
 const secure=options.secure===true;
 const sameSite=['Strict','Lax','None'].includes(options.sameSite)?options.sameSite:'Strict';
 if(sameSite==='None'&&!secure)throw Error('SameSite=None requires secure session cookies');
 const key=configured?crypto.createHmac('sha256',secret).update('loadnote-session-signing-v1').digest():null;
 const accountKey=configured?crypto.createHmac('sha256',secret).update('loadnote-account-id-v1').digest():null;
 const sign=input=>crypto.createHmac('sha256',key).update(input).digest('base64url');

 function accountIdentity(input){
  if(!configured)throw Error('Account authentication is not configured');
  const provider=clean(input?.provider).toLowerCase(),subject=clean(input?.subject);
  if(!/^[a-z0-9._-]{2,80}$/.test(provider)||!subject||subject.length>512)throw Error('Invalid trusted identity');
  const id='acct_'+crypto.createHmac('sha256',accountKey).update(provider+'\u0000'+subject).digest('base64url').slice(0,32);
  return {id,provider};
 }
 function issue(identity,{now=Date.now(),sessionId}={}){
  if(!configured)throw Error('Account authentication is not configured');
  if(!identity||!/^acct_[A-Za-z0-9_-]{20,}$/.test(String(identity.id||''))||!/^[a-z0-9._-]{2,80}$/.test(String(identity.provider||'')))throw Error('Invalid account identity');
  const iat=Math.floor(Number(now)/1000);if(!Number.isFinite(iat)||iat<=0)throw Error('Invalid session time');
  const sid=clean(sessionId)||crypto.randomUUID();
  const csrf=crypto.randomBytes(24).toString('base64url');
  const payload={v:VERSION,aud:'loadnote',sid,accountId:String(identity.id),provider:String(identity.provider),iat,exp:iat+ttlSeconds,csrf};
  const encoded=b64(JSON.stringify(payload)),token=encoded+'.'+sign(encoded);
  return {token,csrf,expiresAt:new Date(payload.exp*1000).toISOString(),account:{id:payload.accountId,provider:payload.provider},sessionId:sid};
 }
 function verify(token,{now=Date.now()}={}){
  if(!configured||typeof token!=='string')return null;
  const [encoded,signature,...extra]=token.split('.');
  if(!encoded||!signature||extra.length||!safeEqual(sign(encoded),signature))return null;
  try{
   const payload=JSON.parse(unb64(encoded)),nowSec=Math.floor(Number(now)/1000);
   if(payload.v!==VERSION||payload.aud!=='loadnote'||typeof payload.sid!=='string'||!payload.sid||typeof payload.accountId!=='string'||!/^acct_/.test(payload.accountId)||typeof payload.provider!=='string'||typeof payload.csrf!=='string'||payload.csrf.length<20)return null;
   if(!Number.isInteger(payload.iat)||!Number.isInteger(payload.exp)||payload.exp<=payload.iat||payload.exp-payload.iat>60*60*24*30)return null;
   if(!Number.isFinite(nowSec)||payload.iat>nowSec+300||payload.exp<=nowSec)return null;
   return {version:VERSION,sessionId:payload.sid,account:{id:payload.accountId,provider:payload.provider},issuedAt:new Date(payload.iat*1000).toISOString(),expiresAt:new Date(payload.exp*1000).toISOString(),csrf:payload.csrf};
  }catch{return null;}
 }
 function fromRequest(req,options={}){
  const authHeader=String(req?.headers?.authorization||'');
  if(authHeader.startsWith('Bearer ')){
   const session=verify(authHeader.slice(7),options);return session?{...session,transport:'bearer'}:null;
  }
  const token=parseCookies(req?.headers?.cookie||'')[COOKIE_NAME];
  const session=verify(token,options);return session?{...session,transport:'cookie'}:null;
 }
 function csrfValid(req,session){
  if(!session)return false;
  if(session.transport==='bearer')return true;
  return safeEqual(req?.headers?.['x-loadnote-csrf'],session.csrf);
 }
 function sessionCookie(token,maxAge=ttlSeconds){
  const attrs=[COOKIE_NAME+'='+token,'Path=/','HttpOnly','SameSite='+sameSite,'Max-Age='+Math.max(0,Math.floor(maxAge))];
  if(secure)attrs.push('Secure');
  return attrs.join('; ');
 }
 function clearCookie(){
  const attrs=[COOKIE_NAME+'=','Path=/','HttpOnly','SameSite='+sameSite,'Max-Age=0'];
  if(secure)attrs.push('Secure');
  return attrs.join('; ');
 }
 return {version:VERSION,configured,ttlSeconds,secure,sameSite,accountIdentity,issue,verify,fromRequest,csrfValid,sessionCookie,clearCookie};
}

module.exports={COOKIE_NAME,VERSION,createAuth,parseCookies,safeEqual};
