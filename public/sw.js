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
  self.clients.claim(); // Take control immediately
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
          } else if (event.request.url.includes('/api/')) {
            queueRequest(event.request);
            return new Response(JSON.stringify({ error: 'Offline, request queued' }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return caches.match(event.request) || new Response('No internet connection', { status: 503 });
        });
      })
    );
  } else if (event.request.method === 'POST' || event.request.method === 'PUT') {
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
  } else if (event.data.action === 'checkConnectivity') {
    checkConnectivity();
  }
});

// Queue for offline requests
let requestQueue = [];

function queueRequest(request) {
  requestQueue.push(request);
  saveQueue();
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: 'offline', message: 'Went offline, requests queued.' }));
  });
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
              self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({ type: 'online', message: 'Back online, data synced.' }));
              });
            }
          }).catch(error => console.error('Sync failed for request:', error));
        }));
      })
    );
  }
});

function checkConnectivity() {
  fetch('https://www.google.com', { mode: 'no-cors' }).then(() => {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'online', message: 'Connection restored.' }));
    });
    self.registration.sync.register('sync-queued-requests').catch(error => console.error('Sync registration failed:', error));
  }).catch(() => {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'offline', message: 'No internet connection.' }));
    });
  });
}

// Check connectivity on activation and periodically
self.addEventListener('activate', () => checkConnectivity());
setInterval(checkConnectivity, 5000); // Check every 5 seconds