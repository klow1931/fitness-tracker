const assert=require('node:assert/strict');
const fs=require('fs'),os=require('os'),path=require('path');
const {createServer}=require('../backend/server');
const Sync=require('../src/product/sync-model');

const empty=()=>Object.fromEntries(Sync.COLLECTIONS.map(name=>[name,[]]));
const state={schemaVersion:25,...empty(),athleteProfile:null,exerciseNotes:{},programStates:{},activeProgramId:null,workouts:[{id:'w-delete',date:'2026-09-29',exercises:[]}]};
const cookies=headers=>typeof headers.getSetCookie==='function'?headers.getSetCookie():[headers.get('set-cookie')].filter(Boolean);

(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-account-delete-'));
 const env={
  NODE_ENV:'test',
  LOADNOTE_AUTH_SECRET:'account-delete-test-secret-'.padEnd(64,'s'),
  LOADNOTE_REQUIRE_AUTH:'1',
  LOADNOTE_ACCOUNT_STORE_PATH:path.join(dir,'accounts.json'),
  LOADNOTE_SYNC_STORE_PATH:path.join(dir,'training'),
  LOADNOTE_DEV_AUTH:'1',
  LOADNOTE_DEV_AUTH_KEY:'account-delete-dev-key-12345'
 };
 const server=createServer({env});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const login=async()=>{
  const response=await fetch(base+'/api/auth/dev-session',{method:'POST',headers:{'Content-Type':'application/json','X-Loadnote-Dev-Auth':env.LOADNOTE_DEV_AUTH_KEY},body:JSON.stringify({provider:'development',subject:'delete-user',email:'delete@example.com',emailVerified:true})});
  assert.equal(response.status,200);
  const body=await response.json();
  const cookie=cookies(response.headers).find(value=>value.startsWith('loadnote_session=')).split(';')[0];
  return {body,cookie};
 };
 try{
  const first=await login(),accountId=first.body.account.id;
  const pkg=Sync.createPackage(state,{clientId:'delete-test-device',createdAt:'2026-09-29T02:00:00.000Z',releaseVersion:'2.60.0'});
  let response=await fetch(base+'/api/sync/state',{method:'PUT',headers:{Cookie:first.cookie,'Content-Type':'application/json','X-Loadnote-CSRF':first.body.csrf},body:JSON.stringify({expectedRevision:0,package:pkg})});
  assert.equal(response.status,200);
  assert.equal(server.loadnote.syncStore.status(accountId).hasSnapshot,true);

  response=await fetch(base+'/api/account',{method:'DELETE',headers:{Cookie:first.cookie}});
  assert.equal(response.status,403,'cookie-authenticated account deletion must require CSRF');
  assert.equal(server.loadnote.accountStore.getAccount(accountId).id,accountId);
  assert.equal(server.loadnote.syncStore.status(accountId).hasSnapshot,true);

  response=await fetch(base+'/api/account',{method:'DELETE',headers:{Cookie:first.cookie,'X-Loadnote-CSRF':first.body.csrf}});
  const deleted=await response.json();
  assert.equal(response.status,200);
  assert.equal(deleted.deleted,true);
  assert.equal(deleted.remoteTrainingDeleted,true);
  assert.equal(deleted.localDeviceDataDeleted,false);
  assert.equal(server.loadnote.accountStore.getAccount(accountId),null);
  assert.equal(server.loadnote.accountStore.findByIdentity({provider:'development',subject:'delete-user'}),null);
  assert.equal(server.loadnote.syncStore.status(accountId).status,'empty');

  response=await fetch(base+'/api/auth/session',{headers:{Cookie:first.cookie}});
  const expired=await response.json();
  assert.equal(expired.authenticated,false,'old session must stop resolving after account deletion');

  const second=await login();
  assert.notEqual(second.body.account.id,accountId,'signing in after deletion must create a new Loadnote account identity');
  console.log('v2.60 account deletion removes identity and remote training while leaving local-device deletion to the client');
 }finally{
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exit(1);});
