/* Short original summaries of linked instruction, not personalized technique analysis. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LoadnoteMovementGuidance=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const cards=[
  {name:'Goblet Squat',setup:'Hold one dumbbell upright near your chest; begin with feet approximately shoulder width.',cues:['Keep your torso organized as you lower.','Drive through both feet to stand.'],source:'https://www.acefitness.org/resources/everyone/exercise-library/362/goblet-squat/'},
  {name:'Dumbbell Bench Press',setup:'Use a flat bench, stable foot support and assistance handling the dumbbells when needed.',cues:['Maintain stable bench contact and straight wrists.','Lower under control, then press without bouncing.'],source:'https://www.acefitness.org/resources/everyone/exercise-library/19/chest-press/'},
  {name:'Hammer Curl',setup:'Hold dumbbells with palms facing inward and a stable stance.',cues:['Keep the torso still as you bend your elbows.','Lower deliberately while keeping wrists aligned.'],source:'https://www.acefitness.org/resources/everyone/exercise-library/10/hammer-curl/'}
 ];
 function find(name){return cards.find(c=>c.name===name)||null;}
 return {find,names:()=>cards.map(c=>c.name),notice:'Educational cues, not a form assessment, diagnosis or clearance. Follow your reviewed protocol and seek qualified instruction for unfamiliar movements. External sources require internet; no videos or images are copied.'};
});
