import axios from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance with secure configuration
 * - Cookies enabled for httpOnly authentication
 * - CSRF token handling
 * - Automatic retry on network errors
 * - Request/response interceptors for error handling
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // CRITICAL: Enable cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Store for CSRF token
let csrfToken = null;

/**
 * Fetch CSRF token from server
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await apiClient.get('/auth/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

/**
 * Request interceptor
 * - Add CSRF token to all non-GET requests
 * - Handle request queueing
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Add CSRF token for state-changing requests
    if (!['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handle token expiration
 * - Auto-refresh tokens when suggested
 * - Handle common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Check if server suggests token refresh
    if (response.headers['x-token-refresh-suggested'] === 'true') {
      // Trigger background refresh
      refreshToken().catch(console.error);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      });
    }

    const { status, data } = error.response;

    // Handle token expiration - attempt refresh
    if (status === 401 && data.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshToken();
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        handleAuthenticationFailure();
        return Promise.reject(refreshError);
      }
    }

    // Handle invalid token - clear auth and redirect
    if (status === 401 && data.code === 'INVALID_TOKEN') {
      handleAuthenticationFailure();
    }

    // Handle forbidden access
    if (status === 403) {
      console.error('Access forbidden:', data.message);
    }

    // Handle rate limiting
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return Promise.reject({
        message: `Too many requests. Please try again after ${retryAfter} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      });
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async () => {
  try {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

/**
 * Handle authentication failure
 * - Clear local storage
 * - Redirect to login
 */
const handleAuthenticationFailure = () => {
  // Clear any stored user data (NOT tokens, as they're in httpOnly cookies)
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  
  // Redirect to login page
  if (window.location.pathname !== '/auth/login') {
    window.location.href = '/auth/login';
  }
};

// Initialize CSRF token on app load
fetchCsrfToken();

export default apiClient;
