import { useState, useEffect } from 'react';
import { Alert } from 'antd';

/**
 * NetworkStatus component that monitors online/offline status and displays a banner
 * when the user is offline or experiences network issues.
 */
const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showAlert, setShowAlert] = useState(!navigator.onLine);
    const [loadErrors, setLoadErrors] = useState([]);

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

        // Listen for resource load errors
        const handleResourceError = (event) => {
            const url = event.target?.src || event.target?.href || '';
            if (url && url.includes('vercel') || url.includes('analytics')) {
                console.warn(`Resource failed to load: ${url}`);
                setLoadErrors(prev => [...prev, url]);

                // Prevent the error from propagating further
                event.stopPropagation();
                event.preventDefault();
            }
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('error', handleResourceError, true); // Capture phase

        // If we're online initially, hide the alert after 3s
        if (isOnline && showAlert) {
            const timer = setTimeout(() => setShowAlert(false), 3000);
            return () => clearTimeout(timer);
        }

        // Clean up event listeners
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('error', handleResourceError, true);
        };
    }, [isOnline, showAlert]);

    if (!showAlert && loadErrors.length === 0) return null;

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
            {showAlert && (
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
            )}

            {loadErrors.length > 0 && !showAlert && (
                <Alert
                    message="Some resources failed to load"
                    description="Non-essential resources couldn't be loaded. The application will continue to function normally."
                    type="info"
                    banner
                    showIcon
                    closable
                    onClose={() => setLoadErrors([])}
                />
            )}
        </div>
    );
};

export default NetworkStatus;
