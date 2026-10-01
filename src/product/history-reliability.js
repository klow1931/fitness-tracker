/* v2.73 — read-only workout-history reliability and filtering.
 * Keeps duplicate detection advisory: athletes review/delete records explicitly.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./data-integrity'));
 else root.LoadnoteHistoryReliability=factory(root.LoadnoteIntegrity);
})(typeof globalThis!=='undefined'?globalThis:this,function(Integrity){
 'use strict';
 const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const norm=x=>String(x??'').trim().replace(/\s+/g,' ').toLowerCase();
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'));
 const number=x=>x==null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
 function identity(exercise){
  // Duplicate review compares what the athlete actually sees/entered. Drafts have
  // not received stable exercise IDs yet, so names keep pre-save and saved records comparable.
  return 'name:'+norm(exercise?.name);
 }
 function setShape(set){
  return {reps:number(set?.reps)||0,duration:number(set?.duration)||0,weight:number(set?.weight)||0,rpe:number(set?.rpe)};
 }
 function exerciseShape(exercise){
  return {
   name:norm(exercise?.name),
   duration:number(exercise?.duration)||0,distance:number(exercise?.distance)||0,distanceUnit:norm(exercise?.distanceUnit||''),
   avgHr:number(exercise?.avgHr),sets:(exercise?.sets||[]).map(setShape)
  };
 }
 function workoutSignature(workout){
  // Possible-duplicate review is deliberately based on visible performed content,
  // not internal IDs or planning metadata. That keeps a pre-save draft comparable
  // with the normalized saved record while remaining advisory rather than destructive.
  return JSON.stringify({
   date:workout?.date||'',notes:norm(workout?.notes),
   exercises:(workout?.exercises||[]).map(exerciseShape)
  });
 }
 function duplicateGroups(workouts){
  const groups=new Map();
  for(const workout of workouts||[]){
   if(!date(workout?.date))continue;
   const key=workoutSignature(workout),rows=groups.get(key)||[];rows.push(workout);groups.set(key,rows);
  }
  return [...groups.values()].filter(rows=>rows.length>1).map(rows=>({
   date:rows[0].date,signature:workoutSignature(rows[0]),workoutIds:rows.map(w=>String(w.id)),
   workouts:rows.map(clone),exerciseNames:[...new Set(rows.flatMap(w=>(w.exercises||[]).map(e=>e.name).filter(Boolean)))]
  })).sort((a,b)=>b.date.localeCompare(a.date)||a.workoutIds[0].localeCompare(b.workoutIds[0]));
 }
 function duplicateMatches(workouts,candidate,{excludeId}={}){
  const sig=workoutSignature(candidate);
  return (workouts||[]).filter(w=>String(w.id)!==String(excludeId??'')&&w.date===candidate?.date&&workoutSignature(w)===sig).map(clone);
 }
 function source(workout){
  if(workout?.sessionIntent?.schedule?.id)return 'scheduled';
  const type=workout?.sessionIntent?.prescription?.source?.type;
  if(type==='repeated-workout')return 'repeated';
  if(workout?.sessionIntent?.prescription)return 'planned';
  return 'manual';
 }
 function issueMap(state){
  const out=new Map(),add=(id,detail,severity='review')=>{if(!id)return;const key=String(id),rows=out.get(key)||[];rows.push({detail,severity});out.set(key,rows);};
  try{
   const audit=Integrity?.auditReliability?.(state)||null;
   for(const issue of audit?.training?.current?.issues||[])add(issue.workoutId,issue.detail,'review');
   for(const issue of audit?.relationships?.issues||[])if(issue.workoutId)add(issue.workoutId,issue.detail,issue.severity==='blocking'?'review':'warning');
  }catch{}
  for(const group of duplicateGroups(state?.workouts||[]))for(const id of group.workoutIds)add(id,'Possible duplicate: another saved workout has the same date and recorded content.','warning');
  return out;
 }
 function searchText(workout){
  return [
   workout?.date,workout?.notes,workout?.programDayName,workout?.sessionIntent?.role,workout?.sessionIntent?.goal,
   ...(workout?.exercises||[]).map(e=>e.name)
  ].map(norm).filter(Boolean).join(' ');
 }
 function filter(state,{query='',from='',to='',sourceKind='all',quality='all',sort='newest',issuesById=null}={}){
  const issues=issuesById?new Map(Object.entries(issuesById)):issueMap(state),needle=norm(query);
  let rows=(state?.workouts||[]).filter(w=>{
   if(from&&w.date<from)return false;if(to&&w.date>to)return false;
   if(needle&&!searchText(w).includes(needle))return false;
   if(sourceKind!=='all'&&source(w)!==sourceKind)return false;
   const needs=issues.has(String(w.id));
   if(quality==='review'&&!needs)return false;
   if(quality==='clear'&&needs)return false;
   return true;
  }).slice();
  rows.sort((a,b)=>(sort==='oldest'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)))||String(b.id).localeCompare(String(a.id)));
  return rows;
 }
 function inspect(state,{asOf}={}){
  const workouts=(state?.workouts||[]).filter(w=>!asOf||!date(w.date)||w.date<=asOf),issues=issueMap({...state,workouts}),dupes=duplicateGroups(workouts);
  const counts={total:workouts.length,scheduled:0,planned:0,repeated:0,manual:0,needsReview:0};
  for(const w of workouts){counts[source(w)]++;if(issues.has(String(w.id)))counts.needsReview++;}
  const lastExport=date(state?.lastExportDate)?state.lastExportDate:null;
  return {version:1,counts,duplicates:dupes,issues:Object.fromEntries([...issues].map(([id,rows])=>[id,rows])),lastExportDate:lastExport,
   backupLabel:lastExport?'Last JSON backup: '+lastExport:'No JSON backup recorded on this device',
   notice:'Possible duplicates and integrity flags are review aids. Loadnote does not delete, merge, or rewrite workout history automatically.'};
 }
 return {workoutSignature,duplicateGroups,duplicateMatches,source,issueMap,filter,inspect};
});