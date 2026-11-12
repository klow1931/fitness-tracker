const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const projects=['mobile-chromium','mobile-webkit'];
const files=['v64-verified-history.spec.js','v4-adaptive-loop.spec.js','v41-evidence-integrity.spec.js','v42-next-session-context.spec.js'];
const listed=spawnSync(process.execPath,[path.join(path.dirname(require.resolve('playwright/package.json')),'cli.js'),'test','--config=playwright.mobile-review.config.js','--list','--reporter=json'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
assert.equal(listed.status,0,listed.stderr||listed.stdout);
const report=JSON.parse(listed.stdout),selected=[];
function visit(suites){for(const suite of suites||[]){for(const spec of suite.specs||[])for(const test of spec.tests)selected.push({file:path.basename(spec.file),project:test.projectName});visit(suite.suites);}}
visit(report.suites);
for(const project of projects)for(const file of files)assert(selected.some(test=>test.file===file&&test.project===project),project+' must actually discover '+file);
const config=require('../playwright.mobile-review.config');
const [,options]=config.reporter.find(([name])=>name.includes('mobile-review-reporter'));
const area='Verified history and adaptation evidence';
for(const file of files)assert(options.areas[area]?.includes(file),'Grouped report must map '+file+' to the training evidence area');
// Exercise the real reporter with synthetic results: evidence failures and retries
// must remain visible per profile, rather than looking like completed coverage.
const Reporter=require('../scripts/mobile-review-reporter');
const outcomes=['expected','flaky','unexpected','skipped'];
const tests=projects.flatMap(project=>files.map((file,index)=>({
 title:'Synthetic training evidence '+index,location:{file,line:1},parent:{project:()=>({name:project})},
 outcome:()=>outcomes[index],expectedStatus:'passed',
 results:index===3?[]:[{status:index===0?'passed':'failed',errors:[{message:'Synthetic evidence mismatch'}]}]
})));
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-review-')),before=process.cwd(),summary=process.env.GITHUB_STEP_SUMMARY;
try{
 process.chdir(directory);delete process.env.GITHUB_STEP_SUMMARY;
 const reporter=new Reporter(options);reporter.onBegin({projects:projects.map(name=>({name}))},{allTests:()=>tests});reporter.onEnd({status:'failed'});
 const markdown=fs.readFileSync('test-results/mobile-review.md','utf8');
 assert(markdown.includes('| '+area+' | 1 passed, 1 flaky, 1 failed, 1 skipped | 1 passed, 1 flaky, 1 failed, 1 skipped |'));
 assert(markdown.includes('**Passed on retry** · iPhone-style WebKit'));
 assert(markdown.includes('**Failed** · Android-style Chromium'));
 assert(markdown.includes('Synthetic evidence mismatch'));
}finally{
 process.chdir(before);if(summary===undefined)delete process.env.GITHUB_STEP_SUMMARY;else process.env.GITHUB_STEP_SUMMARY=summary;
 fs.rmSync(directory,{recursive:true,force:true});
}
console.log('Weekly review discovers history/adaptation cases in both mobile profiles and reports honest grouped outcomes');
