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
const {createFileSyncStore}=require('./sync-store');
const Sync=require('../src/product/sync-model');

const ROOT=path.resolve(__dirname,'..');
const MAX_BODY=256*1024;
const DEFAULT_MAX_SYNC_BODY=8*1024*1024;
const STATIC_ROOT_FILES=new Set(['index.html','styles.css','energy.css','app.js','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']);
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
 const production=env.NODE_ENV==='production';
 const authRequired=(env.LOADNOTE_REQUIRE_AUTH===''||env.LOADNOTE_REQUIRE_AUTH==null)?production:env.LOADNOTE_REQUIRE_AUTH==='1';
 const secureCookie=env.LOADNOTE_COOKIE_SECURE?env.LOADNOTE_COOKIE_SECURE==='1':production;
 const sameSite=env.LOADNOTE_SESSION_SAMESITE||'Strict';
 const authSecret=env.LOADNOTE_AUTH_SECRET||'';
 const auth=createAuth({secret:authSecret,ttlSeconds:Number(env.LOADNOTE_SESSION_TTL_SECONDS)||43200,secure:secureCookie,sameSite});
 const storePath=env.LOADNOTE_ACCOUNT_STORE_PATH||path.join(ROOT,'.loadnote-data','accounts.json');
 const accountStore=createFileAccountStore({filePath:storePath});
 accountStore.snapshot(); // fail fast on an unreadable/corrupt configured account store
 const maxSyncBytes=Math.max(MAX_BODY,Math.min(Number(env.LOADNOTE_SYNC_MAX_BYTES)||DEFAULT_MAX_SYNC_BODY,32*1024*1024));
 const syncRoot=env.LOADNOTE_SYNC_STORE_PATH||(!production?path.join(ROOT,'.loadnote-data','training'):'');
 const syncStore=syncRoot?createFileSyncStore({rootDir:syncRoot,verifyPackage:Sync.verifyPackage}):null;
 const oidc=createOidc({
  issuer:env.LOADNOTE_OIDC_ISSUER||'',
  clientId:env.LOADNOTE_OIDC_CLIENT_ID||'',
  clientSecret:env.LOADNOTE_OIDC_CLIENT_SECRET||'',
  redirectUri:env.LOADNOTE_OIDC_REDIRECT_URI||'',
  providerId:env.LOADNOTE_OIDC_PROVIDER_ID||'',
  providerName:env.LOADNOTE_OIDC_PROVIDER_NAME||'Sign in',
  authSecret,
  secure:secureCookie,
  fetchImpl,
  production
 });
 const devKey=String(env.LOADNOTE_DEV_AUTH_KEY||'');
 const devAuthEnabled=!production&&env.LOADNOTE_DEV_AUTH==='1'&&devKey.length>=16&&auth.configured;
 const allowedOrigins=new Set(String(env.LOADNOTE_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean));
 if(production&&authRequired&&!auth.configured)throw Error('Production authentication requires a 32+ byte LOADNOTE_AUTH_SECRET');
 if(production&&authRequired&&!env.LOADNOTE_ACCOUNT_STORE_PATH)throw Error('Production authentication requires LOADNOTE_ACCOUNT_STORE_PATH');
 if(production&&authRequired&&!oidc.configured)throw Error('Production authentication requires a configured OIDC provider');
 if(typeof fetchImpl!=='function')throw Error('A fetch implementation is required');

 function originAllowed(req){
  const origin=String(req.headers.origin||'');if(!origin)return true;
  if(allowedOrigins.has(origin))return true;
  try{const parsed=new URL(origin);return ['http:','https:'].includes(parsed.protocol)&&parsed.host===String(req.headers.host||'');}catch{return false;}
 }
 function responseHeaders(req,extra={}){
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',...extra},origin=String(req.headers.origin||'');
  if(origin&&originAllowed(req)){
   headers['Access-Control-Allow-Origin']=origin;
   headers['Access-Control-Allow-Credentials']='true';
   headers['Vary']='Origin';
  }
  return headers;
 }
 function send(req,res,status,body,type='application/json',extra={}){
  const headers=responseHeaders(req,{'Content-Type':type,...extra});
  res.writeHead(status,headers);
  res.end(type==='application/json'?JSON.stringify(body):body);
 }
 function redirect(req,res,location,cookies=[]){
  const headers=responseHeaders(req,{Location:location});
  if(cookies.length)headers['Set-Cookie']=cookies;
  res.writeHead(302,headers);res.end();
 }
 function unauthorized(req,res,message='Authentication required'){return send(req,res,401,{error:message});}
 function loadSession(req){
  if(!auth.configured)return null;
  const session=auth.fromRequest(req);if(!session)return null;
  const account=accountStore.getAccount(session.account.id);if(!account)return null;
  return {...session,account};
 }
 function authenticated(req,res,{csrf=false,required=true}={}){
  if(!auth.configured){
   if(required)send(req,res,503,{error:'Account authentication is not configured.'});
   return null;
  }
  const session=loadSession(req);
  if(!session){if(required)unauthorized(req,res);return null;}
  if(csrf&&!auth.csrfValid(req,session)){send(req,res,403,{error:'Request verification failed.'});return null;}
  return session;
 }
 async function coach(req,res){
  if(authRequired&&!authenticated(req,res,{csrf:true,required:true}))return;
  if(!apiKey)return send(req,res,503,{error:'Server AI key is not configured.'});
  const body=await parseBody(req),messages=Array.isArray(body.messages)?body.messages:[];
  if(!messages.length)return send(req,res,400,{error:'messages are required'});
  const upstream=await fetchImpl(baseUrl+'/chat/completions',{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
   body:JSON.stringify({model,messages:messages.slice(-14),temperature:0.4})
  });
  const text=await upstream.text();
  res.writeHead(upstream.status,responseHeaders(req,{'Content-Type':'application/json'}));res.end(text);
 }
 function staticFile(req,res,pathname){
  const relative=pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^[/\\]+/,'');
  if(!STATIC_ROOT_FILES.has(relative)&&!STATIC_PREFIXES.some(prefix=>relative.startsWith(prefix)))return send(req,res,404,{error:'Not found'});
  const file=path.resolve(ROOT,relative),rel=path.relative(ROOT,file);
  if(rel.startsWith('..')||path.isAbsolute(rel))return send(req,res,404,{error:'Not found'});
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(req,res,404,{error:'Not found'});
  const data=fs.readFileSync(file);
  res.writeHead(200,responseHeaders(req,{'Content-Type':contentType(file),'Cache-Control':file.endsWith('index.html')?'no-cache':'public, max-age=300'}));
  return res.end(data);
 }

 const server=http.createServer(async(req,res)=>{
  if(!originAllowed(req))return send(req,res,403,{error:'Origin not allowed'});
  if(req.method==='OPTIONS'){
   res.writeHead(204,responseHeaders(req,{
    'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Loadnote-CSRF, X-Loadnote-Dev-Auth',
    'Access-Control-Allow-Methods':'GET, POST, PUT, OPTIONS',
    'Access-Control-Max-Age':'600'
   }));return res.end();
  }
  try{
   const url=new URL(req.url||'/','http://loadnote.local'),pathname=url.pathname;
   if(req.method==='GET'&&pathname==='/api/health')return send(req,res,200,{ok:true,aiConfigured:!!apiKey,model,auth:{configured:auth.configured,required:authRequired,devLogin:devAuthEnabled,oidc:oidc.configured},remoteTraining:{configured:!!syncStore,protocol:Sync.PROTOCOL,maxBytes:maxSyncBytes}});
   if(req.method==='GET'&&pathname==='/api/auth/providers'){
    return send(req,res,200,{providers:oidc.configured?[{id:oidc.providerId,name:oidc.providerName,loginUrl:'/api/auth/login'}]:[]});
   }
   if(req.method==='GET'&&pathname==='/api/auth/login'){
    if(!oidc.configured)return send(req,res,503,{error:'Account sign-in is not configured.'});
    const start=await oidc.begin(url.searchParams.get('returnTo')||'/');
    return redirect(req,res,start.url,[start.cookie]);
   }
   if(req.method==='GET'&&pathname==='/api/auth/callback'){
    if(!oidc.configured)return send(req,res,503,{error:'Account sign-in is not configured.'});
    if(url.searchParams.get('error'))return send(req,res,400,{error:'Identity provider sign-in was not completed.'},'application/json',{'Set-Cookie':oidc.clearCookie()});
    try{
     const completed=await oidc.complete({code:url.searchParams.get('code'),state:url.searchParams.get('state'),cookieHeader:req.headers.cookie});
     const resolved=accountStore.resolveIdentity(completed.identity);
     const issued=auth.issue({id:resolved.account.id,provider:completed.identity.provider});
     return redirect(req,res,completed.returnTo,[auth.sessionCookie(issued.token),completed.clearCookie]);
    }catch(error){
     const status=/OIDC state|OIDC nonce|sign-in state|authorization code|ID token|audience|issuer|authorized-party|signature|expired/i.test(error.message||'')?400:500;
     return send(req,res,status,{error:error.message||'Sign-in failed'},'application/json',{'Set-Cookie':oidc.clearCookie()});
    }
   }
   if(req.method==='GET'&&pathname==='/api/auth/session'){
    const session=loadSession(req);
    return send(req,res,200,session?{
     authenticated:true,account:session.account,expiresAt:session.expiresAt,csrf:session.transport==='cookie'?session.csrf:null,transport:session.transport,
     authConfigured:auth.configured,authRequired,loginAvailable:oidc.configured,provider:oidc.configured?{id:oidc.providerId,name:oidc.providerName}:null
    }:{authenticated:false,authConfigured:auth.configured,authRequired,loginAvailable:oidc.configured,provider:oidc.configured?{id:oidc.providerId,name:oidc.providerName}:null});
   }
   if(req.method==='POST'&&pathname==='/api/auth/logout'){
    const session=loadSession(req);
    if(session&&!auth.csrfValid(req,session))return send(req,res,403,{error:'Request verification failed.'});
    return send(req,res,200,{ok:true,discardBearer:session?.transport==='bearer'||false},'application/json',{'Set-Cookie':auth.clearCookie()});
   }
   if(req.method==='POST'&&pathname==='/api/auth/dev-session'){
    if(!devAuthEnabled)return send(req,res,404,{error:'Not found'});
    if(!safeEqual(req.headers['x-loadnote-dev-auth'],devKey))return unauthorized(req,res);
    const body=await parseBody(req);
    const resolved=accountStore.resolveIdentity({provider:body.provider||'development',subject:body.subject,email:body.email,emailVerified:body.emailVerified===true,displayName:body.displayName});
    const issued=auth.issue({id:resolved.account.id,provider:resolved.identity.provider});
    return send(req,res,200,{authenticated:true,account:resolved.account,expiresAt:issued.expiresAt,csrf:issued.csrf},'application/json',{'Set-Cookie':auth.sessionCookie(issued.token)});
   }
   if(req.method==='GET'&&pathname==='/api/account'){
    const session=authenticated(req,res,{required:true});if(!session)return;
    return send(req,res,200,{account:session.account,session:{expiresAt:session.expiresAt,transport:session.transport}});
   }
   if(req.method==='GET'&&pathname==='/api/sync/status'){
    const session=authenticated(req,res,{required:true});if(!session)return;
    if(!syncStore)return send(req,res,503,{error:'Remote training storage is not configured.',code:'remote_storage_unavailable'});
    return send(req,res,200,{protocol:Sync.PROTOCOL,...syncStore.status(session.account.id)});
   }
   if(req.method==='GET'&&pathname==='/api/sync/state'){
    const session=authenticated(req,res,{required:true});if(!session)return;
    if(!syncStore)return send(req,res,503,{error:'Remote training storage is not configured.',code:'remote_storage_unavailable'});
    return send(req,res,200,{protocol:Sync.PROTOCOL,...syncStore.get(session.account.id)});
   }
   if(req.method==='PUT'&&pathname==='/api/sync/state'){
    const session=authenticated(req,res,{csrf:true,required:true});if(!session)return;
    if(!syncStore)return send(req,res,503,{error:'Remote training storage is not configured.',code:'remote_storage_unavailable'});
    const body=await parseBody(req,maxSyncBytes);
    try{
     const result=syncStore.commit(session.account.id,body.package,{expectedRevision:body.expectedRevision});
     return send(req,res,200,{protocol:Sync.PROTOCOL,...result});
    }catch(error){
     if(error.code==='revision_conflict')return send(req,res,409,{error:error.message,code:error.code,remote:error.remote});
     if(error.code==='invalid_package'||error.code==='invalid_revision')return send(req,res,400,{error:error.message,code:error.code});
     throw error;
    }
   }
   if(req.method==='POST'&&pathname==='/api/coach')return await coach(req,res);
   if(req.method==='GET')return staticFile(req,res,pathname);
   return send(req,res,404,{error:'Not found'});
  }catch(error){
   const status=Number(error.statusCode)||(/OIDC state|OIDC nonce|sign-in state|authorization code|ID token|audience|issuer|authorized-party|signature|expired/i.test(error.message||'')?400:500);
   return send(req,res,status,{error:error.message||'Server error'});
  }
 });
 server.loadnote={port,auth,authRequired,devAuthEnabled,oidc,accountStore,syncStore,maxSyncBytes,allowedOrigins:[...allowedOrigins]};
 return server;
}

if(require.main===module){
 const server=createServer(),port=server.loadnote.port;
 server.listen(port,()=>console.log(`Loadnote backend listening on http://localhost:${port}`));
}
module.exports={createServer,STATIC_ROOT_FILES,STATIC_PREFIXES};
