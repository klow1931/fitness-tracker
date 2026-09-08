const {readdirSync}=require('fs');
const {join}=require('path');
const {spawnSync}=require('child_process');
for(const name of readdirSync(join(__dirname,'../tests')).filter(n=>n.endsWith('.test.js')).sort()) {
  const result=spawnSync(process.execPath,[join(__dirname,'../tests',name)],{stdio:'inherit'});
  if(result.status !== 0) process.exit(result.status || 1);
}
