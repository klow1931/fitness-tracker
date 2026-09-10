const fs=require('fs'),{execFileSync}=require('child_process');
fs.mkdirSync('assets',{recursive:true});
execFileSync(process.execPath,['node_modules/tailwindcss/lib/cli.js','-i','assets/input.css','-o','assets/tailwind.css','--minify'],{stdio:'inherit'});
fs.copyFileSync('node_modules/chart.js/dist/chart.umd.js','assets/chart.umd.js');
for(const [pkg,file] of [['chart.js','LICENSE.md'],['tailwindcss','LICENSE']])fs.copyFileSync(`node_modules/${pkg}/${file}`,`assets/${pkg.replace('.','-')}-LICENSE.txt`);
