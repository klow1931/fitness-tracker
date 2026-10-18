/* Crash-durable file replacement for the supported single-instance backend.
 * This does not make the file stores safe across multiple API processes.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
function syncDir(dir){const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function replace(file,body){
 const dir=path.dirname(file);
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const tmp=file+'.'+process.pid+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';
 let fd;
 try{
  fd=fs.openSync(tmp,'wx',0o600);
  fs.writeFileSync(fd,body,{encoding:'utf8'});
  fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
  fs.renameSync(tmp,file);
  fs.chmodSync(file,0o600);
  syncDir(dir);
 }catch(error){
  if(fd!==undefined)try{fs.closeSync(fd);}catch{}
  try{fs.unlinkSync(tmp);}catch{}
  throw error;
 }
}
function remove(file){
 if(!fs.existsSync(file))return false;
 fs.unlinkSync(file);
 syncDir(path.dirname(file));
 return true;
}
module.exports={replace,remove,syncDir};
