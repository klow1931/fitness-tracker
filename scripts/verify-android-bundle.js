const assert=require('node:assert/strict');
function verifyAndroidBundle({manifest,files,config,dexMagic,signatureVerified,signatureOutput},{version=require('../package.json').version,buildNumber=require('../native-beta.json').buildNumber,appId=require('../capacitor.config.json').appId,development=false}={}){
 const attr=(name)=>manifest.match(new RegExp('(?:\\s|<)'+name+'="([^"]+)"'))?.[1];
 const packageId=development?appId+'.beta':appId;
 assert.equal(attr('package'),packageId);assert.equal(attr('android:versionName'),version);assert.equal(attr('android:versionCode'),String(buildNumber));
 assert.equal(attr('android:minSdkVersion'),'23');assert.equal(attr('android:targetSdkVersion'),'35');
 assert.equal(attr('android:allowBackup'),'false');assert.equal(attr('android:usesCleartextTraffic'),'false');
 assert.equal(/android:debuggable="true"/.test(manifest),development,'APK debuggable flag does not match its channel');
 const permissions=[...manifest.matchAll(/<uses-permission\b[^>]*android:name="([^"]+)"/g)].map(m=>m[1]);
 assert(permissions.includes('android.permission.INTERNET'),'Missing internet permission');
 for(const permission of permissions)assert(['android.permission.INTERNET',packageId+'.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'].includes(permission),'Unexpected merged permission: '+permission);
 if(development)assert(signatureVerified,'Development APK signature did not verify');
 else {
  assert(!signatureVerified&&/Missing META-INF\/MANIFEST.MF|No signatures|not signed/i.test(signatureOutput),'Unsigned APK check was inconclusive or APK was signed');
  assert(!files.some(f=>/^META-INF\/.*\.(?:RSA|DSA|EC|SF)$/i.test(f)),'Unexpected APK signing material');
 }
 assert.equal(dexMagic,'6465780a','Missing compiled DEX bytecode');
 for(const file of ['AndroidManifest.xml','classes.dex','assets/capacitor.config.json','assets/public/index.html','assets/public/assets/capacitor.js','assets/public/src/product/native-backup.js','assets/public/src/product/beta-onboarding.js'])assert(files.includes(file),'Missing APK resource '+file);
 assert.equal(config.appId,appId);assert(!config.server,'APK points at a live server');
 return {version,buildNumber,appId:packageId,minSdk:23,targetSdk:35,compiled:true,bundledResourcesVerified:true,permissions,signed:development,channel:development?'debug-beta':'unsigned-release',launched:false,physicalDeviceTested:false,storeReady:false};
}
module.exports={verifyAndroidBundle};
