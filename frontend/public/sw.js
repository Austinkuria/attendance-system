self.addEventListener('install', () => {
    console.log('Service Worker installing');
    self.skipWaiting();
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