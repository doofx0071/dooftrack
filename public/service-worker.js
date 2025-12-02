// doofTrack Service Worker
// Enables offline access and intelligent caching

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `dooftrack-static-${CACHE_VERSION}`;
const COVER_CACHE = `dooftrack-covers-${CACHE_VERSION}`;
const API_CACHE = `dooftrack-api-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-dark.png',
  '/logo-light.png',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Precaching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('dooftrack-') && 
              cacheName !== STATIC_CACHE && 
              cacheName !== COVER_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Cover Images - Stale While Revalidate
  // Serve from cache, update in background
  if (url.pathname.startsWith('/api/cover/')) {
    event.respondWith(
      caches.open(COVER_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((error) => {
            console.log('[ServiceWorker] Fetch failed for cover:', url.pathname, error);
            return cachedResponse; // Return cached if network fails
          });

          // Return cached immediately if available, otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy 2: MangaDex API - Network First with Cache Fallback
  // Try network, fall back to cache if offline
  if (url.pathname.startsWith('/api/mangadex/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful responses for 5 minutes
          if (networkResponse && networkResponse.status === 200) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[ServiceWorker] Serving API from cache (offline):', url.pathname);
              return cachedResponse;
            }
            // Return a custom offline response
            return new Response(
              JSON.stringify({ error: 'offline', message: 'You are offline and this data is not cached' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Strategy 3: Static Assets (JS, CSS, fonts) - Cache First
  // Always serve from cache if available
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'font' ||
      url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Clone the response BEFORE using it
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy 4: HTML (SPA) - Network First
  // Always try network for HTML to get latest version
  if (request.destination === 'document' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Offline: serve cached HTML
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default: Network only for everything else
  event.respondWith(fetch(request));
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('dooftrack-')) {
              console.log('[ServiceWorker] Clearing cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      })
    );
  }
});
