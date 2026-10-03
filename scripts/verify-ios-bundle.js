const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function verifyIosToolchain(xcodeVersion,sdkVersion){
 assert(Number(String(xcodeVersion).match(/Xcode (\d+)/)?.[1])>=26&&/^\d+(?:\.\d+)*$/.test(String(sdkVersion))&&Number(String(sdkVersion).split('.')[0])>=26,'Use Xcode 26+ and iOS SDK 26+ for the current App Store Connect upload baseline');
}
function verifyIosBundle(app,info,target,{version=require('../package.json').version,buildNumber=require('../native-beta.json').buildNumber,appId=require('../capacitor.config.json').appId}={}){
 assert.equal(info.CFBundleIdentifier,appId);assert.equal(info.CFBundleShortVersionString,version);assert.equal(info.CFBundleVersion,String(buildNumber));
 const platform=target==='simulator'?'iPhoneSimulator':'iPhoneOS';assert(info.CFBundleSupportedPlatforms?.includes(platform),'Wrong compiled platform');
 assert(!fs.existsSync(path.join(app,'_CodeSignature')),'Unsigned check unexpectedly produced a signed app');
 assert(/^[A-Za-z0-9_-]+$/.test(info.CFBundleExecutable||''),'Invalid executable name');
 const executable=fs.readFileSync(path.join(app,info.CFBundleExecutable));
 assert(executable.length>4&&['cffaedfe','cefaedfe','feedfacf','feedface','cafebabe','bebafeca','cafebabf'].includes(executable.subarray(0,4).toString('hex')),'Missing Mach-O executable');
 for(const file of ['PrivacyInfo.xcprivacy','public/index.html','public/assets/capacitor.js','public/src/product/native-backup.js'])assert(fs.statSync(path.join(app,file)).size>0,'Missing bundled resource '+file);
 const config=JSON.parse(fs.readFileSync(path.join(app,'capacitor.config.json'),'utf8'));assert.equal(config.appId,appId);assert(!config.server,'Compiled app points at a live server');
 return {version,buildNumber,appId,target,platform,compiled:true,bundledResourcesVerified:true,signed:false,launched:false,physicalDeviceTested:false,storeReady:false};
}
module.exports={verifyIosBundle,verifyIosToolchain};
