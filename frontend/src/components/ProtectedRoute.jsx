import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isTokenValid } from '../utils/authUtils';
import { Spin, Alert } from 'antd';

/**
 * ProtectedRoute component for handling authentication.
 * Redirects to login if user is not authenticated.
 * Handles offline mode gracefully.
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const handleOnlineStatusChange = () => {
            if (isMounted) {
                setIsOffline(!navigator.onLine);
            }
        };

        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);

        const checkAuthentication = async () => {
            try {
                // First check local token validity
                const localValid = isTokenValid();

                if (!localValid) {
                    if (isMounted) {
                        console.log("Token invalid, redirecting to login");
                        setIsAuthenticated(false);
                        setIsChecking(false);
                    }
                    return;
                }

                // Handle offline mode
                if (!navigator.onLine) {
                    console.log("Offline mode: using cached authentication");
                    const userData = localStorage.getItem('userData');
                    if (userData && localValid) {
                        // If offline but we have valid local token and userData, allow access
                        if (isMounted) {
                            setIsAuthenticated(true);
                            setIsOffline(true);
                        }
                    } else {
                        // No cached user data
                        if (isMounted) {
                            setError("You're offline with no cached authentication data");
                            setIsAuthenticated(false);
                        }
                    }
                    if (isMounted) {
                        setIsChecking(false);
                    }
                    return;
                }

                // Online mode: validate with server if possible
                try {
                    // Import dynamically to prevent circular dependencies
                    const { validateUserSession } = await import('../services/api');
                    await validateUserSession();
                    if (isMounted) {
                        console.log("Session validated successfully");
                        setIsAuthenticated(true);
                    }
                } catch (serverError) {
                    console.error("Server session validation failed:", serverError);
                    if (isMounted) {
                        setIsAuthenticated(false);
                        setError("Your session has expired. Please log in again.");
                    }
                }
            } catch (e) {
                console.error("Authentication check error:", e);
                if (isMounted) {
                    setIsAuthenticated(false);
                    setError("Authentication check failed.");
                }
            } finally {
                if (isMounted) {
                    setIsChecking(false);
                }
            }
        };

        checkAuthentication();

        return () => {
            isMounted = false;
            window.removeEventListener('online', handleOnlineStatusChange);
            window.removeEventListener('offline', handleOnlineStatusChange);
        };
    }, []);

    // Show a loading spinner while checking authentication
    if (isChecking) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Spin size="large" />
                <p style={{ marginTop: 20 }}>Verifying your session...</p>
            </div>
        );
    }

    // Show error if authentication check failed
    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Alert
                    message="Authentication Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <a href="/auth/login">
                            <button style={{ marginLeft: 10 }}>Log In</button>
                        </a>
                    }
                />
            </div>
        );
    }

    // Handle offline mode with warning
    if (isOffline && isAuthenticated) {
        // We'll still render the content, but with a warning
        console.log("Rendering offline content with cached authentication");
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        console.log("Not authenticated, navigating to login");
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    console.log("Authentication successful, rendering protected content");
    // Render children if they exist, otherwise render an Outlet for nested routes
    return children || <Outlet />;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node
};

export default ProtectedRoute;
