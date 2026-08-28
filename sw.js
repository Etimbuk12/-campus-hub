// OX-Bridge Campus service worker
// Strategy: ALWAYS try the network first for every request, and only fall
// back to the cache when the device is offline. This guarantees that the
// moment you upload a new index.html to your server, the next time anyone
// opens the app (online) they get the new file — not a stale cached copy.
// The cache only exists as an offline fallback, never as the primary source.

const CACHE_NAME = 'oxbridge-campus-v1';
const PRECACHE_URLS = ['./index.html', './manifest.json'];

// Install: cache the basics for offline fallback, then activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: remove any old cache versions, take control of open tabs now
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first, cache as fallback (offline mode only)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});

// Let the page ask this worker to activate immediately (used by the
// "check for updates" logic in index.html)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
