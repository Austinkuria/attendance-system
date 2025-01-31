import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { register } from './serviceWorkerRegistration';
import InstallButton from './InstallButton.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <InstallButton />
  </StrictMode>
);

register();
