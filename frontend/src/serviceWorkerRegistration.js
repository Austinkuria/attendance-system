export function register(config) {
  const isProduction = import.meta.env.MODE === 'production';
  if (isProduction && 'serviceWorker' in navigator) {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const publicUrl = new URL(baseUrl, window.location.href);

    if (publicUrl.origin !== window.location.origin) {
      console.log('Origin mismatch, skipping Service Worker registration:', {
        publicUrl: publicUrl.origin,
        currentOrigin: window.location.origin,
      });
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${baseUrl}service-worker.js`; // VitePWA generates this
      console.log('Attempting to register Service Worker at:', swUrl);

      registerValidSW(swUrl, config);
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available!');
              if (config && config.onUpdate) {
                config.onUpdate(registration); // Trigger update notification
              }
            } else {
              console.log('Content is cached for offline use.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}