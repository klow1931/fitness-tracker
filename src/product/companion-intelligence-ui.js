/* v2.83 — browser adapter for deterministic Companion intelligence.
 * Enriches the existing bounded Companion context without changing the logger,
 * Decisions policy or Coach mutation permissions.
 */
(function(){
 'use strict';
 const Base=window.LoadnoteCoachCompanion,Intelligence=window.LoadnoteCompanionIntelligence;
 if(!Base||!Intelligence||Base.__intelligenceWrapped)return;
 const originalBuild=Base.buildContext.bind(Base),originalOffline=Base.offlineReply.bind(Base);
 let cacheKey='',cache=null;
 function appState(){try{return typeof data!=='undefined'?data:null;}catch{return null;}}
 function draft(){try{return typeof readLoggerDraft==='function'?readLoggerDraft():null;}catch{return null;}}
 function localDay(){try{if(typeof today==='function')return today();}catch{}return new Date().toISOString().slice(0,10);}
 function stateStamp(state){
  if(!state)return 'none';
  const reviews=(state.phaseReviews||[]).length+(state.meetCycles||[]).reduce((n,c)=>n+(c.weeklyReviews||[]).length,0);
  const recent=(state.workouts||[]).slice(0,6).map(w=>String(w.updatedAt||w.createdAt||w.date||'')).join(',');
  return [(state.workouts||[]).length,(state.scheduledSessions||[]).length,(state.phasePrograms||[]).length,(state.meetCycles||[]).length,reviews,recent].join(':');
 }
 function snapshot(context){
  const state=appState();if(!state)return null;const d=draft(),sport=window.LoadnoteSportPlannerUI?.liveContext?.()||null,asOf=localDay(),exercise=context?.liveWorkout?.currentExercise?.name||'';
  const stamp=[asOf,exercise,window.LoadnoteCoachingContext?.signature(state)||stateStamp(state),JSON.stringify(d),JSON.stringify(sport),JSON.stringify(context?.liveWorkout)].join('|');
  if(stamp===cacheKey)return cache;
  try{cache=Intelligence.build(state,{asOf,liveWorkout:context?.liveWorkout||null,draft:d});cache.shared=window.LoadnoteCoachingContext?.build(state,{asOf,live:context,sportLive:sport})||null;cacheKey=stamp;return cache;}catch{cache=null;cacheKey=stamp;return null;}
 }
 Base.buildContext=function(input){
  const context=originalBuild(input),intelligence=snapshot(context);
  if(!intelligence)return context;
  const {shared,...evidence}=intelligence;
  return {...context,intelligence:evidence,sportWorkout:window.LoadnoteSportPlannerUI?.liveContext?.()||null,coaching:shared,capabilities:{...(context.capabilities||{}),trainingIntelligenceRead:true}};
 };
 Base.offlineReply=function(context,question){return originalOffline(context,question)||Intelligence.answer(context?.intelligence||snapshot(context),question);};
 Base.__intelligenceWrapped=true;
 window.LoadnoteCompanionIntelligenceUI={snapshot:()=>snapshot(originalBuild({surface:'other'})),forContext:snapshot,clearCache:()=>{cacheKey='';cache=null;}};
})();
