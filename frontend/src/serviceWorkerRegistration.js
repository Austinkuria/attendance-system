export function register(config) {
  const isProduction = import.meta.env.MODE === 'production';
  if (isProduction && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';
      navigator.serviceWorker.register(swUrl).then((registration) => {
        console.log('Service Worker registered:', registration);
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New update found');
              if (config && config.onUpdate) config.onUpdate(registration);
            }
          };
        };
        if (config && config.onSuccess) config.onSuccess(registration);
      }).catch((error) => console.error('Service Worker registration failed:', error));
    });
  }
}