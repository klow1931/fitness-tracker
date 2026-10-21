/* Offline-only text/CSV/JSON parsing for reviewed custom program uploads. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteCustomProgramImport=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const HEADERS={week:['week','wk','training week'],day:['day','weekday','training day'],exercise:['exercise','movement','lift','exercise name'],sets:['sets','set count'],reps:['reps','repetitions','rep count'],weight:['weight','load','weight (kg)','weight (lb)','load (kg)','load (lb)'],unit:['unit','units','weight unit'],percent:['percent','percentage','intensity %','%1rm','%tm'],percentBasis:['percent basis','percentage basis','basis','max basis'],reference:['reference','reference load','reference max'],referenceUnit:['reference unit','max unit'],roundTo:['round to','rounding','plate increment'],rpe:['rpe','target rpe','effort'],rest:['rest','rest seconds','rest (sec)'],type:['type','training type'],minutes:['minutes','duration','duration (min)','cardio minutes'],notes:['notes','description']};
 const alias=Object.fromEntries(Object.entries(HEADERS).flatMap(([k,rows])=>rows.map(x=>[x,k])));
 function parseDelimited(text,separator=','){
   const rows=[];let row=[],cell='',quoted=false;const input=String(text||'').replace(/^\uFEFF/,'');
   for(let i=0;i<input.length;i++){
     const c=input[i];if(c==='"'){
       if(quoted&&input[i+1]==='"'){cell+='"';i++;}else if(!quoted&&!cell.trim()||quoted){quoted=!quoted;}else throw Error('Unexpected quote in delimited row');
     }else if(c===separator&&!quoted){row.push(cell.trim());cell='';}
     else if((c==='\n'||c==='\r')&&!quoted){row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);row=[];cell='';if(c==='\r'&&input[i+1]==='\n')i++;}
     else cell+=c;
   }
   if(quoted)throw Error('Unclosed quoted field in uploaded file');row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);
   return rows;
 }
 function fromTable(table,{source='csv',sheetName=''}={}){
   if(!Array.isArray(table)||!table.length)throw Error('No table rows found in the file');
   const head=table[0].map(x=>String(x??'').trim().toLowerCase().replace(/\s+/g,' ')),columns=head.map(h=>alias[h]||null);
   if(!['week','day','exercise'].every(k=>columns.includes(k)))throw Error('Expected header columns Week, Day and Exercise. Download or follow the Loadnote CSV format.');
   const unknownTargets=head.filter((h,i)=>h&&!columns[i]&&/\b(sets?|reps?|repetitions?|weight|loads?|rpe|rest|duration|minutes|percentage|percent|reference|rounding)\b/i.test(h));
   if(unknownTargets.length)throw Error('Unrecognized training target column(s): '+unknownTargets.join(', ')+'. Rename to the Loadnote example headers so prescriptions are not silently discarded.');
   const result=[],warnings=[];
   if(!columns.includes('type')&&(!columns.includes('sets')||!columns.includes('reps')))throw Error('Expected Sets and Reps columns for strength programs');
   if(columns.filter(Boolean).length<head.filter(Boolean).length)warnings.push('Unrecognized spreadsheet columns were ignored; check the review before saving.');
   const weightHeader=head[columns.indexOf('weight')]||'';
   for(let i=1;i<table.length;i++){
     const cells=table[i];if(!cells?.some(x=>String(x??'').trim()))continue;
     const row={};for(let k=0;k<columns.length;k++)if(columns[k])row[columns[k]]=String(cells[k]??'').trim();
     if(!row.unit&&weightHeader.includes('(kg)'))row.unit='kg';if(!row.unit&&weightHeader.includes('(lb)'))row.unit='lb';if(/^\d+(?:\.\d+)?\s*%$/.test(row.weight||'')){if(row.percent)throw Error('Row '+(i+1)+': choose a single percentage target');row.percent=row.weight.replace(/\s*%/,'');row.weight='';}
     result.push(row);
   }
   if(result.length>1500)throw Error('Uploaded program exceeds 1500 exercise rows');
   if(!result.length)throw Error('No exercise rows found after the header');
   if(sheetName)warnings.push('Imported worksheet: '+sheetName+'.');
   return {rows:result,warnings,source};
 }
 function csv(text,separator=','){return fromTable(parseDelimited(text,separator),{source:separator==='\t'?'tsv':'csv'});}
 const WEEK=/^\s*(?:week|wk)\s*#?\s*(\d{1,2})\s*[:\-–]?\s*$/i;
 const DAY=/^\s*(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs?(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*[:\-–]?\s*$/i;
 const EXERCISE=/^\s*(?:[-•*]\s*)?(.+?)\s*[:–-]?\s+(\d{1,2})\s*[x×]\s*(\d{1,2})(?!\d)(.*)$/i;
 function plainText(text){
   const raw=String(text||'').replace(/\u00a0/g,' ').split(/\r?\n/),rows=[],ignored=[];let week=1,day='';
   for(let i=0;i<raw.length;i++){
     const line=raw[i].trim();if(!line||/^#|^program\s*:/i.test(line))continue;
     const w=line.match(WEEK);if(w){week=Number(w[1]);continue;}
     const d=line.match(DAY);if(d){day=d[1];continue;}
     const e=line.match(EXERCISE);if(e&&day){
       const originalTail=e[4],range=originalTail.match(/^\s*(?:[-–—]\s*|to\s+)(\d{1,2})(?!\d)/i);
        const reps=range?e[3]+'-'+range[1]:e[3],tail=range?originalTail.slice(range[0].length):originalTail;
        if(/^\s*(?:[-–—/]\s*\d|to\s+\d|\+|[.,]\d)/i.test(tail)||/\d\s*[-–—]\s*\d+\s*(?:kg|lbs?)\b|\bAMRAP\b|(?:@|RPE|rest)\s*-\s*\d|^\s*\+\b/i.test(tail))
          throw Error('Line '+(i+1)+': unsupported AMRAP, negative load or load range. Use a fixed load or a reviewed rep range (e.g. 3x8-12). Original: '+line.slice(0,160));
        const percent=tail.match(/(?:@|\bat\b)?\s*(\d+(?:\.\d+)?)\s*(?:%|percent\b)/i);
        const load=percent?null:tail.match(/@?\s*(\d+(?:\.\d+)?)\s*(kg|lbs?)\b/i);
        const rpe=tail.match(/\bRPE\s*[:@]?\s*(\d+(?:\.\d+)?)/i),rest=tail.match(/\brest\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m)\b/i);
        let notes=tail;for(const target of [percent,load,rpe,rest])if(target)notes=notes.replace(target[0],'');
        notes=notes.replace(/^[\s,;:@|–—-]+|[\s,;|]+$/g,'').trim();
        rows.push({week,day,exercise:e[1],sets:e[2],reps,weight:load?.[1]||'',unit:load?.[2]||'',percent:percent?.[1]||'',rpe:rpe?.[1]||'',...(rest?{rest:String(Number(rest[1])*(/^m/i.test(rest[2])?60:1))}:{}),notes});
     }else ignored.push('Line '+(i+1)+': '+line.slice(0,80));
   }
   if(!rows.length)throw Error('No recognizable exercise rows. Use Week 1 / Monday headings and lines like Squat 4x5 @ 225 lb RPE 7, or import a CSV spreadsheet.');
   return {rows,source:'txt',warnings:[...(rows.some(r=>r.percent)?['Percentage rows need a confirmed training-max or tested-1RM basis, reference load, units and rounding in Studio before approval.']:[]),...(ignored.length?['Could not interpret '+ignored.length+' line(s): '+ignored.slice(0,6).join('; ')+'. Verify against your original file.']:[])]};
 }
 function json(text){
   let p;try{p=JSON.parse(text);}catch{throw Error('Invalid program JSON');}
   if(!p||p.format!=='loadnote-program-v1'||!Array.isArray(p.rows))throw Error('This is not a standalone Loadnote program JSON file. Full-app JSON backups belong in Tools → Restore, not Program Studio.');
   if(p.rows.length<1||p.rows.length>1500)throw Error('Program JSON must contain 1–1500 rows');
   return {rows:p.rows,name:p.name||'',weeks:p.weeks||null,startDate:p.startDate||'',source:'json',warnings:[]};
 }
 // Read only the cell values needed for a reviewed training table. JSZip has no
 // workbook formula evaluation, macros, or executable spreadsheet features.
 async function xlsx(bytes,JSZip,Parser){
   if(!JSZip||!Parser)throw Error('Offline Excel reader is unavailable');
   const zip=await JSZip.loadAsync(bytes);
   if(Object.keys(zip.files).length>400)throw Error('Excel file contains too many embedded parts');
   const nodes=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
   const child=(node,name)=>Array.from(node.childNodes).find(n=>n.localName===name);
   const xml=async(path,optional=false)=>{
     const part=zip.file(path);if(!part){if(optional)return null;throw Error('Excel file is missing '+path);}
     if((part._data?.uncompressedSize||0)>8*1024*1024)throw Error('Excel worksheet is too large');
     const text=await part.async('string');
     if(text.length>8*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('Unsupported or oversized Excel XML');
     const doc=new Parser().parseFromString(text,'application/xml');
     if(nodes(doc,'parsererror').length)throw Error('Invalid Excel XML in '+path);
     return doc;
   };
   const workbook=await xml('xl/workbook.xml'),rels=await xml('xl/_rels/workbook.xml.rels');
   const sheets=nodes(workbook,'sheet');if(!sheets.length)throw Error('No Excel worksheet found');
   const first=sheets[0],rid=first.getAttribute('r:id')||first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
   const relation=nodes(rels,'Relationship').find(n=>n.getAttribute('Id')===rid);
   if(!relation)throw Error('First Excel worksheet has no relationship');
   const target=relation.getAttribute('Target')||'';
   const segments=(target.startsWith('/')?target.slice(1):'xl/'+target).split('/'),normalized=[];
   for(const part of segments){if(!part||part==='.')continue;if(part==='..')normalized.pop();else normalized.push(part);}
   const sheetPath=normalized.join('/');
   if(!sheetPath.startsWith('xl/')||!sheetPath.endsWith('.xml'))throw Error('Invalid Excel worksheet path');
   const [sheet,strings]=await Promise.all([xml(sheetPath),xml('xl/sharedStrings.xml',true)]);
   const shared=strings?nodes(strings,'si').map(si=>nodes(si,'t').map(t=>t.textContent||'').join('')):[];
   const table=[],sheetRows=nodes(sheet,'sheetData').flatMap(d=>nodes(d,'row'));
   if(sheetRows.length>1502)throw Error('Uploaded program exceeds 1500 exercise rows');
   let formulaResults=false;
   for(const row of sheetRows){
     const cells=[];
     for(const c of nodes(row,'c')){
       const addr=c.getAttribute('r')||'',letters=addr.match(/^[A-Z]+/i)?.[0]?.toUpperCase();
       if(!letters)throw Error('Excel cell is missing its column address');
       const col=[...letters].reduce((v,ch)=>v*26+ch.charCodeAt(0)-64,0)-1;
       if(col>=64)throw Error('Excel table has more than 64 columns');
       const formula=child(c,'f'),value=child(c,'v')?.textContent;
       if(formula){if(value==null||value==='')throw Error('An Excel formula has no saved value. Recalculate in Excel and save again, or export CSV.');formulaResults=true;}
       const type=c.getAttribute('t');let parsed=value??'';
       if(type==='s'){const index=Number(value);if(!Number.isInteger(index)||index<0||index>=shared.length)throw Error('Invalid Excel shared string reference');parsed=shared[index];}
       else if(type==='inlineStr')parsed=nodes(c,'is').flatMap(is=>nodes(is,'t')).map(t=>t.textContent||'').join('');
       else if(type==='b')parsed=value==='1'?'TRUE':'FALSE';
       cells[col]=parsed;
     }
     if(cells.some(v=>String(v??'').trim()))table.push(cells);
   }
   const parsed=fromTable(table,{source:'xlsx',sheetName:first.getAttribute('name')||'Sheet 1'});
   if(sheets.length>1)parsed.warnings.push('Only the first worksheet was imported.');
   if(formulaResults)parsed.warnings.push('Formula cells used their saved values; formulas were not executed. Check those targets against your workbook.');
   return parsed;
 }
 function pdfItemsToText(items){
   const lines=[];for(const item of items){if(!item.str?.trim())continue;const x=item.transform?.[4]||0,y=item.transform?.[5]||0;let line=lines.find(row=>Math.abs(row.y-y)<3);if(!line){line={y,parts:[]};lines.push(line);}line.parts.push({x,str:item.str});}
   return lines.sort((a,b)=>b.y-a.y).map(l=>l.parts.sort((a,b)=>a.x-b.x).map(x=>x.str).join(' ')).join('\n');
 }
 const sample='Week,Day,Exercise,Sets,Reps,Weight,Unit,RPE,Rest,Type,Minutes,Notes\n1,Monday,Competition Squat,4,5,315,lb,7,180,strength,,\n1,Monday,Pause Bench Press,3,6,205,lb,7,150,strength,,\n1,Wednesday,Easy Cycling,,,,,, ,cardio,20,Recovery\n2,Monday,Competition Squat,4,4,325,lb,8,180,strength,,\n';
 return {parseDelimited,fromTable,xlsx,pdfItemsToText,csv,plainText,json,sample};
});
