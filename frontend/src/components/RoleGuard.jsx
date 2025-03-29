import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin, message } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../services/api';

/**
 * RoleGuard component that protects routes based on user roles
 * @param {Object} props
 * @param {string|string[]} props.allowedRoles - The role(s) allowed to access the route
 * @param {string} props.redirectTo - Where to redirect if role check fails
 */
const RoleGuard = ({ allowedRoles, redirectTo = '/auth/login' }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const verifyUserRole = async () => {
            setLoading(true);
            try {
                // Get token from localStorage
                const token = localStorage.getItem('token');

                if (!token) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                // Decode token to get role
                const decoded = jwtDecode(token);
                const userRole = decoded?.role;

                if (!userRole) {
                    message.error('Invalid user session');
                    localStorage.clear();
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                // Check if token is valid by making API request
                const response = await axios.get(`${API_URL}/auth/validate-session`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Check if the role in the token matches the role from the server
                if (response.data?.role !== userRole) {
                    message.error('Session mismatch detected');
                    localStorage.clear();
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                // Check if the role is allowed to access this route
                const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
                if (roles.includes(userRole)) {
                    setAuthorized(true);
                } else {
                    message.error('You do not have permission to access this page');
                    setAuthorized(false);
                }
            } catch (error) {
                console.error('Role verification error:', error);
                message.error('Session verification failed');
                localStorage.clear();
                setAuthorized(false);
            } finally {
                setLoading(false);
            }
        };

        verifyUserRole();
    }, [allowedRoles, redirectTo]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <Spin size="large" tip="Verifying access..." />
            </div>
        );
    }

    return authorized ? <Outlet /> : <Navigate to={redirectTo} replace />;
};

// Add prop types validation to fix the ESLint warnings
RoleGuard.propTypes = {
    allowedRoles: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
    redirectTo: PropTypes.string
};

// Add default props
RoleGuard.defaultProps = {
    redirectTo: '/auth/login'
};

export default RoleGuard;
