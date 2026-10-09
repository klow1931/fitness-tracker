const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{createServer}=require('../backend/server');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-ai-limits-'));let calls=0,releaseBody,bodyStarted;
 const started=new Promise(r=>bodyStarted=r),env={NODE_ENV:'test',LOADNOTE_ACCOUNT_STORE_PATH:path.join(dir,'accounts.json'),LOADNOTE_AI_API_KEY:'test-key',LOADNOTE_AI_MAX_CONCURRENT:'1',LOADNOTE_AI_REQUESTS_PER_MINUTE:'2',LOADNOTE_AI_REQUESTS_PER_DAY:'2'};
 const server=createServer({env,fetchImpl:async()=>{calls++;if(calls===1)return {ok:true,json:()=>{bodyStarted();return new Promise(r=>releaseBody=r);}};throw Error('upstream failure');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const request=body=>fetch(base+'/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),valid={question:'What should I focus on?',context:{version:'0.6'}};
 try{
  assert.equal((await request({messages:[{role:'system',content:'unsafe'}]})).status,400);assert.equal(calls,0);
  const first=request(valid);await started;const limited=await request(valid);assert.equal(limited.status,429);assert(Number(limited.headers.get('retry-after'))>0);assert.equal(calls,1,'response parsing holds concurrency');
  releaseBody({choices:[{message:{content:JSON.stringify({summary:'Keep reviewed targets.',insights:[],recommendation:{action:'hold',reason:'Review your plan.'},confidence:'low'})}}]});assert.equal((await first).status,200);
  assert.equal((await request(valid)).status,502,'provider error still releases lease');assert.equal((await request(valid)).status,429,'provider failures consume attempt quota');assert.equal(calls,2);
  for(const resource of ['/','/privacy.html','/support.html','/delete-account.html']){const res=await fetch(base+resource);assert.equal(res.status,200);assert.match(res.headers.get('content-security-policy'),/object-src 'none'/);assert.match(res.headers.get('content-security-policy'),/frame-ancestors 'none'/);}
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
 console.log('AI quota before provider, leased response parsing, failure accounting and public CSP passed');
})().catch(e=>{console.error(e);process.exit(1);});
