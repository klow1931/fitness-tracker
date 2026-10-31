/* Keep full analysis while avoiding duplicate publication into default setup. */
'use strict';
async function planUpload({eventName,requested=false,readConfiguration}){
 if(eventName==='pull_request'||eventName==='workflow_dispatch'&&!requested)return {upload:false,reason:'Full analysis is retained as SARIF artifacts for review.'};
 let configuration;
 try{configuration=await readConfiguration();}
 catch(error){
  if(![403,404].includes(error?.status))throw error;
  if(eventName==='workflow_dispatch'&&requested)return {upload:true,warning:'The workflow token cannot inspect the administrator configuration. Explicit manual upload was requested; GitHub will reject it if default setup remains active.'};
  return {upload:false,warning:'The workflow token cannot inspect default setup (administration read is unavailable). Full analysis and SARIF artifacts are retained; publication from this advanced workflow is unverified. GitHub-managed default scanning is unchanged. After switching to advanced, run this workflow manually with upload-results enabled.'};
 }
 if(configuration?.state==='not-configured')return {upload:true,reason:'Default setup is disabled; publish the advanced analysis.'};
 if(configuration?.state==='configured'){
  if(eventName==='workflow_dispatch'&&requested)throw Error('Default CodeQL setup is active. Switch to advanced before requesting an upload. Analysis publication cannot use both configurations.');
  return {upload:false,warning:'GitHub default CodeQL setup is active. It remains unchanged. This advanced workflow retains all five analyses as SARIF artifacts, without a competing upload. Switch to advanced to publish these results to Security.'};
 }
 throw Error('Unrecognized CodeQL configuration; publication policy could not be validated.');
}
module.exports={planUpload};
