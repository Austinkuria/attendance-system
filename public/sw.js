const CACHE_NAME = 'attendance-system-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch(error => console.error('Cache installation failed:', error))
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    )).catch(error => console.error('Cache cleanup failed:', error))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(error => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          } else if (event.request.url.includes('/api/')) { // Assume API calls for MongoDB
            queueRequest(event.request);
            return new Response(JSON.stringify({ error: 'Offline, request queued' }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return caches.match(event.request);
        });
      })
    );
  } else if (event.request.method === 'POST' || event.request.method === 'PUT') { // For API calls
    event.respondWith(
      fetch(event.request).catch(error => {
        queueRequest(event.request);
        return new Response(JSON.stringify({ error: 'Offline, request queued' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  } else if (event.data.action === 'checkForUpdates') {
    self.skipWaiting().then(() => self.clients.claim());
  }
});

// Queue for offline requests
let requestQueue = [];

function queueRequest(request) {
  requestQueue.push(request);
  saveQueue();
}

function saveQueue() {
  caches.open('request-queue').then(cache => {
    cache.put('queued-requests', new Response(JSON.stringify(requestQueue)));
  });
}

function loadQueue() {
  return caches.open('request-queue').then(cache => {
    return cache.match('queued-requests').then(response => {
      if (response) return response.json();
      return [];
    });
  });
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-queued-requests') {
    event.waitUntil(
      loadQueue().then(queuedRequests => {
        return Promise.all(queuedRequests.map(request => {
          return fetch(request.clone()).then(response => {
            if (response.ok) {
              requestQueue = requestQueue.filter(r => r.url !== request.url);
              saveQueue();
            }
          }).catch(error => console.error('Sync failed for request:', error));
        }));
      })
    );
  }
});

// Check for connectivity and sync when online
self.addEventListener('online', () => {
  self.registration.sync.register('sync-queued-requests').catch(error => console.error('Sync registration failed:', error));
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: 'online', message: 'Back online, syncing data...' }));
  });
});

// Notify about updates
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
  self.registration.showNotification('Update Available', {
    body: 'A new version of the app is available. Please refresh to update.',
    icon: '/icon-192x192.png',
    actions: [{ action: 'refresh', title: 'Refresh Now' }]
  });
});