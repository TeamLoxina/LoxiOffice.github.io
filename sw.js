// LoxiOffice Service Worker — v1.0
const CACHE = 'loxioffice-v1';
const ASSETS = [
  '/LoxiOffice.github.io/',
  '/LoxiOffice.github.io/index.html',
  '/LoxiOffice.github.io/manifest.json',
];

// Install: cache shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Update cache on successful network request
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Handle file launch from OS (File Handling API)
self.addEventListener('launch', e => {
  // Handled by launchQueue in the main page
});
