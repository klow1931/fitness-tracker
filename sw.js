/* Loadnote — app-shell service worker */
const CACHE = 'loadnote-v1.9.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './energy.css',
  './app.js',
  './assets/tailwind.css',
  './assets/chart.umd.js',
  './src/product/app-lifecycle.js',
  './src/core/ui-utils.js',
  './src/product/navigation.js',
  './src/product/home-activity.js',
  './src/product/nutrition-model.js',
  './src/product/nutrition-ui.js',
  './src/product/nutrition-forms.js',
  './src/product/state-store.js',
  './src/product/units.js',
  './src/product/workout-form.js',
  './src/product/workout-templates.js',
  './src/product/rest-timer.js',
  './src/product/training-flow.js',
  './src/product/data-transfer.js',
  './src/product/workout-events.js',

  './src/product/workout-session.js',
  './src/product/progress-model.js',
  './src/product/progress-ui.js',
  './src/product/session-ui.js',
  './src/product/workout-history.js',
  './src/product/persistence.js',
  './src/product/draft-model.js',
  './src/programming-mesocycle.js',
  './src/programming-adaptive.js',
  './src/programming-athlete.js',
  './src/release.js',
  './src/product/workout-logger.js',
  './src/core/loadnote-core.js',
  './src/training/exercises.js',
  './src/training/analytics.js',
  './src/training/progression.js',
  './src/training/fatigue.js',
  './src/training/adaptive.js',
  './src/coach/coach-engine.js',

  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

const SCOPE = self.registration.scope;
const assetURLs = new Set(ASSETS.map(path => new URL(path, SCOPE).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('message', event => {
  if(event.data?.type !== 'APPLY_UPDATE')return;
  event.waitUntil((async()=>{
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const appClients=clients.filter(client=>client.url.startsWith(SCOPE));
    if(appClients.length>1){event.source?.postMessage({type:'UPDATE_BLOCKED'});return;}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  // Retain previous release caches for still-open pages; do not delete unrelated caches.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);url.hash='';url.search='';
  if(url.origin!==self.location.origin||!assetURLs.has(url.href))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(url.href);
    if(cached)return cached;
    return fetch(req);
  }));
});
