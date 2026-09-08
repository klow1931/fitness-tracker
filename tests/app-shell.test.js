const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs');
for(const id of ['panel-dashboard','panel-workouts','panel-calendar','panel-prs','panel-coach','panel-tools','exercise-rows','wo-date','wo-notes','logger-draft-status'])assert(ids.includes(id),'Missing '+id);
const scripts=[...html.matchAll(/<script src="([^":]+)"/g)].map(m=>m[1]);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const script of scripts){assert(fs.existsSync(path.join(root,script)),script);assert(sw.includes("'./"+script+"'"),'Not cached: '+script);}
assert(scripts.indexOf('src/product/draft-model.js')<scripts.indexOf('src/product/workout-logger.js'));
assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,'1.5.1');
console.log('App shell, version, script-order, and cached-module tests passed');
