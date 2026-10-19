const assert=require('node:assert/strict');
const JSZip=require('jszip');
const {DOMParser}=require('@xmldom/xmldom');
const Import=require('../src/product/custom-program-import');

const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';

async function fixture(worksheet,{extraSheet=false}={}){
 const zip=new JSZip();
 zip.file('xl/workbook.xml',`<?xml version="1.0"?><workbook xmlns="${NS}" xmlns:r="${REL}"><sheets><sheet name="Athlete Plan" sheetId="1" r:id="rId1"/>${extraSheet?'<sheet name="Other" sheetId="2" r:id="rId2"/>':''}</sheets></workbook>`);
 zip.file('xl/_rels/workbook.xml.rels',`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`);
 zip.file('xl/sharedStrings.xml',`<?xml version="1.0"?><sst xmlns="${NS}"><si><t>Week</t></si><si><t>Day</t></si><si><t>Exercise</t></si><si><t>Sets</t></si><si><t>Reps</t></si><si><t>Weight (lb)</t></si><si><r><t>Pause </t></r><r><t>Bench Press</t></r></si><si><t>Monday</t></si></sst>`);
 zip.file('xl/worksheets/sheet1.xml',`<?xml version="1.0"?><worksheet xmlns="${NS}"><sheetData>${worksheet}</sheetData></worksheet>`);
 return zip.generateAsync({type:'nodebuffer'});
}
const firstRow='<row r="1">'+[0,1,2,3,4,5].map((n,i)=>`<c r="${String.fromCharCode(65+i)}1" t="s"><v>${n}</v></c>`).join('')+'</row>';

(async()=>{
 const valid=await fixture(firstRow+'<row r="2"><c r="A2"><v>1</v></c><c r="B2" t="s"><v>7</v></c><c r="C2" t="s"><v>6</v></c><c r="D2"><v>3</v></c><c r="E2"><v>6</v></c><c r="F2"><v>225</v></c></row>',{extraSheet:true});
 const result=await Import.xlsx(valid,JSZip,DOMParser);
 assert.deepEqual(result.rows[0],{week:'1',day:'Monday',exercise:'Pause Bench Press',sets:'3',reps:'6',weight:'225',unit:'lb'});
 assert(result.warnings.some(s=>s.includes('first worksheet')));
 const formulas=await fixture(firstRow+'<row r="2"><c r="A2"><v>1</v></c><c r="B2" t="s"><v>7</v></c><c r="C2" t="inlineStr"><is><t>Squat &amp; Pause</t></is></c><c r="D2"><v>3</v></c><c r="E2"><v>5</v></c><c r="F2"><f>SUM(200,25)</f><v>225</v></c></row>');
 const withFormula=await Import.xlsx(formulas,JSZip,DOMParser);
 assert.equal(withFormula.rows[0].exercise,'Squat & Pause');
 assert(withFormula.warnings.some(s=>s.includes('Formula cells')));
 const missingValue=await fixture(firstRow+'<row r="2"><c r="F2"><f>SUM(200,25)</f></c></row>');
 await assert.rejects(Import.xlsx(missingValue,JSZip,DOMParser),/no saved value/);
 const badColumn=await fixture(firstRow+'<row r="2"><c r="ZZ2"><v>1</v></c></row>');
 await assert.rejects(Import.xlsx(badColumn,JSZip,DOMParser),/more than 64 columns/);
 console.log('Custom Excel ZIP import: shared strings, rich text, escaped text, cached formulas and malicious cells passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
