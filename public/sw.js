// MarketMate GH - Offline PWA Service Worker
const CACHE_NAME = 'marketmate-gh-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Asset caching non-fatal notice:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for dynamic navigation, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and internal /api routes from caching
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle cross-origin requests safely
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).catch(() => {
            // Ignore offline errors for external CDNs (fonts, etc.)
            return new Response('', { status: 408, statusText: 'Offline' });
          })
        );
      })
    );
    return;
  }

  // Same-origin assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network failed and request was HTML navigation, return cached shell
          if (request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
