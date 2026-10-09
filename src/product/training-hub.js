/* Read-only athlete journey. Existing lifecycle and review policies own changes. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./programming-workspace'),require('./today-training'),require('./program-lifecycle'),require('./weekly-coaching'),require('./training-week'));
 else root.LoadnoteTrainingHub=factory(root.LoadnoteProgrammingWorkspace,root.LoadnoteTodayTraining,root.LoadnoteProgramLifecycle,root.LoadnoteWeeklyCoaching,root.LoadnoteTrainingWeek);
})(typeof globalThis!=='undefined'?globalThis:this,function(Workspace,Today,Lifecycle,Weekly,Week){
 'use strict';
 function inspect(state,{asOf,now=new Date().toISOString(),draft=null,sportDraft=false}={}){
  const today=Today.inspect(state,{day:asOf,draft}),planner=Workspace.route(state,{asOf});
  const lifecycle=Lifecycle.inspect(state,{asOf,draft,draftOpen:today.openDraft||sportDraft});
  const weekly=Weekly.review(state,{asOf,now});
  const logs=(state.workouts||[]).filter(w=>w.date<=asOf),hasPlan=planner.status==='scheduled';
  const steps=[
   {key:'setup',label:'Your training setup',done:!!planner.profile,detail:planner.profile?planner.profile.goalLabel+' · '+planner.profile.sessionMinutes+' min':'Goal, days and equipment'},
   {key:'plan',label:'Your training plan',done:hasPlan,detail:hasPlan?'Scheduled in Calendar':'Review a supported plan, or log your own training'},
   {key:'train',label:'Your first saved workout',done:logs.length>0,detail:logs.length?'Saved locally; completion does not prove all targets were met':'Record actual sets, load and effort'}
  ];
  let primary;
  if(today.openDraft||sportDraft)primary={kind:'resume',label:'Resume workout',detail:'Protect your unfinished session before starting something new.'};
  else if(lifecycle.nextAction?.kind&& !['no-program','error'].includes(lifecycle.nextAction.kind))primary={kind:'lifecycle',label:lifecycle.nextAction.label,detail:lifecycle.nextAction.detail};
  else if(today.active)primary={kind:'train',label:'Train today',detail:today.active.name};
  else if(!planner.profile)primary={kind:'setup',label:'Set up training',detail:'Save your defaults once. No account is required.'};
  else if(!hasPlan)primary={kind:'plan',label:'Continue your plan',detail:planner.title};
  else primary={kind:'train',label:'Open Train',detail:today.summary};
  if(lifecycle.nextAction?.kind==='error')primary={kind:'resolve',label:'Review program status',detail:lifecycle.nextAction.detail};
  let review;
  if(weekly.status==='ready')review={label:'Review week '+weekly.week,detail:weekly.proposal.label,available:true};
  else if(weekly.status==='waiting')review={label:'Weekly review',detail:'Available after the program week ends '+weekly.through,available:false};
  else if(weekly.status==='unsupported')review={label:'Open program review',detail:'Use the dedicated '+(weekly.program.kind==='sport-program'?'sport':'hypertrophy')+' review.',available:true};
  else if(weekly.status==='ambiguous')review={label:'Choose a program to review',detail:'Overlapping programs are reviewed separately.',available:true};
  else review={label:'Weekly review',detail:weekly.status==='invalid'?'Evidence needs review; no change is proposed.':hasPlan?'This program uses its dedicated review; inspect planned and recorded work in Calendar and training history. Automatic weekly changes are not supported for every program type.':'Schedule a supported program to connect planned and recorded work.',available:weekly.status==='invalid'};
  return {steps,primary,review,planner,lifecycle,weeklyStatus:weekly.status,started:logs.length>0,week:Week.inspect(state,{asOf,now})};
 }
 return {inspect};
});
