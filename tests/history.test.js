const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx={escapeHtml,calcVolume:()=>0,formatDate:x=>x,toDisplay:x=>x,unitLabel:()=> 'kg',formatStrengthSet:()=> '5×100kg'};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/core/ui-utils.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/product/workout-history.js'),'utf8'),ctx);
for(const id of [123,'123','a05c-uuid',"x\" onclick=\"bad()"]){
 const html=ctx.workoutHistoryCardHtml({id,date:'2026-09-07',notes:'<img src=x onerror=bad()>',exercises:[{name:'<script>bad()</script>',sets:[]}]});
 assert(!html.includes('<script>'));assert(!html.includes('<img'));assert(html.includes('data-workout-action="delete"'));assert(html.includes('data-workout-id="'+escapeHtml(id)+'"'));
}
console.log('History IDs and text escaping tests passed');
