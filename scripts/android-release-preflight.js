'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const SIGNING=['LOADNOTE_ANDROID_KEYSTORE','LOADNOTE_ANDROID_KEYSTORE_PASSWORD','LOADNOTE_ANDROID_KEY_ALIAS','LOADNOTE_ANDROID_KEY_PASSWORD'];
function assess({env=process.env,java='',exists=fs.existsSync,isFile=p=>fs.statSync(p).isFile(),unsigned=false,root=path.resolve(__dirname,'..')}={}){
 const sdk=env.ANDROID_HOME||env.ANDROID_SDK_ROOT,checks=[];
 const add=(id,passed)=>checks.push({id,passed:!!passed});
 add('jdk-21',/(?:version|openjdk) "?21[.\s"]/.test(java));
 add('sdk-api-36',sdk&&exists(path.join(sdk,'platforms/android-36/android.jar')));
 add('sdk-build-tools-36',sdk&&exists(path.join(sdk,'build-tools/36.0.0/apksigner')));
 const jar=env.LOADNOTE_BUNDLETOOL_JAR||path.join(root,'.tools/bundletool.jar');
 add('bundletool-present',exists(jar));
 if(unsigned)add('signing-unset',SIGNING.every(k=>!env[k]));
 else {
  add('owner-signing-configured',SIGNING.every(k=>typeof env[k]==='string'&&env[k].trim()));
  const key=env.LOADNOTE_ANDROID_KEYSTORE;
  let valid=false;try{valid=!!key&&path.isAbsolute(key)&&exists(key)&&isFile(key);}catch{}
  add('owner-keystore-file',valid);
 }
 return {version:require('../package.json').version,mode:unsigned?'unsigned-rehearsal':'owner-signed-preflight',checks,buildPrerequisitesReady:checks.every(c=>c.passed),storeReady:false,physicalDeviceTested:false,note:'Read-only prerequisites, not compilation, key-identity verification, physical acceptance or Play approval. No secret values are included.'};
}
if(require.main===module){
 const result=spawnSync('java',['-version'],{encoding:'utf8'});
 const report=assess({java:(result.stdout||'')+(result.stderr||''),unsigned:process.argv.includes('--unsigned')});
 console.log(JSON.stringify(report,null,2));process.exitCode=report.buildPrerequisitesReady?0:1;
}
module.exports={assess};
