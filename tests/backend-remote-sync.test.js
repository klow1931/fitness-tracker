const assert=require('node:assert/strict');
const fs=require('fs'),os=require('os'),path=require('path');
const {createServer}=require('../backend/server');
const Sync=require('../src/product/sync-model');

const empty=()=>Object.fromEntries(Sync.COLLECTIONS.map(name=>[name,[]]));
const state=overrides=>({schemaVersion:25,...empty(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,...overrides});
const workout=(id,note='')=>({id,date:'2026-09-28',createdAt:'2026-09-28T18:00:00.000Z',updatedAt:'2026-09-28T18:00:00.000Z',notes:note,exercises:[{name:'Bench',exerciseId:'bench',type:'strength',trackBy:'reps',sets:[{weight:100,reps:5,rpe:8}]}]});
const cookies=headers=>typeof headers.getSetCookie==='function'?headers.getSetCookie():[headers.get('set-cookie')].filter(Boolean);

(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-remote-api-'));
 const env={
  NODE_ENV:'test',
  LOADNOTE_AUTH_SECRET:'remote-api-test-secret-'.padEnd(64,'s'),
  LOADNOTE_REQUIRE_AUTH:'1',
  LOADNOTE_ACCOUNT_STORE_PATH:path.join(dir,'accounts.json'),
  LOADNOTE_SYNC_STORE_PATH:path.join(dir,'training'),
  LOADNOTE_DEV_AUTH:'1',
  LOADNOTE_DEV_AUTH_KEY:'remote-api-dev-key-12345'
 };
 const start=async()=>{
  const server=createServer({env});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return server;
 };
 const login=async(base,subject)=>{
  const response=await fetch(base+'/api/auth/dev-session',{method:'POST',headers:{'Content-Type':'application/json','X-Loadnote-Dev-Auth':env.LOADNOTE_DEV_AUTH_KEY},body:JSON.stringify({subject,provider:'development'})});
  assert.equal(response.status,200);
  const body=await response.json();
  const cookie=cookies(response.headers).find(value=>value.startsWith('loadnote_session=')).split(';')[0];
  return {body,cookie};
 };

 let server=await start(),base='http://127.0.0.1:'+server.address().port;
 let authA,secondPackage;
 try{
  let response=await fetch(base+'/api/sync/status');
  assert.equal(response.status,401);

  authA=await login(base,'remote-user-a');
  response=await fetch(base+'/api/sync/status',{headers:{Cookie:authA.cookie}});
  let body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.status,'empty');
  assert.equal(body.revision,0);
  assert.equal(body.protocol,Sync.PROTOCOL);
  assert.equal(Object.hasOwn(body,'package'),false,'status endpoint must not return the full training snapshot');

  const firstPackage=Sync.createPackage(state({workouts:[workout('w1','first remote copy')]}),{clientId:'browser-a',createdAt:'2026-09-28T23:20:00.000Z',releaseVersion:'2.58.0'});
  response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:authA.cookie,'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:0,package:firstPackage})});
  assert.equal(response.status,403,'cookie-authenticated remote writes must require CSRF');

  response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:authA.cookie,'Content-Type':'application/json','X-Loadnote-CSRF':authA.body.csrf},body:JSON.stringify({expectedRevision:0,accountId:'acct_someone_else_123456789012345',package:firstPackage})});
  body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.status,'committed');
  assert.equal(body.revision,1);

  response=await fetch(base+'/api/sync/status',{headers:{Cookie:authA.cookie}});
  body=await response.json();
  assert.equal(body.revision,1);
  assert.equal(body.current.packageFingerprint,firstPackage.packageFingerprint);
  assert.equal(body.current.records,1);
  assert.equal(Object.hasOwn(body,'package'),false);

  response=await fetch(base+'/api/sync/state',{headers:{Cookie:authA.cookie}});
  body=await response.json();
  assert.equal(body.hasSnapshot,true);
  assert.equal(body.revision,1);
  assert.equal(body.package.packageFingerprint,firstPackage.packageFingerprint);
  assert.equal(Sync.verifyPackage(body.package).verified,true);

  response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:authA.cookie,'Content-Type':'application/json','X-Loadnote-CSRF':authA.body.csrf},body:JSON.stringify({expectedRevision:0,package:firstPackage})});
  body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.status,'unchanged');
  assert.equal(body.revision,1,'idempotent retry must not create a second revision');

  secondPackage=Sync.createPackage(state({workouts:[workout('w1','newer remote copy')]}),{clientId:'browser-b',createdAt:'2026-09-28T23:21:00.000Z',releaseVersion:'2.58.0'});
  response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:authA.cookie,'Content-Type':'application/json','X-Loadnote-CSRF':authA.body.csrf},body:JSON.stringify({expectedRevision:0,package:secondPackage})});
  body=await response.json();
  assert.equal(response.status,409);
  assert.equal(body.code,'revision_conflict');
  assert.equal(body.remote.revision,1);
  assert.equal(Object.hasOwn(body.remote,'package'),false,'revision conflict response should expose metadata, not duplicate the remote snapshot');

  response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:authA.cookie,'Content-Type':'application/json','X-Loadnote-CSRF':authA.body.csrf},body:JSON.stringify({expectedRevision:1,package:secondPackage})});
  body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.revision,2);

  const tampered=structuredClone(secondPackage);tampered.data.collections.workouts[0].notes='tampered';
  response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:authA.cookie,'Content-Type':'application/json','X-Loadnote-CSRF':authA.body.csrf},body:JSON.stringify({expectedRevision:2,package:tampered})});
  body=await response.json();
  assert.equal(response.status,400);
  assert.equal(body.code,'invalid_package');

  response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:authA.cookie,'Content-Type':'application/json','X-Loadnote-CSRF':authA.body.csrf},body:JSON.stringify({expectedRevision:null,package:secondPackage})});
  body=await response.json();
  assert.equal(response.status,400);
  assert.equal(body.code,'invalid_revision');

  const authB=await login(base,'remote-user-b');
  response=await fetch(base+'/api/sync/status',{headers:{Cookie:authB.cookie}});
  body=await response.json();
  assert.equal(body.status,'empty');
  assert.equal(body.revision,0,'another authenticated account must not see account A training storage');
 }finally{await new Promise(resolve=>server.close(resolve));}

 server=await start();base='http://127.0.0.1:'+server.address().port;
 try{
  const response=await fetch(base+'/api/sync/state',{headers:{Cookie:authA.cookie}});
  const body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.revision,2,'remote training revision must survive a server restart');
  assert.equal(body.package.packageFingerprint,secondPackage.packageFingerprint);
 }finally{await new Promise(resolve=>server.close(resolve));}

 console.log('v2.58 authenticated remote training API revisions, CSRF, isolation, conflict and restart persistence passed');
})().catch(error=>{console.error(error);process.exit(1);});
