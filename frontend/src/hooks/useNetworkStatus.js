import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to track network connection status
 * @returns {Object} Network status information
 */
const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const previousOnlineStateRef = useRef(isOnline);

    useEffect(() => {
        const handleOnline = () => {
            const wasOffline = !previousOnlineStateRef.current;
            setIsOnline(true);
            previousOnlineStateRef.current = true;

            if (wasOffline) {
                // Dispatch custom event that components can listen for
                window.dispatchEvent(new CustomEvent('networkReconnected'));
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            previousOnlineStateRef.current = false;
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        wasOffline: !isOnline,
        justReconnected: isOnline && !previousOnlineStateRef.current
    };
};

export default useNetworkStatus;
