'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const VERSION='1.18.2',SHA256='378b5434cd1378bef6b2bc527b8c7f0ff2584b273830335bce54d6d0813c8584';
function verify(bytes){if(crypto.createHash('sha256').update(bytes).digest('hex')!==SHA256)throw Error('Bundletool checksum mismatch');}
async function setup(){const response=await fetch(`https://github.com/google/bundletool/releases/download/${VERSION}/bundletool-all-${VERSION}.jar`,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Bundletool download failed');const bytes=Buffer.from(await response.arrayBuffer());verify(bytes);const dir=path.resolve(__dirname,'../.tools');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'bundletool.jar'),bytes);console.log('Verified pinned bundletool '+VERSION);}
if(require.main===module)setup().catch(e=>{console.error(e.message);process.exit(1);});
module.exports={verify,VERSION,SHA256};
