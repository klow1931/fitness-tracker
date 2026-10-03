const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pkg=JSON.parse(read('package.json')),beta=JSON.parse(read('native-beta.json')),config=JSON.parse(read('capacitor.config.json'));
assert.equal(beta.stage,'unsigned-development');assert.equal(beta.services,'local-only');assert.equal(beta.storeReady,false);
assert.equal(config.appId,beta.appId);assert.equal(config.appId,'app.loadnote.mobile');assert.equal(config.webDir,'www');
assert(!config.server,'Native beta must use packaged assets, not a live server');
const gradle=read('android/app/build.gradle'),project=read('ios/App/App.xcodeproj/project.pbxproj');
assert(gradle.includes(`applicationId "${config.appId}"`));assert(gradle.includes(`versionName "${pkg.version}"`));assert(gradle.includes(`versionCode ${beta.buildNumber}`));
assert(project.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${config.appId};`));
assert.equal([...project.matchAll(/MARKETING_VERSION = ([^;]+);/g)].length,2);
for(const version of project.matchAll(/MARKETING_VERSION = ([^;]+);/g))assert.equal(version[1],pkg.version);
for(const version of project.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g))assert.equal(version[1],String(beta.buildNumber));
assert(!/DEVELOPMENT_TEAM = [^;\s]+;/.test(project),'Do not commit a signing team in the unsigned foundation');
const manifest=read('android/app/src/main/AndroidManifest.xml');
assert.deepEqual([...manifest.matchAll(/<uses-permission[^>]+android:name="([^"]+)"/g)].map(m=>m[1]),['android.permission.INTERNET']);
assert(manifest.includes('android:allowBackup="false"'));assert(manifest.includes('android:usesCleartextTraffic="false"'));
const paths=read('android/app/src/main/res/xml/file_paths.xml');
assert(paths.includes('path="loadnote-exports/"'));assert.equal((paths.match(/<cache-path /g)||[]).length,1);assert(!/<(?:root|external|files)-path/.test(paths));
const plist=read('ios/App/App/Info.plist');assert(!/NS(?:Microphone|Camera|Location|Health|AppTransportSecurity)/.test(plist));
const privacy=read('ios/App/App/PrivacyInfo.xcprivacy');assert(privacy.includes('NSPrivacyAccessedAPICategoryFileTimestamp'));assert(privacy.includes('C617.1'));
assert(project.includes('A28500000000000000000002 /* PrivacyInfo.xcprivacy */,')&&project.includes('A28500000000000000000001 /* PrivacyInfo.xcprivacy in Resources */,'),'Privacy manifest must be part of the app resource phase');
const spm=read('ios/App/CapApp-SPM/Package.swift');for(const plugin of ['CapacitorFilesystem','CapacitorShare'])assert(spm.includes(plugin),'Missing SPM plugin '+plugin);
const mobile=read('www/index.html');assert(mobile.includes('assets/capacitor.js'));assert(mobile.indexOf('assets/capacitor.js')<mobile.indexOf('src/product/platform-runtime.js'));
for(const file of ['android/app/src/main/assets/capacitor.config.json','ios/App/App/capacitor.config.json']){
 const copied=JSON.parse(read(file));assert.equal(copied.appId,config.appId);assert(!copied.server);
}
const icon=fs.readFileSync(path.join(root,'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'));
assert.equal(icon.readUInt32BE(16),1024);assert.equal(icon.readUInt32BE(20),1024);
console.log('Unsigned native source checks passed: identity, versions, permissions, privacy resources, local assets and plugin wiring. Native compilation/device acceptance not performed.');
