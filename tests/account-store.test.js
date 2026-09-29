const assert=require('node:assert/strict');
const fs=require('fs'),os=require('os'),path=require('path');
const {createFileAccountStore}=require('../backend/account-store');

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-account-store-')),file=path.join(dir,'accounts.json');
let now=Date.parse('2026-09-28T22:30:00.000Z'),counter=0;
const make=()=>createFileAccountStore({filePath:file,now:()=>now,createId:()=> 'acct_test_account_identity_'+(++counter)});
let store=make();
let resolved=store.resolveIdentity({provider:'oidc-test',subject:'sub-123',email:'athlete@example.com',emailVerified:true,displayName:'Athlete'});
assert.equal(resolved.created,true);
assert.equal(resolved.account.email,'athlete@example.com');
assert.equal(resolved.account.displayName,'Athlete');
assert.deepEqual(resolved.account.providers,['oidc-test']);
const id=resolved.account.id;
assert(fs.existsSync(file));

now+=60000;
resolved=store.resolveIdentity({provider:'oidc-test',subject:'sub-123',email:'changed@example.com',emailVerified:false,displayName:'Updated Athlete'});
assert.equal(resolved.created,false);
assert.equal(resolved.account.id,id);
assert.equal(resolved.account.email,'athlete@example.com','unverified email must not replace a verified account email');
assert.equal(resolved.account.displayName,'Updated Athlete');

store=make();
assert.equal(store.findByIdentity({provider:'oidc-test',subject:'sub-123'}).account.id,id,'account identity must survive process/store reload');
assert.equal(store.getAccount(id).id,id);
assert.equal(store.findByIdentity({provider:'oidc-test',subject:'missing'}),null);

const raw=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(raw.version,1);
assert.equal(Object.keys(raw.accounts).length,1);
assert.equal(Object.keys(raw.identities).length,1);
assert.equal(raw.identities[Object.keys(raw.identities)[0]].subject,'sub-123');
const deleted=store.deleteAccount(id);
assert.equal(deleted.deleted,true);
assert.equal(deleted.identityCount,1);
assert.equal(store.getAccount(id),null);
assert.equal(store.findByIdentity({provider:'oidc-test',subject:'sub-123'}),null);
store=make();
assert.equal(store.getAccount(id),null,'account deletion must survive store reload');
assert.equal(Object.keys(store.snapshot().accounts).length,0);
assert.equal(Object.keys(store.snapshot().identities).length,0);
console.log('v2.60 persistent account store identity, verified-profile, reload and deletion behavior passed');
