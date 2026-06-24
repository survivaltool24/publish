const CACHE_NAME = 'survival-tool-v375';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event: cache resources & skip waiting
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate Event: clean up old caches & claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network First strategy (always fetch from network first, fall back to cache if offline)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Prevent caching non-http/https schemes (like chrome-extension://, file://, etc.)
  if (!event.request.url.startsWith('http')) return;

  const fetchOptions = {};
  // For navigation requests, bypass browser local cache to get latest index.html from server
  if (event.request.mode === 'navigate') {
    fetchOptions.cache = 'no-cache';
  }

  event.respondWith(
    fetch(event.request, fetchOptions)
      .then(response => {
        // If response is valid, update the cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed (offline), try serving from cache
        return caches.match(event.request);
      })
  );
});
