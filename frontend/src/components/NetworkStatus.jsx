import { useState, useEffect, useRef } from 'react';
import { Alert } from 'antd';
import './NetworkStatus.css'; // Import the CSS file

/**
 * NetworkStatus component that monitors online/offline status and displays a banner
 * when the user is offline or experiences network issues.
 */
const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showAlert, setShowAlert] = useState(!navigator.onLine);
    const [loadErrors, setLoadErrors] = useState([]);
    const [spacerHeight, setSpacerHeight] = useState(0);

    const alertRef = useRef(null);

    // Update spacer height based on actual banner height
    const updateSpacerHeight = () => {
        if (alertRef.current) {
            const height = alertRef.current.offsetHeight;
            setSpacerHeight(height);
        } else {
            // Use CSS variable as fallback
            const alertHeight = getComputedStyle(document.documentElement)
                .getPropertyValue('--alert-height')
                .trim();
            setSpacerHeight(alertHeight ? parseInt(alertHeight) : 56);
        }
    };

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
            if (url && (url.includes('vercel') || url.includes('analytics'))) {
                console.warn(`Resource failed to load: ${url}`);
                setLoadErrors(prev => [...prev, url]);

                // Prevent the error from propagating further
                event.stopPropagation();
                event.preventDefault();
            }
        };

        // Update spacer height on window resize
        const handleResize = () => {
            updateSpacerHeight();
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('error', handleResourceError, true); // Capture phase
        window.addEventListener('resize', handleResize);

        // Initial height update
        updateSpacerHeight();

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
            window.removeEventListener('resize', handleResize);
        };
    }, [isOnline, showAlert]);

    // Update spacer height when alert visibility changes
    useEffect(() => {
        updateSpacerHeight();
        // Use ResizeObserver for more accurate height tracking
        if (alertRef.current) {
            const resizeObserver = new ResizeObserver(() => {
                updateSpacerHeight();
            });
            resizeObserver.observe(alertRef.current);
            return () => resizeObserver.disconnect();
        }
    }, [showAlert, loadErrors.length]);

    // If nothing to show, don't render anything
    if (!showAlert && loadErrors.length === 0) {
        return null;
    }

    // Custom message for small screens (mobile devices)
    const getResponsiveMessage = (online) => {
        const width = window.innerWidth;
        if (width <= 576) {
            return online ? "Connected" : "No connection";
        }
        return online ? "You're back online!" : "You're offline";
    };

    return (
        <>
            {/* This spacer div pushes content down when alerts are visible */}
            <div
                className="network-status-spacer"
                style={{
                    height: (showAlert || loadErrors.length > 0) ? `${spacerHeight}px` : '0px',
                }}
                aria-hidden="true"
            />

            {/* Fixed position container for alerts */}
            <div
                className="network-status-container"
                data-testid="network-status"
                role="alert"
                aria-live="assertive"
                ref={alertRef}
            >
                {showAlert && (
                    <Alert
                        message={getResponsiveMessage(isOnline)}
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
                        message={window.innerWidth <= 576 ? "Resources failed" : "Some resources failed to load"}
                        description="Non-essential resources couldn't be loaded. The application will continue to function normally."
                        type="info"
                        banner
                        showIcon
                        closable
                        onClose={() => setLoadErrors([])}
                    />
                )}
            </div>
        </>
    );
};

export default NetworkStatus;
