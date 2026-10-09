const fs=require('fs'),crypto=require('node:crypto');
fs.mkdirSync('assets',{recursive:true});
// Approved utility CSS is inert vendored output, not an executable glob/selector compiler.
// Extend styles.css/energy.css for new styles; see docs/releases-v3.22.md before replacing this baseline.
const baseline=fs.readFileSync('assets/tailwind-baseline.css');
if(crypto.createHash('sha256').update(baseline).digest('hex')!=='ba3813c5b3de11fbf6e0a4fc08ae2bc132966d7d6e35476ffb44c2a2bdc9627a')throw Error('Approved utility CSS baseline changed; review layout/browser compatibility before updating its checksum');
fs.writeFileSync('assets/tailwind.css',baseline);
fs.copyFileSync('node_modules/chart.js/dist/chart.umd.js','assets/chart.umd.js');
fs.copyFileSync('node_modules/chart.js/LICENSE.md','assets/chart-js-LICENSE.txt');
if(!fs.existsSync('assets/tailwindcss-LICENSE.txt'))throw Error('Vendored Tailwind MIT license is missing');
console.log('Restored approved utility CSS and locked Chart.js assets');
