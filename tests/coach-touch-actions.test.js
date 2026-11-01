const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function node(){
 return {style:{},children:[],events:{},append(child){this.children.push(child);},addEventListener(type,fn,options){this.events[type]={fn,options};}};
}
const document={createElement:()=>node(),querySelector:()=>null};
let opened=0,closed=0;
const window={LoadnoteOfflinePlannerUI:{open:()=>opened++},LoadnoteCoachCompanionUI:{close:()=>closed++}};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/product/smart-coach-ui'),'utf8'),{window,document});
const host=node();
window.LoadnoteSmartCoachUI.attach(host,{actions:[{kind:'offline-plan',label:'Draft my workout',request:{kind:'daily'}}]});
const button=host.children[0].children[0];
assert.equal(button.style.touchAction,'manipulation');
const mouseDown={button:0,prevented:false,preventDefault(){this.prevented=true;}};
button.events.mousedown.fn(mouseDown);
assert.equal(mouseDown.prevented,true,'mouse press must not scroll the Coach chat away from the action');
const rightClick={button:2,prevented:false,preventDefault(){this.prevented=true;}};
button.events.mousedown.fn(rightClick);
assert.equal(rightClick.prevented,false,'context click remains native');
assert.equal(button.events.touchend,undefined,'touchend must never open a modal ahead of the native compatibility click');
assert.equal(button.events.touchstart,undefined,'touch handling must not duplicate the browser-managed click');
button.events.click.fn({detail:1});
assert.equal(opened,1,'mouse click opens one review');
button.events.click.fn({detail:1});
assert.equal(opened,2,'native tap click also opens exactly one review');
button.events.click.fn({detail:0});
assert.equal(opened,3,'keyboard activation is preserved');
assert.equal(closed,3,'each activation closes the companion before routing');
console.log('Coach action uses one native mouse/tap/keyboard click without touchend ghost activation');
