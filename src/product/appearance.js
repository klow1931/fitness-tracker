/* Device-local visual preferences. No workout data, synced records or training dose changes. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.LoadnoteAppearance=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='loadnote-appearance-v1';
 const PALETTES=Object.freeze({
  indigo:'#4f46e5',ocean:'#0369a1',emerald:'#047857',
  crimson:'#be123c',amber:'#92400e',slate:'#334155'
 });
 const names=Object.keys(PALETTES);
 const validHex=value=>typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value);
 const rgb=value=>[1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
 const color=v=>'#'+v.map(n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0')).join('');
 const blend=(a,b,f)=>color(rgb(a).map((v,i)=>v*(1-f)+rgb(b)[i]*f));
 const channel=n=>{const s=n/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;};
 const luminance=hex=>rgb(hex).reduce((n,v,i)=>n+channel(v)*[0.2126,0.7152,0.0722][i],0);
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
 function accessible(input){
  if(!validHex(input))throw Error('Choose a valid six-digit color.');
  let output=input.toLowerCase();
  for(let n=0;n<24&&contrast(output,'#ffffff')<4.5;n++)output=blend(output,'#000000',0.12);
  return output;
 }
 const fallback=legacyDark=>({version:1,mode:legacyDark?'dark':'light',palette:'indigo',customColor:null});
 function normalize(raw,legacyDark=false){
  const base=fallback(legacyDark);
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return base;
  const mode=['light','dark','system'].includes(raw.mode)?raw.mode:base.mode;
  const palette=names.includes(raw.palette)||raw.palette==='custom'?raw.palette:'indigo';
  const customColor=validHex(raw.customColor)?raw.customColor.toLowerCase():null;
  return {version:1,mode,palette:palette==='custom'&&!customColor?'indigo':palette,customColor};
 }
 function tokens(palette,dark){
  const selected=palette.palette==='custom'?palette.customColor:PALETTES[palette.palette];
  const brand=accessible(selected||PALETTES.indigo),deep=blend(brand,'#000000',0.18),soft=blend(brand,'#ffffff',0.91);
  return {'--brand':brand,'--brand-deep':deep,'--accent':palette.palette==='indigo'?'#5eead4':blend(brand,'#ffffff',0.7),
   '--theme-soft':soft,'--theme-dark-soft':blend(brand,'#17213a',0.72),
   '--theme-dark-accent':blend(brand,'#ffffff',0.53),
   '--theme-focus':dark?blend(brand,'#ffffff',0.56):brand};
 }
 function create({local=()=>globalThis.localStorage,media=()=>globalThis.matchMedia?.('(prefers-color-scheme: dark)'),doc=()=>globalThis.document}={}){
  let state=null,listener=null;
  function current(legacyDark=false){
   if(!state){
    let raw=null;try{raw=JSON.parse(local()?.getItem(KEY)||'null');}catch{}
    state=normalize(raw,legacyDark);
   }
   return {...state};
  }
  function set(patch,{legacyDark=false}={}){
   if(!patch||typeof patch!=='object')throw Error('Invalid appearance selection.');
   if(patch.mode!=null&&!['light','dark','system'].includes(patch.mode))throw Error('Choose light, dark or system appearance.');
   if(patch.palette!=null&&!names.includes(patch.palette)&&patch.palette!=='custom')throw Error('Unknown color theme.');
   if(patch.customColor!=null&&!validHex(patch.customColor))throw Error('Choose a valid six-digit color.');
   const next=normalize({...current(legacyDark),...patch},legacyDark);
   if(patch.palette==='custom'&&!next.customColor)throw Error('Choose a custom color first.');
   try{const store=local();if(!store)throw Error('Storage unavailable');store.setItem(KEY,JSON.stringify(next));}
   catch{throw Error('Appearance could not be saved on this device. Your previous setting was kept.');}
   state=next;return current(legacyDark);
  }
  function reset(){
   try{const store=local();if(!store)throw Error('Storage unavailable');store.removeItem(KEY);}
   catch{throw Error('Appearance could not be reset on this device.');}
   state=fallback(false);return current();
  }
  function isDark(legacyDark=false){
   const mode=current(legacyDark).mode;
   return mode==='dark'||(mode==='system'&&!!media()?.matches);
  }
  function apply(legacyDark=false){
   const d=doc(),prefs=current(legacyDark),dark=isDark(legacyDark);
   if(d?.documentElement){
    for(const [k,v] of Object.entries(tokens(prefs,dark)))d.documentElement.style.setProperty(k,v);
    d.documentElement.style.colorScheme=dark?'dark':'light';
    d.body?.classList.toggle('dark',dark);
    const meta=d.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=dark?'#0c1326':tokens(prefs,dark)['--brand'];
   }
   return {dark,...prefs};
  }
  function listen(callback){
   if(listener)return;
   const query=media();
   if(!query)return;
   listener=()=>{if(current().mode==='system')callback();};
   if(query.addEventListener)query.addEventListener('change',listener);
   else if(query.addListener)query.addListener(listener);
  }
  return {KEY,PALETTES,current,set,reset,isDark,apply,listen,contrast,accessible,normalize,tokens};
 }
 return create();
});