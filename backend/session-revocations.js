'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
// Single-process adapter, like account-store. Use a transactional shared adapter for replicas.
function createSessionRevocations({filePath,now=Date.now,maxEntries=100000}){
 function read(){
  if(!fs.existsSync(filePath))return {};
  const data=JSON.parse(fs.readFileSync(filePath,'utf8'));
  if(data.version!==1||!data.sessions||Array.isArray(data.sessions)||typeof data.sessions!=='object')throw Error('Invalid session revocation store');
  for(const [sid,expiry]of Object.entries(data.sessions))if(!sid||!Number.isFinite(expiry)||expiry<=0)throw Error('Invalid session revocation record');
  return data.sessions;
 }
 read();
 function revoked(sid){return Number(read()[sid]||0)>now();}
 function revoke(sid,expiresAt){
  const expiry=Date.parse(expiresAt);if(!sid||!Number.isFinite(expiry))throw Error('Invalid session revocation');
  const sessions=Object.fromEntries(Object.entries(read()).filter(([,exp])=>exp>now()));
  sessions[sid]=expiry;if(Object.keys(sessions).length>maxEntries)throw Error('Session revocation capacity reached');
  fs.mkdirSync(path.dirname(filePath),{recursive:true,mode:0o700});
  const temp=filePath+'.'+crypto.randomUUID()+'.tmp';let fd;
  try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({version:1,sessions}));fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,filePath);const dir=fs.openSync(path.dirname(filePath),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
  finally{if(fd!==undefined)fs.closeSync(fd);fs.rmSync(temp,{force:true});}
 }
 return {revoked,revoke};
}
module.exports={createSessionRevocations};
