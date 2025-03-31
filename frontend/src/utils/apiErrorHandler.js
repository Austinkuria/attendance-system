/**
 * Utility for handling API error responses with consistent messaging
 */

/**
 * Formats API errors into user-friendly messages
 * @param {Error} error - The error object from API call
 * @param {Object} options - Additional options
 * @returns {Object} Formatted error with user-friendly message
 */
export const formatApiError = (error, options = {}) => {
    const defaultMessage = options.defaultMessage || 'An unexpected error occurred';
    let errorMessage = defaultMessage;
    let errorCode = 'UNKNOWN_ERROR';
    let statusCode = 0;

    // Check if we're offline first
    if (!navigator.onLine) {
        return {
            message: 'You are offline. Please check your internet connection.',
            code: 'OFFLINE',
            status: 0,
            originalError: error
        };
    }

    // Handle different error types
    if (error.response) {
        // Server responded with error status
        statusCode = error.response.status;

        switch (statusCode) {
            case 400:
                errorMessage = error.response.data?.message || 'Bad request. Please check your input.';
                errorCode = 'BAD_REQUEST';
                break;
            case 401:
                errorMessage = 'Your session has expired. Please log in again.';
                errorCode = 'UNAUTHORIZED';
                break;
            case 403:
                errorMessage = 'You don\'t have permission to access this resource.';
                errorCode = 'FORBIDDEN';
                break;
            case 404:
                errorMessage = 'The requested resource was not found.';
                errorCode = 'NOT_FOUND';
                break;
            case 429:
                errorMessage = 'Too many requests. Please try again later.';
                errorCode = 'RATE_LIMITED';
                break;
            case 500:
            case 502:
            case 503:
            case 504:
                errorMessage = 'Server error. Please try again later.';
                errorCode = 'SERVER_ERROR';
                break;
            default:
                errorMessage = error.response.data?.message || defaultMessage;
                errorCode = `ERROR_${statusCode}`;
        }
    } else if (error.request) {
        // Request was made but no response received
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = 'Request timed out. The server might be under heavy load.';
            errorCode = 'TIMEOUT';
        } else if (error.message.includes('Network Error')) {
            errorMessage = 'Network error. Please check your connection or the server might be down.';
            errorCode = 'NETWORK_ERROR';
        } else {
            errorMessage = 'Unable to connect to the server. Please try again later.';
            errorCode = 'CONNECTION_ERROR';
        }
    } else if (error.name === 'AbortError') {
        errorMessage = 'Request was cancelled.';
        errorCode = 'ABORTED';
    }

    // Return formatted error object
    return {
        message: errorMessage,
        code: errorCode,
        status: statusCode,
        originalError: error
    };
};

/**
 * Check if error is related to network connectivity
 * @param {Error} error - The error object to check
 * @returns {boolean} True if it's a network-related error
 */
export const isNetworkError = (error) => {
    if (!navigator.onLine) return true;

    return Boolean(
        error.message?.includes('Network Error') ||
        error.code === 'ECONNABORTED' ||
        error.name === 'AbortError' ||
        error.code === 'NETWORK_ERROR' ||
        (error.response && [502, 503, 504].includes(error.response.status))
    );
};

/**
 * Check if an error is due to user authentication/authorization issues
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's an auth-related error
 */
export const isAuthError = (error) => {
    return Boolean(
        error.response && [401, 403].includes(error.response.status) ||
        error.code === 'UNAUTHORIZED' ||
        error.code === 'FORBIDDEN'
    );
};

export default {
    formatApiError,
    isNetworkError,
    isAuthError
};
