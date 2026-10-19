/* PDF.js smoke test for text-based athlete program PDFs; no screenshots or user data. */
const assert=require('node:assert/strict');
const Import=require('../src/product/custom-program-import');

function tinyPdf(){
 const content='BT /F1 12 Tf 50 740 Td (Week 1) Tj 0 -18 Td (Monday) Tj 0 -18 Td (Competition Squat 4x5 225 lb RPE 7) Tj ET';
 const objects=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  '<< /Length '+Buffer.byteLength(content)+' >>\nstream\n'+content+'\nendstream'
 ];
 let pdf='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}
 const xref=Buffer.byteLength(pdf);pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';for(const n of offsets.slice(1))pdf+=String(n).padStart(10,'0')+' 00000 n \n';
 pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return new Uint8Array(Buffer.from(pdf));
}
(async()=>{
 const pdf=await import('../assets/vendor/pdf.mjs');
 const doc=await pdf.getDocument({data:tinyPdf(),isEvalSupported:false}).promise;
 try{
  assert.equal(doc.numPages,1);
  const text=Import.pdfItemsToText((await (await doc.getPage(1)).getTextContent()).items);
  const parsed=Import.plainText(text);
  assert.equal(parsed.rows.length,1);
  assert.equal(parsed.rows[0].exercise,'Competition Squat');
  assert.equal(parsed.rows[0].sets,'4');
  assert.equal(parsed.rows[0].weight,'225');
 }finally{await doc.destroy();}
 console.log('PDF text extraction and conservative program parsing passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
