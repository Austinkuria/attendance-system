import { useEffect, useState, useContext } from 'react';
import { Alert, message } from 'antd';
import { ThemeContext } from '../context/ThemeContext';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineBanner, setShowOfflineBanner] = useState(false);
    const { themeColors } = useContext(ThemeContext);

    useEffect(() => {
        const messageKey = 'network-status';

        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineBanner(false);
            message.success({
                content: 'You are back online!',
                key: messageKey,
                duration: 3
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineBanner(true);
            message.error({
                content: 'You are offline. Some features may not work.',
                key: messageKey,
                duration: 0 // Show until manually closed
            });
        };

        // Set initial status
        if (!navigator.onLine) {
            setShowOfflineBanner(true);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            message.destroy(messageKey);
        };
    }, []);

    if (!showOfflineBanner) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
        }}>
            <Alert
                message="You are offline"
                description="Please check your internet connection. Some features may not be available."
                type="warning"
                banner
                closable
                onClose={() => setShowOfflineBanner(false)}
                style={{
                    borderRadius: 0,
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.accent,
                }}
            />
        </div>
    );
};

export default NetworkStatus;
