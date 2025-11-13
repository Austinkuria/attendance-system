import apiClient from './secureApiClient';

/**
 * Secure Authentication Utilities
 * All authentication happens via httpOnly cookies
 * NO tokens stored in localStorage for security
 */

/**
 * Login user
 * @param {Object} credentials - {email, password}
 * @returns {Promise<Object>} User data
 */
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    
    if (response.data.success && response.data.user) {
      // Store only non-sensitive user data in localStorage
      storeUserData(response.data.user);
      return response.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Sign up new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Response data
 */
export const signupUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

/**
 * Logout user
 * Revokes refresh token and clears cookies
 */
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
    clearUserData();
  } catch (error) {
    console.error('Logout error:', error);
    // Clear data anyway
    clearUserData();
  }
};

/**
 * Logout from all devices
 * Revokes all refresh tokens for the user
 */
export const logoutAllDevices = async () => {
  try {
    await apiClient.post('/auth/logout-all');
    clearUserData();
  } catch (error) {
    console.error('Logout all error:', error);
    clearUserData();
    throw error;
  }
};

/**
 * Validate current session
 * @returns {Promise<Object>} User data if session is valid
 */
export const validateSession = async () => {
  try {
    const response = await apiClient.get('/auth/validate-session');
    
    if (response.data.success && response.data.user) {
      // Update stored user data
      storeUserData(response.data.user);
      return response.data.user;
    }
    
    throw new Error('Session invalid');
  } catch (error) {
    console.error('Session validation error:', error);
    clearUserData();
    throw error;
  }
};

/**
 * Check if user is authenticated
 * Validates session with server
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    await validateSession();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get current user from localStorage
 * NOTE: This is cached data, use validateSession() for fresh data
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const userFirstName = localStorage.getItem('userFirstName');
    const userLastName = localStorage.getItem('userLastName');

    if (!userId || !userRole) {
      return null;
    }

    return {
      id: userId,
      role: userRole,
      email: userEmail,
      firstName: userFirstName,
      lastName: userLastName,
      fullName: `${userFirstName || ''} ${userLastName || ''}`.trim()
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get user role from localStorage
 * @returns {string|null} User role
 */
export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

/**
 * Check if user has specific role
 * @param {string|string[]} allowedRoles - Role or array of roles
 * @returns {boolean}
 */
export const hasRole = (allowedRoles) => {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }

  return userRole === allowedRoles;
};

/**
 * Store user data in localStorage (non-sensitive data only)
 * @param {Object} user - User object
 */
const storeUserData = (user) => {
  try {
    if (user.id) localStorage.setItem('userId', user.id);
    if (user.role) localStorage.setItem('userRole', user.role);
    if (user.email) localStorage.setItem('userEmail', user.email);
    if (user.firstName) localStorage.setItem('userFirstName', user.firstName);
    if (user.lastName) localStorage.setItem('userLastName', user.lastName);
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

/**
 * Clear all user data from localStorage
 */
const clearUserData = () => {
  try {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    
    // Clear any other user-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Password reset request
 * @param {string} email - User email
 * @returns {Promise<Object>}
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/auth/reset-password', { email });
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>}
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiClient.put(`/auth/reset-password/${token}`, {
      password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

export default {
  loginUser,
  signupUser,
  logoutUser,
  logoutAllDevices,
  validateSession,
  isAuthenticated,
  getCurrentUser,
  getUserRole,
  hasRole,
  requestPasswordReset,
  resetPassword
};
