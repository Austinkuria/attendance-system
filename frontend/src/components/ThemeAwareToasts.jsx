import { useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { ThemeContext } from '../context/ThemeContext';
import { register } from '../serviceWorkerRegistration';

// Function to clear all caches
async function clearCaches() {
    const cacheNames = await caches.keys();
    console.log('Clearing caches:', cacheNames);
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}

export const ThemeAwareToasts = () => {
    const { themeColors } = useContext(ThemeContext);

    useEffect(() => {
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
                            await clearCaches();
                            window.location.reload();
                        },
                        autoClose: false,
                        closeOnClick: false,
                        position: 'top-center',
                        hideProgressBar: false,
                        closeButton: false,
                        style: {
                            backgroundColor: themeColors.primary || '#4285f4',
                            color: themeColors.text || 'white',
                            fontWeight: 'bold',
                        },
                    });
                }
            },
            onSuccess: () => {
                console.log('Service Worker successfully initialized and content cached.');
            },
        });

        // Listen for controller change to detect updates
        const controllerChangeHandler = () => {
            console.log('Service worker controller changed');
            toast.info('🔄 New version installed! Page will reload.', {
                onClick: () => window.location.reload(),
                autoClose: 5000,
                position: 'top-center',
                style: {
                    backgroundColor: themeColors.primary || '#4285f4',
                    color: themeColors.text || 'white',
                    fontWeight: 'bold',
                },
            });
            setTimeout(() => window.location.reload(), 5000);
        };

        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);
        }

        return () => {
            if (navigator.serviceWorker) {
                navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
            }
        };
    }, [themeColors]); // Re-run when themeColors changes

    return null; // This component doesn't render anything
};
