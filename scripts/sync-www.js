const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..'); const out=path.join(root,'www');
fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
for (const name of ['index.html','privacy.html','support.html','delete-account.html','app.js','styles.css','energy.css','manifest.webmanifest','sw.js','apple-touch-icon.png','icon-192.png','icon-512.png']) { const src=path.join(root,name); if(fs.existsSync(src)) fs.copyFileSync(src,path.join(out,name)); }
for (const dir of ['src','assets']) { fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true}); }
// Keep the generated mobile shell aligned with the canonical package release even
// when the browser shell renders its footer version at runtime.
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const mobileIndex=path.join(out,'index.html');
if(fs.existsSync(mobileIndex)){
 fs.copyFileSync(path.join(root,'node_modules/@capacitor/core/dist/capacitor.js'),path.join(out,'assets/capacitor.js'));
 fs.copyFileSync(path.join(root,'node_modules/@capacitor/core/LICENSE'),path.join(out,'assets/capacitor-LICENSE.txt'));
 const html=fs.readFileSync(mobileIndex,'utf8').replace(/Loadnote web v\d+\.\d+\.\d+ ·/,'Loadnote web v'+pkg.version+' ·').replace('<script src="src/product/platform-runtime.js"','<script src="assets/capacitor.js" defer></script>\n  <script src="src/product/platform-runtime.js"');
 fs.writeFileSync(mobileIndex,html);
}
console.log('Synced web assets to www/');
