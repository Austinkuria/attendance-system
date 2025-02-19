export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener('load', () => {
      const swUrl = '/sw.js';
      if (isLocalhost) checkValidServiceWorker(swUrl, config);
      else registerValidSW(swUrl, config);
    });

    // Periodically check for updates
    setInterval(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.update();
        });
      }
    }, 1000 * 60 * 60); // Check every hour
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker.register(swUrl).then(registration => {
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            showUpdateNotification(registration, config);
          } else {
            console.log('Content cached for offline use.');
            if (config && config.onSuccess) config.onSuccess(registration);
          }
        }
      };
    };
  }).catch(error => console.error('Service worker registration failed:', error));
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { cache: 'no-cache' }).then(response => {
    if (response.status === 404 || !response.headers.get('content-type')?.includes('javascript')) {
      navigator.serviceWorker.ready.then(registration => {
        registration.unregister().then(() => window.location.reload()).catch(error => console.error('Unregistration failed:', error));
      });
    } else {
      registerValidSW(swUrl, config);
    }
  }).catch(error => {
    console.log('Network error checking service worker. Running online:', error);
    registerValidSW(swUrl, config);
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister().catch(error => console.error('Service worker unregistration failed:', error));
    });
  }
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' || 
  window.location.hostname === '[::1]' || 
  /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(window.location.hostname)
);

function showUpdateNotification(registration, config) {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        registration.showNotification('Update Available', {
          body: 'A new version of the app is available. Please refresh to update.',
          icon: '/icon-192x192.png',
          actions: [{ action: 'refresh', title: 'Refresh Now' }]
        });
      }
    });
  }

  if (config && config.onUpdate) config.onUpdate(registration);
}