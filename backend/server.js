/* Loadnote backend — Coach proxy, authenticated account boundary, and v2.57 OIDC/account store.
 * Production example:
 *   NODE_ENV=production
 *   LOADNOTE_AUTH_SECRET=<32+ random bytes>
 *   LOADNOTE_ACCOUNT_STORE_PATH=/var/lib/loadnote/accounts.json
 *   LOADNOTE_OIDC_ISSUER=https://id.example.com
 *   LOADNOTE_OIDC_CLIENT_ID=...
 *   LOADNOTE_OIDC_CLIENT_SECRET=...
 *   LOADNOTE_OIDC_REDIRECT_URI=https://app.example.com/api/auth/callback
 *   node backend/server.js
 */
'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const {createAuth,safeEqual}=require('./auth');
const {createFileAccountStore}=require('./account-store');
const {createOidc}=require('./oidc');
const {createSessionRevocations}=require('./session-revocations');
const {createRequestLimits}=require('./request-limits');
const {createFileSyncStore}=require('./sync-store');
const Sync=require('../src/product/sync-model');
const CoachGateway=require('./coach-gateway');
const VoiceGateway=require('./voice-gateway');

const ROOT=path.resolve(__dirname,'..');
const MAX_BODY=256*1024;
const DEFAULT_MAX_SYNC_BODY=8*1024*1024;
const STATIC_ROOT_FILES=new Set(['index.html','privacy.html','support.html','delete-account.html','styles.css','energy.css','app.js','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']);
const STATIC_PREFIXES=['assets/','src/'];

function contentType(file){
 const ext=path.extname(file).toLowerCase();
 return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'})[ext]||'application/octet-stream';
}
function parseBody(req,maxBytes=MAX_BODY){
 return new Promise((resolve,reject)=>{
  const declared=Number(req.headers?.['content-length']||0);
  if(Number.isFinite(declared)&&declared>maxBytes){const error=new Error('Request too large');error.statusCode=413;reject(error);return;}
  let body='',tooLarge=false,bytes=0;
  req.on('data',chunk=>{
   if(tooLarge)return;
   bytes+=chunk.length;
   if(bytes>maxBytes){tooLarge=true;const error=new Error('Request too large');error.statusCode=413;reject(error);req.destroy();return;}
   body+=chunk;
  });
  req.on('end',()=>{if(tooLarge)return;try{resolve(JSON.parse(body||'{}'));}catch{const error=new Error('Invalid JSON');error.statusCode=400;reject(error);}});
  req.on('error',reject);
 });
}
function createServer({env=process.env,fetchImpl=globalThis.fetch}={}){
 const port=Number(env.PORT||8787);
 const apiKey=env.LOADNOTE_AI_API_KEY||'';
 const baseUrl=(env.LOADNOTE_AI_BASE_URL||'https://api.x.ai/v1').replace(/\/$/,'');
 const model=env.LOADNOTE_AI_MODEL||'grok-2-latest';
 const voiceApiKey=env.LOADNOTE_VOICE_API_KEY||'';
 const voiceBaseUrl=(env.LOADNOTE_VOICE_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'');
 const voiceModel=env.LOADNOTE_VOICE_MODEL||'gpt-realtime-2.1';
 const voiceName=env.LOADNOTE_VOICE_VOICE||'marin';
 const voiceTranscriptionModel=env.LOADNOTE_VOICE_TRANSCRIBE_MODEL||'gpt-4o-mini-transcribe';
 const production=env.NODE_ENV==='production';
 const authRequired=(env.LOADNOTE_REQUIRE_AUTH===''||env.LOADNOTE_REQUIRE_AUTH==null)?production:env.LOADNOTE_REQUIRE_AUTH==='1';
 const coachAuthRequired=production||authRequired;
 const secureCookie=env.LOADNOTE_COOKIE_SECURE?env.LOADNOTE_COOKIE_SECURE==='1':production;
 const sameSite=env.LOADNOTE_SESSION_SAMESITE||'Strict';
 const authSecret=env.LOADNOTE_AUTH_SECRET||'';
 const auth=createAuth({secret:authSecret,ttlSeconds:Number(env.LOADNOTE_SESSION_TTL_SECONDS)||43200,secure:secureCookie,sameSite});
 const storePath=env.LOADNOTE_ACCOUNT_STORE_PATH||path.join(ROOT,'.loadnote-data','accounts.json');
 const accountStore=createFileAccountStore({filePath:storePath});
 accountStore.snapshot();
 const revocations=createSessionRevocations({filePath:env.LOADNOTE_SESSION_REVOCATIONS_PATH||storePath+'.revocations.json'});
 const requestLimits=createRequestLimits({env});
 const maxSyncBytes=Math.max(MAX_BODY,Math.min(Number(env.LOADNOTE_SYNC_MAX_BYTES)||DEFAULT_MAX_SYNC_BODY,32*1024*1024));
 const syncRoot=env.LOADNOTE_SYNC_STORE_PATH||(!production?path.join(ROOT,'.loadnote-data','training'):'');
 const syncStore=syncRoot?createFileSyncStore({rootDir:syncRoot,verifyPackage:Sync.verifyPackage}):null;
 const oidc=createOidc({
  issuer:env.LOADNOTE_OIDC_ISSUER||'',clientId:env.LOADNOTE_OIDC_CLIENT_ID||'',clientSecret:env.LOADNOTE_OIDC_CLIENT_SECRET||'',
  redirectUri:env.LOADNOTE_OIDC_REDIRECT_URI||'',providerId:env.LOADNOTE_OIDC_PROVIDER_ID||'',providerName:env.LOADNOTE_OIDC_PROVIDER_NAME||'Sign in',
  authSecret,secure:secureCookie,fetchImpl,production
 });
 const devKey=String(env.LOADNOTE_DEV_AUTH_KEY||'');
 const devAuthEnabled=!production&&env.LOADNOTE_DEV_AUTH==='1'&&devKey.length>=16&&auth.configured;
 const allowedOrigins=new Set(String(env.LOADNOTE_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean));
 if(production&&authRequired&&!auth.configured)throw Error('Production authentication requires a 32+ byte LOADNOTE_AUTH_SECRET');
 if(production&&authRequired&&!env.LOADNOTE_ACCOUNT_STORE_PATH)throw Error('Production authentication requires LOADNOTE_ACCOUNT_STORE_PATH');
 if(production&&authRequired&&!oidc.configured)throw Error('Production authentication requires a configured OIDC provider');
 if(production&&apiKey&&!auth.configured)throw Error('Production online Coach requires a 32+ byte LOADNOTE_AUTH_SECRET');
 if(production&&apiKey&&!oidc.configured)throw Error('Production online Coach requires a configured OIDC provider');
 if(production&&voiceApiKey&&!auth.configured)throw Error('Production Voice Companion requires a 32+ byte LOADNOTE_AUTH_SECRET');
 if(production&&voiceApiKey&&!oidc.configured)throw Error('Production Voice Companion requires a configured OIDC provider');
 if(typeof fetchImpl!=='function')throw Error('A fetch implementation is required');

 function originAllowed(req){
  const origin=String(req.headers.origin||'');if(!origin)return true;
  if(allowedOrigins.has(origin))return true;
  try{const parsed=new URL(origin);return ['http:','https:'].includes(parsed.protocol)&&parsed.host===String(req.headers.host||'');}catch{return false;}
 }
 function responseHeaders(req,extra={}){
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://unpkg.com https://esm.run https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",'X-Frame-Options':'DENY',...extra},origin=String(req.headers.origin||'');
  if(origin&&originAllowed(req)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Credentials']='true';headers['Vary']='Origin';}
  return headers;
 }
 function send(req,res,status,body,type='application/json',extra={}){const headers=responseHeaders(req,{'Content-Type':type,...extra});res.writeHead(status,headers);res.end(type==='application/json'?JSON.stringify(body):body);}
 function redirect(req,res,location,cookies=[]){const headers=responseHeaders(req,{Location:location});if(cookies.length)headers['Set-Cookie']=cookies;res.writeHead(302,headers);res.end();}
 function unauthorized(req,res,message='Authentication required'){return send(req,res,401,{error:message});}
 function loadSession(req){if(!auth.configured)return null;const session=auth.fromRequest(req);if(!session||revocations.revoked(session.sessionId))return null;const account=accountStore.getAccount(session.account.id);if(!account)return null;return {...session,account};}
 function authenticated(req,res,{csrf=false,required=true}={}){
  if(!auth.configured){if(required)send(req,res,503,{error:'Account authentication is not configured.'});return null;}
  const session=loadSession(req);if(!session){if(required)unauthorized(req,res);return null;}
  if(csrf&&!auth.csrfValid(req,session)){send(req,res,403,{error:'Request verification failed.'});return null;}return session;
 }
 async function coach(req,res){
  const session=coachAuthRequired?authenticated(req,res,{csrf:true,required:true}):loadSession(req);
  if(coachAuthRequired&&!session)return;
  if(!apiKey)return send(req,res,503,{error:'Online Coach is not configured.',code:'coach_unavailable'});
  const body=await parseBody(req),messages=CoachGateway.providerMessages(body);
  const lease=requestLimits.acquire(session?.account.id||'ip:'+req.socket.remoteAddress);
  if(!lease.ok)return send(req,res,429,{error:'AI request limit reached. Try again later.',code:'ai_rate_limit'},'application/json',{'Retry-After':String(lease.retryAfter)});
  let timeout;
  try {
  const controller=new AbortController();timeout=setTimeout(()=>controller.abort(),Number(env.LOADNOTE_AI_TIMEOUT_MS)||25000);let upstream;
  try{upstream=await fetchImpl(baseUrl+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model,messages,temperature:0.3}),signal:controller.signal});}
  catch(error){if(error?.name==='AbortError')return send(req,res,504,{error:'Online Coach timed out.',code:'coach_timeout'});return send(req,res,502,{error:'Online Coach provider is unavailable.',code:'coach_provider_unavailable'});}
  if(!upstream.ok)return send(req,res,502,{error:'Online Coach provider returned an error.',code:'coach_provider_error'});
  let payload;try{payload=await upstream.json();}catch{return send(req,res,502,{error:'Online Coach provider returned an invalid response.',code:'coach_provider_invalid_json'});}
  return send(req,res,200,{coach:CoachGateway.parseProviderResponse(payload)});
  } finally {clearTimeout(timeout);lease.release();}
 }
 async function voiceSession(req,res){
  const session=authenticated(req,res,{csrf:true,required:true});if(!session)return;
  if(!voiceApiKey)return send(req,res,503,{error:'Realtime Voice Companion is not configured.',code:'voice_unavailable'});
  const body=await parseBody(req),config=VoiceGateway.sessionConfig({context:body.context,model:voiceModel,voice:voiceName,transcriptionModel:voiceTranscriptionModel});
  const lease=requestLimits.acquire(session?.account.id||'ip:'+req.socket.remoteAddress);
  if(!lease.ok)return send(req,res,429,{error:'AI request limit reached. Try again later.',code:'ai_rate_limit'},'application/json',{'Retry-After':String(lease.retryAfter)});
  let timeout;
  try {
  const controller=new AbortController();timeout=setTimeout(()=>controller.abort(),Number(env.LOADNOTE_VOICE_TIMEOUT_MS)||12000);let upstream;
  try{upstream=await fetchImpl(voiceBaseUrl+'/realtime/client_secrets',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+voiceApiKey,'OpenAI-Safety-Identifier':VoiceGateway.safetyIdentifier(session.account.id)},body:JSON.stringify(config),signal:controller.signal});}
  catch(error){if(error?.name==='AbortError')return send(req,res,504,{error:'Voice session setup timed out.',code:'voice_timeout'});return send(req,res,502,{error:'Voice provider is unavailable.',code:'voice_provider_unavailable'});}
  if(!upstream.ok)return send(req,res,502,{error:'Voice provider returned an error.',code:'voice_provider_error'});
  let payload;try{payload=await upstream.json();}catch{return send(req,res,502,{error:'Voice provider returned an invalid response.',code:'voice_provider_invalid_json'});}
  let secret;try{secret=VoiceGateway.parseClientSecret(payload);}catch(error){return send(req,res,502,{error:error.message,code:'voice_provider_invalid_secret'});}
  return send(req,res,200,{clientSecret:secret,model:voiceModel,voice:voiceName});
  } finally {clearTimeout(timeout);lease.release();}
 }
 function staticFile(req,res,pathname){
  const relative=pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^[/\\]+/,'');
  if(!STATIC_ROOT_FILES.has(relative)&&!STATIC_PREFIXES.some(prefix=>relative.startsWith(prefix)))return send(req,res,404,{error:'Not found'});
  const file=path.resolve(ROOT,relative),rel=path.relative(ROOT,file);if(rel.startsWith('..')||path.isAbsolute(rel))return send(req,res,404,{error:'Not found'});
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(req,res,404,{error:'Not found'});
  const data=fs.readFileSync(file);res.writeHead(200,responseHeaders(req,{'Content-Type':contentType(file),'Cache-Control':file.endsWith('index.html')?'no-cache':'public, max-age=300'}));return res.end(data);
 }

 const server=http.createServer(async(req,res)=>{
  if(!originAllowed(req))return send(req,res,403,{error:'Origin not allowed'});
  if(req.method==='OPTIONS'){res.writeHead(204,responseHeaders(req,{'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Loadnote-CSRF, X-Loadnote-Dev-Auth','Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS','Access-Control-Max-Age':'600'}));return res.end();}
  try{
   const url=new URL(req.url||'/','http://loadnote.local'),pathname=url.pathname;
   if(req.method==='GET'&&pathname==='/api/health')return send(req,res,200,{ok:true,aiConfigured:!!apiKey,coach:{configured:!!apiKey,authRequired:coachAuthRequired},voice:{configured:!!voiceApiKey,authRequired:true,mode:'workout_scoped'},auth:{configured:auth.configured,required:authRequired,devLogin:devAuthEnabled,oidc:oidc.configured},remoteTraining:{configured:!!syncStore,protocol:Sync.PROTOCOL,maxBytes:maxSyncBytes}});
   if(req.method==='GET'&&pathname==='/api/auth/providers')return send(req,res,200,{providers:oidc.configured?[{id:oidc.providerId,name:oidc.providerName,loginUrl:'/api/auth/login'}]:[]});
   if(req.method==='GET'&&pathname==='/api/auth/login'){
    if(!oidc.configured)return send(req,res,503,{error:'Account sign-in is not configured.'});const start=await oidc.begin(url.searchParams.get('returnTo')||'/');return redirect(req,res,start.url,[start.cookie]);
   }
   if(req.method==='GET'&&pathname==='/api/auth/callback'){
    if(!oidc.configured)return send(req,res,503,{error:'Account sign-in is not configured.'});
    if(url.searchParams.get('error'))return send(req,res,400,{error:'Identity provider sign-in was not completed.'},'application/json',{'Set-Cookie':oidc.clearCookie()});
    try{const completed=await oidc.complete({code:url.searchParams.get('code'),state:url.searchParams.get('state'),cookieHeader:req.headers.cookie});const resolved=accountStore.resolveIdentity(completed.identity);const issued=auth.issue({id:resolved.account.id,provider:completed.identity.provider});return redirect(req,res,completed.returnTo,[auth.sessionCookie(issued.token),completed.clearCookie]);}
    catch(error){const status=/OIDC state|OIDC nonce|sign-in state|authorization code|ID token|audience|issuer|authorized-party|signature|expired/i.test(error.message||'')?400:500;return send(req,res,status,{error:status>=500?'Sign-in failed.':error.message||'Sign-in failed'},'application/json',{'Set-Cookie':oidc.clearCookie()});}
   }
   if(req.method==='GET'&&pathname==='/api/auth/session'){
    const session=loadSession(req);return send(req,res,200,session?{authenticated:true,account:session.account,expiresAt:session.expiresAt,csrf:session.transport==='cookie'?session.csrf:null,transport:session.transport,authConfigured:auth.configured,authRequired,loginAvailable:oidc.configured,provider:oidc.configured?{id:oidc.providerId,name:oidc.providerName}:null}:{authenticated:false,authConfigured:auth.configured,authRequired,loginAvailable:oidc.configured,provider:oidc.configured?{id:oidc.providerId,name:oidc.providerName}:null});
   }
   if(req.method==='POST'&&pathname==='/api/auth/logout'){
    const session=loadSession(req);if(session&&!auth.csrfValid(req,session))return send(req,res,403,{error:'Request verification failed.'});if(session)revocations.revoke(session.sessionId,session.expiresAt);return send(req,res,200,{ok:true,discardBearer:session?.transport==='bearer'||false},'application/json',{'Set-Cookie':auth.clearCookie()});
   }
   if(req.method==='POST'&&pathname==='/api/auth/dev-session'){
    if(!devAuthEnabled)return send(req,res,404,{error:'Not found'});if(!safeEqual(req.headers['x-loadnote-dev-auth'],devKey))return unauthorized(req,res);const body=await parseBody(req);const resolved=accountStore.resolveIdentity({provider:body.provider||'development',subject:body.subject,email:body.email,emailVerified:body.emailVerified===true,displayName:body.displayName});const issued=auth.issue({id:resolved.account.id,provider:resolved.identity.provider});return send(req,res,200,{authenticated:true,account:resolved.account,expiresAt:issued.expiresAt,csrf:issued.csrf},'application/json',{'Set-Cookie':auth.sessionCookie(issued.token)});
   }
   if(req.method==='GET'&&pathname==='/api/account'){const session=authenticated(req,res,{required:true});if(!session)return;return send(req,res,200,{account:session.account,session:{expiresAt:session.expiresAt,transport:session.transport}});}
   if(req.method==='DELETE'&&pathname==='/api/account'){
    const session=authenticated(req,res,{csrf:true,required:true});if(!session)return;const remote=syncStore?syncStore.remove(session.account.id):{deleted:false};const account=accountStore.deleteAccount(session.account.id);if(!account.deleted)throw Error('Authenticated account disappeared before deletion completed');return send(req,res,200,{deleted:true,remoteTrainingDeleted:remote.deleted===true,localDeviceDataDeleted:false},'application/json',{'Set-Cookie':auth.clearCookie()});
   }
   if(req.method==='GET'&&pathname==='/api/sync/status'){const session=authenticated(req,res,{required:true});if(!session)return;if(!syncStore)return send(req,res,503,{error:'Remote training storage is not configured.',code:'remote_storage_unavailable'});return send(req,res,200,{protocol:Sync.PROTOCOL,...syncStore.status(session.account.id)});}
   if(req.method==='GET'&&pathname==='/api/sync/state'){const session=authenticated(req,res,{required:true});if(!session)return;if(!syncStore)return send(req,res,503,{error:'Remote training storage is not configured.',code:'remote_storage_unavailable'});return send(req,res,200,{protocol:Sync.PROTOCOL,...syncStore.get(session.account.id)});}
   if(req.method==='PUT'&&pathname==='/api/sync/state'){
    const session=authenticated(req,res,{csrf:true,required:true});if(!session)return;if(!syncStore)return send(req,res,503,{error:'Remote training storage is not configured.',code:'remote_storage_unavailable'});const body=await parseBody(req,maxSyncBytes);
    try{const result=syncStore.commit(session.account.id,body.package,{expectedRevision:body.expectedRevision});return send(req,res,200,{protocol:Sync.PROTOCOL,...result});}
    catch(error){if(error.code==='revision_conflict')return send(req,res,409,{error:error.message,code:error.code,remote:error.remote});if(error.code==='invalid_package'||error.code==='invalid_revision')return send(req,res,400,{error:error.message,code:error.code});throw error;}
   }
   if(req.method==='POST'&&pathname==='/api/voice/session')return await voiceSession(req,res);
   if(req.method==='POST'&&pathname==='/api/coach')return await coach(req,res);
   if(req.method==='GET')return staticFile(req,res,pathname);
   return send(req,res,404,{error:'Not found'});
  }catch(error){const status=Number(error.statusCode)||(/OIDC state|OIDC nonce|sign-in state|authorization code|ID token|audience|issuer|authorized-party|signature|expired/i.test(error.message||'')?400:500);return send(req,res,status,{error:status>=500?'Server request failed.':error.message||'Server error',...(error.code?{code:error.code}:{})});}
 });
 server.loadnote={port,auth,authRequired,coachAuthRequired,aiConfigured:!!apiKey,voiceConfigured:!!voiceApiKey,devAuthEnabled,oidc,accountStore,syncStore,maxSyncBytes,allowedOrigins:[...allowedOrigins]};
 return server;
}
if(require.main===module){const server=createServer(),port=server.loadnote.port;server.listen(port,()=>console.log(`Loadnote backend listening on http://localhost:${port}`));}
module.exports={createServer,STATIC_ROOT_FILES,STATIC_PREFIXES};
