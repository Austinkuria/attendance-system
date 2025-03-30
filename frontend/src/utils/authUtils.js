import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_URL } from '../services/api';

/**
 * Check if a JWT token exists in localStorage
 * @returns {boolean} True if token exists
 */
export const hasToken = () => {
    return !!localStorage.getItem('token');
};

/**
 * Check if the current JWT token is valid and not expired
 * @returns {boolean} True if token is valid and not expired
 */
export const isTokenValid = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;

        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Convert to seconds

        return decodedToken.exp > currentTime;
    } catch (error) {
        console.error("Token validation error:", error);
        return false;
    }
};

/**
 * Get the user's role from the JWT token
 * @returns {string|null} User role or null if not available
 */
export const getUserRole = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const decodedToken = jwtDecode(token);
        return decodedToken.role;
    } catch {
        return null;
    }
};

/**
 * Get the user's ID from the JWT token
 * @returns {string|null} User ID or null if not available
 */
export const getUserId = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    } catch {
        return null;
    }
};

/**
 * Check if user has specified role
 * @param {string|string[]} allowedRoles - Role(s) to check
 * @returns {boolean} True if user has required role
 */
export const hasRole = (allowedRoles) => {
    const userRole = getUserRole();
    if (!userRole) return false;

    // Handle empty arrays or undefined allowedRoles
    if (!allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
        return false;
    }

    if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(userRole);
    }
    return userRole === allowedRoles;
};

/**
 * Redirects to the appropriate dashboard based on user role
 * Helper function for login flows
 */
export const redirectToDashboard = () => {
    const role = getUserRole();

    switch (role) {
        case 'admin':
            window.location.href = '/admin/dashboard';
            break;
        case 'lecturer':
            window.location.href = '/lecturer/dashboard';
            break;
        case 'student':
            window.location.href = '/student/dashboard';
            break;
        default:
            // Fallback to login if role is unknown
            window.location.href = '/auth/login';
    }
};

/**
 * Validate the current session with the backend
 * @returns {Promise<Object>} The validation response
 * @throws {Error} If validation fails
 */
export const validateSession = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_URL}/auth/validate-session`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Store any additional user data from the validation response
        if (response.data?.user) {
            const userData = JSON.stringify({
                id: response.data.user.id,
                role: response.data.user.role,
                firstName: response.data.user.firstName,
                lastName: response.data.user.lastName,
                lastValidated: new Date().toISOString()
            });
            localStorage.setItem('userData', userData);
        }

        return response.data;
    } catch (error) {
        console.error('Session validation error:', error);
        logout();
        throw new Error(error.response?.data?.message || 'Session validation failed');
    }
};

/**
 * Logout the user by clearing localStorage and sessionStorage
 */
export const logout = () => {
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login page if not already there
    if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
    }
};

/**
 * Store authentication data in localStorage after successful login
 * @param {Object} authData - Authentication data including token and user info
 */
export const storeAuthData = (authData) => {
    const { token } = authData;

    // Store token
    localStorage.setItem('token', token);

    // Decode token to get user data
    const decodedToken = jwtDecode(token);
    const { userId, role } = decodedToken;

    // Store minimal user data
    const userData = JSON.stringify({
        id: userId,
        role,
        lastLogin: new Date().toISOString()
    });

    localStorage.setItem('userData', userData);
    localStorage.setItem('userId', userId);
    localStorage.setItem('role', role);
};

/**
 * Setup axios interceptors for authentication
 * @param {Object} axiosInstance - The axios instance to configure
 */
export const setupAuthInterceptors = (axiosInstance) => {
    // Request interceptor to add token
    axiosInstance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor to handle authentication errors
    axiosInstance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            // If the error is 401 and we haven't tried to refresh the token yet
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Try to validate the session first
                    await validateSession();

                    // If validation succeeds (doesn't throw), retry the original request
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    // If session validation fails, logout and redirect
                    console.error('Session validation failed during request:', refreshError);
                    logout();
                    return Promise.reject(error);
                }
            }

            // For other errors, just pass them through
            return Promise.reject(error);
        }
    );
};
