import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { register } from './serviceWorkerRegistration';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker with update notifications
register({
  onUpdate: (registration) => {
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      // Notify user of new version
      import('react-toastify').then(({ toast }) => {
        toast.info('A new version is available! Click here to update.', {
          onClick: async () => {
            waitingWorker.postMessage({ action: 'skipWaiting' });

            // Small delay for a smoother update experience
            await new Promise((resolve) => setTimeout(resolve, 1000));

            window.location.reload();
          },
          autoClose: false,
          closeOnClick: false,
        });
      }).catch(error => console.error("Failed to load react-toastify:", error));
    }
  },
  onSuccess: () => {
    console.log('Service Worker successfully initialized and content cached.');
  },
});

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
