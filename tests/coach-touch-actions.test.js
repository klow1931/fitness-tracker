const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function node(){
 return {style:{},children:[],events:{},append(child){this.children.push(child);},addEventListener(type,fn){this.events[type]=fn;}};
}
const document={createElement:()=>node(),querySelector:()=>null};
let opened=0,closed=0;
const window={LoadnoteOfflinePlannerUI:{open:()=>opened++},LoadnoteCoachCompanionUI:{close:()=>closed++}};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/product/smart-coach-ui'),'utf8'),{window,document});
const host=node();
window.LoadnoteSmartCoachUI.attach(host,{actions:[{kind:'offline-plan',label:'Draft my workout',request:{kind:'daily'}}]});
const button=host.children[0].children[0];
assert.equal(button.style.touchAction,'manipulation');
const gesture=(id,x,y,time)=>{
 button.events.pointerdown({pointerType:'touch',pointerId:id,clientX:x,clientY:y});
 button.events.pointerup({pointerType:'touch',pointerId:id,clientX:x,clientY:y,timeStamp:time});
};
gesture(1,100,100,200);
assert.equal(opened,1,'one stationary touch must activate Coach review');
button.events.click({detail:1,timeStamp:209});
assert.equal(opened,1,'synthetic touch click must not duplicate review');
button.events.click({detail:0,timeStamp:211});
assert.equal(opened,2,'keyboard activation must remain available');
button.events.click({detail:1,timeStamp:3200});
assert.equal(opened,3,'subsequent mouse click should still activate');
button.events.pointerdown({pointerType:'touch',pointerId:2,clientX:10,clientY:10});
button.events.pointerup({pointerType:'touch',pointerId:2,clientX:100,clientY:100,timeStamp:3300});
assert.equal(opened,3,'scroll/drag release must not open a review');
button.events.pointerdown({pointerType:'touch',pointerId:3,clientX:10,clientY:10});
button.events.pointercancel();
button.events.pointerup({pointerType:'touch',pointerId:3,clientX:10,clientY:10,timeStamp:3400});
assert.equal(opened,3,'cancelled touch must not open a review');
assert.equal(closed,3,'each activation closes the companion before routing');
console.log('Coach touch/keyboard activation and synthesized-click deduplication passed');
