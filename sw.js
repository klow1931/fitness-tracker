/* Loadnote — app-shell service worker */
const CACHE = 'loadnote-v1.8.1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './energy.css',
  './app.js',
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAppShell = ASSETS.some((a) => url.pathname.endsWith(a.replace('./', '')) || url.pathname.endsWith('/'));

  if (isAppShell || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
  }
});
