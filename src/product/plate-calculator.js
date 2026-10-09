(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnotePlateCalculator=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function calculate(target,bar,unit='kg'){
  if(!['kg','lb'].includes(unit)||![target,bar].every(Number.isFinite)||target<0||bar<=0||target>10000)throw Error('Enter a valid target and positive bar weight.');
  if(target<bar)throw Error('Target is less than bar weight.');
  const inventory=unit==='lb'?[45,35,25,10,5,2.5]:[25,20,15,10,5,2.5,1.25];
  const perSide=(target-bar)/2,plates=[];let remaining=perSide;
  for(const plate of inventory){const count=Math.floor((remaining+1e-8)/plate);if(count)plates.push({plate,count});remaining=Math.max(0,remaining-count*plate);}
  return {unit,perSide,plates,remainder:Math.round(remaining*10000)/10000,loaded:target-remaining*2};
 }
 return {calculate};
});
