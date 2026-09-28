const assert=require('node:assert/strict');
const {createAuth,parseCookies}=require('../backend/auth');

const secret='v2.56-test-secret-'.padEnd(64,'x');
const auth=createAuth({secret,ttlSeconds:3600,secure:true,sameSite:'Strict'});
assert.equal(auth.configured,true);
const identity=auth.accountIdentity({provider:'oidc-test',subject:'provider-user-123'});
const same=auth.accountIdentity({provider:'oidc-test',subject:'provider-user-123'});
const other=auth.accountIdentity({provider:'oidc-test',subject:'provider-user-456'});
assert.equal(identity.id,same.id,'trusted provider identity must map to a stable Loadnote account id');
assert.notEqual(identity.id,other.id);
assert.equal(identity.provider,'oidc-test');

const issued=auth.issue(identity,{now:Date.parse('2026-09-28T20:00:00.000Z'),sessionId:'session-1'});
const verified=auth.verify(issued.token,{now:Date.parse('2026-09-28T20:30:00.000Z')});
assert.equal(verified.account.id,identity.id);
assert.equal(verified.sessionId,'session-1');
assert.equal(verified.csrf,issued.csrf);
assert.equal(auth.verify(issued.token+'tamper',{now:Date.parse('2026-09-28T20:30:00.000Z')}),null);
assert.equal(auth.verify(issued.token,{now:Date.parse('2026-09-28T21:00:01.000Z')}),null,'expired session must be rejected');

const cookie=auth.sessionCookie(issued.token);
assert.match(cookie,/HttpOnly/);
assert.match(cookie,/SameSite=Strict/);
assert.match(cookie,/Secure/);
assert.equal(parseCookies(cookie).loadnote_session,issued.token);
assert.match(auth.clearCookie(),/Max-Age=0/);

const cookieReq={headers:{cookie,authorization:'','x-loadnote-csrf':issued.csrf}};
const cookieSession=auth.fromRequest(cookieReq,{now:Date.parse('2026-09-28T20:30:00.000Z')});
assert.equal(cookieSession.transport,'cookie');
assert.equal(auth.csrfValid(cookieReq,cookieSession),true);
assert.equal(auth.csrfValid({headers:{'x-loadnote-csrf':'wrong'}},cookieSession),false);

const bearerReq={headers:{authorization:'Bearer '+issued.token}};
const bearerSession=auth.fromRequest(bearerReq,{now:Date.parse('2026-09-28T20:30:00.000Z')});
assert.equal(bearerSession.transport,'bearer');
assert.equal(auth.csrfValid(bearerReq,bearerSession),true);

assert.equal(createAuth({secret:'short'}).configured,false);
assert.throws(()=>createAuth({secret,secure:false,sameSite:'None'}),/requires secure/);
console.log('v2.56 server account identity, signed sessions, expiry, cookie and CSRF primitives passed');
