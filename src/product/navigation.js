/* Session-local navigation state. No workout/nutrition schema changes. */
const LoadnoteNavigation={active:null,sub:{workouts:'wo-log',nutrition:'nu-today',coach:'co-programs'},scroll:{},revision:0,rendered:{},frame:0,metrics:{renders:0,skips:0}};
function invalidateViews() { LoadnoteNavigation.revision++; }
function navigationKey(panel) {return panel+':'+(LoadnoteNavigation.sub[panel] || 'main');}
function renderVisibleView(panel,sub) {
  const nav=LoadnoteNavigation,key=panel+':'+(sub || 'main');
  // Draft persistence is separate from saved training data. Home must refresh
  // after logger edits/clears even when the data revision did not change.
  const draftStamp=panel==='dashboard'?(readLoggerDraft()?.updatedAt||'none'):'';
  const stamp=nav.revision+':'+today()+':'+(panel==='nutrition'?document.getElementById('nu-date').value:'')+':'+draftStamp;
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
  else if(panel==='prs'){renderPRs();window.renderProgressAnalytics?.();window.renderTrainingReview?.();}
  else if(panel==='measures')renderMeasures();
  else if(panel==='photos')renderPhotos();
  else if(panel==='coach')renderCoach();
  else if(panel==='profile')window.renderProfileHub?.();
  else if(panel==='tools'){updateStorageInfo();window.renderDataIntegrityTools?.();}
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
  for(const panel of ['dashboard','calendar','workouts','nutrition','prs','measures','photos','coach','profile','tools']) {
    document.getElementById('panel-'+panel)?.classList.toggle('hidden',panel!==name);
    const tab=document.getElementById('tab-'+panel);if(tab){tab.classList.toggle('nav-active',panel===name);tab.setAttribute('aria-pressed',String(panel===name));}
  }
  const desktopMore=document.getElementById('desktop-more');
  desktopMore?.classList.toggle('nav-active',!['dashboard','workouts','prs','coach','profile'].includes(name));
  if(desktopMore && !['dashboard','workouts','prs','coach','profile'].includes(name))desktopMore.open=false;
  document.querySelectorAll('.mobile-nav-btn').forEach(btn=>{
    const selected=btn.dataset.tab===name;
    btn.classList.toggle('nav-active',selected);btn.setAttribute('aria-pressed',String(selected));
  });
  if(nav.sub[name])navigateSubTab(name,nav.sub[name],true);else renderVisibleView(name);
  if(changed) {section.classList.add('view-enter');section.tabIndex=-1;section.focus({preventScroll:true});}
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

/* v2.76 — calm information hierarchy. Presentation only: existing data,
 * handlers and secondary feature surfaces stay intact and directly reachable
 * from Profile. */
function initCalmNavigation(){
  if(document.body?.dataset.calmNavigation==='2.76')return;
  document.body.dataset.calmNavigation='2.76';
  const style=document.createElement('style');
  style.id='calm-navigation-style';
  style.textContent=`
    [data-calm-hidden="true"]{display:none!important}
    .calm-home-secondary{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem}
    .calm-home-secondary>.card{margin:0}
    #today-training{border-width:1px;box-shadow:0 8px 28px #18234410}
    .calm-home-secondary #program-lifecycle-home,.calm-home-secondary #athlete-home-command{box-shadow:none}
    #home-details>summary,#home-week-plan>summary{min-height:56px;padding:.25rem 0;cursor:pointer}
    #home-details>summary small,#home-week-plan>summary small{display:block;margin-top:.2rem;color:var(--muted);font-weight:400}
    .calm-secondary-card{box-shadow:none!important;border-style:dashed!important}
    .calm-advanced-programming{margin-top:1rem}
    .calm-advanced-programming>summary{cursor:pointer;min-height:48px;display:flex;align-items:center;font-weight:700}
    .calm-advanced-programming-body{display:grid;gap:1rem;margin-top:1rem}
    .desktop-tabs{margin-left:auto}
    @media(min-width:800px){.calm-home-secondary{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);
  const hide=el=>{if(el){el.dataset.calmHidden='true';el.setAttribute('aria-hidden','true');}};
  hide(document.getElementById('dark-toggle'));hide(document.getElementById('gym-mode-btn'));hide(document.getElementById('unit-kg')?.parentElement);
  const dashboard=document.getElementById('panel-dashboard'),today=document.getElementById('today-training'),program=document.getElementById('program-lifecycle-home'),command=document.getElementById('athlete-home-command');
  if(dashboard&&today&&program&&command&&!document.getElementById('calm-home-secondary')){const secondary=document.createElement('div');secondary.id='calm-home-secondary';secondary.className='calm-home-secondary';today.after(secondary);secondary.append(program,command);}
  hide(document.getElementById('start-here-card'));hide(document.getElementById('stat-protein')?.closest('.card'));hide(document.getElementById('nutritionChart')?.closest('.card'));
  const empty=document.getElementById('home-empty');
  if(empty){
    const direct=[...empty.querySelectorAll('button')];
    for(const button of direct){const action=button.getAttribute('onclick')||'';if(action.includes("showTab('nutrition')")||action.includes("showTab('tools')"))hide(button);if(action.includes("showTab('coach')")){const detail=button.querySelector('.block.text-xs');if(detail)detail.textContent='Ask about programming, progression or deloads';}}
    const paragraphs=[...empty.querySelectorAll(':scope > p')];if(paragraphs[1])paragraphs[1].textContent='Start with your first training session. Progress, trends and adaptive guidance fill in as you log workouts.';const tip=paragraphs.at(-1);if(tip)tip.innerHTML='Preferences such as units, appearance and Gym mode live in <b>Profile</b>.';
  }
  const more=document.getElementById('home-details');if(more){more.open=false;const bold=more.querySelector(':scope > summary b'),small=more.querySelector(':scope > summary small');if(bold)bold.textContent='Training insights & history';if(small)small.textContent='Reports, trends, records and supporting evidence';}
  const week=document.getElementById('home-week-plan');if(week)week.open=false;
  document.getElementById('training-review')?.classList.add('calm-secondary-card');document.getElementById('pr-entry')?.classList.add('calm-secondary-card');
  const coach=document.getElementById('panel-coach');
  if(coach&&!coach.querySelector('.calm-advanced-programming')){
    const legacy=[...coach.querySelectorAll('.card')].filter(card=>{const title=card.querySelector('h2')?.textContent.trim()||'';return title==='Legacy generator selection'||title==='Legacy program library';});
    if(legacy.length){const details=document.createElement('details');details.className='card calm-advanced-programming';details.innerHTML='<summary>Advanced programming <span class="more-hint">Legacy generator and library</span></summary><div class="calm-advanced-programming-body"></div>';legacy[0].before(details);const body=details.querySelector('.calm-advanced-programming-body');for(const card of legacy)body.append(card);}
  }
  const footer=document.getElementById('app-version');if(footer)footer.textContent='Loadnote web v2.84.0 · local-first training log';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCalmNavigation,{once:true});else initCalmNavigation();
document.addEventListener('click',event=>{const menu=document.getElementById('desktop-more');if(menu?.open&&!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.getElementById('desktop-more');if(menu?.open){menu.open=false;menu.querySelector('summary')?.focus();}}});
