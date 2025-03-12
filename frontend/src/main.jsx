import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './styles.css';
import App from './App.jsx';
import { register } from './serviceWorkerRegistration';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker with update notifications
register({
  onUpdate: (registration) => {
    const waitingWorker = registration.waiting;
    console.log('Service worker update detected', registration);
    if (waitingWorker) {
      console.log('New service worker waiting to be activated');
      toast.info('🔄 New version available! Refresh for latest features.', {
        onClick: async () => {
          waitingWorker.postMessage({ action: 'skipWaiting' });
          // Clear caches and reload the page
          await clearCaches();
          window.location.reload();
        },
        autoClose: false,
        closeOnClick: false,
        position: "top-center",
        hideProgressBar: false,
        closeButton: false,
        style: { 
          backgroundColor: '#4285f4',
          color: 'white',
          fontWeight: 'bold'
        },
      });
    }
  },
  onSuccess: () => {
    console.log('Service Worker successfully initialized and content cached.');
  },
});

// Function to clear all caches
async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}

// Function to inject analytics (avoids top-level await issue)
async function loadAnalytics() {
  try {
    const { injectSpeedInsights } = await import('@vercel/speed-insights');
    const { inject } = await import('@vercel/analytics');
    injectSpeedInsights();
    inject();
  } catch (error) {
    console.error('Vercel Analytics failed to initialize:', error);
  }
}

// Call the function
loadAnalytics();