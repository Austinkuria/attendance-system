export function register(config) {
  const isProduction = import.meta.env.MODE === 'production';
  if (isProduction && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      console.log('Service Worker registration handled by VitePWA');
      if (config && config.onSuccess) {
        navigator.serviceWorker.ready.then((registration) =>
          config.onSuccess(registration)
        );
      }
      if (config && config.onUpdate) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.onupdatefound = () => config.onUpdate(registration);
          }
        });
      }
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}