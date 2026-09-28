const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),www=path.join(root,'www');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=message=>{throw new Error(message);};
const config=JSON.parse(read('capacitor.config.json'));
if(config.appName!=='Loadnote')fail('Capacitor appName must be Loadnote');
if(!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*){2,}$/.test(config.appId||''))fail('Capacitor appId must be a valid reverse-domain identifier');
if(config.webDir!=='www')fail('Capacitor webDir must remain www');
if(!fs.existsSync(www))fail('www/ is missing; run npm run sync:web first');
const html=fs.readFileSync(path.join(www,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(www,'manifest.webmanifest'),'utf8'));
const pkg=JSON.parse(read('package.json'));
if(!/viewport-fit=cover/.test(html))fail('Mobile viewport must opt into safe-area handling');
for(const key of ['name','short_name','description','start_url','scope','id','display'])if(!manifest[key])fail('Manifest missing '+key);
if(manifest.name!=='Loadnote'||manifest.display!=='standalone')fail('Manifest identity/display mismatch');
if(!manifest.icons?.some(icon=>icon.sizes==='512x512'&&String(icon.purpose||'').includes('maskable')))fail('Manifest needs a maskable 512 icon');
const refs=[
 ...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g),
 ...html.matchAll(/<img[^>]+src="([^"]+)"/g)
].map(match=>match[1]).filter(ref=>!ref.startsWith('http')&&!ref.startsWith('#')&&!ref.startsWith('data:'));
for(const ref of refs){const clean=ref.split(/[?#]/)[0].replace(/^\.\//,'');if(clean&&clean!=='/'&&!fs.existsSync(path.join(www,clean)))fail('Generated mobile bundle missing '+clean);}
const sw=fs.readFileSync(path.join(www,'sw.js'),'utf8');
for(const match of sw.matchAll(/'\.\/([^']+)'/g)){const asset=match[1];if(asset&&asset!=='/'&&!fs.existsSync(path.join(www,asset)))fail('Service worker references missing mobile asset '+asset);}
for(const forbidden of ['backend','tests','.github','.env'])if(fs.existsSync(path.join(www,forbidden)))fail('Development/server material must not be packaged in www/: '+forbidden);
if(!html.includes('Loadnote web v'+pkg.version+' ·'))fail('Generated mobile bundle version does not match package.json');
if(!sw.includes("const CACHE = 'loadnote-v"+pkg.version+"';"))fail('Generated mobile service-worker cache version drift');
console.log('Mobile release bundle checks passed: Capacitor config, manifest, safe areas, assets and package boundary');
