const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(dir,f.name)):f.name.endsWith('.js')?[path.join(dir,f.name)]:[]);}
for(const file of [path.join(root,'app.js'),path.join(root,'sw.js'),path.join(root,'playwright.config.js'),...['src','backend','scripts','tests'].flatMap(d=>walk(path.join(root,d)))]) {
  const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
  if(result.status !== 0) process.exit(result.status || 1);
}
console.log('JavaScript syntax checks passed');
