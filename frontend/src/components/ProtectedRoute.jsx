import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isTokenValid } from '../utils/authUtils';
import { Spin } from 'antd';

/**
 * ProtectedRoute component for handling authentication.
 * Redirects to login if user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const [isChecking, setIsChecking] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        // Check authentication status
        const valid = isTokenValid();
        setIsAuthenticated(valid);
        setIsChecking(false);
    }, []);

    // Show a loading spinner while checking authentication
    if (isChecking) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // Render children if they exist, otherwise render an Outlet for nested routes
    return children || <Outlet />;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node
};

export default ProtectedRoute;
