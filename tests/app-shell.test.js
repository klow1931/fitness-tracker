const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs');
for(const id of ['panel-dashboard','panel-workouts','panel-calendar','panel-prs','panel-coach','panel-profile','panel-tools','exercise-rows','wo-date','wo-notes','logger-draft-status','app-version'])assert(ids.includes(id),'Missing '+id);
const scripts=[...html.matchAll(/<script src="([^":]+)"/g)].map(m=>m[1]);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const script of scripts){assert(fs.existsSync(path.join(root,script)),script);assert(sw.includes("'./"+script+"'"),'Not cached: '+script);}
assert(scripts.indexOf('src/product/draft-model.js')<scripts.indexOf('src/product/workout-logger.js'));
for(const dependency of ['session-intent','schedule','phase-builder','meet-cycle','programming-profile','athlete-intake','coach-support'])assert(scripts.indexOf('src/product/'+dependency+'.js')<scripts.indexOf('src/product/accessory-review.js'),'Accessory review must load after '+dependency);
assert(scripts.indexOf('src/product/accessory-review.js')<scripts.indexOf('src/product/coach-conversation.js'));
for(const dependency of ['accessory-review','coach-support','session-intent','schedule'])assert(scripts.indexOf('src/product/'+dependency+'.js')<scripts.indexOf('src/product/accessory-follow-up.js'),'Accessory follow-up must load after '+dependency);
assert(scripts.indexOf('src/product/accessory-follow-up.js')<scripts.indexOf('src/product/coach-conversation.js'));
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
const navigation=fs.readFileSync(path.join(root,'src/product/navigation.js'),'utf8');
assert(navigation.includes(`Loadnote web v${version} ·`),'Rendered footer version drift');
assert(sw.includes(`const CACHE = 'loadnote-v${version}';`),'Cache version drift');
const shortVersion=version.replace(/\.0$/,'');
const releaseNote=path.join(root,'docs',`releases-v${shortVersion}.md`);
assert(fs.existsSync(releaseNote),'Missing versioned release notes');
assert(fs.readFileSync(releaseNote,'utf8').startsWith(`# Loadnote v${version}`),'Release-note version drift');
console.log('App shell, version, script-order, cached-module, and release-note tests passed');

for(const name of ['coach-turn-context','workout-brief']){assert(html.indexOf('src/product/'+name+'.js')>html.indexOf('src/product/coach-support.js'));assert(html.indexOf('src/product/'+name+'.js')<html.indexOf('src/product/coach-conversation.js'));}

for(const dependency of ['schedule','program-lifecycle','decision-readiness','weekly-evidence','cycle-review','cycle-adaptive-controller','cycle-response','adaptive-outcome-learning','primary-follow-up','coach-support'])assert(scripts.indexOf('src/product/'+dependency+'.js')<scripts.indexOf('src/product/weekly-coaching.js'),'Weekly coaching must load after '+dependency);
assert(scripts.indexOf('src/product/weekly-coaching.js')<scripts.indexOf('src/product/coach-conversation.js'));
