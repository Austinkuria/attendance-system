import { useState, useEffect, useRef, useContext } from 'react';
import { Alert } from 'antd';
import { ThemeContext } from '../context/ThemeContext';
import {
    DisconnectOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import './NetworkStatus.css';

/**
 * NetworkStatus component that monitors online/offline status and displays a banner
 * when the user is offline or experiences network issues.
 * Uses ThemeContext for consistent styling with the rest of the app.
 * 
 * Note: Toast notifications are now handled by ThemeAwareToasts component
 */
const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showAlert, setShowAlert] = useState(!navigator.onLine);
    const [loadErrors, setLoadErrors] = useState([]);
    const [spacerHeight, setSpacerHeight] = useState(0);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const { isDarkMode, themeColors } = useContext(ThemeContext);

    const alertRef = useRef(null);
    const previousOnlineStateRef = useRef(isOnline);

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
            // Track if this is a transition from offline to online
            const wasOffline = !previousOnlineStateRef.current;

            setIsOnline(true);
            previousOnlineStateRef.current = true;

            // Show "back online" message briefly
            setShowAlert(true);

            // Dispatch an event to indicate the banner is visible
            window.dispatchEvent(new CustomEvent('networkBannerVisible', {
                detail: { type: 'online' }
            }));

            setTimeout(() => {
                setShowAlert(false);

                // Dispatch an event to indicate the banner is hidden
                window.dispatchEvent(new CustomEvent('networkBannerHidden'));
            }, 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            previousOnlineStateRef.current = false;
            setShowAlert(true);

            // Dispatch an event to indicate the banner is visible
            window.dispatchEvent(new CustomEvent('networkBannerVisible', {
                detail: { type: 'offline' }
            }));
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
            setWindowWidth(window.innerWidth);
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

    // Custom message for small screens (mobile devices) - keep only title different
    const getResponsiveMessage = (online) => {
        if (windowWidth <= 576) {
            return online ? (
                <span className="network-status-title">
                    <CheckCircleOutlined className="network-status-icon success" /> Connected
                </span>
            ) : (
                <span className="network-status-title">
                    <DisconnectOutlined className="network-status-icon error" /> You&apos;re offline
                </span>
            );
        }
        return online ? (
            <span className="network-status-title">
                <CheckCircleOutlined className="network-status-icon success" /> You&apos;re back online!
            </span>
        ) : (
            <span className="network-status-title">
                <DisconnectOutlined className="network-status-icon error" /> You&apos;re offline
            </span>
        );
    };

    // Get the appropriate description - now always showing the full description
    const getResponsiveDescription = (online) => {
        return online ? (
            <span className="network-status-description">
                Your connection has been restored.
            </span>
        ) : (
            <span className="network-status-description">
                Please check your internet connection. Some features may be unavailable while offline.
            </span>
        );
    };

    // Get theme-aware styles for alerts
    const getAlertStyle = (type) => {
        // Base styles with theme colors
        const baseStyle = {
            fontSize: 'var(--alert-font-size)',
            color: themeColors.text,
            borderLeft: `3px solid ${type === 'success' ? themeColors.secondary :
                type === 'warning' ? themeColors.accent : themeColors.primary
                }`,
            // Center text for medium and large screens
            textAlign: windowWidth > 576 ? 'center' : 'left',
            // Keep content together on one line
            whiteSpace: windowWidth > 576 ? 'normal' : 'normal'
        };

        // Theme-specific background colors
        if (isDarkMode) {
            return {
                ...baseStyle,
                backgroundColor: type === 'success' ? '#1a3a2a' :
                    type === 'warning' ? '#3b2a1a' : '#1e2c3d',
            };
        } else {
            return {
                ...baseStyle,
                backgroundColor: type === 'success' ? '#f0fff4' :
                    type === 'warning' ? '#fffbf0' : '#f0f7ff',
            };
        }
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
                style={{
                    width: '100%',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1050,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.15)',
                    backgroundColor: isDarkMode ? themeColors.background : '#fff',
                }}
            >
                {showAlert && (
                    <Alert
                        message={getResponsiveMessage(isOnline)}
                        description={getResponsiveDescription(isOnline)}
                        type={isOnline ? "success" : "warning"}
                        banner
                        showIcon={false} /* We're using our own icons now */
                        closable={isOnline}
                        onClose={() => setShowAlert(false)}
                        style={getAlertStyle(isOnline ? 'success' : 'warning')}
                        className={`network-status-alert ${isDarkMode ? 'dark-theme-alert' : ''} ${isOnline ? 'online-alert' : 'offline-alert'}`}
                    />
                )}

                {loadErrors.length > 0 && !showAlert && (
                    <Alert
                        message={
                            <span className="network-status-title">
                                <InfoCircleOutlined className="network-status-icon info" />
                                {windowWidth <= 576 ? "Resources failed" : "Some resources failed to load"}
                            </span>
                        }
                        description={
                            <span className="network-status-description">
                                {windowWidth <= 576
                                    ? "Resources couldn't be loaded."
                                    : "Non-essential resources couldn't be loaded. The application will continue to function normally."}
                            </span>
                        }
                        type="info"
                        banner
                        showIcon={false}
                        closable
                        onClose={() => setLoadErrors([])}
                        style={getAlertStyle('info')}
                        className={`network-status-alert ${isDarkMode ? 'dark-theme-alert' : ''} info-alert`}
                    />
                )}
            </div>
        </>
    );
};

export default NetworkStatus;
