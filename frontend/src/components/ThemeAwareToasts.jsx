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

                    // Get the appropriate position based on screen size
                    const position = window.innerWidth >= 768 ? 'top-right' : 'top-center';

                    toast.info(
                        <div>
                            <span role="img" aria-label="Update" style={{ marginRight: '8px', fontSize: '18px' }}>
                                🔄
                            </span>
                            <span>New version available! Refresh for latest features.</span>
                        </div>,
                        {
                            onClick: async () => {
                                waitingWorker.postMessage({ action: 'skipWaiting' });
                                await clearCaches();
                                window.location.reload();
                            },
                            autoClose: false,
                            closeOnClick: false,
                            position: position,
                            hideProgressBar: false,
                            closeButton: false,
                            style: {
                                backgroundColor: themeColors.primary || '#4285f4',
                                color: 'white', // Always white text
                                fontWeight: 'bold',
                            },
                        }
                    );
                }
            },
            onSuccess: () => {
                console.log('Service Worker successfully initialized and content cached.');
            },
        });

        // Listen for controller change to detect updates
        const controllerChangeHandler = () => {
            console.log('Service worker controller changed');

            // Get the appropriate position based on screen size
            const position = window.innerWidth >= 768 ? 'top-right' : 'top-center';

            toast.info(
                <div>
                    <span role="img" aria-label="Update" style={{ marginRight: '8px', fontSize: '18px' }}>
                        ⚡
                    </span>
                    <span>New version installed! Page will reload.</span>
                </div>,
                {
                    onClick: () => window.location.reload(),
                    autoClose: 5000,
                    position: position,
                    style: {
                        backgroundColor: themeColors.primary || '#4285f4',
                        color: 'white', // Always white text
                        fontWeight: 'bold',
                    },
                }
            );
            setTimeout(() => window.location.reload(), 5000);
        };

        // Add resize listener to update toast position when screen size changes
        const handleResize = () => {
            // This will ensure new toasts use the correct position based on current screen size
            toast.dismiss(); // Optional: dismiss existing toasts on resize
        };

        window.addEventListener('resize', handleResize);

        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);
        }

        return () => {
            if (navigator.serviceWorker) {
                navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [themeColors]); // Re-run when themeColors changes

    return null; // This component doesn't render anything
};
