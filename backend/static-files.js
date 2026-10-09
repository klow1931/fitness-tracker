'use strict';
const fs=require('node:fs'),path=require('node:path');
function resolveStaticFile(root,pathname,{rootFiles,prefixes}){
 try{
  const requested=(pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^[/\\]+/,''));
  if(requested.includes('\0')||requested.split(/[/\\]/).some(segment=>segment==='.'||segment==='..'))return null;
  const allowed=file=>{const relative=path.relative(root,file).split(path.sep).join('/');return !relative.startsWith('../')&&!path.isAbsolute(relative)&&(rootFiles.has(relative)||prefixes.some(prefix=>relative.startsWith(prefix)));};
  const file=path.resolve(root,requested);if(!allowed(file)||!fs.statSync(file).isFile())return null;
  const real=fs.realpathSync(file);return allowed(real)?real:null;
 }catch{return null;}
}
module.exports={resolveStaticFile};
