const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..'); const out=path.join(root,'www');
fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
for (const name of ['index.html','app.js','styles.css','manifest.webmanifest','sw.js','apple-touch-icon.png','icon-192.png','icon-512.png']) { const src=path.join(root,name); if(fs.existsSync(src)) fs.copyFileSync(src,path.join(out,name)); }
for (const dir of ['src']) { fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true}); }
console.log('Synced web assets to www/');
