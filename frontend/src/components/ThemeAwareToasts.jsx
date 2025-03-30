import { useEffect, useContext, useRef } from 'react';
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
    const { themeColors, isDarkMode } = useContext(ThemeContext);
    const isOnlineRef = useRef(navigator.onLine);

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

        // Network status handlers
        const handleOnline = () => {
            // Only show toast if we were previously offline
            if (!isOnlineRef.current) {
                // Use toast.info for reconnection
                toast.info(
                    <div>
                        <span role="img" aria-label="Online" style={{ marginRight: '8px', fontSize: '18px' }}>
                            🔄
                        </span>
                        <span>Back online. Refreshing data...</span>
                    </div>,
                    {
                        position: "top-center",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        style: {
                            background: isDarkMode ? '#1e2c3d' : '#f0f7ff',
                            color: themeColors.text
                        }
                    }
                );

                // Trigger a custom event that other components can listen for
                window.dispatchEvent(new CustomEvent('networkReconnected'));
            }
            isOnlineRef.current = true;
        };

        const handleOffline = () => {
            isOnlineRef.current = false;

            // Show toast notification when going offline
            toast.error(
                <div>
                    <span role="img" aria-label="Offline" style={{ marginRight: '8px', fontSize: '18px' }}>
                        📶
                    </span>
                    <span>You&apos;re offline. Some features may not work.</span>
                </div>,
                {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    style: {
                        background: isDarkMode ? '#3b2a1a' : '#fffbf0',
                        color: themeColors.text
                    }
                }
            );
        };

        // Add resize listener to update toast position when screen size changes
        const handleResize = () => {
            // This will ensure new toasts use the correct position based on current screen size
            toast.dismiss(); // Optional: dismiss existing toasts on resize
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);
        }

        return () => {
            if (navigator.serviceWorker) {
                navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
            }
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [themeColors, isDarkMode]); // Re-run when themeColors changes

    return null; // This component doesn't render anything
};
