import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isTokenValid, validateSession } from '../utils/authUtils';
import { Spin, Alert } from 'antd';

/**
 * ProtectedRoute component for handling authentication.
 * Redirects to login if user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const checkAuthentication = async () => {
            try {
                // First check local token validity
                const token = localStorage.getItem('token');
                const localValid = token && isTokenValid();

                if (!localValid) {
                    if (isMounted) {
                        console.log("Token invalid, redirecting to login");
                        setIsAuthenticated(false);
                        setIsChecking(false);
                    }
                    return;
                }

                // Check if this route is for the QR scanner
                const currentPath = window.location.pathname;
                const isQRScannerPath = currentPath.includes('/qr-scanner');

                if (isQRScannerPath) {
                    // For QR scanner paths, just mark as authenticated if local token is valid
                    // The actual session check will happen within the QR scanner component
                    if (isMounted) {
                        console.log("Allowing QR scanner access with valid token");
                        setIsAuthenticated(true);
                        setIsChecking(false);
                    }
                    return;
                }

                // For non-QR scanner paths, validate with server
                try {
                    await validateSession();
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
