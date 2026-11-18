(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-profile'));
 else root.LoadnoteProgramDesigner=factory(root.LoadnoteProgrammingProfile);
})(typeof globalThis!=='undefined'?globalThis:this,function(Profile){
 'use strict';
 const LB_PER_KG=2.2046226218;
 function unit(u){if(!['kg','lb'].includes(u))throw Error('Choose kg or lb');return u;}
 function kg(value,u){unit(u);if(String(value).trim()===''||!Number.isFinite(Number(value))||Number(value)<0)throw Error('Enter a valid non-negative load');return Number(value)/(u==='lb'?LB_PER_KG:1);}
 function display(value,u){unit(u);const n=value*(u==='lb'?LB_PER_KG:1);if(!Number.isFinite(n)||n<0)throw Error('Enter a valid non-negative load');return Number(n.toFixed(4));}
 function missing(profile){return Object.keys(Profile.EQUIPMENT).filter(k=>!profile?.context?.equipment?.includes(k));}
 function requireEquipment(profile){const keys=missing(profile);if(keys.length)throw Error('Confirm the required equipment in saved training setup: '+keys.map(k=>Profile.EQUIPMENT[k]).join(', ')+'. Your training maxes have not been changed.');}
 function equipmentError(message){return /This builder requires a barbell|Confirm the required equipment|Saving equipment access/.test(message);}
 function updateEquipment(state,revision,equipment,options){
  const current=Profile.current(state.programmingProfiles||[]);if(!current||current.id!==revision)throw Error('Training setup changed. Reopen the designer before saving equipment access.');
  const context=Profile.context({...current.context,equipment});
  if(JSON.stringify(context.equipment)===JSON.stringify(current.context.equipment))return state;
  return {...state,programmingProfiles:Profile.save(state.programmingProfiles,context,options)};
 }
 return {kg,display,missing,requireEquipment,equipmentError,updateEquipment};
});
