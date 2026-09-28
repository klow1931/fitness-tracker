/* Loadnote backend — secure Coach proxy plus v2.56 account/session boundary.
 * Production example:
 *   LOADNOTE_AI_API_KEY=... LOADNOTE_AUTH_SECRET=<32+ random bytes> LOADNOTE_REQUIRE_AUTH=1 NODE_ENV=production node backend/server.js
 *
 * v2.56 does not verify a production identity provider yet. A development-only
 * session issuer exists behind explicit non-production environment flags so the
 * authenticated boundary can be integration-tested without creating fake consumer auth.
 */
'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const {createAuth,safeEqual}=require('./auth');

const ROOT=path.resolve(__dirname,'..');
const MAX_BODY=256*1024;

function contentType(file){
 const ext=path.extname(file).toLowerCase();
 return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'})[ext]||'application/octet-stream';
}
function parseBody(req){
 return new Promise((resolve,reject)=>{
  let body='',tooLarge=false;
  req.on('data',chunk=>{
   if(tooLarge)return;
   body+=chunk;
   if(Buffer.byteLength(body,'utf8')>MAX_BODY){tooLarge=true;const error=new Error('Request too large');error.statusCode=413;reject(error);req.destroy();}
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
 const authRequired=(env.LOADNOTE_REQUIRE_AUTH===''||env.LOADNOTE_REQUIRE_AUTH==null)?env.NODE_ENV==='production':env.LOADNOTE_REQUIRE_AUTH==='1';
 const secureCookie=env.LOADNOTE_COOKIE_SECURE?env.LOADNOTE_COOKIE_SECURE==='1':env.NODE_ENV==='production';
 const sameSite=env.LOADNOTE_SESSION_SAMESITE||'Strict';
 const auth=createAuth({secret:env.LOADNOTE_AUTH_SECRET||'',ttlSeconds:Number(env.LOADNOTE_SESSION_TTL_SECONDS)||43200,secure:secureCookie,sameSite});
 const devKey=String(env.LOADNOTE_DEV_AUTH_KEY||'');
 const devAuthEnabled=env.NODE_ENV!=='production'&&env.LOADNOTE_DEV_AUTH==='1'&&devKey.length>=16&&auth.configured;
 const allowedOrigins=new Set(String(env.LOADNOTE_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean));
 if(env.NODE_ENV==='production'&&authRequired&&!auth.configured)throw Error('LOADNOTE_REQUIRE_AUTH=1 requires a 32+ byte LOADNOTE_AUTH_SECRET in production');
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
 function unauthorized(req,res,message='Authentication required'){
  return send(req,res,401,{error:message});
 }
 function authenticated(req,res,{csrf=false,required=true}={}){
  if(!auth.configured){
   if(required)return send(req,res,503,{error:'Account authentication is not configured.'});
   return null;
  }
  const session=auth.fromRequest(req);
  if(!session){
   if(required)unauthorized(req,res);
   return null;
  }
  if(csrf&&!auth.csrfValid(req,session)){send(req,res,403,{error:'Request verification failed.'});return null;}
  return session;
 }
 async function coach(req,res){
  if(authRequired&&!authenticated(req,res,{csrf:true,required:true}))return;
  if(!apiKey)return send(req,res,503,{error:'Server AI key is not configured.'});
  const body=await parseBody(req);
  const messages=Array.isArray(body.messages)?body.messages:[];
  if(!messages.length)return send(req,res,400,{error:'messages are required'});
  const upstream=await fetchImpl(baseUrl+'/chat/completions',{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
   body:JSON.stringify({model,messages:messages.slice(-14),temperature:0.4})
  });
  const text=await upstream.text();
  const headers=responseHeaders(req,{'Content-Type':'application/json'});
  res.writeHead(upstream.status,headers);res.end(text);
 }
 function staticFile(req,res,pathname){
  const relative=pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^[/\\]+/,'');
  const file=path.resolve(ROOT,relative),rel=path.relative(ROOT,file);
  if(rel.startsWith('..')||path.isAbsolute(rel)&&rel!==file)return send(req,res,404,{error:'Not found'});
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
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Max-Age':'600'
   }));return res.end();
  }
  try{
   const url=new URL(req.url||'/','http://loadnote.local'),pathname=url.pathname;
   if(req.method==='GET'&&pathname==='/api/health')return send(req,res,200,{ok:true,aiConfigured:!!apiKey,model,auth:{configured:auth.configured,required:authRequired,devLogin:devAuthEnabled}});
   if(req.method==='GET'&&pathname==='/api/auth/session'){
    const session=auth.configured?auth.fromRequest(req):null;
    return send(req,res,200,session?{authenticated:true,account:session.account,expiresAt:session.expiresAt,csrf:session.transport==='cookie'?session.csrf:null,transport:session.transport}:{authenticated:false,authConfigured:auth.configured,authRequired});
   }
   if(req.method==='POST'&&pathname==='/api/auth/logout'){
    const session=auth.configured?auth.fromRequest(req):null;
    if(session&&!auth.csrfValid(req,session))return send(req,res,403,{error:'Request verification failed.'});
    return send(req,res,200,{ok:true,discardBearer:session?.transport==='bearer'||false},'application/json',{'Set-Cookie':auth.clearCookie()});
   }
   if(req.method==='POST'&&pathname==='/api/auth/dev-session'){
    if(!devAuthEnabled)return send(req,res,404,{error:'Not found'});
    if(!safeEqual(req.headers['x-loadnote-dev-auth'],devKey))return unauthorized(req,res);
    const body=await parseBody(req),identity=auth.accountIdentity({provider:body.provider||'development',subject:body.subject});
    const issued=auth.issue(identity);
    return send(req,res,200,{authenticated:true,account:issued.account,expiresAt:issued.expiresAt,csrf:issued.csrf},'application/json',{'Set-Cookie':auth.sessionCookie(issued.token)});
   }
   if(req.method==='GET'&&pathname==='/api/account'){
    const session=authenticated(req,res,{required:true});if(!session)return;
    return send(req,res,200,{account:session.account,session:{expiresAt:session.expiresAt,transport:session.transport}});
   }
   if(req.method==='POST'&&pathname==='/api/coach')return await coach(req,res);
   if(req.method==='GET')return staticFile(req,res,pathname);
   return send(req,res,404,{error:'Not found'});
  }catch(error){
   return send(req,res,Number(error.statusCode)||500,{error:error.message||'Server error'});
  }
 });
 server.loadnote={port,auth,authRequired,devAuthEnabled,allowedOrigins:[...allowedOrigins]};
 return server;
}

if(require.main===module){
 const server=createServer();
 const port=server.loadnote.port;
 server.listen(port,()=>console.log(`Loadnote backend listening on http://localhost:${port}`));
}
module.exports={createServer};
