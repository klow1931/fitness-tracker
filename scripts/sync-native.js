const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),pkg=require('../package.json'),beta=require('../native-beta.json');
const update=(file,fn)=>{const name=path.join(root,file);fs.writeFileSync(name,fn(fs.readFileSync(name,'utf8')));};
if(!Number.isInteger(beta.buildNumber)||beta.buildNumber<1)throw Error('Choose a positive native build number');
update('android/app/build.gradle',s=>s.replace(/versionCode \d+/,`versionCode ${beta.buildNumber}`).replace(/versionName "[^"]+"/,`versionName "${pkg.version}"`));
update('ios/App/App.xcodeproj/project.pbxproj',s=>s.replace(/MARKETING_VERSION = [^;]+;/g,`MARKETING_VERSION = ${pkg.version};`).replace(/CURRENT_PROJECT_VERSION = [^;]+;/g,`CURRENT_PROJECT_VERSION = ${beta.buildNumber};`));
const cli=path.join(root,'node_modules/@capacitor/cli/bin/capacitor');
for(const platform of ['android','ios'])execFileSync(process.execPath,[cli,'sync',platform],{cwd:root,stdio:'inherit'});
console.log('Native source projects synchronized; compilation, signing and device acceptance remain required.');
