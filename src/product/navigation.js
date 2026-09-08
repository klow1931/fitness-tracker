/* Session-local navigation state. No workout/nutrition schema changes. */
const LoadnoteNavigation={active:null,sub:{workouts:'wo-log',nutrition:'nu-today',coach:'co-insights'},scroll:{},revision:0,rendered:{},frame:0,metrics:{renders:0,skips:0}};
function invalidateViews() { LoadnoteNavigation.revision++; }
function navigationKey(panel) {return panel+':'+(LoadnoteNavigation.sub[panel] || 'main');}
function renderVisibleView(panel,sub) {
  const nav=LoadnoteNavigation,key=panel+':'+(sub || 'main');
  const stamp=nav.revision+':'+today()+':'+(panel==='nutrition'?document.getElementById('nu-date').value:'');
  if(nav.rendered[key]===stamp){nav.metrics.skips++;return;}
  const start=performance.now();
  if(panel==='dashboard')renderDashboard();
  else if(panel==='calendar')renderCalendar();
  else if(panel==='workouts' && sub==='wo-history')renderWorkoutHistory();
  else if(panel==='workouts' && sub==='wo-templates')renderTemplates();
  else if(panel==='nutrition') {
    if(sub==='nu-today')loadDayFoods();
    if(sub==='nu-add') {loadDayFoods();searchFoodLibrary();}
    if(sub==='nu-library')renderFoodLibrary();
    if(sub==='nu-history')renderNutritionHistory();
  }
  else if(panel==='prs')renderPRs();
  else if(panel==='measures')renderMeasures();
  else if(panel==='photos')renderPhotos();
  else if(panel==='coach')renderCoach();
  else if(panel==='tools')updateStorageInfo();
  nav.rendered[key]=stamp;nav.metrics.renders++;nav.metrics.lastRenderMs=performance.now()-start;
}
function restoreViewPosition(panel) {
  const nav=LoadnoteNavigation,key=navigationKey(panel);
  cancelAnimationFrame(nav.frame);
  nav.frame=requestAnimationFrame(()=>{
    if(nav.active!==panel)return;
    window.scrollTo({top:nav.scroll[key] || 0,behavior:'instant'});
  });
}
function navigateTab(name) {
  const nav=LoadnoteNavigation,section=document.getElementById('panel-'+name);
  if(!section)return;
  if(nav.active)nav.scroll[navigationKey(nav.active)]=window.scrollY;
  const changed=nav.active!==name;
  nav.active=name;
  for(const panel of ['dashboard','calendar','workouts','nutrition','prs','measures','photos','coach','tools']) {
    document.getElementById('panel-'+panel)?.classList.toggle('hidden',panel!==name);
    const tab=document.getElementById('tab-'+panel);if(tab){tab.classList.toggle('nav-active',panel===name);tab.setAttribute('aria-pressed',String(panel===name));}
  }
  document.querySelectorAll('.mobile-nav-btn').forEach(btn=>{
    const selected=btn.dataset.tab===name || btn.dataset.tab==='more'&&!['dashboard','workouts','nutrition','coach'].includes(name);
    btn.classList.toggle('nav-active',selected);btn.setAttribute('aria-pressed',String(selected));
  });
  if(nav.sub[name])navigateSubTab(name,nav.sub[name],true);else renderVisibleView(name);
  if(changed) {
    section.classList.add('view-enter');
    section.tabIndex=-1;section.focus({preventScroll:true});
  }
  applyGymMode();updateBackupBanner();restoreViewPosition(name);
}
function navigateSubTab(panel,sub,fromTab=false) {
  const nav=LoadnoteNavigation;
  const target=document.querySelector('.sub-panel[data-panel="'+panel+'"][data-sub="'+sub+'"]');
  if(!target)return;
  if(!fromTab && nav.active===panel)nav.scroll[navigationKey(panel)]=window.scrollY;
  nav.sub[panel]=sub;
  document.querySelectorAll('.sub-panel[data-panel="'+panel+'"]').forEach(el=>el.classList.toggle('hidden',el.dataset.sub!==sub));
  document.querySelectorAll('#panel-'+panel+' .section-tab').forEach(btn=>{btn.classList.toggle('active',btn.dataset.sub===sub);btn.setAttribute('aria-selected',String(btn.dataset.sub===sub));});
  renderVisibleView(panel,sub);
  if(!fromTab && nav.active===panel)restoreViewPosition(panel);
}
function updateFoodEntrySummary() {
  const node=document.getElementById('food-entry-summary');if(!node)return;
  const t=sumDayFoods(dayFoods);
  node.textContent=(document.getElementById('nu-date').value || today())+' · '+(t.calories ?? 'Unknown')+' kcal · '+(t.protein ?? 'Unknown')+'g protein · '+dayFoods.length+' foods';
}
