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
const workflow=fs.readFileSync(path.join(root,'.github/workflows/mobile-review.yml'),'utf8');
assert(workflow.split('steps:')[0].includes('LOADNOTE_SOURCE_COMMIT: ${{ github.event.pull_request.head.sha || github.sha }}'),'All regular and repeated PR reviews must receive source identity separately from tested checkout');
const area='Verified history and adaptation evidence';
for(const file of files)assert(options.areas[area]?.includes(file),'Grouped report must map '+file+' to the training evidence area');
for(const project of projects)assert(selected.some(test=>test.file==='v78-exercise-goals.spec.js'&&test.project===project),'Discover exercise/goal acceptance in '+project);
assert(options.areas['Exercise graphs and goal journeys'].includes('v78-exercise-goals.spec.js'));
// Exercise the real reporter with synthetic results: evidence failures and retries
// must remain visible per profile, rather than looking like completed coverage.
const Reporter=require('../scripts/mobile-review-reporter');
const outcomes=['expected','flaky','unexpected','skipped'];
const tests=projects.flatMap(project=>files.map((file,index)=>({
 title:'Synthetic training evidence '+index,location:{file,line:1},parent:{project:()=>({name:project})},
 outcome:()=>outcomes[index],expectedStatus:'passed',
 results:index===3?[]:[{status:index===0?'passed':'failed',errors:[{message:'Synthetic evidence mismatch'}]}]
})));
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'loadnote-review-')),before=process.cwd(),summary=process.env.GITHUB_STEP_SUMMARY,source=process.env.LOADNOTE_SOURCE_COMMIT;
try{
 process.chdir(directory);delete process.env.GITHUB_STEP_SUMMARY;
 process.env.LOADNOTE_SOURCE_COMMIT='a'.repeat(40);
 const reporter=new Reporter(options);reporter.onBegin({projects:projects.map(name=>({name,use:{baseURL:'http://127.0.0.1:8000'}}))},{allTests:()=>tests});reporter.onEnd({status:'failed'});
 const markdown=fs.readFileSync('test-results/mobile-review.md','utf8');
 assert(markdown.includes('| '+area+' | 1 passed, 1 flaky, 1 failed, 1 skipped | 1 passed, 1 flaky, 1 failed, 1 skipped |'));
 assert(markdown.includes('**Passed on retry** · iPhone-style WebKit'));
 assert(markdown.includes('**Failed** · Android-style Chromium'));
 assert(markdown.includes('Synthetic evidence mismatch'));
 assert(markdown.includes('Source commit | '+ 'a'.repeat(40)));
 const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
 assert(markdown.includes('Tested checkout commit | '+head),'Report the actual checkout, not the PR source SHA');
 assert(markdown.includes('Tracked changes present; commit alone does not identify this run') || markdown.includes('No tracked changes'));
 assert(markdown.includes('Build | '+require('../release.json').buildNumber));
 assert(markdown.includes('http://127.0.0.1:8000'));
 assert(markdown.includes('Served-build browser profiles'));
 assert(markdown.includes('Offline acceptance is not evaluated by this report'));
 assert(markdown.includes('../playwright-report/offline-release/index.html'));
 assert(markdown.includes('not deployed-site or physical-phone acceptance'));
 // An absent target and malformed source must remain unknown, even on a green
 // regular review; separate offline evidence may be missing, failed or stale.
 process.env.LOADNOTE_SOURCE_COMMIT='not-a-commit';
 const unknown=new Reporter(options);unknown.onBegin({projects:projects.map(name=>({name,use:{}}))},{allTests:()=>[]});unknown.onEnd({status:'passed'});
 const missing=fs.readFileSync('test-results/mobile-review.md','utf8');
 assert(missing.includes('Source commit | Unavailable'));
 assert(missing.includes('Target | Not reported'));
 assert(missing.includes('No cases selected'));
 assert(missing.includes('Offline acceptance is not evaluated by this report'));
 delete process.env.LOADNOTE_SOURCE_COMMIT;
 const local=new Reporter(options);local.onBegin({projects:projects.map(name=>({name,use:{baseURL:'http://127.0.0.1:8000/?fixture=a|b'}}))},{allTests:()=>[]});local.onEnd({status:'interrupted'});
 const localReport=fs.readFileSync('test-results/mobile-review.md','utf8');
 assert(localReport.includes('Source commit | '+head),'A local review falls back to the actual checkout');
 assert(localReport.includes('Browser run **interrupted**'));
 assert(localReport.includes('fixture=a\\|b'),'Provenance must not break the Markdown table');
}finally{
 process.chdir(before);if(summary===undefined)delete process.env.GITHUB_STEP_SUMMARY;else process.env.GITHUB_STEP_SUMMARY=summary;
 if(source===undefined)delete process.env.LOADNOTE_SOURCE_COMMIT;else process.env.LOADNOTE_SOURCE_COMMIT=source;
 fs.rmSync(directory,{recursive:true,force:true});
}
console.log('Weekly review discovers history/adaptation cases in both mobile profiles and reports honest grouped outcomes');

for(const project of projects)assert(selected.some(test=>test.file==='v781-simple-home.spec.js'&&test.project===project),'Discover touch preference regression in '+project);
assert(options.areas['Accessibility and layout'].includes('v781-simple-home.spec.js'));

for(const project of projects)assert(selected.some(test=>test.file==='v79-focused-home.spec.js'&&test.project===project),'Discover useful Simple Home actions in '+project);
assert(options.areas['Onboarding and first workout'].includes('v79-focused-home.spec.js'));

for(const project of projects)assert(selected.some(test=>test.file==='v710-ui-flow.spec.js'&&test.project===project),'Discover flow, goals, pins and keyboard regressions in '+project);

for(const project of projects)assert(selected.some(test=>test.file==='v711-program-designer.spec.js'&&test.project===project),'Discover equipment recovery, lb entry and beginner designer regressions in '+project);
