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
          onClick: () => {
            waitingWorker.postMessage({ action: 'skipWaiting' });
            window.location.reload(); // Reload to apply the update
          },
          autoClose: false,
          closeOnClick: false,
        });
      });
    }
  },
  onSuccess: () => {
    console.log('Service Worker successfully initialized and content cached.');
  },
});