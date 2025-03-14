import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './styles.css';
import App from './App.jsx';
// import { register } from './serviceWorkerRegistration';
// import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { loadAnalytics } from './utils/analytics.js';

// Remove the unused ThemeAwareToasts component from here as it's now in its own file

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Function to clear all caches
// async function clearCaches() {
//   const cacheNames = await caches.keys();
//   console.log('Clearing caches:', cacheNames);
//   await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
// }

// Initialize analytics
loadAnalytics();