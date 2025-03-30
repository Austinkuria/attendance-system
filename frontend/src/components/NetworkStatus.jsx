import { useState, useEffect } from 'react';
import { Alert } from 'antd';

/**
 * NetworkStatus component that monitors online/offline status and displays a banner
 * when the user is offline or experiences network issues.
 */
const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showAlert, setShowAlert] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Show "back online" message briefly
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowAlert(true);
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // If we're online initially, hide the alert after 3s
        if (isOnline && showAlert) {
            const timer = setTimeout(() => setShowAlert(false), 3000);
            return () => clearTimeout(timer);
        }

        // Clean up event listeners
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOnline, showAlert]);

    if (!showAlert) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000
            }}
        >
            <Alert
                message={isOnline ? "You're back online!" : "You're offline"}
                description={
                    isOnline
                        ? "Your connection has been restored."
                        : "Please check your internet connection. Some features may be unavailable while offline."
                }
                type={isOnline ? "success" : "warning"}
                banner
                showIcon
                closable={isOnline}
                onClose={() => setShowAlert(false)}
            />
        </div>
    );
};

export default NetworkStatus;
