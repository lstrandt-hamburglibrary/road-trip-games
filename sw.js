// Service Worker for Road Trip Games
const VERSION = '1.35.1';
const CACHE_NAME = `roadtrip-v${VERSION}`;
const BYPASS_CACHE = true; // Always bypass cache to ensure updates are seen

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
  // Game files are NOT pre-cached - always fetch fresh when online
];

// Install service worker
self.addEventListener('install', event => {
  console.log('Installing service worker version:', VERSION);
  // Force new service worker to activate immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch from cache when offline
self.addEventListener('fetch', event => {
  // For HTML and JS files, always fetch fresh to check for updates
  if (event.request.url.includes('.html') || event.request.url.includes('.js') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only use cache as fallback when offline
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch new
        if (response && !BYPASS_CACHE) {
          return response;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response because it can only be used once
          const responseToCache = response.clone();

          // Cache the new resource
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Return offline fallback if available
          return caches.match('./index.html');
        });
      })
  );
});

// Clean up old caches and notify clients
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== CACHE_NAME;
          }).map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control of all clients immediately
      clients.claim()
    ]).then(() => {
      // Notify all clients about the update
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: VERSION
          });
        });
      });
    })
  );
});
