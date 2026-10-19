/* Copy audited, pinned local program readers into the static offline asset bundle. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/vendor');
const files=[
 ['exceljs/dist/exceljs.min.js','exceljs.min.js'],
 ['exceljs/LICENSE','exceljs-LICENSE.txt'],
 ['pdfjs-dist/build/pdf.mjs','pdf.mjs'],
 ['pdfjs-dist/build/pdf.worker.mjs','pdf.worker.mjs'],
 ['pdfjs-dist/LICENSE','pdfjs-LICENSE.txt']
];
fs.mkdirSync(out,{recursive:true});
for(const [source,name] of files){
 const from=path.join(root,'node_modules',source);
 if(!fs.existsSync(from))throw Error('Missing offline program reader: '+source+'. Run npm ci before packaging Loadnote.');
 fs.copyFileSync(from,path.join(out,name));
}
console.log('Bundled local Excel and PDF readers, with licenses, for offline program import');
