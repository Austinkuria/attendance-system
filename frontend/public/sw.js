// Import workbox from CDN
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-strategies.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-routing.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-cacheable-response.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-expiration.js',
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-background-sync.js'
);

// Wait for workbox to load
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      new Promise((resolve, reject) => {
        // Check if workbox loaded properly
        if (self.workbox) {
          console.log('Workbox loaded successfully');

          // Initialize workbox
          self.workbox.setConfig({ debug: false });

          // Set up routes after workbox is ready
          const { strategies, routing, cacheableResponse, expiration, backgroundSync } = self.workbox;

          // Cache static assets
          routing.registerRoute(
            ({ request }) => request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'image',
            new strategies.StaleWhileRevalidate({
              cacheName: 'static-resources',
              plugins: [
                new cacheableResponse.CacheableResponsePlugin({
                  statuses: [0, 200],
                }),
                new expiration.ExpirationPlugin({
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
              ],
            })
          );

          // API cache route
          routing.registerRoute(
            /^https:\/\/attendance-system-w70n\.onrender\.com\/api\/.*/,
            new strategies.NetworkFirst({
              cacheName: 'api-cache',
              plugins: [
                new cacheableResponse.CacheableResponsePlugin({
                  statuses: [0, 200],
                }),
                new expiration.ExpirationPlugin({
                  maxAgeSeconds: 24 * 60 * 60,
                  maxEntries: 50,
                }),
              ],
              networkTimeoutSeconds: 3,
            })
          );

          // Background sync for POST requests
          routing.registerRoute(
            /^https:\/\/attendance-system-w70n\.onrender\.com\/api\/.*/,
            new strategies.NetworkOnly({
              plugins: [
                new backgroundSync.BackgroundSyncPlugin('failedRequests', {
                  maxRetentionTime: 24 * 60,
                }),
              ],
            }),
            'POST'
          );

          resolve();
        } else {
          reject(new Error('Workbox failed to load'));
        }
      }),
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic fetch handler (optional caching logic can be added here)
  event.respondWith(fetch(event.request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('Service Worker skipping waiting');
    self.skipWaiting();
  }
});